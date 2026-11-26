// tests/publish.test.mjs
//
//   node --test tests/
//
// Titlovi iz timing.json i YouTube pravila za chaptere.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCues, chunkTokens, wrapLines, srtTime, toSrt, parseChapters, validateChapters, clock, SUB_DEFAULTS,
  parseTitles, validateTitles, parsePlaylists, validatePlaylists,
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

const TRIO = ['Athena', 'Apollo', 'Artemis'];
const titlesOf = (...ts) => parseTitles(`TITLE OPTIONS:\n${ts.map((t, i) => `${i + 1}. ${t} — ugao`).join('\n')}\n\nDESCRIPTION:\n1. nije naslov`);

test('naslovi: parser odseca ugao posle poslednje crte i staje na kraju bloka', () => {
  const ts = parseTitles('# x\n\nTITLE OPTIONS:\n1. Ramesses III Was Murdered — His Mummy Proved It — the forensic proof\n2. B — b\n\nDESCRIPTION:\n3. C — c');
  assert.deepEqual(ts.map((t) => t.title), ['Ramesses III Was Murdered — His Mummy Proved It', 'B']);
});

test('naslovi: svi glavni likovi ili nijedan prolazi', () => {
  const ts = titlesOf(
    'Athena, Apollo & Artemis: The Gods Who Were Never Supposed to Be Born',
    "Zeus Swallowed One Mother, Hera Hunted the Other: Athena, Apollo & Artemis",
    'Why Were Athena, Apollo and Artemis Never Supposed to Be Born?',
    "One Born From Zeus's Head, Two on a Floating Island: Athena, Apollo & Artemis",
    'Three Gods Who Were Never Supposed to Be Born',
  );
  assert.deepEqual(validateTitles(ts, TRIO), []);
});

test('naslovi: naslov o jednom od glavnih likova je naslov za Short', () => {
  const ts = titlesOf(
    'Athena, Apollo & Artemis: The Gods Who Were Never Supposed to Be Born',
    'Hera Hunted Apollo\'s Mother Across the Earth Until Delos Took Her In',
    'Why Were Athena, Apollo and Artemis Never Supposed to Be Born?',
    'Athena, Apollo and Artemis Again',
    'Three Gods Who Were Never Supposed to Be Born',
  );
  const errors = validateTitles(ts, TRIO).join('\n');
  assert.match(errors, /naslov 2 imenuje samo Apollo/);
  assert.match(errors, /fali: Athena, Artemis/);
});

test('naslovi: prvi imenuje sve, većina imenuje sve, tačno 5, najviše 100 znakova', () => {
  const partial = titlesOf('Three Gods', 'Three Gods 2', 'Three Gods 3', 'Athena, Apollo, Artemis', 'Athena, Apollo, Artemis 2');
  const e1 = validateTitles(partial, TRIO).join('\n');
  assert.match(e1, /naslov 1 mora da imenuje sve/);
  assert.match(e1, /samo 2 od 5/);
  assert.match(validateTitles(titlesOf('Athena Apollo Artemis'), TRIO).join(), /treba 5/);
  const long = titlesOf(`Athena, Apollo & Artemis ${'x'.repeat(80)}`, 'Athena Apollo Artemis', 'Athena Apollo Artemis', 'x', 'y');
  assert.match(validateTitles(long, TRIO).join(), /najviše 100/);
});

test('naslovi: ime se traži kao cela reč, bez obzira na velika slova i posesiv', () => {
  const ts = titlesOf("Zeus's Daughter", 'ZEUS Again', 'Zeusian', 'x', 'y');
  assert.match(validateTitles(ts, ['Zeus']).join(), /samo 2 od 5/);
  assert.deepEqual(validateTitles(titlesOf('Ramesses III Was Murdered', 'Ramesses III', 'ramesses iii', 'x', 'y'), ['Ramesses III']), []);
});

test('naslovi: nepoznat lik prolazi pod imenom ili pod ulogom koju naslovi koriste', () => {
  const sub = [['Erra-imitti', 'Gardener']];
  const ok = titlesOf('The Gardener Who Became King', 'Erra-imitti, King for a Day', 'A Gardener on the Throne', 'x', 'y');
  assert.deepEqual(validateTitles(ok, sub), []);
  assert.match(validateTitles(titlesOf('x', 'y', 'z', 'w', 'v'), sub).join(), /naslov 1 mora .*fali: Erra-imitti \/ Gardener/);
});

test('naslovi: bez protagonists u episode.json nema provere', () => {
  assert.match(validateTitles(titlesOf('a', 'b', 'c', 'd', 'e'), undefined).join(), /protagonists/);
  assert.match(validateTitles(titlesOf('a', 'b', 'c', 'd', 'e'), []).join(), /protagonists/);
});

test('clock', () => {
  assert.equal(clock(0), '0:00');
  assert.equal(clock(117.2), '1:57');
  assert.equal(clock(3725), '1:02:05');
});

// 26. nov 2026, zahtev vlasnika: plejliste se odlučuju i zapisuju pri publishu, u `publish.md`.
test('parsePlaylists: stavke ispod PLAYLISTS:, ime, ID i oznaka; nova plejlista bez ID-ja', () => {
  const md = [
    'HASHTAGS:', '#AnimatedTales', '',
    'PLAYLISTS:',
    '- Ancient Americas (PLA7y22Sz8NpI) — primary',
    '- Ancient Mysteries & Discoveries (PLCJ0-2X4_lHM)',
    '- Same Story, Different World (new) — create it first',
    '',
    'SUBTITLES:', 'subtitles.srt',
  ].join('\n');
  assert.deepEqual(parsePlaylists(md), [
    { name: 'Ancient Americas', id: 'PLA7y22Sz8NpI', isNew: false, note: 'primary' },
    { name: 'Ancient Mysteries & Discoveries', id: 'PLCJ0-2X4_lHM', isNew: false, note: '' },
    { name: 'Same Story, Different World', id: null, isNew: true, note: 'create it first' },
  ]);
  assert.equal(parsePlaylists('TITLE OPTIONS:\n1. A — b'), null, 'bez odeljka: null, ne prazna lista');
  assert.deepEqual(parsePlaylists('PLAYLISTS:\n\nSUBTITLES:'), []);
});

test('validatePlaylists: odeljak fali, prazan ili stavka bez ID-ja i bez (new) su upozorenja', () => {
  assert.match(validatePlaylists(null)[0], /nema PLAYLISTS/);
  assert.match(validatePlaylists([])[0], /prazan/);
  assert.match(validatePlaylists([{ name: 'Kings', id: null, isNew: false, note: '' }])[0], /Kings/);
  assert.deepEqual(validatePlaylists([{ name: 'Kings, Crowns & Conspiracies', id: 'PLEBO7vEBCib8', isNew: false, note: 'primary' }]), []);
});
