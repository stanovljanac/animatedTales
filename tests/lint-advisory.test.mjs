// tests/lint-advisory.test.mjs
//
//   node --test tests/
//
// Verifikacija 4 iz docs/plan/C07-lint-advisory.md (ADVISORY deo), plus po jedan test na svaku
// ivicu svakog od pet signala. Fixture-i su tests/fixtures/{repetitive,linked}-episode; oba
// prolaze BLOCKING sloj sa nula nalaza, jer se inače na njima ne vidi da ADVISORY ne menja
// exit code — a to je jedina stvar koju ovaj sloj mora da garantuje.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  R1_AXES, R4_MIN_WORDS, TAGS,
  loadFixedPromptLines, loadStyleString, r4Tokens,
} from '../tools/contract.mjs';
import {
  ADVISORY, advise, flatShots, lintStatic, main, r4Exemptions, r4Segments, renderReport,
} from '../tools/lint.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');
const REPETITIVE = path.join(FIX, 'repetitive-episode');
const LINKED = path.join(FIX, 'linked-episode');
const GOOD = path.join(FIX, 'good-episode');

const load = (dir) => ({
  sb: JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8')),
  ep: JSON.parse(fs.readFileSync(path.join(dir, 'episode.json'), 'utf8')),
});

/** Bez izuzeća — za testove praga, gde doc fajlovi nisu predmet merenja. */
const BARE = { styleString: '', fixedLines: [] };

const of = (signals, code) => signals.filter((s) => s.code === code);
const msgs = (signals, code) => of(signals, code).map((s) => `${s.where}: ${s.message}`);

// ---------------------------------------------------------------- građa sintetičkih ulaza

const tags = (over = {}) => ({
  subject_type: 'character', shot_size: 'MS', angle: 'eye',
  location: 'a-place', time_light: 'day', camera_motion: 'locked',
  ...over,
});

const mkShot = (id, over = {}) => ({
  shot_id: id,
  beat_id: over.beat_id ?? 'B01',
  link_group: null,
  t_in: 0,
  t_out: 5,
  use_in: 0,
  use_out: 5,
  use_len: 5,
  motion_budget: 5,
  source_file: `shots/part${id}.mp4`,
  ingredient_image: null,
  characters: [],
  image_prompt: `image ${id}`,
  animation_prompt: `animation ${id}`,
  ...over,
  tags: tags(over.tags),
});

/** Storyboard od zadatih shotova; beatovi se prave po `beat_id`, u redosledu pojavljivanja. */
const mkSb = (shots, beatOver = {}) => {
  const beats = [];
  for (const s of shots) {
    let b = beats.find((x) => x.beat_id === s.beat_id);
    if (!b) {
      b = {
        beat_id: s.beat_id, sentences: ['S01'], start: 0, end: 5, dur: 5,
        device: null, narration_says: 'x', viewer_sees: 'y', shots: [],
        ...(beatOver[s.beat_id] ?? {}),
      };
      beats.push(b);
    }
    b.shots.push(s);
  }
  return {
    schema_version: 1,
    episode: 'synthetic',
    generated_at: '2026-09-05T00:00:00Z',
    narration_duration: 5,
    fps: 24,
    beats,
  };
};

const mkEp = (over = {}) => ({
  slug: 'synthetic', title: 'S', status: 'draft', voice: null,
  narration_file: null, final_file: null, endcard_file: null,
  characters: [], locations: [], key_props: [], notes: '',
  ...over,
});

const run = (shots, epOver = {}, opts = BARE) => advise(mkSb(shots), mkEp(epOver), opts);

// ---------------------------------------------------------------- verifikacija 4: fixture-i

test('repetitive-episode: exit 0 i R1 eskalacija na četiri uzastopna shota', () => {
  const { sb, ep } = load(REPETITIVE);
  assert.deepEqual(lintStatic(sb, ep), [], 'fixture mora da prođe BLOCKING sloj');
  const r1 = msgs(advise(sb, ep), 'R1');
  assert.equal(r1.length, 2);
  assert.match(r1[0], /^shot 01–04: eskalacija: 4 uzastopna shota dele /);
  assert.match(r1[0], /subject_type=character \+ location=lugdunum-forum \+ time_light=grey-rain/);
  // Eskalacija ide prva; par je zaseban signal i imenuje osu po kojoj se shotovi razlikuju.
  assert.equal(r1[1], 'shot 01 → 02: dele 5 od 6 osa — razlikuje se samo camera_motion (locked → push)');
});

test('linked-episode: tri linked shota istog beata — R1 se NE javlja', () => {
  const { sb, ep } = load(LINKED);
  assert.deepEqual(lintStatic(sb, ep), [], 'kontra-fixture mora da prođe BLOCKING sloj');
  const shots = flatShots(sb);
  assert.equal(shots.length, 3);
  assert.ok(shots.every((s) => s.link_group === 'B01'), 'sva tri shota moraju biti linkovana');
  for (const k of ['subject_type', 'location', 'time_light']) {
    assert.ok(shots.every((s) => s.tags[k] === shots[0].tags[k]), `shotovi moraju da dele ${k}`);
  }
  assert.deepEqual(of(advise(sb, ep), 'R1'), []);
});

test('linked-episade bez link_group-a bi eskalirao — izuzeće stvarno radi', () => {
  // Bez ovog testa gornji dokazuje samo da podataka nema, ne da izuzeće nešto radi.
  const { sb, ep } = load(LINKED);
  for (const s of flatShots(sb)) s.link_group = null;
  const r1 = msgs(advise(sb, ep), 'R1');
  // Tri shota se razlikuju po shot_size, angle i camera_motion, pa nijedan par nije flag;
  // ono što izlazi na videlo je upravo eskalacija koju link_group inače guši.
  assert.equal(r1.length, 1, r1.join(' | '));
  assert.match(r1[0], /^shot 01–03: eskalacija: 3 uzastopna shota dele /);
});

test('good-episode: promptovi koji dele samo locked_description, style string i fiksne linije — R4 ćuti', () => {
  const { sb, ep } = load(GOOD);
  assert.deepEqual(of(advise(sb, ep), 'R4'), []);
  assert.deepEqual(of(advise(sb, ep), 'R1'), []);
});

test('good-episode: sva tri izuzeća su nosiva — bez ijednog R4 laje na ispravan storyboard', () => {
  const { sb, ep } = load(GOOD);
  const bez = (epOver, opts) => of(advise(epOver ?? sb, epOver ? ep : ep, opts), 'R4').length;
  const prazan = { ...ep, characters: [], locations: [], key_props: [] };
  assert.ok(of(advise(sb, prazan, BARE), 'R4').length > 0, 'bez ijednog izuzeća');
  assert.ok(of(advise(sb, ep, BARE), 'R4').length > 0, 'bez style stringa i fiksnih linija');
  assert.ok(of(advise(sb, ep, { fixedLines: [] }), 'R4').length > 0, 'bez fiksnih PRESERVE/FORBID linija');
  assert.equal(bez(), 0);
});

test('main(): ADVISORY ne menja exit code', async () => {
  const log = console.log;
  const lines = [];
  console.log = (...a) => lines.push(a.join(' '));
  try {
    // Šest signala, nula BLOCKING nalaza -> i dalje 0.
    assert.equal(await main([REPETITIVE, '--no-write']), 0);
    assert.ok(lines.some((l) => /^ADVISORY: 6 signala /.test(l)), lines.join('\n'));
    assert.ok(lines.some((l) => /\[R1\] shot 01–04: eskalacija/.test(l)));
    lines.length = 0;
    assert.equal(await main([LINKED, '--no-write']), 0);
    assert.ok(lines.some((l) => /^ADVISORY: 3 signala /.test(l)));
    assert.ok(!lines.some((l) => /\[R1\]/.test(l)));
  } finally {
    console.log = log;
  }
});

// ---------------------------------------------------------------- R1

test('R1: par bez ijedne razlike', () => {
  const s = msgs(run([mkShot('01'), mkShot('02')]), 'R1');
  assert.deepEqual(s, ['shot 01 → 02: dele svih 6 osa — nijedna se ne razlikuje']);
});

test('R1: par sa tačno jednom razlikom imenuje osu i obe vrednosti', () => {
  const s = msgs(run([mkShot('01'), mkShot('02', { tags: { angle: 'low' } })]), 'R1');
  assert.deepEqual(s, ['shot 01 → 02: dele 5 od 6 osa — razlikuje se samo angle (eye → low)']);
});

test('R1: par sa dve razlike ne diže flag', () => {
  const s = run([mkShot('01'), mkShot('02', { tags: { angle: 'low', shot_size: 'CU' } })]);
  assert.deepEqual(of(s, 'R1'), []);
});

test('R1: linked par je izuzet i kad se ne razlikuje ni po čemu', () => {
  const a = mkShot('01', { link_group: 'B01' });
  const b = mkShot('02', { link_group: 'B01' });
  assert.deepEqual(of(run([a, b]), 'R1'), []);
});

test('R1: link_group null na oba shota nije „isti link_group"', () => {
  const s = msgs(run([mkShot('01'), mkShot('02')]), 'R1');
  assert.equal(s.length, 1, 'null === null ne sme da izuzme par');
});

test('R1: eskalacija traži tri shota, dva nisu dovoljna', () => {
  const esk = (signals) => of(signals, 'R1').filter((x) => /eskalacija/.test(x.message));
  const dva = run([mkShot('01', { tags: { angle: 'low' } }), mkShot('02', { tags: { angle: 'high' } })]);
  assert.deepEqual(esk(dva), [], 'dva shota ne prave lanac, ma koliko delila');
  const tri = esk(run([
    mkShot('01', { tags: { angle: 'low' } }),
    mkShot('02', { tags: { angle: 'high' } }),
    mkShot('03', { tags: { angle: 'eye' } }),
  ]));
  assert.equal(tri.length, 1);
  assert.equal(tri[0].where, 'shot 01–03');
  assert.equal(tri[0].measured, '3 shota');
});

test('R1: eskalacija gleda samo tri ose, ne svih šest', () => {
  // Tri shota koja se razlikuju po shot_size, angle i camera_motion — nijedan par nije flag,
  // a eskalacija ipak mora da se javi: ista tema, isto mesto, isto svetlo tri reza zaredom.
  const s = run([
    mkShot('01', { tags: { shot_size: 'LS', angle: 'high', camera_motion: 'pan' } }),
    mkShot('02', { tags: { shot_size: 'MS', angle: 'eye', camera_motion: 'push' } }),
    mkShot('03', { tags: { shot_size: 'CU', angle: 'low', camera_motion: 'pull' } }),
  ]);
  assert.equal(of(s, 'R1').length, 1);
  assert.match(of(s, 'R1')[0].where, /^shot 01–03$/);
});

test('R1: eskalacija ide preko granice beata', () => {
  const s = msgs(run([
    mkShot('01', { beat_id: 'B01' }),
    mkShot('02', { beat_id: 'B01' }),
    mkShot('03', { beat_id: 'B02' }),
  ]), 'R1');
  assert.ok(s.some((m) => /^shot 01–03: eskalacija/.test(m)), s.join('\n'));
});

test('R1: linked par u sredini prekida lanac eskalacije', () => {
  const s = run([
    mkShot('01'),
    mkShot('02', { link_group: 'B01' }),
    mkShot('03', { link_group: 'B01' }),
    mkShot('04'),
  ]);
  const esk = of(s, 'R1').filter((x) => /eskalacija/.test(x.message));
  assert.deepEqual(esk, [], 'lanac 01–04 je prekinut linkovanim parom 02–03');
});

test('R1: različita lokacija obara eskalaciju', () => {
  const s = run([
    mkShot('01'), mkShot('02', { tags: { location: 'drugde' } }), mkShot('03'),
  ]);
  assert.deepEqual(of(s, 'R1').filter((x) => /eskalacija/.test(x.message)), []);
});

// ---------------------------------------------------------------- R2

test('R2: broji sve vrednosti enuma, i one sa nulom', () => {
  const s = of(run([mkShot('01'), mkShot('02', { tags: { subject_type: 'object' } })]), 'R2');
  assert.equal(s.length, 1);
  assert.equal(s[0].where, 'episode');
  assert.match(s[0].message, /^2 shotova: 1 character, 0 group, 0 environment, 1 object, 0 map-diagram, /);
  for (const v of TAGS.subject_type) assert.ok(s[0].message.includes(v), `nedostaje ${v}`);
});

test('R2: nema praga — poruka ne sudi o miksu', () => {
  const s = of(run([mkShot('01'), mkShot('02'), mkShot('03')]), 'R2')[0];
  assert.doesNotMatch(s.message, /previše|premalo|treba|preporuk/i);
});

test('R2: nepoznat subject_type se vidi, ne nestaje u zbiru', () => {
  const s = of(run([mkShot('01', { tags: { subject_type: 'vinjeta' } })]), 'R2')[0];
  assert.match(s.message, /1 vinjeta/);
  assert.match(s.message, /0 character/);
});

// ---------------------------------------------------------------- R3

test('R3: izlistava uređaje sa brojem i broji beatove bez uređaja', () => {
  const shots = [mkShot('01', { beat_id: 'B01' }), mkShot('02', { beat_id: 'B02' }),
    mkShot('03', { beat_id: 'B03' })];
  const sb = mkSb(shots, { B01: { device: 'silhouette' }, B02: { device: 'silhouette' } });
  const s = of(advise(sb, mkEp(), BARE), 'R3')[0];
  assert.equal(s.message, 'korišćeni uređaji: silhouette ×2 · 1 od 3 beatova bez uređaja (device: null)');
});

test('R3: bez ijednog uređaja', () => {
  const s = of(run([mkShot('01')]), 'R3')[0];
  assert.match(s.message, /^korišćeni uređaji: nijedan · 1 od 1 beatova bez uređaja/);
});

test('R3: lista je azbučna, ne redosled pojavljivanja', () => {
  const shots = [mkShot('01', { beat_id: 'B01' }), mkShot('02', { beat_id: 'B02' })];
  const sb = mkSb(shots, { B01: { device: 'silhouette' }, B02: { device: 'animated-map' } });
  const s = of(advise(sb, mkEp(), BARE), 'R3')[0];
  assert.match(s.message, /^korišćeni uređaji: animated-map ×1, silhouette ×1 · 0 od 2/);
});

// ---------------------------------------------------------------- R4

const THIRTEEN = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu';

test('R4: trinaest identičnih reči van izuzeća se javlja', () => {
  assert.equal(r4Tokens(THIRTEEN).length, R4_MIN_WORDS);
  const s = of(run([
    mkShot('01', { image_prompt: `jedan ${THIRTEEN} kraj` }),
    mkShot('02', { image_prompt: `drugi ${THIRTEEN} finis` }),
  ]), 'R4');
  assert.equal(s.length, 1);
  assert.equal(s[0].where, 'shot 01 image ↔ shot 02 image');
  assert.equal(s[0].message, `13 uzastopnih identičnih reči — „${THIRTEEN}"`);
  assert.equal(s[0].measured, '13 reči');
});

test('R4: dvanaest identičnih reči ćuti — prag je „više od 12"', () => {
  const twelve = THIRTEEN.split(' ').slice(0, 12).join(' ');
  const s = run([
    mkShot('01', { image_prompt: `jedan ${twelve} kraj` }),
    mkShot('02', { image_prompt: `drugi ${twelve} finis` }),
  ]);
  assert.deepEqual(of(s, 'R4'), []);
});

test('R4: locked_description se izuzima iako ga C1 zahteva doslovno', () => {
  const locked = THIRTEEN;
  const ep = { characters: [{ id: 'x', name: 'X', locked_description: locked }] };
  const shots = [
    mkShot('01', { image_prompt: `SUBJECT: X, ${locked}.` }),
    mkShot('02', { image_prompt: `SUBJECT: X, ${locked}.` }),
  ];
  assert.ok(of(run(shots), 'R4').length > 0, 'bez izuzeća bi se javio');
  assert.deepEqual(of(run(shots, ep), 'R4'), []);
});

test('R4: kanonski style string i fiksne linije dolaze iz docs/reference/', () => {
  const styleString = loadStyleString();
  const fixedLines = loadFixedPromptLines();
  assert.match(styleString, /^STYLE: /);
  assert.equal(fixedLines.length, 2);
  assert.ok(fixedLines.some((l) => l.startsWith('PRESERVE:')));
  assert.ok(fixedLines.some((l) => l.startsWith('FORBID:')));
  // PRESERVE linija sama nosi 13 reči — tačno prag, pa bi bez izuzeća obarala svaki par.
  const preserve = fixedLines.find((l) => l.startsWith('PRESERVE:'));
  assert.equal(r4Tokens(preserve).length, R4_MIN_WORDS);

  const shots = [mkShot('01', { animation_prompt: preserve }), mkShot('02', { animation_prompt: preserve })];
  assert.ok(of(run(shots), 'R4').length > 0);
  assert.deepEqual(of(run(shots, {}, { styleString, fixedLines }), 'R4'), []);
});

test('R4: izuzeća ne prolaze tiho kad dokument promeni oblik', () => {
  // Isti izbor kao za S1 liste u C06: prazno ili nepročitano izuzeće baca, ne ćuti. Tiho
  // izgubljeno izuzeće ne gasi proveru nego je pretvara u lajanje na svaki ispravan storyboard.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-c07-'));
  try {
    const bezStyle = path.join(dir, 'style-string.md');
    fs.writeFileSync(bezStyle, '# Naslov\n\n```\nSUBJECT: nije style blok.\n```\n');
    assert.throws(() => loadStyleString(bezStyle), /nema blok koda koji počinje sa "STYLE:"/);
    assert.throws(() => loadStyleString(path.join(dir, 'nema.md')), /ne može pročitati/);

    const bezOdeljka = path.join(dir, 'prompt-templates.md');
    fs.writeFileSync(bezOdeljka, '## Image template\n\n```\nSTYLE: x\n```\n');
    assert.throws(() => loadFixedPromptLines(bezOdeljka), /nema odeljka "## Animation template"/);

    const bezForbida = path.join(dir, 'pola.md');
    fs.writeFileSync(bezForbida, '## Animation template\n\n```\nPRESERVE: same characters\n```\n');
    assert.throws(() => loadFixedPromptLines(bezForbida), /nema fiksnu FORBID liniju/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R4: izuzeta fraza ne spaja svoje susede u nov n-gram', () => {
  const segs = r4Segments('a b cut me out c d', [r4Tokens('cut me out')]);
  assert.deepEqual(segs, [['a', 'b'], ['c', 'd']]);
});

test('R4: rez izuzeća ne može da se premosti n-gramom', () => {
  // Šest reči + izuzeta fraza + sedam reči = 13 tokena tek ako se rez premosti. Ne sme.
  const cut = 'x y z';
  const ep = { characters: [{ id: 'c', name: 'C', locked_description: cut }] };
  const text = `a b c d e f ${cut} g h i j k l m`;
  const s = run([mkShot('01', { image_prompt: text }), mkShot('02', { image_prompt: text })], ep);
  assert.deepEqual(of(s, 'R4'), []);
});

test('R4: image i animation prompt istog shota se ne porede', () => {
  const s = run([mkShot('01', { image_prompt: THIRTEEN, animation_prompt: THIRTEEN })]);
  assert.deepEqual(of(s, 'R4'), []);
});

test('R4: image jednog i animation drugog shota se porede', () => {
  const s = of(run([
    mkShot('01', { image_prompt: THIRTEEN }),
    mkShot('02', { animation_prompt: THIRTEEN }),
  ]), 'R4');
  assert.equal(s.length, 1);
  assert.equal(s[0].where, 'shot 01 image ↔ shot 02 animation');
});

test('R4: po paru se prijavljuje najduži niz', () => {
  const dodatak = 'nu xi omicron pi rho sigma tau';
  const s = of(run([
    mkShot('01', { image_prompt: `${THIRTEEN} ${dodatak} kraj` }),
    mkShot('02', { image_prompt: `${THIRTEEN} ${dodatak} finis` }),
  ]), 'R4');
  assert.equal(s.length, 1);
  assert.equal(s[0].measured, '20 reči');
});

test('R4: dugačak niz se skraćuje u prikazu, ali izmerena vrednost ostaje puna', () => {
  const dugo = Array.from({ length: 30 }, (_, i) => `w${i}`).join(' ');
  const s = of(run([mkShot('01', { image_prompt: dugo }), mkShot('02', { image_prompt: dugo })]), 'R4')[0];
  assert.equal(s.measured, '30 reči');
  assert.match(s.message, /…"$/);
});

test('R4: interpunkcija na ivici tokena ne razdvaja reči', () => {
  // Šablon piše `… as the source image` bez tačke, prompt sa tačkom. Isti niz.
  assert.deepEqual(r4Tokens('the source image.'), r4Tokens('the source image'));
  assert.deepEqual(r4Tokens('16:9.'), ['16:9']);
});

test('R4: izuzeća su sortirana od najduže fraze ka najkraćoj', () => {
  const ex = r4Exemptions(mkEp({
    characters: [{ id: 'a', name: 'A', locked_description: 'jedna dve tri' }],
    key_props: [{ id: 'b', name: 'B', locked_description: 'jedna dve tri četiri pet' }],
  }), BARE);
  assert.deepEqual(ex.map((t) => t.length), [5, 3]);
});

// ---------------------------------------------------------------- C2

test('C2: meri deklaraciju u animation promptu, ne posebno polje', () => {
  const multi = 'OPENING VISUAL: the road. VISUAL TRANSITION: the camera crosses. FINAL VISUAL: the gate.';
  const s = of(run([mkShot('01', { animation_prompt: multi }), mkShot('02')]), 'C2');
  assert.equal(s.length, 1);
  assert.equal(s[0].message, '1 od 2 klipova je multi-visual — shot 01');
  assert.equal(s[0].measured, '1 klipova');
});

test('C2: običan animation prompt se ne broji', () => {
  const s = of(run([mkShot('01'), mkShot('02')]), 'C2')[0];
  assert.equal(s.message, '0 od 2 klipova je multi-visual');
});

test('C2: markeri se traže verzalom, kao S2 blokovi', () => {
  const s = of(run([mkShot('01', { animation_prompt: 'opening visual: the road.' })]), 'C2')[0];
  assert.match(s.message, /^0 od 1 klipova/);
});

test('C2: nijedan postojeći fixture nije multi-visual', () => {
  // Aktuelni animation template iz prompt-templates.md nema multi-visual oblik, pa je nula
  // tačno merenje, a ne mrtav signal. Kad C11 doda taj oblik, ovaj test pada i tada se menja.
  for (const dir of [GOOD, REPETITIVE, LINKED]) {
    const { sb, ep } = load(dir);
    assert.match(of(advise(sb, ep), 'C2')[0].message, /^0 od /, dir);
  }
});

// ---------------------------------------------------------------- izveštaj i oblik

test('advise: signali su sortirani redosledom ADVISORY tabele', () => {
  const { sb, ep } = load(REPETITIVE);
  const got = advise(sb, ep).map((s) => s.code);
  const want = got.slice().sort((a, b) => ADVISORY.indexOf(a) - ADVISORY.indexOf(b));
  assert.deepEqual(got, want);
  assert.deepEqual([...new Set(got)], ['R1', 'R2', 'R3', 'R4', 'C2']);
});

test('advise: svaki signal nosi izmerenu vrednost', () => {
  const { sb, ep } = load(REPETITIVE);
  for (const s of advise(sb, ep)) {
    assert.ok(s.measured && s.measured.length, `[${s.code}] bez izmerene vrednosti`);
    assert.ok(s.where && s.message, `[${s.code}] bez mesta ili poruke`);
    assert.equal('expected' in s, false, 'ADVISORY signal nema očekivanu vrednost');
  }
});

test('renderReport: ADVISORY je grupisan po kodu i nosi svih pet pododeljaka', () => {
  const { sb, ep } = load(REPETITIVE);
  const md = renderReport({ storyboard: sb, findings: [], signals: advise(sb, ep) });
  assert.match(md, /^## ADVISORY {2}\(6 signala\)$/m);
  for (const code of ADVISORY) assert.match(md, new RegExp(`^### ${code} — .+ {2}\\(\\d+\\)$`, 'm'));
  assert.ok(md.indexOf('### R1') < md.indexOf('### R2'));
  assert.ok(md.indexOf('## BLOCKING') < md.indexOf('## ADVISORY'));
});

test('renderReport: prazan kod kaže da nema signala', () => {
  const { sb, ep } = load(LINKED);
  const md = renderReport({ storyboard: sb, findings: [], signals: advise(sb, ep) });
  assert.match(md, /^### R1 — pravilo razlike {2}\(0\)\nNema signala\.$/m);
});

test('renderReport: legenda objašnjava izuzeća R4 i način merenja C2', () => {
  const md = renderReport({ storyboard: load(GOOD).sb, findings: [], signals: [] });
  assert.match(md, /locked_description.+style-string\.md.+prompt-templates\.md/s);
  assert.match(md, /C1 zahteva doslovno ponavljanje/);
  assert.match(md, /Legenda: meri se deklaracija u `animation_prompt`/);
});

test('renderReport: bez signala ADVISORY sekcija i dalje postoji', () => {
  const md = renderReport({ storyboard: load(GOOD).sb, findings: [] });
  assert.match(md, /^## ADVISORY {2}\(0 signala\)$/m);
});

test('assertShape: shot bez tags-a ne prolazi tiho u R1', () => {
  const sb = mkSb([mkShot('01')]);
  delete sb.beats[0].shots[0].tags;
  assert.throws(() => advise(sb, mkEp(), BARE), /shot 01: nedostaje tags/);
});

test('assertShape: svaka od šest osa mora da bude string', () => {
  for (const k of R1_AXES) {
    const sb = mkSb([mkShot('01')]);
    delete sb.beats[0].shots[0].tags[k];
    assert.throws(() => advise(sb, mkEp(), BARE), new RegExp(`tags\\.${k} nije string`));
  }
});

test('assertShape: shot bez link_group-a i beat bez device-a ne prolaze', () => {
  const a = mkSb([mkShot('01')]);
  delete a.beats[0].shots[0].link_group;
  assert.throws(() => advise(a, mkEp(), BARE), /shot 01: nedostaje link_group/);
  const b = mkSb([mkShot('01')]);
  delete b.beats[0].device;
  assert.throws(() => advise(b, mkEp(), BARE), /beat B01: nedostaje device/);
});
