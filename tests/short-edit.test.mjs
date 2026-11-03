// tests/short-edit.test.mjs
//
//   node --test tests/*.test.mjs
//
// Čisti deo tools/short-edit.mjs: granice rečenica prema tišini, skraćenje pauza, markeri kadrova,
// prozor 9:16. Render zove ffmpeg i proverava se na pravoj epizodi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  EDIT, lineBounds, mapSrc, planLines, markerTime, planVisuals, interpExpr, framingCorners, editSrt,
} from '../tools/short-edit.mjs';

/** ffmpeg izraz po frejmu -> broj. Samo funkcije koje short-edit koristi. */
function evalAt(expr, on) {
  const js = expr
    .replace(/\bif\(/g, 'IF(').replace(/\blt\(/g, 'LT(').replace(/\bclip\(/g, 'CLIP(')
    .replace(/\b(max|min|cos)\(/g, 'Math.$1(').replace(/\bPI\b/g, 'Math.PI');
  return vm.runInNewContext(js, {
    on, Math,
    IF: (c, a, b) => (c ? a : b),
    LT: (a, b) => (a < b ? 1 : 0),
    CLIP: (v, lo, hi) => Math.min(Math.max(v, lo), hi),
  });
}

// Tri rečenice; alignment kasni za stvarnim govorom, tišine su istina.
const SENTENCES = [
  { id: 'S1', start: 0.0, end: 2.0, text: 'One two three.' },
  { id: 'S2', start: 3.1, end: 5.0, text: 'Four five six seven.' },
  { id: 'S3', start: 6.4, end: 8.0, text: 'Eight nine ten.' },
];
const TIMING = { sentences: SENTENCES, words: [], duration: 9 };
const GAPS = [{ s: 2.2, e: 3.3 }, { s: 5.1, e: 6.2 }, { s: 8.2, e: 9.0 }];

test('lineBounds uzima stvarnu tišinu, ne alignment', () => {
  const b = lineBounds(GAPS, SENTENCES, 1);
  assert.equal(b.onset, 3.3, 'početak je kraj tišine pre rečenice');
  assert.equal(b.offset, 5.1, 'kraj je početak tišine posle nje');
  assert.equal(lineBounds(GAPS, SENTENCES, 0).onset, 0, 'prva rečenica bez tišine pre sebe kreće od alignmenta');
});

test('planLines: razmak između rečenica je gap, redosled je redosled iz spec-a', () => {
  const { lines, end } = planLines({ lines: [{ id: 'S2' }, { id: 'S1' }] }, TIMING, GAPS);
  assert.equal(lines[0].id, 'S2');
  assert.equal(lines[0].outStart, EDIT.lead);
  assert.ok(Math.abs(lines[0].outEnd - (EDIT.lead + 1.8)) < 1e-9);
  assert.ok(Math.abs(lines[1].outStart - (lines[0].outEnd + EDIT.gap)) < 1e-9);
  assert.equal(end, lines[1].outEnd);
});

test('planLines: before menja razmak samo ispred svoje rečenice', () => {
  const { lines } = planLines({ lines: [{ id: 'S1' }, { id: 'S2', before: 0.7 }, { id: 'S3' }] }, TIMING, GAPS);
  assert.ok(Math.abs(lines[1].outStart - (lines[0].outEnd + 0.7)) < 1e-9);
  assert.ok(Math.abs(lines[2].outStart - (lines[1].outEnd + EDIT.gap)) < 1e-9, 'sledeći razmak je opet podrazumevani');
  assert.equal(planLines({ lines: [{ id: 'S1', before: 5 }] }, TIMING, GAPS).lines[0].outStart, EDIT.lead, 'prva rečenica ima lead, ne before');
});

test('planLines: unutrašnja pauza duža od pause se skuplja, tokeni prate skraćenje', () => {
  const gaps = [...GAPS, { s: 3.9, e: 4.5 }]; // pauza od 0.6s unutar S2
  const { lines } = planLines({ lines: [{ id: 'S2' }], pause: 0.3 }, TIMING, gaps.sort((a, b) => a.s - b.s));
  const l = lines[0];
  assert.equal(l.pieces.length, 2);
  assert.ok(Math.abs(l.outEnd - l.outStart - (1.8 - 0.3)) < 1e-9, 'pauza od 0.6s ostaje 0.3s');
  assert.ok(l.tokens.every((t) => t.start >= l.outStart && t.end <= l.outEnd + 1e-9));
});

test('planLines: from seče rečenicu na reč', () => {
  const { lines } = planLines({ lines: [{ id: 'S2', from: 'six' }] }, TIMING, GAPS);
  assert.deepEqual(lines[0].tokens.map((t) => t.text), ['six', 'seven.']);
  assert.throws(() => planLines({ lines: [{ id: 'S2', from: 'nine' }] }, TIMING, GAPS), /nine/);
  assert.throws(() => planLines({ lines: [{ id: 'S9' }] }, TIMING, GAPS), /S9/);
});

test('mapSrc prevodi vreme izvora kroz komade i skraćene pauze', () => {
  const pieces = [{ srcA: 3.3, srcB: 4.05, outA: 1 }, { srcA: 4.35, srcB: 5.1, outA: 1.75 }];
  assert.equal(mapSrc(pieces, 3.3), 1);
  assert.ok(Math.abs(mapSrc(pieces, 4.5) - 1.9) < 1e-9);
  assert.equal(mapSrc(pieces, 4.2), 1.75, 'unutar izbačene tišine ide na početak sledećeg komada');
  assert.equal(mapSrc(pieces, 9), 2.5, 'iza kraja ostaje na kraju');
});

test('markerTime: rečenica ili reč u njoj', () => {
  const { lines } = planLines({ lines: [{ id: 'S2' }, { id: 'S3' }] }, TIMING, GAPS);
  assert.equal(markerTime(lines, 'S3'), lines[1].outStart);
  assert.ok(markerTime(lines, 'S3:nine') > lines[1].outStart);
  assert.throws(() => markerTime(lines, 'S1'), /nije u lines/);
  assert.throws(() => markerTime(lines, 'S3:zeus'), /zeus/);
});

test('planVisuals: kadar menja cutLead pre glasa, prvi kreće od 0, poslednji traje do kraja', () => {
  const { lines, end } = planLines({ lines: [{ id: 'S2' }, { id: 'S3' }] }, TIMING, GAPS);
  const total = Math.round((end + 0.6) * 24) / 24;
  const shots = [{ shot_id: '01', source_file: 'shots/part01.mp4' }, { shot_id: '02', source_file: 'shots/shot02.jpeg', render_mode: 'still' }];
  const v = planVisuals({ visuals: [{ shot: '01', at: 'S2' }, { shot: '02', at: 'S3' }] }, lines, total, shots, '.');
  assert.equal(v[0].start, 0);
  assert.ok(Math.abs(v[1].start - (lines[1].outStart - EDIT.cutLead)) < 1 / 24);
  assert.equal(v[1].end, total);
  assert.equal(v[1].kind, 'still');
  assert.equal(v[0].frames, Math.round(v[0].len * 24));
  assert.throws(() => planVisuals({ visuals: [{ shot: '01', at: 'S2' }, { shot: '02', at: 'S3' }, { shot: '01', at: 'S2' }] }, lines, total, shots, '.'), /redosled/);
  assert.throws(() => planVisuals({ visuals: [{ shot: '77', at: 'S2' }] }, lines, total, shots, '.'), /77/);
});

test('framingCorners: prozor klizi od prve do poslednje tačke i ne izlazi iz kadra', () => {
  const wc = 3414;
  const c = framingCorners([[0.5, 0.5, 1], [0.8, 0.5, 1]], 25, { wc });
  const x0 = /x0='([^']+)'/.exec(c)[1];
  assert.ok(Math.abs(evalAt(x0, 0) - (0.5 * wc - 540)) < 0.01);
  assert.ok(Math.abs(evalAt(x0, 24) - (0.8 * wc - 540)) < 0.01);
  assert.ok(evalAt(x0, 12) > evalAt(x0, 6), 'klizi udesno');
  const edge = /x0='([^']+)'/.exec(framingCorners([[0.99, 0.5, 1]], 10, { wc }))[1];
  assert.equal(evalAt(edge, 3), wc - 1080, 'desna ivica prozora ostaje u kadru');
  const left = /x0='([^']+)'/.exec(framingCorners([[0.01, 0.5, 1]], 10, { wc }))[1];
  assert.equal(evalAt(left, 3), 0);
});

test('interpExpr: dve tačke ease-in-out, tri linearno kroz sredinu', () => {
  const two = interpExpr([0, 1], 11);
  assert.ok(evalAt(two, 1) < 0.1, 'ease-in: sporo na početku');
  assert.ok(Math.abs(evalAt(two, 5) - 0.5) < 1e-3);
  const three = interpExpr([0, 1, 0], 11);
  assert.ok(Math.abs(evalAt(three, 5) - 1) < 1e-3, 'srednja tačka je dostignuta');
  assert.ok(Math.abs(evalAt(three, 10) - 0) < 1e-3);
  assert.equal(interpExpr([0.4], 11), '0.4');
});

test('editSrt: titlovi prate pomerene tokene i ne prelaze trajanje', () => {
  const { lines, end } = planLines({ lines: [{ id: 'S2' }, { id: 'S1' }] }, TIMING, GAPS);
  const srt = editSrt(lines, end + 0.6);
  assert.match(srt, /^1\n00:00:00,\d{3} --> /);
  assert.ok(/Four five six seven\./.test(srt.replace(/\n/g, ' ')));
  const ends = [...srt.matchAll(/--> (\d\d):(\d\d):(\d\d),(\d{3})/g)].map((m) => +m[3] + +m[4] / 1000);
  assert.ok(Math.max(...ends) <= end + 0.6 + 1e-9);
});
