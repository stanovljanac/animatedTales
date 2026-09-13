// tests/render.test.mjs
//
//   node --test tests/
//
// Verifikacija iz docs/plan/C08-render-i-shotlist.md za `tools/render.mjs`: determinizam
// (dva pokretanja -> bajt-identičan fajl) i prisustvo DO-NOT-EDIT zaglavlja, plus po jedan
// test na svaku granu prikaza — jer prikaz koji tiho izostavi polje izgleda ispravno.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDisplayable, countWords, linkChains } from '../tools/contract.mjs';
import { HEADER, clock, fence, main, parseArgs, renderStoryboard } from '../tools/render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');
const GOOD = path.join(FIX, 'good-episode');
const LINKED = path.join(FIX, 'linked-episode');

const load = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'));

/**
 * Kopija fixture-a u tmp — render piše u folder epizode, a fixture ostaje netaknut.
 * Kopija kreće bez `storyboard.md`: fixture ga posle ručne verifikacije iz plana ima na
 * disku (nije u gitu), a test koji ga zatekne meri zaostatak prošlog pokretanja, ne render.
 */
function tmpCopy(dir) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'at-render-'));
  fs.cpSync(dir, out, { recursive: true });
  fs.rmSync(path.join(out, 'storyboard.md'), { force: true });
  return out;
}

/** Isti dokument sa obrnutim redosledom ključeva u svakom objektu. */
function reverseKeys(value) {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value === null || typeof value !== 'object') return value;
  const out = {};
  for (const k of Object.keys(value).reverse()) out[k] = reverseKeys(value[k]);
  return out;
}

// ---------------------------------------------------------------- determinizam

test('render: dva pokretanja daju bajt-identičan fajl', () => {
  const dir = tmpCopy(GOOD);
  main([dir]);
  const first = fs.readFileSync(path.join(dir, 'storyboard.md'));
  main([dir]);
  const second = fs.readFileSync(path.join(dir, 'storyboard.md'));
  assert.deepEqual(first, second);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('render: redosled ključeva u JSON-u ne menja izlaz', () => {
  const sb = load(GOOD);
  assert.equal(renderStoryboard(reverseKeys(sb)), renderStoryboard(sb));
});

test('render: nigde nema vremena osim `generated_at` iz JSON-a', () => {
  const md = renderStoryboard(load(GOOD));
  const stamps = md.match(/\d{4}-\d{2}-\d{2}T[\d:]+Z/g) ?? [];
  assert.deepEqual(stamps, ['2026-09-05T00:00:00Z']);
});

test('render: izmena `generated_at` menja izlaz (vreme se stvarno čita iz JSON-a)', () => {
  const sb = load(GOOD);
  const before = renderStoryboard(sb);
  sb.generated_at = '2030-01-02T03:04:05Z';
  assert.notEqual(renderStoryboard(sb), before);
  assert.ok(renderStoryboard(sb).includes('2030-01-02T03:04:05Z'));
});

// ---------------------------------------------------------------- zaglavlje

test('render: prvi red je DO-NOT-EDIT zaglavlje', () => {
  const md = renderStoryboard(load(GOOD));
  assert.equal(md.split('\n')[0], HEADER);
  assert.ok(HEADER.includes('DO NOT EDIT'));
  assert.ok(HEADER.includes('storyboard.json'));
});

test('render: zaglavlje je i u fajlu koji CLI napiše', () => {
  const dir = tmpCopy(GOOD);
  main([dir]);
  const md = fs.readFileSync(path.join(dir, 'storyboard.md'), 'utf8');
  assert.equal(md.split('\n')[0], HEADER);
  assert.ok(md.endsWith('\n'));
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- sadržaj

test('render: oba prompta izlaze doslovno, red po red', () => {
  const sb = load(GOOD);
  const lines = renderStoryboard(sb).split('\n');
  for (const b of sb.beats) {
    for (const s of b.shots) {
      for (const p of [s.image_prompt, s.animation_prompt]) {
        for (const line of p.split('\n')) assert.ok(lines.includes(line), `nema reda: ${line}`);
      }
    }
  }
});

test('render: svaki beat nosi id, opseg, trajanje, uređaj i oba teksta', () => {
  const sb = load(GOOD);
  const md = renderStoryboard(sb);
  for (const b of sb.beats) {
    assert.ok(md.includes(`## ${b.beat_id} ·`), `nema naslova za ${b.beat_id}`);
    assert.ok(md.includes(`${b.dur}s`), `nema trajanja beata ${b.beat_id}`);
    assert.ok(md.includes(`uređaj: ${b.device ?? '—'}`), `nema uređaja za ${b.beat_id}`);
    assert.ok(md.includes(`> ${b.narration_says}`), `nema NARRATION SAYS za ${b.beat_id}`);
    assert.ok(md.includes(`> ${b.viewer_sees}`), `nema VIEWER SEES za ${b.beat_id}`);
    assert.ok(md.includes(`rečenice: ${b.sentences.join(', ')}`), `nema rečenica za ${b.beat_id}`);
  }
});

test('render: svaki shot nosi use opseg, use_len, tagove i klip', () => {
  const sb = load(GOOD);
  const md = renderStoryboard(sb);
  for (const b of sb.beats) {
    for (const s of b.shots) {
      assert.ok(md.includes(`### shot ${s.shot_id} ·`), `nema naslova za shot ${s.shot_id}`);
      assert.ok(md.includes(`use ${s.use_in} → ${s.use_out}s`), `nema use opsega za ${s.shot_id}`);
      assert.ok(md.includes(`\`use_len\` ${s.use_len}s`), `nema use_len za ${s.shot_id}`);
      assert.ok(md.includes(`\`${s.source_file}\``), `nema klipa za ${s.shot_id}`);
      for (const v of Object.values(s.tags)) assert.ok(md.includes(`\`${v}\``), `nema taga ${v}`);
    }
  }
});

test('render: šest osa ide u kanonskom redosledu, ne po redosledu ključeva', () => {
  const sb = load(GOOD);
  const line = renderStoryboard(reverseKeys(sb)).split('\n').find((l) => l.startsWith('- tags:'));
  assert.equal(line, '- tags: subject_type `character` · shot_size `MS` · angle `eye` · ' +
    'location `carthage-quay` · time_light `morning-haze` · camera_motion `push`');
});

test('render: broj reči uz prompt je kanonski countWords', () => {
  const sb = load(GOOD);
  const s = sb.beats[0].shots[0];
  const md = renderStoryboard(sb);
  assert.ok(md.includes(`**IMAGE PROMPT** · ${countWords(s.image_prompt)} reči`));
  assert.ok(md.includes(`**ANIMATION PROMPT** · ${countWords(s.animation_prompt)} reči`));
});

test('render: zaglavlje broji beatove i shotove po srpskoj gramatici broja', () => {
  const sb = load(GOOD);
  assert.ok(renderStoryboard(sb).includes('- 2 beata · 3 shota · tajmlajn'),
    'mnozina za 2 i 3 nije paukalna');
  const one = { ...sb, beats: [sb.beats[1]] };
  assert.ok(renderStoryboard(one).includes('- 1 beat · 1 shot · tajmlajn'),
    'jednina za 1 nije jednina');
});

test('render: null polja izlaze kao crta, ne kao `null`', () => {
  const sb = load(GOOD);
  const md = renderStoryboard(sb);
  assert.ok(md.includes('- motion budget: —'), 'motion_budget: null nije prikazan kao crta');
  assert.ok(md.includes('- ingredient: —'), 'ingredient_image: null nije prikazan kao crta');
  assert.ok(!md.includes('null'), 'reč null je procurila u prikaz');
});

test('render: prazan `characters` izlazi kao crta', () => {
  const sb = load(GOOD);
  sb.beats[0].shots[0].characters = [];
  assert.ok(renderStoryboard(sb).includes('- likovi: —'));
});

test('render: linkovani shotovi su označeni kao lanac, samostalni kao tvrd rez', () => {
  const md = renderStoryboard(load(GOOD));
  assert.ok(md.includes('### shot 01 · 0:00.0 → 0:06.5 · 6.5s · lanac B01 (A od 2)'));
  assert.ok(md.includes('### shot 02 · 0:06.5 → 0:13.5 · 7s · lanac B01 (B od 2)'));
  assert.ok(md.includes('### shot 03 · 0:13.5 → 0:23.0 · 9.5s · samostalan · tvrd rez'));
});

test('render: lanac od tri shota dobija A, B, C', () => {
  const md = renderStoryboard(load(LINKED));
  for (const [id, letter] of [['01', 'A'], ['02', 'B'], ['03', 'C']]) {
    assert.ok(md.includes(`shot ${id} · `) && md.includes(`(${letter} od 3)`), `nema ${letter}`);
  }
});

test('render: tabela sadržaja ima red po beatu', () => {
  const sb = load(GOOD);
  const rows = renderStoryboard(sb).split('\n').filter((l) => /^\| B\d\d \|/.test(l));
  assert.equal(rows.length, sb.beats.length);
  assert.ok(rows[1].includes('macro-object'));
});

// ---------------------------------------------------------------- režijska tabla

/** Redovi režijske table počinju `shot_id`-jem; beat mapa ispod počinje `beat_id`-jem. */
const boardRows = (md) => md.split('\n').filter((l) => /^\| \d\d \|/.test(l));

test('render: režijska tabla ima red po shotu, u redosledu tajmlajna', () => {
  const sb = load(GOOD);
  const rows = boardRows(renderStoryboard(sb));
  const shots = sb.beats.flatMap((b) => b.shots);
  assert.equal(rows.length, shots.length);
  assert.deepEqual(rows.map((r) => r.split(' | ')[0].slice(2)), shots.map((s) => s.shot_id));
  // Kolone se broje jednom: red koji ispadne iz šeme razbija ceo prikaz tiho.
  // 16 od uvođenja kolone `režim` (schemas.md §3.3.2).
  for (const r of rows) assert.equal(r.split(/(?<!\\)\|/).length - 1, 16);
});

test('render: tabla nosi tagove, lanac, lockove i obe dužine prompta', () => {
  const sb = load(GOOD);
  const [first] = boardRows(renderStoryboard(sb));
  const s = sb.beats[0].shots[0];
  const cells = first.split(' | ');
  assert.ok(cells.includes(s.tags.shot_size) && cells.includes(s.tags.camera_motion));
  assert.ok(first.includes(`${s.link_group} A`), 'nema oznake lanca');
  assert.ok(first.includes(s.characters.join(' + ')), 'nema lockova');
  assert.ok(first.includes(`${countWords(s.image_prompt)}/${countWords(s.animation_prompt)}`),
    'nema P1/P2 dužina');
});

test('render: ponovljena vrednost u koloni je navodnik, prvi red nikad nije', () => {
  const rows = boardRows(renderStoryboard(load(GOOD)));
  assert.ok(!rows[0].includes('„'), 'prvi red nema od čega da se ponovi');
  // sva tri shota fixture-a dele `location`, i to je jedina kolona koja se ponavlja u sva tri.
  assert.ok(rows[1].includes('„') && rows[2].includes('„'), 'ponavljanje se ne vidi');
  assert.ok(rows[1].includes('midday-hard-sun'), 'različit `time_light` je pretvoren u navodnik');
});

test('render: tabla ne piše `null` ni za uređaj ni za prazan `characters`', () => {
  const sb = load(GOOD);
  sb.beats[0].shots[0].characters = [];
  const [first] = boardRows(renderStoryboard(sb));
  assert.ok(!first.includes('null'));
  assert.equal(first.split(' | ').filter((c) => c === '—').length, 3,
    'uređaj, režim i lockovi su crte');
});

// ---------------------------------------------------------------- visual_priority (shema 2)

test('render: visual_priority se ispisuje rangirano kad polje postoji', () => {
  const sb = load(GOOD);
  assert.ok(!renderStoryboard(sb).includes('- visual_priority:'),
    'shema 1 nema polje, pa ni red');
  sb.beats[0].shots[0].visual_priority = ['prvo', 'drugo', 'treće'];
  assert.ok(renderStoryboard(sb).includes('- visual_priority: 1. prvo · 2. drugo · 3. treće'));
});

test('render: pipe u slobodnom tekstu ne razbija red tabele', () => {
  const sb = load(GOOD);
  sb.beats[0].device = 'a|b';
  const row = renderStoryboard(sb).split('\n').find((l) => l.startsWith('| B01 |'));
  assert.equal(row.split(/(?<!\\)\|/).length - 1, 6); // 5 kolona -> 6 granica
});

// ---------------------------------------------------------------- ograda bloka koda

test('fence: podrazumevano tri obrnuta apostrofa', () => {
  assert.equal(fence('tekst'), '```text\ntekst\n```');
});

test('fence: prompt sa ``` u sebi dobija dužu ogradu', () => {
  const out = fence('a\n```\nb');
  assert.ok(out.startsWith('````text\n'));
  assert.ok(out.endsWith('\n````'));
  assert.ok(out.includes('\n```\n'), 'sadržaj prompta je izmenjen');
});

test('render: prompt sa ``` ne prelama dokument', () => {
  const sb = load(GOOD);
  sb.beats[0].shots[0].image_prompt += '\n``` still the prompt';
  assert.ok(renderStoryboard(sb).includes('````text'));
});

// ---------------------------------------------------------------- clock

test('clock: sekunde -> sat format', () => {
  assert.equal(clock(0), '0:00.0');
  assert.equal(clock(6.5), '0:06.5');
  assert.equal(clock(23), '0:23.0');
  assert.equal(clock(63.2), '1:03.2');
  assert.equal(clock(600), '10:00.0');
  assert.equal(clock(3661.5), '1:01:01.5');
});

// ---------------------------------------------------------------- oblik ulaza

test('render: dokument bez `viewer_sees` pada, ne ispisuje undefined', () => {
  const sb = load(GOOD);
  delete sb.beats[0].viewer_sees;
  assert.throws(() => assertDisplayable(sb), /nedostaje viewer_sees/);
});

test('render: shot bez ose u tagovima pada', () => {
  const sb = load(GOOD);
  delete sb.beats[0].shots[0].tags.time_light;
  assert.throws(() => assertDisplayable(sb), /tags\.time_light nije string/);
});

test('render: shot bez `ingredient_image` pada — polje je obavezno i kad je null', () => {
  const sb = load(GOOD);
  delete sb.beats[0].shots[0].ingredient_image;
  assert.throws(() => assertDisplayable(sb), /nedostaje ingredient_image/);
});

test('linkChains: susedni shotovi istog lanca idu zajedno, ostali sami', () => {
  const chains = linkChains([
    { shot_id: '01', link_group: 'B01' },
    { shot_id: '02', link_group: 'B01' },
    { shot_id: '03', link_group: null },
    { shot_id: '04', link_group: 'B03' },
  ]);
  assert.deepEqual(chains.map((c) => [c.group, c.shots.map((s) => s.shot_id)]),
    [['B01', ['01', '02']], [null, ['03']], ['B03', ['04']]]);
});

// ---------------------------------------------------------------- CLI

test('parseArgs: folder, --stdout, --help', () => {
  assert.deepEqual(parseArgs(['episodes/x']), { dir: 'episodes/x', stdout: false, help: false });
  assert.deepEqual(parseArgs(['episodes/x', '--stdout']),
    { dir: 'episodes/x', stdout: true, help: false });
  assert.equal(parseArgs(['--help']).help, true);
});

test('parseArgs: nepoznata opcija i višak argumenta padaju', () => {
  assert.throws(() => parseArgs(['x', '--nema']), /nepoznata opcija/);
  assert.throws(() => parseArgs(['x', 'y']), /višak argumenta/);
  assert.throws(() => parseArgs([]), /nedostaje folder epizode/);
});

test('CLI: nepostojeći folder i folder bez storyboard.json padaju sa jasnom porukom', () => {
  assert.throws(() => main([path.join(os.tmpdir(), 'at-nema-ovoga')]), /folder epizode ne postoji/);
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'at-empty-'));
  assert.throws(() => main([empty]), /nema storyboard\.json/);
  fs.rmSync(empty, { recursive: true, force: true });
});

test('CLI: --stdout ne piše fajl', () => {
  const dir = tmpCopy(GOOD);
  const write = process.stdout.write;
  let out = '';
  process.stdout.write = (chunk) => { out += chunk; return true; };
  try {
    main([dir, '--stdout']);
  } finally {
    process.stdout.write = write;
  }
  assert.equal(out, renderStoryboard(load(GOOD)));
  assert.equal(fs.existsSync(path.join(dir, 'storyboard.md')), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- still kadrovi (schemas.md §3.3.2)
//
// Režijska tabla dobija kolonu `režim`. Pravilo iz C08 ostaje netaknuto — kolona ne nosi
// nijedan podatak kojeg nema u `storyboard.json` — a bez nje se najvažnija režijska činjenica
// novog formata (koliko slika stoji u nizu i sa kojim pokretima) ne vidi ni na jednom ekranu.

const STILL = path.join(FIX, 'still-episode');

/** Redovi režijske table: počinju `| ` i imaju broj shota u prvoj koloni. */
const boardRowsOf = (md) => md.split('\n').filter((l) => /^\| \d\d \|/.test(l));

test('tabla: kolona režim postoji i imenuje pokret still kadra', () => {
  const md = renderStoryboard(load(STILL));
  assert.match(md, /\| režim \|/);
  const rows = boardRowsOf(md);
  assert.match(rows[0], /still push/);
  assert.match(rows[4], /still pan-right/);
  assert.match(rows[5], /\| — \|/); // clip shot nema pokret
});

test('tabla: still shot nema broj reči animation prompta, jer prompta nema', () => {
  const rows = boardRowsOf(renderStoryboard(load(STILL)));
  assert.match(rows[0], /\d+\/— \|/);
  assert.match(rows[5], /\d+\/\d+ \|/);
});

test('odeljak still shota nosi sliku i pokret, ne klip i use raspon', () => {
  const md = renderStoryboard(load(STILL));
  const block = md.split(/^### shot /m).find((b) => b.startsWith('01'));
  assert.match(block, /- slika: `shots\/shot01\.jpeg` · pokret: push/);
  assert.ok(!block.includes('- klip:'), block);
  assert.ok(!block.includes('ANIMATION PROMPT'), block);
  assert.match(block, /IMAGE PROMPT/);
});

test('odeljak clip shota u istoj epizodi ostaje nepromenjen', () => {
  const md = renderStoryboard(load(STILL));
  const block = md.split(/^### shot /m).find((b) => b.startsWith('06'));
  assert.match(block, /- klip: `shots\/part06\.mp4`/);
  assert.match(block, /ANIMATION PROMPT/);
  assert.ok(!block.includes('- slika:'), block);
});

test('storyboard.md still epizode nema ni undefined ni null u tekstu', () => {
  const md = renderStoryboard(load(STILL));
  assert.ok(!md.includes('undefined'), 'undefined u prikazu izgleda kao podatak');
  assert.ok(!/\bnull\b/.test(md.replace(/`[^`]*`/g, '')), md.split('\n').find((l) => /\bnull\b/.test(l)));
});
