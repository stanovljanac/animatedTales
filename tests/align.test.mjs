// tests/align.test.mjs
//
//   node --test tests/
//
// Pokriva čiste delove align.mjs iz docs/plan/C05-align.md: normalizaciju tokena,
// segmentaciju script.md na rečenice, Needleman–Wunsch nad sintetičkim nizovima i
// sklapanje timing.json-a. Whisper se nikad ne pokreće — ASR reči su sintetičke.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  tokenize, parseScript, needlemanWunsch, buildTiming, timelineDuration,
  parseArgs, ensureAsr, scriptFromAsr,
} from '../tools/align.mjs';

// ---------------------------------------------------------------- normalizacija tokena

test('tokenize: mala slova, interpunkcija na kraju otpada', () => {
  assert.deepEqual(tokenize('History is full.'), ['history', 'is', 'full']);
  assert.deepEqual(tokenize('Rome, the city'), ['rome', 'the', 'city']);
});

test('tokenize: apostrof se briše, reč ostaje jedna', () => {
  assert.deepEqual(tokenize("don't"), ['dont']);
  assert.deepEqual(tokenize('don\u2019t'), ['dont'], 'unicode apostrof isto');
  assert.deepEqual(tokenize("O'Brien's"), ['obriens']);
});

test('tokenize: crtica deli reč na dva tokena', () => {
  assert.deepEqual(tokenize('eye-level'), ['eye', 'level']);
  assert.deepEqual(tokenize('Rome\u2014the city'), ['rome', 'the', 'city']);
});

test('tokenize: tačke u skraćenicama otpadaju (B.C. == BC)', () => {
  assert.deepEqual(tokenize('B.C.'), tokenize('BC'));
  assert.deepEqual(tokenize('U.S.'), ['us']);
});

test('tokenize: brojevi se šire u reči, pa se digit i slovni oblik poklapaju', () => {
  assert.deepEqual(tokenize('390'), ['three', 'hundred', 'ninety']);
  assert.deepEqual(tokenize('390'), tokenize('three hundred ninety'));
  assert.deepEqual(tokenize('1,500'), tokenize('one thousand five hundred'));
  assert.deepEqual(tokenize('3.5'), ['three', 'point', 'five']);
});

test('tokenize: samostalna interpunkcija daje nula tokena', () => {
  assert.deepEqual(tokenize('\u2014'), []);
  assert.deepEqual(tokenize('|  -  \u2014'), []);
});

test('tokenize: % i & se izgovaraju', () => {
  assert.deepEqual(tokenize('50%'), ['fifty', 'percent']);
  assert.deepEqual(tokenize('R&D'), ['r', 'and', 'd']);
});

// ---------------------------------------------------------------- segmentacija script.md

const texts = (md) => parseScript(md).sentences.map((s) => s.text);

test('parseScript: tačka + veliko slovo deli rečenice', () => {
  assert.deepEqual(texts('This is one. That is two.'), ['This is one.', 'That is two.']);
});

test('parseScript: skraćenica ne deli rečenicu', () => {
  assert.deepEqual(texts('In 390 B.C. the Gauls came.'), ['In 390 B.C. the Gauls came.']);
  assert.deepEqual(texts('Mr. Smith arrived. Then he left.'), ['Mr. Smith arrived.', 'Then he left.']);
});

test('parseScript: inicijal ne deli rečenicu', () => {
  assert.deepEqual(texts('J. R. Smith went home.'), ['J. R. Smith went home.']);
});

test('parseScript: decimalni broj ne deli rečenicu', () => {
  assert.deepEqual(texts('It cost 3.5 million. Really.'), ['It cost 3.5 million.', 'Really.']);
});

test('parseScript: navodnik posle tačke ostaje uz prvu rečenicu', () => {
  assert.deepEqual(texts('He shouted "Run." Then silence.'), ['He shouted "Run."', 'Then silence.']);
});

test('parseScript: prazan red deli rečenice i bez tačke', () => {
  assert.deepEqual(texts('First line\n\nSecond line'), ['First line', 'Second line']);
});

test('parseScript: tri tačke pa malo slovo ne dele rečenicu', () => {
  assert.deepEqual(texts('He waited... and waited.'), ['He waited... and waited.']);
});

test('parseScript: naslovi i markdown ukrasi se skidaju iz teksta', () => {
  const md = '# The Night Rome Almost Fell\n\n**Rome** fell.\n\n- a bullet line\n';
  assert.deepEqual(texts(md), ['Rome fell.', 'a bullet line']);
});

test('parseScript: ## OUTRO postavlja outroIndex na prvu rečenicu outra', () => {
  const md = 'One. Two.\n\n## OUTRO\n\nThanks for watching.';
  const p = parseScript(md);
  assert.deepEqual(p.sentences.map((s) => s.text), ['One.', 'Two.', 'Thanks for watching.']);
  assert.equal(p.outroIndex, 2);
});

test('parseScript: naslov bez praznog reda oko sebe i dalje zatvara pasus', () => {
  const p = parseScript('One. Two.\n## OUTRO\nThanks for watching.');
  assert.deepEqual(p.sentences.map((s) => s.text), ['One.', 'Two.', 'Thanks for watching.']);
  assert.equal(p.outroIndex, 2, 'telo epizode ne sme da upadne u outro');
});

test('parseScript: bez outro sekcije outroIndex je null', () => {
  assert.equal(parseScript('One. Two.').outroIndex, null);
});

test('parseScript: rečenice dobijaju id S01, S02, ... bez rupa', () => {
  const p = parseScript('One. Two. Three.');
  assert.deepEqual(p.sentences.map((s) => s.id), ['S01', 'S02', 'S03']);
});

// ---------------------------------------------------------------- Needleman–Wunsch

test('NW: identični nizovi -> sve poklopljeno, bez rupa', () => {
  const a = ['the', 'gauls', 'crossed', 'the', 'river'];
  const pairs = needlemanWunsch(a, a);
  assert.equal(pairs.length, a.length);
  pairs.forEach((p, i) => {
    assert.deepEqual([p.ai, p.bi, p.match], [i, i, true]);
  });
});

test('NW: zamena reči ostaje par, ne dve rupe', () => {
  const pairs = needlemanWunsch(['the', 'cat', 'sat'], ['the', 'dog', 'sat']);
  assert.equal(pairs.length, 3);
  assert.deepEqual(pairs[1], { ai: 1, bi: 1, match: false });
});

test('NW: višak reči u ASR-u -> rupa na strani skripte', () => {
  const pairs = needlemanWunsch(['the', 'cat'], ['the', 'big', 'cat']);
  const holes = pairs.filter((p) => p.ai === null);
  assert.equal(holes.length, 1);
  assert.equal(holes[0].bi, 1);
  assert.deepEqual(pairs.filter((p) => p.match).map((p) => [p.ai, p.bi]), [[0, 0], [1, 2]]);
});

test('NW: reč koju ASR nije čuo -> rupa na strani ASR-a', () => {
  const pairs = needlemanWunsch(['the', 'big', 'cat'], ['the', 'cat']);
  const holes = pairs.filter((p) => p.bi === null);
  assert.equal(holes.length, 1);
  assert.equal(holes[0].ai, 1);
});

test('NW: indeksi su monotoni na obe strane', () => {
  const a = 'one two three four five six seven'.split(' ');
  const b = 'one three four x five six seven eight'.split(' ');
  let ai = -1;
  let bi = -1;
  for (const p of needlemanWunsch(a, b)) {
    if (p.ai !== null) {
      assert.ok(p.ai > ai, 'ai nije rastuće');
      ai = p.ai;
    }
    if (p.bi !== null) {
      assert.ok(p.bi > bi, 'bi nije rastuće');
      bi = p.bi;
    }
  }
});

// ---------------------------------------------------------------- buildTiming

/** ASR reči iz teksta: svaka reč traje `step`, sa `gap` pauze između. */
function asr(text, { step = 0.5, gap = 0, start = 0, probability = 0.99 } = {}) {
  let t = start;
  return text.split(/\s+/).filter(Boolean).map((word) => {
    const w = { word, start: r3(t), end: r3(t + step), probability };
    t = r3(t + step + gap);
    return w;
  });
}
const r3 = (t) => Math.round(t * 1000) / 1000;

/** Invarijante iz docs/reference/schemas.md §2.4 — važe za svaki timing.json. */
function checkTiming(timing) {
  const S = timing.sentences;
  assert.ok(S.length >= 1, 'bar jedna rečenica');
  S.forEach((s, i) => {
    assert.equal(s.id, 'S' + String(i + 1).padStart(2, '0'), 'id bez rupa');
    assert.ok(s.end > s.start, `${s.id}: end nije veće od start`);
    assert.ok(Math.abs(s.dur - (s.end - s.start)) < 1e-9, `${s.id}: dur != end - start`);
    assert.ok(typeof s.text === 'string' && s.text.length > 0, `${s.id}: nema text`);
    assert.ok(s.confidence >= 0 && s.confidence <= 1, `${s.id}: confidence van 0–1`);
    for (const [k, v] of Object.entries({ start: s.start, end: s.end, dur: s.dur })) {
      assert.equal(v, r3(v), `${s.id}.${k}=${v} nije zaokruženo na 3 decimale`);
    }
    if (i + 1 < S.length) {
      assert.ok(s.end <= S[i + 1].start + 1e-9, `${s.id}: preklapanje sa sledećom rečenicom`);
    }
  });
  assert.ok(S[0].start >= 0, 'prva rečenica počinje pre nule');
  assert.ok(S.at(-1).end <= timing.duration + 1e-9, 'poslednja rečenica prelazi trajanje fajla');

  const ids = new Set(S.map((s) => s.id));
  let prev = -Infinity;
  for (const w of timing.words) {
    assert.ok(ids.has(w.sentence_id), `reč "${w.word}" pokazuje na nepostojeću rečenicu`);
    assert.ok(w.end >= w.start, 'reč se završava pre nego što počne');
    assert.ok(w.start >= prev - 1e-9, 'reči nisu u rastućem redosledu');
    prev = w.start;
  }
  assert.ok(timing.outro_start === null || S.some((s) => Math.abs(s.start - timing.outro_start) < 1e-9),
    'outro_start se ne poklapa ni sa jednom rečenicom');
}

test('buildTiming: alignment na sopstveni transkript -> vremena identična, confidence 1', () => {
  const script = parseScript('The gauls crossed the river. Rome slept.');
  const words = asr('The gauls crossed the river. Rome slept.');
  const { timing, stats, warnings } = buildTiming(script, words, { duration: 4, model: 'small.en' });

  checkTiming(timing);
  assert.equal(stats.matchRate, 1);
  assert.equal(timing.sentences[0].start, words[0].start);
  assert.equal(timing.sentences[0].end, words[4].end);
  assert.equal(timing.sentences[1].start, words[5].start);
  assert.equal(timing.sentences[1].end, words.at(-1).end);
  assert.equal(timing.sentences[0].confidence, 0.99);
  assert.equal(timing.model, 'small.en');
  assert.equal(timing.duration, 4);
  assert.deepEqual(warnings, []);
});

test('buildTiming: tekst je iz skripte, vreme iz ASR-a', () => {
  const script = parseScript('Brennus took the city.');
  const words = asr('Braedus took the city.');
  const { timing } = buildTiming(script, words, { duration: 3, model: 'small.en' });

  checkTiming(timing);
  assert.equal(timing.sentences[0].text, 'Brennus took the city.', 'ASR ne sme da prepiše skriptu');
  assert.equal(timing.words[0].word, 'Brennus');
  assert.equal(timing.words[0].start, words[0].start, 'vreme mora ostati iz ASR-a');
  assert.equal(timing.words[0].confidence, 0, 'reč koju ASR nije čuo kako piše nema confidence');
  assert.ok(timing.sentences[0].confidence < 1);
});

test('buildTiming: reč koju ASR nije čuo dobija interpolirano vreme', () => {
  const script = parseScript('One two three.');
  const words = [
    { word: 'One', start: 0, end: 1, probability: 0.9 },
    { word: 'three.', start: 2, end: 3, probability: 0.9 },
  ];
  const { timing, stats } = buildTiming(script, words, { duration: 3, model: 'small.en' });

  checkTiming(timing);
  const two = timing.words[1];
  assert.equal(two.word, 'two');
  assert.equal(two.confidence, 0);
  assert.equal(two.start, 1, 'interpolirana reč mora da počne na kraju prethodne');
  assert.equal(two.end, 2, 'jedna nečuvena reč popunjava celu rupu, ne 1ms');
  assert.equal(timing.sentences[0].start, 0);
  assert.equal(timing.sentences[0].end, 3);
  assert.ok(stats.matchRate < 1);
});

test('buildTiming: ASR reč koja se raširi u više tokena deli svoje vreme na njih', () => {
  const script = parseScript('Three hundred ninety fell.');
  const words = [
    { word: '390', start: 1, end: 2.5, probability: 0.9 },
    { word: 'fell.', start: 2.5, end: 3, probability: 0.9 },
  ];
  const { timing, stats } = buildTiming(script, words, { duration: 3, model: 'small.en' });

  checkTiming(timing);
  assert.equal(stats.matchRate, 1, '390 mora da se poklopi sa "three hundred ninety"');
  assert.deepEqual(timing.words.map((w) => [w.word, w.start, w.end]), [
    ['Three', 1, 1.5],
    ['hundred', 1.5, 2],
    ['ninety', 2, 2.5],
    ['fell', 2.5, 3],
  ], 'vreme ASR reči se deli na tokene, ne kopira celo na svaki');

  // Kad skripta pokriva samo deo raširene ASR reči, mora da dobije baš taj deo.
  const kraca = buildTiming(parseScript('Ninety fell.'), words, { duration: 3, model: 'small.en' });
  checkTiming(kraca.timing);
  assert.deepEqual(kraca.timing.words.map((w) => [w.word, w.start, w.end]), [
    ['Ninety', 2, 2.5],
    ['fell', 2.5, 3],
  ], '"ninety" je treći token reči 390 i počinje na 2.0, ne na 1.0');
});

test('buildTiming: pauza veća od 1.5s -> upozorenje gap', () => {
  const script = parseScript('One. Two.');
  const words = [
    { word: 'One.', start: 0, end: 1, probability: 0.99 },
    { word: 'Two.', start: 3, end: 4, probability: 0.99 },
  ];
  const { warnings } = buildTiming(script, words, { duration: 4, model: 'small.en' });
  const gaps = warnings.filter((w) => w.code === 'gap');
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].sentence_id, 'S02');
});

test('buildTiming: rečenica ispod 0.85 -> upozorenje low-confidence sa predlogom medium.en', () => {
  const script = parseScript('Alpha beta gamma delta.');
  const words = asr('Alpha beta gamma delta.', { probability: 0.5 });
  const { timing, warnings } = buildTiming(script, words, { duration: 2, model: 'small.en' });

  checkTiming(timing);
  const low = warnings.filter((w) => w.code === 'low-confidence');
  assert.equal(low.length, 1);
  assert.equal(low[0].sentence_id, 'S01');
  assert.match(low[0].message, /medium\.en/);
});

test('buildTiming: outro_start je start prve rečenice outra', () => {
  const script = parseScript('One. Two.\n\n## OUTRO\n\nThanks for watching.');
  const words = asr('One. Two. Thanks for watching.');
  const { timing } = buildTiming(script, words, { duration: 4, model: 'small.en' });

  checkTiming(timing);
  assert.equal(timing.outro_start, timing.sentences[2].start);
});

test('buildTiming: bez outra outro_start je null', () => {
  const script = parseScript('One. Two.');
  const { timing } = buildTiming(script, asr('One. Two.'), { duration: 2, model: 'small.en' });
  assert.equal(timing.outro_start, null);
});

test('buildTiming: višak ASR reči na početku ne pomera prvu rečenicu', () => {
  const script = parseScript('Rome slept.');
  const words = [
    { word: 'Mm', start: 0, end: 0.4, probability: 0.3 },
    { word: 'Rome', start: 1, end: 1.5, probability: 0.99 },
    { word: 'slept.', start: 1.5, end: 2, probability: 0.99 },
  ];
  const { timing } = buildTiming(script, words, { duration: 2, model: 'small.en' });

  checkTiming(timing);
  assert.equal(timing.sentences[0].start, 1, 'halucinacija pre prve reči ne sme da uđe u rečenicu');
  assert.equal(timing.words.length, 2, 'u timing.json ulaze samo reči iz skripte');
});

test('buildTiming: rečenica koju ASR uopšte nije čuo i dalje ima end > start', () => {
  const script = parseScript('One. Ghost sentence here. Two.');
  const words = [
    { word: 'One.', start: 0, end: 1, probability: 0.99 },
    { word: 'Two.', start: 1, end: 2, probability: 0.99 },
  ];
  const { timing, warnings } = buildTiming(script, words, { duration: 2, model: 'small.en' });

  checkTiming(timing);
  assert.equal(timing.sentences.length, 3);
  assert.ok(warnings.some((w) => w.code === 'unheard'), 'nečujna rečenica mora da digne upozorenje');
});

test('buildTiming: prazna skripta baca', () => {
  assert.throws(() => buildTiming({ sentences: [], outroIndex: null }, asr('one'), { duration: 1 }), TypeError);
});

// ---------------------------------------------------------------- nula na tajmlajnu

test('timelineDuration: kontejner ofset se skida sa trajanja, ne sa vremena reči', () => {
  // narration.mp3 epizode night-when-rome-almost-fell: 217.21s uz start 0.025057s
  assert.equal(timelineDuration({ duration: 217.21, start: 0.025057 }), 217.185);
  assert.equal(timelineDuration({ duration: 10, start: 0 }), 10);
  assert.equal(timelineDuration({ duration: 10, start: null }), 10);
});

test('timelineDuration: izmereno trajanje dekodiranog audia ima prednost', () => {
  assert.equal(timelineDuration({ duration: 217.21, start: 0.025057 }, { audio_duration: 217.182 }), 217.182);
});

test('timelineDuration: besmisleno trajanje iz ASR-a se odbacuje', () => {
  assert.equal(timelineDuration({ duration: 217.21, start: 0.025057 }, { audio_duration: 5 }), 217.185);
});

// ---------------------------------------------------------------- CLI i keš

test('parseArgs: podrazumevane vrednosti i zastave', () => {
  assert.deepEqual(parseArgs(['episodes/x']), {
    dir: 'episodes/x', model: 'small.en', asrOnly: false, force: false, asrScript: false, help: false,
  });
  const a = parseArgs(['episodes/x', '--model', 'medium.en', '--asr-only', '--force', '--asr-script']);
  assert.deepEqual([a.model, a.asrOnly, a.force, a.asrScript], ['medium.en', true, true, true]);
});

test('parseArgs: model van schemas.md §2.1 se odbija', () => {
  assert.throws(() => parseArgs(['episodes/x', '--model', 'large-v3']), /nije dozvoljen/);
});

test('parseArgs: nepoznata opcija i nedostajući folder se odbijaju', () => {
  assert.throws(() => parseArgs(['episodes/x', '--turbo']), /nepoznata opcija/);
  assert.throws(() => parseArgs([]), /nedostaje folder/);
});

/** Folder epizode sa unapred pripremljenim ASR kešom. */
function fakeEpisode(model) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-align-test-'));
  fs.mkdirSync(path.join(dir, '.cache'));
  fs.writeFileSync(path.join(dir, '.cache', 'asr-words.json'), JSON.stringify({
    model, audio_duration: 2, elapsed: 1.0, segments: [{ start: 0, end: 2, text: 'Rome slept.' }],
    words: [
      { word: 'Rome', start: 0, end: 1, probability: 0.9 },
      { word: 'slept.', start: 1, end: 2, probability: 0.9 },
    ],
  }));
  return dir;
}

test('ensureAsr: keš istog modela se koristi, whisper se ne pokreće', async () => {
  const dir = fakeEpisode('small.en');
  try {
    const r = await ensureAsr(dir, { model: 'small.en', narration: path.join(dir, 'nema.mp3') });
    assert.equal(r.cached, true);
    assert.equal(r.asr.words.length, 2, 'reči moraju doći iz keša');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('ensureAsr: keš snimljen drugim modelom se ne koristi', async () => {
  const dir = fakeEpisode('medium.en');
  try {
    // narracija ne postoji -> ffmpeg pada; bitno je da se uopšte krenulo u nov run
    await assert.rejects(
      ensureAsr(dir, { model: 'small.en', narration: path.join(dir, 'nema.mp3') }),
      (err) => !/cached/.test(err.message),
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('ensureAsr: --force preskače ispravan keš', async () => {
  const dir = fakeEpisode('small.en');
  try {
    await assert.rejects(ensureAsr(dir, { model: 'small.en', force: true, narration: path.join(dir, 'nema.mp3') }));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scriptFromAsr: transkript postaje skripta, bez outra', () => {
  const { md, script } = scriptFromAsr({
    segments: [{ text: ' Rome slept. ' }, { text: 'The Gauls came.' }],
    words: [],
  });
  assert.equal(md, 'Rome slept. The Gauls came.');
  assert.deepEqual(script.sentences.map((s) => s.text), ['Rome slept.', 'The Gauls came.']);
  assert.equal(script.outroIndex, null);
});
