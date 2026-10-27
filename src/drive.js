// Google Drive appDataFolder の読み書き。トークンは保持せず、リクエストごとに渡される。

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

export class DriveError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class Drive {
  constructor(token) {
    this.token = token;
    this.ids = null;
  }

  async fetch(url, init = {}) {
    const res = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${this.token}` } });
    if (!res.ok) throw new DriveError(res.status, `Drive API ${res.status}`);
    return res;
  }

  // name -> fileId。1リクエスト内ではキャッシュする。
  async index() {
    if (!this.ids) {
      const q = new URLSearchParams({ spaces: 'appDataFolder', fields: 'files(id,name)', pageSize: '1000' });
      const { files } = await (await this.fetch(`${API}/files?${q}`)).json();
      this.ids = new Map(files.map((f) => [f.name, f.id]));
    }
    return this.ids;
  }

  async read(name, fallback) {
    const id = (await this.index()).get(name);
    if (!id) return fallback;
    return (await this.fetch(`${API}/files/${id}?alt=media`)).json();
  }

  async write(name, data) {
    const ids = await this.index();
    const id = ids.get(name);
    const body = JSON.stringify({ schema: 1, ...data });
    if (id) {
      await this.fetch(`${UPLOAD}/files/${id}?uploadType=media`, {
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
    ids.set(name, (await res.json()).id);
  }

  async removeAll() {
    for (const id of (await this.index()).values()) {
      await this.fetch(`${API}/files/${id}`, { method: 'DELETE' });
    }
    this.ids = new Map();
  }
}
