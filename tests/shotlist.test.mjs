// tests/shotlist.test.mjs
//
//   node --test tests/
//
// Verifikacija iz docs/plan/C08-render-i-shotlist.md za `tools/shotlist.mjs`: `--only`
// filtriranje i grupisanje linkovanih shotova. Uz njih i provera koja se ne vidi u planu
// ali je jedini razlog zašto ovaj alat postoji — prompt izlazi doslovno, neprelomljen.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CEILING, DAILY, TIERS, creditLines, creditPlan,
  imageFile, main, parseArgs, renderShotlist, resolveOnly,
} from '../tools/shotlist.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');
const GOOD = path.join(FIX, 'good-episode');
const LINKED = path.join(FIX, 'linked-episode');

const load = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'));

const shotHeads = (out) => out.split('\n').filter((l) => l.startsWith('shot '));

/**
 * Indeks reda na kojem `block` stoji u `lines` kao neprekinut niz redova, ili -1.
 * Ne sme se tražiti po prvom redu prompta: dva shota dele istu `STYLE:` liniju, pa bi
 * `indexOf` uporedio pogrešan shot i test bi lagao u oba smera.
 */
function blockAt(lines, block) {
  const want = block.split('\n');
  for (let i = 0; i <= lines.length - want.length; i += 1) {
    if (want.every((l, j) => lines[i + j] === l)) return i;
  }
  return -1;
}

const ids = (sb) => sb.beats.flatMap((b) => b.shots).map((s) => s.shot_id);
const only = (sb, list) => renderShotlist(sb, { only: resolveOnly(ids(sb), list) });

// ---------------------------------------------------------------- --only

test('shotlist: bez --only izlaze svi shotovi', () => {
  const sb = load(GOOD);
  assert.equal(shotHeads(renderShotlist(sb)).length, 3);
});

test('shotlist: --only 1,3 daje tačno dve stavke', () => {
  const sb = load(GOOD);
  const heads = shotHeads(only(sb, ['1', '3']));
  assert.equal(heads.length, 2);
  assert.ok(heads[0].startsWith('shot 01 '));
  assert.ok(heads[1].startsWith('shot 03 '));
});

test('shotlist: --only prima i `01` i `1`, sa istim izlazom', () => {
  const sb = load(GOOD);
  assert.equal(only(sb, ['01', '03']), only(sb, ['1', '3']));
});

test('shotlist: --only zadržava redosled generisanja, ne redosled argumenata', () => {
  const sb = load(GOOD);
  assert.deepEqual(shotHeads(only(sb, ['3', '1'])).map((l) => l.slice(5, 7)), ['01', '03']);
});

test('shotlist: --only sa nepostojećim shotom pada i kaže koji postoje', () => {
  const sb = load(GOOD);
  assert.throws(() => only(sb, ['1', '9']), (err) => {
    assert.match(err.message, /shot ne postoji: 9/);
    assert.match(err.message, /postoje: 01, 02, 03/);
    return true;
  });
});

test('shotlist: --only broji zaglavlje po prikazanim, ne po svim shotovima', () => {
  const sb = load(GOOD);
  assert.ok(only(sb, ['1', '3']).split('\n')[0].includes('2 shota od 3 (--only)'));
  assert.ok(only(sb, ['1']).split('\n')[0].includes('1 shot od 3 (--only)'));
});

test('resolveOnly: nenumerički shot_id se razrešava doslovno', () => {
  assert.deepEqual([...resolveOnly(['01', '2b'], ['2b', '1'])], ['2b', '01']);
  assert.throws(() => resolveOnly(['01'], ['2b']), /shot ne postoji: 2b/);
});

// ---------------------------------------------------------------- grupisanje lanaca

test('shotlist: linkovani shotovi izlaze pod jednim zaglavljem lanca, pre oba shota', () => {
  const out = renderShotlist(load(GOOD));
  const lines = out.split('\n');
  const chain = lines.findIndex((l) => l.startsWith('LANAC B01'));
  const s01 = lines.findIndex((l) => l.startsWith('shot 01 '));
  const s02 = lines.findIndex((l) => l.startsWith('shot 02 '));
  assert.ok(chain >= 0, 'nema zaglavlja lanca');
  assert.ok(chain < s01 && s01 < s02, 'zaglavlje lanca ne stoji pre oba shota');
  assert.equal(lines.filter((l) => l.startsWith('LANAC B01')).length, 1);
});

test('shotlist: zaglavlje lanca kaže da shotovi dele lokaciju i svetlo', () => {
  const out = renderShotlist(load(GOOD));
  assert.ok(out.includes('spajaju se dissolve-om'));
  assert.ok(out.includes('istom lokacijom i istim svetlom'));
});

test('shotlist: samostalan shot nema zaglavlje lanca', () => {
  const out = renderShotlist(load(GOOD));
  const lines = out.split('\n');
  const s03 = lines.findIndex((l) => l.startsWith('shot 03 '));
  assert.ok(lines[s03].includes('samostalan, tvrd rez'));
  assert.ok(!lines.slice(s03).some((l) => l.startsWith('LANAC')));
});

test('shotlist: lanac od tri shota nosi A/B/C i broj u lancu', () => {
  const out = renderShotlist(load(LINKED));
  assert.ok(out.includes('LANAC B01 — 3 shota (01, 02, 03), spajaju se dissolve-om.'));
  for (const [id, letter] of [['01', 'A'], ['02', 'B'], ['03', 'C']]) {
    assert.ok(shotHeads(out).some((l) => l.startsWith(`shot ${id} `) && l.includes(`${letter} od 3`)),
      `shot ${id} nije označen kao ${letter} od 3`);
  }
});

test('shotlist: --only iz lanca zadržava naznaku lanca i kaže šta je sakriveno', () => {
  const sb = load(LINKED);
  const out = only(sb, ['2']);
  assert.equal(shotHeads(out).length, 1);
  assert.ok(out.includes('LANAC B01 — 3 shota (01, 02, 03)'), 'lanac je nestao iz zaglavlja');
  assert.ok(out.includes('(--only prikazuje 02)'));
  assert.ok(out.includes('B od 3'), 'izgubljeno mesto shota u lancu');
});

// ---------------------------------------------------------------- promptovi

test('shotlist: promptovi izlaze doslovno, red po red, bez ukrasa', () => {
  const sb = load(GOOD);
  const out = renderShotlist(sb);
  const lines = out.split('\n');
  for (const b of sb.beats) {
    for (const s of b.shots) {
      for (const p of [s.image_prompt, s.animation_prompt]) {
        assert.ok(blockAt(lines, p) >= 0,
          `prompt shota ${s.shot_id} nije izašao kao neprekinut blok redova`);
      }
    }
  }
});

test('shotlist: nigde nema markdown ograde oko prompta', () => {
  assert.ok(!renderShotlist(load(GOOD)).includes('```'));
});

test('shotlist: prompt sa dugim redom se ne prelama', () => {
  const sb = load(GOOD);
  const long = `SUBJECT: ${'x'.repeat(400)}`;
  sb.beats[0].shots[0].image_prompt += `\n${long}`;
  assert.ok(renderShotlist(sb).split('\n').includes(long));
});

test('shotlist: broj reči uz prompt poštuje srpsku gramatiku broja', () => {
  const out = renderShotlist(load(GOOD));
  assert.ok(/IMAGE PROMPT \(151 reč\)/.test(out), 'broj reči image prompta nije 151 reč');
  assert.ok(/ANIMATION PROMPT \(90 reči\)/.test(out), 'broj reči animation prompta nije 90 reči');
});

// ---------------------------------------------------------------- čeklista

test('shotlist: po shotu izlaze tri koraka — slika, klip sa ingredientom, snimanje klipa', () => {
  const sb = load(GOOD);
  const out = renderShotlist(sb);
  assert.ok(out.includes('  [ ] 1. image prompt -> slika; sačuvaj je kao images/shot01.jpeg'));
  assert.ok(out.includes('  [ ] 2. animation prompt -> klip; ingredient: images/shot01.jpeg'));
  assert.ok(out.includes('  [ ] 3. sačuvaj klip kao shots/part01.mp4 (traje bar 6.5s)'));
});

test('shotlist: shot bez ingredienta to kaže, a sliku i dalje čuva po konvenciji', () => {
  const sb = load(GOOD);
  const s = sb.beats[1].shots[0];
  assert.equal(s.ingredient_image, null);
  const out = renderShotlist(sb);
  assert.ok(out.includes('  [ ] 1. image prompt -> slika; sačuvaj je kao images/shot03.jpeg'));
  assert.ok(out.includes('ingredient: nema (ingredient_image: null), generiši bez ulazne slike'));
});

test('imageFile: prati `ingredient_image`, pa tek onda konvenciju invarijante 13', () => {
  assert.equal(imageFile({ shot_id: '07', ingredient_image: 'images/shot07.jpeg' }), 'images/shot07.jpeg');
  assert.equal(imageFile({ shot_id: '07', ingredient_image: null }), 'images/shot07.jpeg');
  assert.equal(imageFile({ shot_id: '07', ingredient_image: 'images/alt.jpeg' }), 'images/alt.jpeg');
});

test('shotlist: izlaz je deterministički', () => {
  const sb = load(GOOD);
  assert.equal(renderShotlist(sb), renderShotlist(load(GOOD)));
});

// ---------------------------------------------------------------- CLI

test('parseArgs: --only u oba oblika, ponovljeno se sabira', () => {
  assert.deepEqual(parseArgs(['x', '--only', '7,12']).only, ['7', '12']);
  assert.deepEqual(parseArgs(['x', '--only=7, 12']).only, ['7', '12']);
  assert.deepEqual(parseArgs(['x', '--only', '7', '--only', '12']).only, ['7', '12']);
  assert.equal(parseArgs(['x']).only, null);
});

test('parseArgs: prazan ili nedostajući --only pada', () => {
  assert.throws(() => parseArgs(['x', '--only']), /--only traži spisak/);
  assert.throws(() => parseArgs(['x', '--only', ' , ']), /prazan spisak/);
  assert.throws(() => parseArgs(['x', '--kobajagi']), /nepoznata opcija/);
  assert.throws(() => parseArgs([]), /nedostaje folder epizode/);
});

test('CLI: piše na stdout i ne dira folder epizode', () => {
  const before = fs.readdirSync(GOOD).sort();
  const write = process.stdout.write;
  let out = '';
  process.stdout.write = (chunk) => { out += chunk; return true; };
  try {
    assert.equal(main([GOOD, '--only', '1,3']), 0);
  } finally {
    process.stdout.write = write;
  }
  assert.equal(shotHeads(out).length, 2);
  assert.deepEqual(fs.readdirSync(GOOD).sort(), before);
});

test('CLI: nepostojeći folder pada sa jasnom porukom', () => {
  assert.throws(() => main([path.join(os.tmpdir(), 'at-nema-ovoga')]), /folder epizode ne postoji/);
});

// ---------------------------------------------------------------- Flow krediti

test('krediti: cena je broj klipova puta tier, slike se ne računaju', () => {
  const plan = creditPlan(27);
  assert.deepEqual(plan.map((r) => r.total), [270, 540, 2700]);
});

test('krediti: Quality za celu epizodu probija mesečni plafon, Lite ne', () => {
  const [lite, fast, quality] = creditPlan(33);
  assert.equal(lite.overCeiling, false);
  assert.equal(fast.overCeiling, false);
  assert.equal(quality.overCeiling, true);
  assert.ok(quality.total > CEILING);
});

test('krediti: dani se računaju samo od dnevnih kredita', () => {
  // 330 / 50 = 6.6 -> sedam dana; zaokružuje se naviše jer se sedmi dan mora otvoriti.
  assert.equal(creditPlan(33)[0].days, Math.ceil(330 / DAILY));
  assert.equal(creditPlan(33)[0].days, 7);
});

test('krediti: nula klipova ne košta ništa i ne probija plafon', () => {
  for (const r of creditPlan(0)) {
    assert.equal(r.total, 0);
    assert.equal(r.days, 0);
    assert.equal(r.overCeiling, false);
  }
});

test('krediti: hiljade se pišu tačkom, kako se čitaju', () => {
  const out = creditLines(33).join('\n');
  assert.ok(out.includes('3.300'), out);
  assert.ok(out.includes('1.700'), out);
  assert.ok(!out.includes('3300'), 'neformatiran broj je procurio u izlaz');
});

test('krediti: preko plafona se kaže umesto broja dana', () => {
  const over = creditLines(33).find((l) => l.includes('Quality'));
  assert.ok(over.includes('preko mesečnog plafona'), over);
  assert.ok(!over.includes('dana po'), over);
});

test('shotlist: zaglavlje nosi budžet za onoliko klipova koliko ima shotova', () => {
  const out = renderShotlist(load(GOOD));
  assert.ok(out.includes('FLOW KREDITI — 3 klipa'), out.split('\n').slice(0, 8).join('\n'));
});

test('shotlist: --only spušta račun na regenerisane shotove', () => {
  const sb = load(GOOD);
  const one = only(sb, ['1']);
  assert.ok(one.includes('FLOW KREDITI — 1 klip;'), one.split('\n').slice(0, 8).join('\n'));
  assert.ok(one.includes(`${1 * TIERS[0].cost} cr`), 'cena jednog Lite klipa nije u izlazu');
});

test('shotlist: blok o kreditima stoji pre prvog shota, ne posle', () => {
  const lines = renderShotlist(load(GOOD)).split('\n');
  const credits = lines.findIndex((l) => l.startsWith('FLOW KREDITI'));
  const firstShot = lines.findIndex((l) => l.startsWith('shot '));
  assert.ok(credits !== -1 && firstShot !== -1);
  assert.ok(credits < firstShot, 'čeklista se čita odozgo — budžet mora da dođe pre posla');
});
