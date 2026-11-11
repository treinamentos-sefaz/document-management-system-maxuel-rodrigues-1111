const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, before, after } = require('node:test');
const assert = require('node:assert');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_BYTES = '1024';

const app = require('../src/app');

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = app.listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  server.close(() => {
    fs.rmSync(storageDir, { recursive: true, force: true });
    resolve();
  });
}));

function uploadFile({ owner, content = 'conteudo', name = 'arquivo.txt' }) {
  const form = new FormData();
  form.append('file', new Blob([content]), name);
  const headers = owner ? { 'X-User-Id': owner } : {};
  return fetch(`${baseUrl}/upload`, { method: 'POST', headers, body: form });
}

function listDocuments(owner) {
  return fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': owner } });
}

test('upload retorna 201 com os metadados do documento', async () => {
  const response = await uploadFile({ owner: 'dono-upload', name: 'contrato.pdf' });
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(body.originalName, 'contrato.pdf');
  assert.strictEqual(body.owner, 'dono-upload');
  assert.ok(body.id);
});

test('upload sem X-User-Id retorna 400 e não grava arquivo', async () => {
  const before = fs.readdirSync(storageDir).length;
  const response = await uploadFile({ owner: null });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(fs.readdirSync(storageDir).length, before);
});

test('upload sem arquivo retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'dono-sem-arquivo' },
    body: new FormData(),
  });

  assert.strictEqual(response.status, 400);
});

test('upload acima do limite retorna 413', async () => {
  const response = await uploadFile({ owner: 'dono-grande', content: 'x'.repeat(2048) });

  assert.strictEqual(response.status, 413);
});

test('listagem retorna apenas os documentos do próprio usuário', async () => {
  await uploadFile({ owner: 'lista-a', name: 'a.txt' });
  await uploadFile({ owner: 'lista-b', name: 'b.txt' });

  const response = await listDocuments('lista-a');
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.ok(body.length >= 1);
  assert.ok(body.every((document) => document.owner === 'lista-a'));
});

test('listagem sem X-User-Id retorna 400', async () => {
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 400);
});

test('download retorna o conteúdo com cabeçalhos de anexo', async () => {
  const uploaded = await (await uploadFile({ owner: 'dono-download', content: 'hello', name: 'hello.txt' })).json();
  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`, {
    headers: { 'X-User-Id': 'dono-download' },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('content-type'), 'application/octet-stream');
  assert.match(response.headers.get('content-disposition'), /attachment; filename="hello.txt"/);
  assert.strictEqual(await response.text(), 'hello');
});

test('download de documento de outro usuário retorna 404', async () => {
  const uploaded = await (await uploadFile({ owner: 'dono-privado' })).json();
  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`, {
    headers: { 'X-User-Id': 'intruso' },
  });

  assert.strictEqual(response.status, 404);
});

test('download com id inexistente ou com traversal retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/${encodeURIComponent('../app.js')}/download`, {
    headers: { 'X-User-Id': 'qualquer' },
  });

  assert.strictEqual(response.status, 404);
});
