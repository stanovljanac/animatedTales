// tests/publish.test.mjs
//
//   node --test tests/
//
// Titlovi iz timing.json i YouTube pravila za chaptere.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCues, chunkTokens, wrapLines, srtTime, toSrt, parseChapters, validateChapters, clock, SUB_DEFAULTS,
} from '../tools/publish.mjs';

/** Rečenica sa rečima od po 0.3s. */
function timingOf(texts, { gap = 0.5 } = {}) {
  const sentences = [];
  const words = [];
  let t = 0;
  texts.forEach((text, i) => {
    const id = 'S' + String(i + 1).padStart(2, '0');
    const start = t;
    for (const w of text.split(' ')) {
      words.push({ sentence_id: id, word: w.replace(/[^\w'-]/g, ''), start: t, end: t + 0.3 });
      t += 0.3;
    }
    sentences.push({ id, start, end: t, text });
    t += gap;
  });
  return { duration: t, sentences, words };
}

test('kratka rečenica je jedan titl u jednom redu', () => {
  const cues = buildCues(timingOf(['One diver died.']));
  assert.equal(cues.length, 1);
  assert.deepEqual(cues[0].lines, ['One diver died.']);
});

test('duga rečenica se deli bez siročeta i poštuje granice', () => {
  const t = timingOf(['They sheltered off Antikythera, a small rocky island between Crete and mainland Greece.']);
  const cues = buildCues(t, { ...SUB_DEFAULTS, maxDur: 3 });
  assert.ok(cues.length >= 2);
  for (const c of cues) {
    assert.ok(c.lines.length <= 2);
    for (const l of c.lines) assert.ok(l.length <= 42, l);
    assert.ok(c.lines.join(' ').split(' ').length > 1, 'nijedan titl od jedne reči');
  }
  assert.match(cues[0].lines.join(' '), /Antikythera,$/, 'rez posle zareza');
});

test('titlovi se ne preklapaju i ne prelaze kraj', () => {
  const t = timingOf(['A gear wheel.', 'And not just one.', 'Until next time.'], { gap: 0.05 });
  const cues = buildCues(t);
  cues.forEach((c, i) => {
    assert.ok(c.end > c.start);
    if (i) assert.ok(c.start >= cues[i - 1].end);
  });
  assert.ok(cues.at(-1).end <= t.duration);
});

test('chunkTokens čuva sve reči redom', () => {
  const t = timingOf(['In canvas suits and copper helmets, at depths their bodies were never built for, the work was brutal.']);
  const toks = t.sentences[0].text.split(' ').map((text, i) => ({ text, start: i * 0.3, end: i * 0.3 + 0.3 }));
  const chunks = chunkTokens(toks);
  assert.equal(chunks.flat().map((x) => x.text).join(' '), t.sentences[0].text);
});

test('wrapLines ujednačava redove', () => {
  assert.deepEqual(wrapLines('When the sea calmed, one diver went down to look around.'),
    ['When the sea calmed, one diver', 'went down to look around.']);
});

test('SRT format', () => {
  assert.equal(srtTime(3723.456), '01:02:03,456');
  assert.equal(toSrt([{ index: 1, start: 0, end: 1.5, lines: ['a', 'b'] }]), '1\n00:00:00,000 --> 00:00:01,500\na\nb\n');
});

test('chapteri: ispravni prolaze', () => {
  const ch = parseChapters('uvod\n0:00 Start\n0:45 Middle\n2:10 End\n#tag');
  assert.deepEqual(ch.map((c) => c.at), [0, 45, 130]);
  assert.deepEqual(validateChapters(ch, 244), []);
});

test('chapteri: YouTube pravila', () => {
  assert.match(validateChapters(parseChapters('0:00 A\n1:00 B'), 244).join(), /najmanje 3/);
  assert.match(validateChapters(parseChapters('0:05 A\n1:00 B\n2:00 C'), 244).join(), /0:00/);
  assert.match(validateChapters(parseChapters('0:00 A\n0:05 B\n2:00 C'), 244).join(), /najmanje 10s/);
  assert.match(validateChapters(parseChapters('0:00 A\n2:00 B\n1:00 C'), 244).join(), /nije posle/);
  assert.match(validateChapters(parseChapters('0:00 A\n1:00 B\n4:00 C'), 244).join(), /najmanje 10s/);
});

test('clock', () => {
  assert.equal(clock(0), '0:00');
  assert.equal(clock(117.2), '1:57');
  assert.equal(clock(3725), '1:02:05');
});
