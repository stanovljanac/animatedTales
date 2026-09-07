// tests/lint-blocking.test.mjs
//
//   node --test tests/
//
// Verifikacija 4 iz docs/plan/C06-lint-blocking.md (BLOCKING deo), plus po jedan test na
// svaku ivicu svake od deset provera. Fixture-i su tests/fixtures/{good,bad}-episode.
//
// Medija za F1 je u repou (16x16 crni testsrc, ~2 KB po klipu), ali probe() traži ffmpeg —
// pa se F1 testovi preskaču kad binarnog fajla nema, po konvenciji iz tests/ffmpeg.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ffmpegPath } from '../tools/ffmpeg.mjs';
import { countWords, loadCameraLanguage, normalize, segments, s1Violations } from '../tools/contract.mjs';
import {
  CHECKS, assertShape, checkF1, lintEpisode, lintStatic, main, parseArgs, renderReport,
} from '../tools/lint.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');
const GOOD = path.join(FIX, 'good-episode');
const BAD = path.join(FIX, 'bad-episode');

const LISTS = loadCameraLanguage();

let noBinary = false;
try {
  ffmpegPath();
} catch {
  noBinary = 'ffmpeg nije nađen u ovom okruženju';
}

// ---------------------------------------------------------------- građa sintetičkih ulaza

const filler = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

/** Pet obaveznih blokova, 24 reči po kanonskom brojaču. */
const BLOCKS = 'CAMERA: eye level, wide.\nFRAME LAYOUT: center — the subject.\n' +
  'FACING: we see the face.\nSCREEN DIRECTION: left to right.\nNOT IN FRAME: the sky.';

/** Image prompt tačno zadate dužine, sa svih pet blokova. */
const imagePrompt = (words = 120, head = '') => {
  const base = head ? `${head}\n${BLOCKS}` : BLOCKS;
  const pad = words - countWords(base);
  assert.ok(pad >= 0, `imagePrompt: ${words} reči je manje od osnove (${countWords(base)})`);
  return pad ? `${base}\n${filler(pad)}` : base;
};

/** Animation prompt tačno zadate dužine, sa MOTION BUDGET linijom. */
const animPrompt = (words = 80, budget = 6) => {
  const base = `MOTION BUDGET: key motion completes within ${budget}s.`;
  const pad = words - countWords(base);
  assert.ok(pad >= 0, `animPrompt: ${words} reči je manje od osnove`);
  return pad ? `${base}\n${filler(pad)}` : base;
};

const mkShot = (over = {}) => ({
  shot_id: '01',
  beat_id: 'B01',
  link_group: null,
  t_in: 0,
  t_out: 6,
  use_in: 0,
  use_out: 6,
  use_len: 6,
  motion_budget: 6,
  source_file: 'shots/part01.mp4',
  ingredient_image: null,
  characters: [],
  image_prompt: imagePrompt(120),
  animation_prompt: animPrompt(80, 6),
  tags: {
    subject_type: 'object', shot_size: 'CU', angle: 'eye',
    location: 'a-place', time_light: 'day', camera_motion: 'locked',
  },
  ...over,
});

/** Jedan beat koji tačno pokriva zadate shotove. */
const mkSb = (shots, over = {}) => {
  const end = shots.at(-1).t_out;
  return {
    schema_version: 1,
    episode: 'synthetic',
    generated_at: '2026-09-05T00:00:00Z',
    narration_duration: shots.reduce((a, s) => a + s.use_len, 0),
    fps: 24,
    beats: [{
      beat_id: 'B01',
      sentences: ['S01'],
      start: shots[0].t_in,
      end,
      dur: end - shots[0].t_in,
      device: null,
      narration_says: 'x',
      viewer_sees: 'y',
      shots,
    }],
    ...over,
  };
};

const mkEp = (over = {}) => ({
  slug: 'synthetic', title: 'S', status: 'draft', voice: null,
  narration_file: null, final_file: null, endcard_file: null,
  characters: [], locations: [], key_props: [], notes: '',
  ...over,
});

/** Kodovi nalaza nad jednim shotom, u redosledu izveštaja. */
const run = (shotOver, epOver) =>
  lintStatic(mkSb([mkShot(shotOver)]), mkEp(epOver), { lists: LISTS });
const codes = (findings) => findings.map((f) => f.code);
const only = (findings, code) => findings.filter((f) => f.code === code);

// ---------------------------------------------------------------- verifikacija 4: fixture-i

test('good-episode: nula BLOCKING nalaza (devet provera bez medija)', () => {
  const sb = JSON.parse(fs.readFileSync(path.join(GOOD, 'storyboard.json'), 'utf8'));
  const ep = JSON.parse(fs.readFileSync(path.join(GOOD, 'episode.json'), 'utf8'));
  const findings = lintStatic(sb, ep, { lists: LISTS });
  assert.deepEqual(findings, [], findings.map((f) => `[${f.code}] ${f.where}: ${f.message}`).join('\n'));
});

test('good-episode: shot 01 su izbrojani primeri iz prompt-templates.md (151 / 90 reči)', () => {
  const sb = JSON.parse(fs.readFileSync(path.join(GOOD, 'storyboard.json'), 'utf8'));
  const s = sb.beats[0].shots[0];
  assert.equal(countWords(s.image_prompt), 151);
  assert.equal(countWords(s.animation_prompt), 90);
});

test('good-episode: shot 02 nosi zabranjenu frazu OTKLJUČANU listom B', () => {
  // Ako ovo prestane da važi, S1 test na dobrom fixture-u više ne dokazuje ništa:
  // lista B se mora videti na primeru koji prolazi, ne samo na onom koji pada.
  const sb = JSON.parse(fs.readFileSync(path.join(GOOD, 'storyboard.json'), 'utf8'));
  const s = sb.beats[0].shots[1];
  assert.ok(normalize(s.image_prompt).includes('in front of'), 'fixture više ne sadrži "in front of"');
  assert.deepEqual(s1Violations(s.image_prompt, LISTS), []);
});

test('bad-episode: obara tačno S1, S2, T2, C1 — po jedan nalaz', () => {
  const sb = JSON.parse(fs.readFileSync(path.join(BAD, 'storyboard.json'), 'utf8'));
  const ep = JSON.parse(fs.readFileSync(path.join(BAD, 'episode.json'), 'utf8'));
  const findings = lintStatic(sb, ep, { lists: LISTS });
  assert.deepEqual(codes(findings), ['T2', 'S1', 'S2', 'C1']);
  assert.deepEqual(findings.map((f) => f.where), ['shot 03', 'shot 01', 'shot 02', 'shot 04']);
});

test('bad-episode: svaki nalaz nosi izmerenu i očekivanu vrednost', () => {
  const sb = JSON.parse(fs.readFileSync(path.join(BAD, 'storyboard.json'), 'utf8'));
  const ep = JSON.parse(fs.readFileSync(path.join(BAD, 'episode.json'), 'utf8'));
  for (const f of lintStatic(sb, ep, { lists: LISTS })) {
    assert.ok(f.measured && f.measured.length, `[${f.code}] bez izmerene vrednosti`);
    assert.ok(f.expected && f.expected.length, `[${f.code}] bez očekivane vrednosti`);
  }
});

test('main(): bad -> exit 1, good -> exit 0', async () => {
  const log = console.log;
  console.log = () => {};
  try {
    assert.equal(await main([BAD, '--no-media', '--no-write']), 1);
    assert.equal(await main([GOOD, '--no-media', '--no-write']), 0);
  } finally {
    console.log = log;
  }
});

// ---------------------------------------------------------------- T1

test('T1: gap na tajmlajnu', () => {
  const a = mkShot({ shot_id: '01', t_in: 0, t_out: 6 });
  const b = mkShot({ shot_id: '02', t_in: 6.5, t_out: 12.5 });
  const f = only(lintStatic(mkSb([a, b]), mkEp(), { lists: LISTS }), 'T1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /gap od 0\.5s/);
});

test('T1: preklapanje na tajmlajnu', () => {
  const a = mkShot({ shot_id: '01', t_in: 0, t_out: 6 });
  const b = mkShot({ shot_id: '02', t_in: 5.5, t_out: 11.5 });
  const f = only(lintStatic(mkSb([a, b]), mkEp(), { lists: LISTS }), 'T1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /preklapanje od 0\.5s/);
});

test('T1: tajmlajn mora da počne na nuli', () => {
  const f = only(run({ t_in: 1, t_out: 7 }), 'T1');
  assert.ok(f.length >= 1);
  assert.match(f[0].message, /t_in 1s/);
});

test('T1: t_out != t_in + use_len', () => {
  const sb = mkSb([mkShot({ t_out: 6 })]);
  sb.beats[0].shots[0].use_len = 5;
  const f = only(lintStatic(sb, mkEp(), { lists: LISTS }), 'T1');
  assert.ok(f.some((x) => /t_out 6s != t_in \+ use_len/.test(x.message)));
});

test('T1: use_out != use_in + use_len', () => {
  const f = only(run({ use_in: 0.5 }), 'T1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /use_out 6s != use_in \+ use_len/);
});

test('T1: granice beata se porede kvantizovano, ne sirovo', () => {
  // beat.end je sirova vrednost iz timing.json (nije frejm-poravnata); shot.t_out jeste.
  // q(6.002) === 6, pa ovo NIJE nalaz.
  const sb = mkSb([mkShot({ t_out: 6 })]);
  sb.beats[0].end = 6.002;
  sb.beats[0].dur = 6.002;
  assert.deepEqual(only(lintStatic(sb, mkEp(), { lists: LISTS }), 'T1'), []);
});

test('T1: beat čija granica ne pada na shot', () => {
  const sb = mkSb([mkShot({ t_out: 6 })]);
  sb.beats[0].end = 7;
  const f = only(lintStatic(sb, mkEp(), { lists: LISTS }), 'T1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /poslednji shot se završava na 6s, a beat na 7s/);
});

test('T1: drift preko 0.2s je nalaz, ispod nije', () => {
  const sb = mkSb([mkShot()]);
  sb.narration_duration = 6.2;
  assert.deepEqual(only(lintStatic(sb, mkEp(), { lists: LISTS }), 'T1'), []);
  sb.narration_duration = 6.21;
  const f = only(lintStatic(sb, mkEp(), { lists: LISTS }), 'T1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /drift 0\.21s/);
});

// ---------------------------------------------------------------- T2

test('T2: granice 3.0 i 10.0 prolaze, 2.999 i 10.001 padaju', () => {
  const at = (len) => only(run({ t_out: len, use_out: len, use_len: len, motion_budget: len,
    animation_prompt: animPrompt(80, len) }), 'T2');
  assert.deepEqual(at(3), []);
  assert.deepEqual(at(10), []);
  assert.equal(at(2.9).length, 1);
  assert.equal(at(10.1).length, 1);
});

test('T2: nalaz nosi izmerenu dužinu', () => {
  const f = only(run({ t_out: 1.2, use_out: 1.2, use_len: 1.2, motion_budget: 1.2,
    animation_prompt: animPrompt(80, 1.2) }), 'T2');
  assert.equal(f[0].measured, '1.2s');
  assert.equal(f[0].expected, '3.0–10.0s');
});

// ---------------------------------------------------------------- T3

test('T3: motion_budget je obavezan ispod 9.0s', () => {
  const f = only(run({ motion_budget: null }), 'T3');
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, 'null');
});

test('T3: na 9.0s i preko motion_budget sme da bude null', () => {
  const len = 9;
  assert.deepEqual(only(run({
    t_out: len, use_out: len, use_len: len, motion_budget: null,
  }), 'T3'), []);
});

test('T3: motion_budget mora da bude jednak use_len', () => {
  const f = only(run({ motion_budget: 5, animation_prompt: animPrompt(80, 5) }), 'T3');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /motion_budget 5s != use_len 6s/);
});

test('T3: MOTION BUDGET linija mora da nosi isti broj', () => {
  const f = only(run({ animation_prompt: animPrompt(80, 4) }), 'T3');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /promptu kaže 4s, a motion_budget je 6s/);
});

test('T3: animation prompt bez MOTION BUDGET linije', () => {
  const f = only(run({ animation_prompt: filler(80) }), 'T3');
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, 'nema linije');
});

// ---------------------------------------------------------------- S1

test('S1: zabranjena fraza bez klauzule pada', () => {
  const f = only(run({ image_prompt: imagePrompt(120, 'ACTION: the herald stands in front of the altar.') }), 'S1');
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, '"in front of"');
});

test('S1: klauzula u istoj rečenici otključava', () => {
  const head = 'ACTION: the herald stands in front of the altar, center, near-camera and large.';
  assert.deepEqual(only(run({ image_prompt: imagePrompt(120, head) }), 'S1'), []);
});

test('S1: klauzula u susednoj rečenici NE otključava', () => {
  const head = 'ACTION: the herald stands in front of the altar. He is center, near-camera and large.';
  assert.equal(only(run({ image_prompt: imagePrompt(120, head) }), 'S1').length, 1);
});

test('S1: klauzula u drugom promptu NE otključava', () => {
  const f = lintStatic(mkSb([mkShot({
    image_prompt: imagePrompt(120, 'ACTION: soldiers behind them.'),
    animation_prompt: animPrompt(80, 6) + '\ncenter, near-camera and large',
  })]), mkEp(), { lists: LISTS });
  assert.equal(only(f, 'S1').length, 1);
});

test('S1: traži se i u animation promptu', () => {
  const f = only(run({ animation_prompt: animPrompt(80, 6) + '\nthe hills in the distance behind' }), 'S1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /^animation prompt/);
});

test('S1: "far" u "farmers" ne otključava (granica reči)', () => {
  const head = 'ACTION: farmers work in the background of the valley.';
  assert.equal(only(run({ image_prompt: imagePrompt(120, head) }), 'S1').length, 1);
});

test('S1: obe liste dolaze iz camera-language.md, ne iz koda', () => {
  assert.deepEqual(LISTS.phrases,
    ['in the background', 'behind them', 'in the distance behind', 'in front of']);
  assert.equal(LISTS.tokens.length, 18);
  for (const t of ['upper-right', 'left third', 'near-camera', 'cropped at', 'centre'])
    assert.ok(LISTS.tokens.includes(t), `lista B nema token "${t}"`);
  // Lista D nosi R6 i čita se iz istog dokumenta, pa pada pod isto pravilo.
  assert.ok(LISTS.nullDirection.includes('nothing crosses the frame'));
  assert.ok(LISTS.nullDirection.includes('no movement across the frame'));
});

test('S1: prazan ili pokvaren camera-language.md se ne prećutkuje', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-'));
  const noSection = path.join(dir, 'a.md');
  fs.writeFileSync(noSection, '# nista\n');
  assert.throws(() => loadCameraLanguage(noSection), /nema odeljka/);

  const emptyList = path.join(dir, 'b.md');
  fs.writeFileSync(emptyList, '## Liste koje provera S1 konzumira\n\n### A. x\n\n```\n\n```\n\n### B. y\n\n```\nfar\n```\n\n### D. z\n\n```\nnothing moves\n```\n');
  assert.throws(() => loadCameraLanguage(emptyList), /lista A/);

  // Lista D je uvedena uz R6 i obavezna je kao A i B: bez nje R6 tiho nikad ne bi javio.
  const noD = path.join(dir, 'c.md');
  fs.writeFileSync(noD, '## Liste koje provera S1 konzumira\n\n### A. x\n\n```\nin front of\n```\n\n### B. y\n\n```\nfar\n```\n');
  assert.throws(() => loadCameraLanguage(noD), /### D/);

  assert.throws(() => loadCameraLanguage(path.join(dir, 'nema.md')), /se ne mogu pročitati/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('S1: prelom reda je granica i kad se linija ne završava tačkom', () => {
  // Blokovi prompta se ne pišu uvek sa tačkom na kraju. Da prelom reda nije granica sam
  // za sebe, klauzula iz FRAME LAYOUT linije bi otključala frazu iz sledeće linije.
  const head = 'FRAME LAYOUT: center, near-camera and large\n' +
    'ACTION: the herald stands in front of the altar';
  const f = only(run({ image_prompt: imagePrompt(120, head) }), 'S1');
  assert.equal(f.length, 1);
  assert.equal(f[0].message.includes('center'), false, 'klauzula iz druge linije je ušla u isti segment');
});

test('segments(): prelom reda i tačka dele, decimala ne deli', () => {
  assert.deepEqual(segments('A one. B two.\nC three'), ['a one.', 'b two.', 'c three']);
  assert.deepEqual(segments('within 6.5s of the shot'), ['within 6.5s of the shot']);
});

// ---------------------------------------------------------------- S2

test('S2: svaki od pet blokova se traži posebno', () => {
  for (const blk of ['CAMERA', 'FRAME LAYOUT', 'FACING', 'SCREEN DIRECTION', 'NOT IN FRAME']) {
    const stripped = BLOCKS.split('\n').filter((l) => !l.startsWith(blk + ':')).join('\n');
    const prompt = `${stripped}\n${filler(120 - countWords(stripped))}`;
    const f = only(run({ image_prompt: prompt }), 'S2');
    assert.equal(f.length, 1, `${blk}: očekivan tačno jedan nalaz`);
    assert.match(f[0].message, new RegExp(`nema blok ${blk}$`));
  }
});

test('S2: blok mora da bude verzalom i sa dvotačkom', () => {
  const prompt = BLOCKS.replace('FACING:', 'Facing:');
  assert.equal(only(run({ image_prompt: `${prompt}\n${filler(120 - countWords(prompt))}` }), 'S2').length, 1);
  const noColon = BLOCKS.replace('FACING:', 'FACING');
  assert.equal(only(run({ image_prompt: `${noColon}\n${filler(119 - countWords(noColon))}` }), 'S2').length, 1);
});

test('S2: gleda se image prompt, ne animation', () => {
  const prompt = BLOCKS.split('\n').filter((l) => !l.startsWith('FACING:')).join('\n');
  const f = run({
    image_prompt: `${prompt}\n${filler(120 - countWords(prompt))}`,
    animation_prompt: `${animPrompt(70, 6)}\nFACING: we see the face.`,
  });
  assert.equal(only(f, 'S2').length, 1);
});

// ---------------------------------------------------------------- S3

test('S3: svih pet reči se hvata u animation promptu', () => {
  for (const w of ['then', 'later', 'afterwards', 'cuts to', 'meanwhile']) {
    const prompt = `${animPrompt(70, 6)}\n1-4s: the hand moves ${w} the light shifts.`;
    const f = only(run({ animation_prompt: prompt }), 'S3');
    assert.equal(f.length, 1, `"${w}" nije uhvaćeno`);
  }
});

test('S3: granica reči — "strengthen" i "cuts," ne pale proveru', () => {
  const prompt = `${animPrompt(70, 6)}\n1-4s: the rope cuts, the grip strengthens, the latheR holds.`;
  assert.deepEqual(only(run({ animation_prompt: prompt }), 'S3'), []);
});

test('S3: gleda se animation prompt, ne image', () => {
  const head = 'ACTION: he lifts it, then sets it down.';
  assert.deepEqual(only(run({ image_prompt: imagePrompt(120, head) }), 'S3'), []);
});

// ---------------------------------------------------------------- P1 / P2

test('P1: 89 pada, 90 i 160 prolaze, 161 pada', () => {
  assert.equal(only(run({ image_prompt: imagePrompt(89) }), 'P1').length, 1);
  assert.deepEqual(only(run({ image_prompt: imagePrompt(90) }), 'P1'), []);
  assert.deepEqual(only(run({ image_prompt: imagePrompt(160) }), 'P1'), []);
  assert.equal(only(run({ image_prompt: imagePrompt(161) }), 'P1').length, 1);
});

test('P2: 59 pada, 60 i 100 prolaze, 101 pada', () => {
  assert.equal(only(run({ animation_prompt: animPrompt(59) }), 'P2').length, 1);
  assert.deepEqual(only(run({ animation_prompt: animPrompt(60) }), 'P2'), []);
  assert.deepEqual(only(run({ animation_prompt: animPrompt(100) }), 'P2'), []);
  assert.equal(only(run({ animation_prompt: animPrompt(101) }), 'P2').length, 1);
});

test('P1: nalaz nosi izmereni broj reči', () => {
  const f = only(run({ image_prompt: imagePrompt(200) }), 'P1');
  assert.equal(f[0].measured, '200 reči');
  assert.equal(f[0].expected, '90–160');
});

// ---------------------------------------------------------------- C1

const LOCKED = 'a lean Carthaginian clerk of about fifty, close-cropped grey hair, a short curled beard';
const withEntity = (id, desc, promptHead) => run(
  { characters: [id], image_prompt: imagePrompt(120, promptHead) },
  { characters: [{ id, name: id, locked_description: desc }] },
);

test('C1: doslovan opis prolazi, prepričan pada', () => {
  assert.deepEqual(only(withEntity('hanno', LOCKED, `SUBJECT: Hanno, ${LOCKED}.`), 'C1'), []);
  const paraphrase = 'SUBJECT: Hanno, a thin Carthaginian clerk about fifty, short grey hair, a curled beard.';
  assert.equal(only(withEntity('hanno', LOCKED, paraphrase), 'C1').length, 1);
});

test('C1: belina se sažima, veličina slova se ignoriše', () => {
  const wrapped = `SUBJECT: Hanno, a lean Carthaginian clerk\n   of about FIFTY, close-cropped grey hair,\na short curled beard.`;
  assert.deepEqual(only(withEntity('hanno', LOCKED, wrapped), 'C1'), []);
});

test('C1: interpunkcija se NE normalizuje — izbačen zarez ruši proveru', () => {
  const noComma = `SUBJECT: Hanno, ${LOCKED.replace('fifty,', 'fifty')}.`;
  assert.equal(only(withEntity('hanno', LOCKED, noComma), 'C1').length, 1);
});

test('C1: traži se u image promptu, animation ne pomaže', () => {
  const f = lintStatic(mkSb([mkShot({
    characters: ['hanno'],
    image_prompt: imagePrompt(120),
    animation_prompt: `${animPrompt(70, 6)}\nPRESERVE: ${LOCKED}.`,
  })]), mkEp({ characters: [{ id: 'hanno', name: 'H', locked_description: LOCKED }] }), { lists: LISTS });
  assert.equal(only(f, 'C1').length, 1);
});

test('C1: entitet se traži u sva tri niza episode.json-a', () => {
  for (const key of ['characters', 'locations', 'key_props']) {
    const f = lintStatic(
      mkSb([mkShot({ characters: ['x'], image_prompt: imagePrompt(120, `SUBJECT: ${LOCKED}.`) })]),
      mkEp({ [key]: [{ id: 'x', name: 'X', locked_description: LOCKED }] }),
      { lists: LISTS },
    );
    assert.deepEqual(only(f, 'C1'), [], `${key}: entitet nije nađen`);
  }
});

test('C1: nepoznat id je nalaz, ne pad', () => {
  const f = only(run({ characters: ['nema-ga'] }), 'C1');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /ne postoji u episode\.json/);
});

test('C1: prazan characters niz je legitiman', () => {
  assert.deepEqual(only(run({ characters: [] }), 'C1'), []);
});

// ---------------------------------------------------------------- F1

test('F1: klip koji traje dovoljno prolazi', { skip: noBinary }, async () => {
  const sb = JSON.parse(fs.readFileSync(path.join(GOOD, 'storyboard.json'), 'utf8'));
  assert.deepEqual(await checkF1(sb, GOOD), []);
});

test('F1: nedostajući klip je nalaz', { skip: noBinary }, async () => {
  const sb = mkSb([mkShot({ source_file: 'shots/nema.mp4' })]);
  const f = await checkF1(sb, GOOD);
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, 'fajl ne postoji');
});

test('F1: prekratak izvor je nalaz, uz toleranciju od jednog frejma', { skip: noBinary }, async () => {
  // fixture klipovi traju 10s
  const at = async (useOut) => (await checkF1(mkSb([mkShot({ use_out: useOut })]), GOOD)).length;
  assert.equal(await at(10), 0);
  assert.equal(await at(10 + 1 / 24 - 0.001), 0, 'tolerancija od jednog frejma mora da drži');
  assert.equal(await at(10.2), 1);
});

test('F1: dostupno trajanje je na osi prvog dekodiranog sempla (duration - start)', async () => {
  // Ista konvencija kao za narraciju u C05 (schemas.md §5.4 tačka 1): ffmpeg -ss računa
  // od prvog dekodiranog sempla, pa kontejnerski ofset ne sme da se broji kao materijal.
  const sb = mkSb([mkShot({ use_out: 9 })]);
  const stub = (start) => async () => ({ duration: 10, start });
  assert.deepEqual(await checkF1(sb, GOOD, { probe: stub(0) }), []);
  const f = await checkF1(sb, GOOD, { probe: stub(2) });
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, '8s');
});

test('F1: nečitljiv fajl je nalaz, ne pad alata', async () => {
  const sb = mkSb([mkShot()]);
  const boom = async () => { throw new Error(['probe: ffmpeg nije prepoznao fajl', 'više linija'].join('\n')); };
  const f = await checkF1(sb, GOOD, { probe: boom });
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, 'probe je pao');
  assert.ok(!f[0].message.includes('\n'), 'poruka mora da stane u jednu liniju izveštaja');
});

test('F1: ffmpeg bez trajanja je nalaz', async () => {
  const f = await checkF1(mkSb([mkShot()]), GOOD, { probe: async () => ({ duration: null, start: 0 }) });
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, 'duration = N/A');
});

test('F1: --no-media preskače proveru, ostale rade', { skip: noBinary }, async () => {
  const withMedia = await lintEpisode(BAD, { lists: LISTS });
  const without = await lintEpisode(BAD, { media: false, lists: LISTS });
  assert.deepEqual(codes(withMedia.findings), codes(without.findings));
  assert.equal(without.media, false);
});

// ---------------------------------------------------------------- oblik ulaza i izveštaj

test('assertShape: nedostajuće polje ruši lint sa čitljivom porukom, ne TypeError-om', () => {
  const sb = mkSb([mkShot()]);
  delete sb.beats[0].shots[0].use_len;
  delete sb.narration_duration;
  assert.throws(() => assertShape(sb, mkEp()), (err) => {
    assert.match(err.message, /nedostaje narration_duration/);
    assert.match(err.message, /shot 01: nedostaje use_len/);
    return true;
  });
});

test('assertShape: beat bez shotova', () => {
  const sb = mkSb([mkShot()]);
  sb.beats[0].shots = [];
  assert.throws(() => assertShape(sb, mkEp()), /bar jednim shotom/);
});

test('renderReport: dve strogo odvojene sekcije, BLOCKING pre ADVISORY', () => {
  // ADVISORY sadržaj je posao C07 i drži ga tests/lint-advisory.test.mjs; ovde se tvrdi
  // samo to da BLOCKING sekcija ne zna za signale i da stoji prva.
  const sb = JSON.parse(fs.readFileSync(path.join(BAD, 'storyboard.json'), 'utf8'));
  const ep = JSON.parse(fs.readFileSync(path.join(BAD, 'episode.json'), 'utf8'));
  const md = renderReport({ storyboard: sb, findings: lintStatic(sb, ep, { lists: LISTS }) });
  assert.match(md, /^# QA report — bad-episode$/m);
  assert.match(md, /storyboard: 3 beatova, 4 shotova/);
  assert.match(md, /^## BLOCKING {2}\(4 nalaza\)$/m);
  assert.match(md, /^## ADVISORY {2}\(0 signala\)$/m);
  assert.ok(md.indexOf('## BLOCKING') < md.indexOf('## ADVISORY'));
  for (const c of ['T2', 'S1', 'S2', 'C1']) assert.match(md, new RegExp(`^- \\[${c}\\] shot \\d\\d: `, 'm'));
});

test('renderReport: bez nalaza i sa preskočenim F1', () => {
  const sb = JSON.parse(fs.readFileSync(path.join(GOOD, 'storyboard.json'), 'utf8'));
  const md = renderReport({ storyboard: sb, findings: [], media: false });
  assert.match(md, /## BLOCKING {2}\(0 nalaza\)/);
  assert.match(md, /F1 preskočen \(--no-media\)/);
  assert.match(md, /Nema nalaza\./);
});

test('nalazi su sortirani redosledom BLOCKING tabele', () => {
  const sb = mkSb([mkShot({
    image_prompt: imagePrompt(200, 'ACTION: he stands in front of the altar.'),
    animation_prompt: `${animPrompt(101, 6)}\nlater the hand lifts`,
  })]);
  const got = codes(lintStatic(sb, mkEp(), { lists: LISTS }));
  const want = got.slice().sort((a, b) => CHECKS.indexOf(a) - CHECKS.indexOf(b));
  assert.deepEqual(got, want);
  assert.ok(got.includes('S1') && got.includes('S3') && got.includes('P1') && got.includes('P2'));
});

test('parseArgs: zastave i greške', () => {
  assert.deepEqual(parseArgs(['episodes/x']), { dir: 'episodes/x', media: true, write: true, help: false });
  assert.equal(parseArgs(['x', '--no-media']).media, false);
  assert.equal(parseArgs(['x', '--no-write']).write, false);
  assert.throws(() => parseArgs([]), /nedostaje folder/);
  assert.throws(() => parseArgs(['x', '--sta-je-ovo']), /nepoznata opcija/);
  assert.throws(() => parseArgs(['x', 'y']), /višak argumenta/);
});
