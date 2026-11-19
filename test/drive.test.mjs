import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Drive } from '../src/drive.js';

// Drive API の偽物。ファイルは name -> { id, body } で持ち、呼ばれた API を記録する
let files;
let calls;
let nextId;
beforeEach(() => {
  files = new Map();
  calls = [];
  nextId = 1;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method ?? 'GET';
    calls.push(`${method} ${u.pathname}`);
    const ok = (data) => new Response(JSON.stringify(data), { status: 200 });
    const byId = (id) => [...files.values()].find((f) => f.id === id);
    if (method === 'GET' && u.pathname === '/drive/v3/files') {
      return ok({ files: [...files].map(([name, f]) => ({ name, id: f.id })) });
    }
    const m = /\/files\/([^/]+)$/.exec(u.pathname);
    if (method === 'GET' && m) {
      const f = byId(m[1]);
      return f ? ok(JSON.parse(f.body)) : new Response('', { status: 404 });
    }
    if (method === 'PATCH' && m) {
      const f = byId(m[1]);
      if (!f) return new Response('', { status: 404 });
      f.body = init.body;
      return ok({ id: f.id });
    }
    if (method === 'POST') {
      const name = /"name":"([^"]+)"/.exec(init.body)[1];
      const body = init.body.split('\r\n\r\n')[2].split('\r\n--')[0];
      const id = `f${nextId++}`;
      files.set(name, { id, body });
      return ok({ id });
    }
    throw new Error(`unexpected ${method} ${url}`);
  };
});

let uidSeq = 0;
const freshUid = () => `u${++uidSeq}`;

test('2回目以降のリクエストはファイル一覧を取り直さない', async () => {
  const uid = freshUid();
  files.set('profile.json', { id: 'p', body: '{"a":1}' });
  assert.deepEqual(await new Drive('t', uid).read('profile.json', {}), { a: 1 });
  calls = [];
  assert.deepEqual(await new Drive('t', uid).read('profile.json', {}), { a: 1 });
  assert.deepEqual(calls, ['GET /drive/v3/files/p']);
});

test('一覧に無いファイルは取り直してから判断し、別の isolate が作ったファイルを二重に作らない', async () => {
  const uid = freshUid();
  await new Drive('t', uid).read('profile.json', {}); // 空の一覧がキャッシュされる
  files.set('taps-2026-11.json', { id: 'x', body: '{"taps":[1]}' }); // 別の isolate が作成
  const d = new Drive('t', uid);
  assert.deepEqual(await d.read('taps-2026-11.json', { taps: [] }), { taps: [1] });
  await d.write('taps-2026-11.json', { taps: [1, 2] });
  assert.equal(files.size, 1);
  assert.equal(JSON.parse(files.get('taps-2026-11.json').body).taps.length, 2);
});

test('キャッシュした ID のファイルが消されていたら、一覧を取り直してやり直す', async () => {
  const uid = freshUid();
  files.set('profile.json', { id: 'old', body: '{"a":1}' });
  await new Drive('t', uid).read('profile.json', {});
  files.set('profile.json', { id: 'new', body: '{"a":2}' });
  assert.deepEqual(await new Drive('t', uid).read('profile.json', {}), { a: 2 });
});

test('新規作成したファイルは、次のリクエストでも一覧を取り直さずに使える', async () => {
  const uid = freshUid();
  await new Drive('t', uid).write('relationship.json', { items: [] });
  calls = [];
  await new Drive('t', uid).write('relationship.json', { items: [1] });
  assert.deepEqual(calls, ['PATCH /upload/drive/v3/files/f1']);
});
