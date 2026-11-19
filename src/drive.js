// Google Drive appDataFolder の読み書き。トークンは保持せず、リクエストごとに渡される。

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

export class DriveError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// name -> fileId の一覧は、同じ isolate 内ではユーザーごとに使い回す(毎回の一覧取得 = Drive への往復1回を省く)。
// 別の isolate や端末がファイルを作った可能性があるので、一覧に無い名前を引いたときは取り直してから「無い」と判断する
// (古い一覧のまま同名ファイルを新規作成して二重にしないため)。消されていた(404)ときも取り直す。
const INDEX_TTL = 10 * 60 * 1000;
const indexCache = new Map(); // uid -> { ids, exp }

export class Drive {
  constructor(token, uid) {
    this.token = token;
    this.uid = uid;
    const hit = uid && indexCache.get(uid);
    this.ids = hit && hit.exp > Date.now() ? hit.ids : null;
    this.fresh = false; // このリクエスト内で一覧を取得済みか
  }

  async fetch(url, init = {}) {
    const res = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${this.token}` } });
    if (!res.ok) throw new DriveError(res.status, `Drive API ${res.status}`);
    return res;
  }

  async index(refresh = false) {
    if (!this.ids || refresh) {
      const q = new URLSearchParams({ spaces: 'appDataFolder', fields: 'files(id,name)', pageSize: '1000' });
      const { files } = await (await this.fetch(`${API}/files?${q}`)).json();
      this.ids = new Map(files.map((f) => [f.name, f.id]));
      this.fresh = true;
      if (this.uid) indexCache.set(this.uid, { ids: this.ids, exp: Date.now() + INDEX_TTL });
    }
    return this.ids;
  }

  // fileId。一覧が古い可能性があるときは取り直して確かめる
  async idOf(name) {
    const id = (await this.index()).get(name);
    if (id || this.fresh) return id;
    return (await this.index(true)).get(name);
  }

  // 一覧が古く、ファイルが消されていた(404)ときは一覧を取り直して1回だけやり直す
  async retryStale(fn) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof DriveError) || e.status !== 404 || this.fresh) throw e;
      await this.index(true);
      return fn();
    }
  }

  read(name, fallback) {
    return this.retryStale(async () => {
      const id = await this.idOf(name);
      if (!id) return fallback;
      return (await this.fetch(`${API}/files/${id}?alt=media`)).json();
    });
  }

  write(name, data) {
    return this.retryStale(() => this.#write(name, data));
  }

  async #write(name, data) {
    const id = await this.idOf(name);
    const body = JSON.stringify({ schema: 1, ...data });
    if (id) {
      await this.fetch(`${UPLOAD}/files/${id}?uploadType=media&fields=id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return;
    }
    const boundary = 'ct' + crypto.randomUUID();
    const meta = JSON.stringify({ name, parents: ['appDataFolder'], mimeType: 'application/json' });
    const res = await this.fetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body:
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`,
    });
    this.ids.set(name, (await res.json()).id);
  }

  async removeAll() {
    for (const id of (await this.index(true)).values()) {
      await this.fetch(`${API}/files/${id}`, { method: 'DELETE' });
    }
    this.ids = new Map();
    if (this.uid) indexCache.delete(this.uid);
  }
}
