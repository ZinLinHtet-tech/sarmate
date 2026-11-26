import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sourceStudy } from '../lib/study.ts';

const folder = process.argv[2];
const names = ['lesson.txt', 'myanmar.txt', 'lesson.jpg', 'lesson.jpeg',
  'lesson.png', 'lesson.webp', 'lesson.pdf', 'scanned.pdf', 'lesson.doc',
  'lesson.docx', 'lesson.ppt', 'lesson.pptx'];
for (const name of names) {
  const bytes = await readFile(join(folder, name));
  const url = 'http://localhost:5173/api/upload?' + new URLSearchParams({ filename: name });
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/octet-stream' },
    body: new Uint8Array(bytes),
  });
  const data = await response.json();
  assert.equal(response.status, 200, name + ': ' + JSON.stringify(data));
  assert.equal(typeof data.text, 'string', name);
  assert.ok(name === 'myanmar.txt' ? data.text.includes('ပညာရေး') :
    data.text.toLowerCase().includes('binary search'), name + ': ' + data.text);
  assert.ok(sourceStudy([data.text, data.text, data.text].join('\n\n')).questions.length > 0, name);
  process.stdout.write('PASS ' + name + '\n');
}
