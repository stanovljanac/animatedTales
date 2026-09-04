// tests/ffmpeg.test.mjs
//
//   node --test tests/
//
// Verifikacija V1 iz docs/plan/C04-ffmpeg-i-timeline.md, u obliku testa.
//
// Medija je van gita (.gitignore izbacuje *.mp4 i *.mp3), pa se testovi koji je traže
// preskaču kad fajla nema — na drugoj mašini paket i dalje mora da bude zelen.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ffmpegPath, run, probe } from '../tools/ffmpeg.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MP4 = path.join(ROOT, 'episodes/marathon/part1.mp4');
const MP3 = path.join(ROOT, 'episodes/night-when-rome-almost-fell/narration.mp3');

const missing = (f) => (fs.existsSync(f) ? false : `nema ${path.relative(ROOT, f)} na disku`);

let binary = null;
try {
  binary = ffmpegPath();
} catch {
  binary = null;
}
const noBinary = binary ? false : 'ffmpeg nije nađen u ovom okruženju';

test('ffmpegPath() vraća izvršiv binarni fajl', { skip: noBinary }, () => {
  assert.equal(typeof binary, 'string');
  assert.ok(binary.length > 0);
  if (binary.includes('/') || binary.includes('\\')) assert.ok(fs.existsSync(binary));
});

test('run() vraća code/stdout/stderr', { skip: noBinary }, async () => {
  const r = await run(['-hide_banner', '-version']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /ffmpeg version/);
});

test('run() sa check:false ne baca na exit != 0', { skip: noBinary }, async () => {
  // -i bez izlaznog fajla je legitiman poziv koji ffmpeg završava sa exit 1
  const r = await run(['-hide_banner', '-i', MP4], { check: false });
  assert.notEqual(r.code, 0);
});

test('run() sa check:true baca čitljivu grešku', { skip: noBinary }, async () => {
  await assert.rejects(
    () => run(['-hide_banner', '-i', 'nema-ovakvog-fajla.mp4', '-f', 'null', '-']),
    (err) => {
      assert.match(err.message, /ffmpeg pao \(exit \d+/);
      assert.match(err.message, /argumenti:/);
      assert.ok(typeof err.stderr === 'string' && err.stderr.length > 0);
      return true;
    },
  );
});

test('probe(part1.mp4) — 10.01s / 1280x720 / 24fps / audio', { skip: noBinary || missing(MP4) }, async () => {
  const p = await probe(MP4);
  assert.ok(Math.abs(p.duration - 10.01) < 0.05, `duration ${p.duration}`);
  assert.equal(p.width, 1280);
  assert.equal(p.height, 720);
  assert.equal(p.fps, 24);
  assert.equal(p.hasVideo, true);
  assert.equal(p.hasAudio, true);
  assert.equal(p.start, 0);
});

test('probe(narration.mp3) — 217.21s, start 0.025057, bez videa', { skip: noBinary || missing(MP3) }, async () => {
  const p = await probe(MP3);
  assert.ok(Math.abs(p.duration - 217.21) < 0.05, `duration ${p.duration}`);
  assert.ok(Math.abs(p.start - 0.025057) < 1e-6, `start ${p.start}`);
  assert.equal(p.hasVideo, false);
  assert.equal(p.hasAudio, true);
  assert.equal(p.width, null);
  assert.equal(p.fps, null);
});

test('probe() na nepostojećem fajlu baca', { skip: noBinary }, async () => {
  await assert.rejects(() => probe('episodes/nema-ovoga.mp4'), /fajl ne postoji/);
});

test('probe() na fajlu koji nije medij baca', { skip: noBinary }, async () => {
  await assert.rejects(() => probe(path.join(ROOT, 'tools/config.json')), /nije prepoznao fajl/);
});
