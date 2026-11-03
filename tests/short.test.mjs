// tests/short.test.mjs
//
//   node --test tests/
//
// Čisti deo tools/short.mjs: izraz za izrez, titlovi, SRT i plan. Render i merenje govora
// zovu ffmpeg i proveravaju se na pravoj epizodi, ne ovde.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  SHORT, snapFrame, centerToX, cropExpr, captionTokens, splitLines, captionChunks, buildAss, shortSrt, planShort,
} from '../tools/short.mjs';

/** ffmpeg izraz -> broj, za `t`. Samo funkcije koje cropExpr koristi. */
function evalAt(expr, t) {
  const js = expr.replace(/\bif\(/g, 'IF(').replace(/\blt\(/g, 'LT(').replace(/\bclip\(/g, 'CLIP(');
  return vm.runInNewContext(js, {
    t,
    IF: (c, a, b) => (c ? a : b),
    LT: (a, b) => (a < b ? 1 : 0),
    CLIP: (v, lo, hi) => Math.min(Math.max(v, lo), hi),
  });
}

const SHOTS = [
  { shot_id: '01', t_in: 0, t_out: 4 },
  { shot_id: '02', t_in: 4, t_out: 8 },
  { shot_id: '03', t_in: 8, t_out: 12 },
];

test('snapFrame vraća najbliži frejm', () => {
  assert.equal(snapFrame(110.5), 110.5);
  assert.ok(Math.abs(snapFrame(58.042) - 58.041667) < 1e-6);
});

test('centerToX drži prozor unutar kadra', () => {
  assert.equal(centerToX(0), 0);
  assert.equal(centerToX(1), SHORT.srcW - SHORT.w);
  assert.equal(centerToX(0.5), (SHORT.srcW - SHORT.w) / 2);
});

test('cropExpr: statičan kadar je konstanta, klizanje ide od a do b i ostaje u granicama', () => {
  const { expr, missing } = cropExpr(SHOTS, { '01': [0.2, 0.6], '02': 0.5, '03': 0.9 }, 0, 12);
  assert.deepEqual(missing, []);
  const x = (c) => centerToX(c);
  assert.ok(Math.abs(evalAt(expr, 0) - x(0.2)) < 0.01, 'početak klizanja');
  assert.ok(Math.abs(evalAt(expr, 2) - (x(0.2) + x(0.6)) / 2) < 0.01, 'sredina je smoothstep 0.5');
  assert.ok(Math.abs(evalAt(expr, 3.999) - x(0.6)) < 1, 'kraj klizanja');
  assert.ok(Math.abs(evalAt(expr, 5) - x(0.5)) < 0.01);
  assert.ok(Math.abs(evalAt(expr, 9) - x(0.9)) < 0.01);
});

test('cropExpr: offset pomera kadrove, kadar bez zapisa se prijavljuje', () => {
  const { expr, missing } = cropExpr(SHOTS, { '01': 0.2, '03': 0.9 }, 0, 12, 0.5);
  assert.deepEqual(missing, ['02']);
  assert.ok(Math.abs(evalAt(expr, 4.4) - centerToX(0.2)) < 0.01, 'prvi kadar traje do 4.5');
  assert.ok(Math.abs(evalAt(expr, 4.6) - centerToX(0.5)) < 0.01, 'drugi kadar bez zapisa je u središtu');
});

test('cropExpr: kadrovi izvan [from, to] ne ulaze', () => {
  const { expr, missing } = cropExpr(SHOTS, { '02': 0.3 }, 4, 8);
  assert.deepEqual(missing, []);
  assert.ok(Math.abs(Number(expr) - centerToX(0.3)) < 0.01, 'ostaje jedna konstanta, bez if()');
});

/** Rečenica sa rečima od po 0.3s, počev od `t0`; reči nemaju interpunkciju kao u timing.json. */
function timingOf(texts, t0 = 0) {
  const sentences = [];
  const words = [];
  let t = t0;
  texts.forEach((text, i) => {
    const id = 'S' + String(i + 1).padStart(2, '0');
    const start = t;
    for (const w of text.split(/\s+/).filter((x) => /[\p{L}\p{N}]/u.test(x))) {
      words.push({ sentence_id: id, word: w.replace(/[^\p{L}\p{N}'-]/gu, ''), start: t, end: t + 0.3 });
      t += 0.3;
    }
    sentences.push({ id, start, end: t, text });
    t += 0.5;
  });
  return { sentences, words, duration: t };
}

test('captionTokens lepi samostalnu crticu za prethodnu reč i zadržava vremena reči', () => {
  const timing = timingOf(['Then he took a wife — and heard it.']);
  const toks = captionTokens(timing, timing.sentences[0]);
  assert.equal(toks.length, 8);
  assert.equal(toks[4].text, 'wife —');
  assert.equal(toks[5].text, 'and');
  assert.ok(Math.abs(toks[5].start - 1.5) < 1e-9, 'reč posle crtice je na svom vremenu, ne proporcionalno');
});

test('splitLines deli dugačak tekst u dva ujednačena reda', () => {
  const toks = 'Zeus had overthrown it'.split(' ').map((text) => ({ text }));
  const lines = splitLines(toks, 18);
  assert.equal(lines.length, 2);
  assert.ok(lines.every((l) => l.map((t) => t.text).join(' ').length <= 18));
  assert.equal(splitLines(toks.slice(0, 2), 18).length, 1);
});

test('buildAss: jedan događaj po reči, aktivna reč zlatna, vreme pomereno na početak Shorta', () => {
  const timing = timingOf(['Zeus had overthrown a father.'], 10);
  const chunks = captionChunks(timing, 10, 20);
  const ass = buildAss(chunks, -10);
  const events = ass.split('\n').filter((l) => l.startsWith('Dialogue:'));
  assert.equal(events.length, 5);
  assert.match(events[0], /\{\\1c&H28C8FF&\}Zeus\{\\1c&HFFFFFF&\}/);
  assert.match(events[1], /\{\\1c&H28C8FF&\}had\{\\1c&HFFFFFF&\}/);
  assert.match(events[0], /^Dialogue: 0,0:00:00\.00,/, 'prvi titl kreće na 0:00 Shorta (lead se ne ide ispod nule)');
  assert.ok(ass.includes(`PlayResY: ${SHORT.h}`));
});

test('captionChunks: samo reči unutar [from, to]', () => {
  const timing = timingOf(['One two three four five six seven eight.']);
  const chunks = captionChunks(timing, 0.9, 1.8).flat().map((t) => t.text);
  assert.deepEqual(chunks, ['four', 'five', 'six']);
});

test('shortSrt pomera titlove na 0:00 Shorta i ne izlazi iz njegovog trajanja', () => {
  const timing = timingOf(['Before the cut.', 'Zeus had overthrown a father.', 'After the cut.']);
  const [, mid] = timing.sentences;
  const srt = shortSrt(timing, mid.start, mid.end);
  assert.match(srt, /^1\n00:00:00,000 --> /);
  assert.ok(!/Before|After/.test(srt));
  const ends = [...srt.matchAll(/--> (\d\d):(\d\d):(\d\d),(\d{3})/g)].map((m) => +m[3] + +m[4] / 1000);
  assert.ok(Math.max(...ends) <= mid.end - mid.start + 1e-9);
});

test('planShort: zvuk ranije i preskočeni frejmovi produžavaju slikovni pad, ne trajanje slike', () => {
  const plan = planShort({ from: 110.5, to: 163.25, crops: {} }, [], { lead: 0.125, skip: 0 });
  assert.equal(plan.padFrames, 3);
  assert.equal(plan.duration, 52.875);
  const skipped = planShort({ from: 0, to: 44.583, crops: {} }, [], { lead: 0, skip: 10 });
  assert.equal(skipped.padFrames, 10);
  assert.equal(skipped.duration, 44.583);
});
