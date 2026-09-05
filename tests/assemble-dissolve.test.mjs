// tests/assemble-dissolve.test.mjs
//
//   node --test tests/
//
// Verifikacija iz docs/plan/C10-assemble-dissolve-qc.md: cross-dissolve između linked shotova
// i `qc-report.md`. Kao i u C09, **bez pravog rendera** — dokazuje se ono što render ne pokazuje:
// da xfade graf stoji tamo gde treba i da kompenzacija trajanja zaista vraća ukradene frejmove.
//
// Četiri odluke koje ovi testovi čuvaju od tihog vraćanja unazad:
//   - dissolve **ne menja** ukupan broj frejmova (kompenzacija (a) iz plana)
//   - dissolve ide **samo** unutar `link_group`-a; između beatova ostaje hard cut
//   - `offset` xfade-a pada na kraj **baznog** dela, ne produženog — inače se sve iza pomeri
//   - `qc-report.md` na ispravnoj epizodi nema nijedan ERROR

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  DEFAULT_DISSOLVE, RES, build, chainRecipe, inspectSources, main, parseArgs, planCuts,
  qcReport, renderUnits, validate, writeQcReport, xfadeArgs,
} from '../tools/assemble.mjs';

// ---------------------------------------------------------------- pomoćno

const FPS = 24;
const D = 8; // podrazumevani dissolve iz plana

function shot(n, tIn, len, extra = {}) {
  const id = String(n).padStart(2, '0');
  return {
    shot_id: id,
    beat_id: 'B01',
    link_group: null,
    t_in: tIn,
    t_out: Math.round((tIn + len) * 1000) / 1000,
    use_in: 0,
    use_out: len,
    use_len: len,
    motion_budget: len,
    source_file: `shots/part${id}.mp4`,
    ingredient_image: null,
    characters: [],
    image_prompt: 'x',
    animation_prompt: 'x',
    tags: {},
    ...extra,
  };
}

/**
 * Storyboard iz opisa beatova: `[['B01', [5, 5], 'B01'], ['B02', [5], null]]` znači beat B01
 * sa dva linkovana shota i beat B02 sa jednim samostalnim. Treći član je `link_group`.
 */
function storyboardOfBeats(spec, root = {}) {
  let t = 0;
  let n = 0;
  const beats = spec.map(([beatId, lens, group]) => {
    const shots = lens.map((len) => {
      n += 1;
      const s = shot(n, Math.round(t * 1000) / 1000, len, { beat_id: beatId, link_group: group });
      t = Math.round((t + len) * 1000) / 1000;
      return s;
    });
    return {
      beat_id: beatId, sentences: ['S01'], start: 0, end: t, dur: t, device: null,
      narration_says: 'x', viewer_sees: 'x', shots,
    };
  });
  return {
    schema_version: 1, episode: 'test', generated_at: '2026-01-01T00:00:00Z',
    narration_duration: t, fps: FPS, beats, ...root,
  };
}

/** Jedan beat, svi shotovi linkovani — najčešći oblik u ovim testovima. */
const linked = (lens) => storyboardOfBeats([['B01', lens, 'B01']]);

/** Mapa izvora kakvu vraća `inspectSources`, sa istim trajanjem za svaki klip. */
function sourcesOf(storyboard, duration = 10.01) {
  const map = new Map();
  for (const b of storyboard.beats) {
    for (const s of b.shots) {
      map.set(s.source_file, {
        source: s.source_file, file: s.source_file, exists: true,
        duration, start: 0, available: duration, error: null,
      });
    }
  }
  return map;
}

function tmpEpisode(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-dissolve-'));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return dir;
}

const rm = (dir) => fs.rmSync(dir, { recursive: true, force: true });

function fakeRun(calls) {
  return async (args) => {
    calls.push(args);
    const out = args.at(-1);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `fake ${calls.length}`);
    return { code: 0, stdout: '', stderr: '' };
  };
}

const idx = (args, flag) => args.indexOf(flag);

const buildOpts = (extra = {}) => ({
  width: 1920, height: 1080, fps: FPS, narration: 'narration.mp3', out: 'final.mp4', ...extra,
});

function episodeWithClips(n, extra = {}) {
  const files = { 'narration.mp3': 'x', 'endcard.jpeg': 'x', ...extra };
  for (let i = 1; i <= n; i += 1) files[`shots/part${String(i).padStart(2, '0')}.mp4`] = `clip ${i}`;
  return tmpEpisode(files);
}

const dissolvePlan = (sb, opts = {}) =>
  planCuts(sb, { outroStart: null, dissolveFrames: D, sources: sourcesOf(sb), ...opts });

// ---------------------------------------------------------------- planCuts: formiranje lanca

test('bez --dissolve plan je isti kao u C09', () => {
  const sb = linked([5, 5, 5]);
  const c09 = planCuts(sb, { outroStart: null });
  const c10 = planCuts(sb, { outroStart: null, dissolveFrames: 0, sources: sourcesOf(sb) });
  assert.deepEqual(c10.segments, c09.segments);
  assert.equal(c10.totalFrames, c09.totalFrames);
  assert.equal(c10.dissolve.frames, 0);
  assert.deepEqual(c10.dissolve.applied, []);
});

test('linked shotovi istog beata postaju jedan lanac', () => {
  const plan = dissolvePlan(linked([5, 5, 5]));
  const chain = plan.segments.find((s) => s.kind === 'chain');
  assert.ok(chain, 'nema lanca u planu');
  assert.equal(chain.id, 'B01');
  assert.deepEqual(chain.parts.map((p) => p.id), ['01', '02', '03']);
  assert.equal(plan.segments.filter((s) => s.kind === 'shot').length, 0);
});

test('link_group null ostavlja hard cut — nema lanca', () => {
  const sb = storyboardOfBeats([['B01', [5, 5], null], ['B02', [5], null]]);
  const plan = dissolvePlan(sb);
  assert.equal(plan.segments.filter((s) => s.kind === 'chain').length, 0);
  assert.deepEqual(plan.dissolve.applied, []);
});

test('lanac ne prelazi granicu beata (plan to eksplicitno odbija)', () => {
  const sb = storyboardOfBeats([['B01', [5, 5], 'B01'], ['B02', [5, 5], 'B02']]);
  const plan = dissolvePlan(sb);
  const chains = plan.segments.filter((s) => s.kind === 'chain');
  assert.equal(chains.length, 2);
  assert.deepEqual(chains.map((c) => c.id), ['B01', 'B02']);
  assert.equal(plan.dissolve.applied.length, 2, 'jedan prelaz po lancu, nijedan između beatova');
});

test('lanac od tri shota ima dva prelaza', () => {
  const plan = dissolvePlan(linked([5, 5, 5]));
  assert.deepEqual(plan.dissolve.applied, [
    { after: '01', before: '02', group: 'B01', frames: D },
    { after: '02', before: '03', group: 'B01', frames: D },
  ]);
});

test('samostalan shot pored lanca ostaje zaseban segment', () => {
  const sb = storyboardOfBeats([['B01', [5, 5], 'B01'], ['B02', [5], null]]);
  const plan = dissolvePlan(sb);
  assert.deepEqual(plan.segments.map((s) => s.kind), ['chain', 'shot', 'endcard']);
});

// ---------------------------------------------------------------- kompenzacija trajanja

test('dissolve NE menja ukupan broj frejmova (kompenzacija (a) iz plana)', () => {
  const sb = linked([5, 5, 5]);
  const bez = planCuts(sb, { outroStart: null });
  const sa = dissolvePlan(sb);
  assert.equal(sa.totalFrames, bez.totalFrames);
  assert.equal(sa.duration, bez.duration);
  assert.equal(sa.coverage, bez.coverage);
  assert.equal(sa.dissolve.lost, 0, 'uz kompenzaciju prelaz ne krade trajanje');
});

test('svaki deo lanca osim poslednjeg dobija tačno D frejmova viška', () => {
  const plan = dissolvePlan(linked([5, 5, 5]));
  const parts = plan.segments[0].parts;
  assert.deepEqual(parts.map((p) => p.base), [120, 120, 120]);
  assert.deepEqual(parts.map((p) => p.frames), [120 + D, 120 + D, 120]);
});

test('frejmovi lanca su zbir baznih, ne produženih', () => {
  const chain = dissolvePlan(linked([5, 5, 5])).segments[0];
  assert.equal(chain.frames, 360);
  assert.equal(chain.len, 15);
  assert.notEqual(chain.frames, chain.parts.reduce((a, p) => a + p.frames, 0));
});

test('produženje traži materijal iz izvora, pa je len dela duži od use_len', () => {
  const parts = dissolvePlan(linked([5, 5])).segments[0].parts;
  assert.equal(parts[0].len, Math.round(((120 + D) / FPS) * 1000) / 1000);
  assert.equal(parts[1].len, 5);
});

// ---------------------------------------------------------------- kad prelaz otpada

test('izvor bez rezerve na kraju: prelaz otpada, plan to zapisuje', () => {
  const sb = linked([5, 5]);
  const tight = sourcesOf(sb, 5); // tačno use_out, ni frejma viška
  const plan = planCuts(sb, { outroStart: null, dissolveFrames: D, sources: tight });
  assert.deepEqual(plan.dissolve.applied, []);
  assert.equal(plan.dissolve.skipped.length, 1);
  assert.equal(plan.dissolve.skipped[0].after, '01');
  assert.match(plan.dissolve.skipped[0].reason, /rezerv/i);
  assert.deepEqual(plan.segments.map((s) => s.kind), ['shot', 'shot', 'endcard']);
});

test('izvor kojeg nema ne dobija prelaz (bez pada, uz zapis)', () => {
  const sb = linked([5, 5]);
  const sources = sourcesOf(sb);
  sources.set('shots/part01.mp4', {
    source: 'shots/part01.mp4', file: 'shots/part01.mp4', exists: false,
    duration: null, start: null, available: null, error: null,
  });
  const plan = planCuts(sb, { outroStart: null, dissolveFrames: D, sources });
  assert.equal(plan.dissolve.applied.length, 0);
  assert.equal(plan.dissolve.skipped.length, 1);
});

test('shot kraći od samog prelaza ne ulazi u prelaz', () => {
  const sb = linked([5, 0.25]); // 6 frejmova < 8
  const plan = dissolvePlan(sb);
  assert.deepEqual(plan.dissolve.applied, []);
  assert.equal(plan.dissolve.skipped.length, 1);
  assert.match(plan.dissolve.skipped[0].reason, /kra[ćc]/i);
});

test('shot dug tačno koliko i prelaz ne prolazi — prelaz bi pojeo ceo kadar', () => {
  const plan = dissolvePlan(linked([5, 1 / 3])); // 8 frejmova, tačno D
  assert.deepEqual(plan.dissolve.applied, []);
  assert.equal(plan.dissolve.skipped.length, 1);
  assert.match(plan.dissolve.skipped[0].reason, /kra[ćc]/i);
});

test('bez mape izvora rezerva se ne proverava (plan ostaje čista funkcija)', () => {
  const plan = planCuts(linked([5, 5]), { outroStart: null, dissolveFrames: D });
  assert.equal(plan.dissolve.applied.length, 1);
  assert.deepEqual(plan.dissolve.skipped, []);
});

test('prekinut prelaz u sredini lanca deli lanac na dva, ne ruši oba prelaza', () => {
  const sb = linked([5, 5, 5]);
  const sources = sourcesOf(sb);
  sources.set('shots/part01.mp4', {
    source: 'shots/part01.mp4', file: 'shots/part01.mp4', exists: true,
    duration: 5, start: 0, available: 5, error: null,
  });
  const plan = planCuts(sb, { outroStart: null, dissolveFrames: D, sources });
  assert.equal(plan.dissolve.applied.length, 1, '02→03 preživljava');
  assert.equal(plan.dissolve.skipped.length, 1);
  assert.deepEqual(plan.segments.map((s) => s.kind), ['shot', 'chain', 'endcard']);
});

test('poslednji shot lanca skraćen outrom ne traži rezervu — on se ne produžava', () => {
  const sb = linked([5, 5]);
  const sources = sourcesOf(sb);
  sources.set('shots/part02.mp4', {
    source: 'shots/part02.mp4', file: 'shots/part02.mp4', exists: true,
    duration: 5, start: 0, available: 5, error: null,
  });
  const plan = planCuts(sb, { outroStart: null, dissolveFrames: D, sources });
  assert.equal(plan.dissolve.applied.length, 1);
});

test('shot izbačen outrom ne vuče lanac sa sobom', () => {
  const sb = linked([5, 5, 5]);
  const plan = dissolvePlan(sb, { outroStart: 10 });
  assert.deepEqual(plan.dropped.map((d) => d.shot_id), ['03']);
  assert.equal(plan.dissolve.applied.length, 1);
  assert.deepEqual(plan.segments[0].parts.map((p) => p.id), ['01', '02']);
});

// ---------------------------------------------------------------- xfadeArgs

const chainOf = (sb, opts = {}) => dissolvePlan(sb, opts).segments.find((s) => s.kind === 'chain');
const filterOf = (args) => args[idx(args, '-filter_complex') + 1];

test('xfadeArgs: jedan ulaz po delu lanca, redom', () => {
  const args = xfadeArgs(chainOf(linked([5, 5, 5])), { segDir: '/seg', fps: FPS, out: '/o.mp4' });
  const inputs = args.filter((a, i) => args[i - 1] === '-i');
  assert.equal(inputs.length, 3);
  assert.deepEqual(inputs.map((p) => path.basename(p)), ['01.mp4', '02.mp4', '03.mp4']);
});

test('xfadeArgs: offset pada na kraj BAZNOG dela, ne produženog', () => {
  const args = xfadeArgs(chainOf(linked([5, 5])), { segDir: '/seg', fps: FPS, out: '/o.mp4' });
  const filter = filterOf(args);
  assert.match(filter, /offset=5\.0{2,}/, 'offset mora da bude 5s (120 frejmova), a ne 5.333s');
});

test('xfadeArgs: trajanje prelaza je D frejmova izraženo u sekundama', () => {
  const args = xfadeArgs(chainOf(linked([5, 5])), { segDir: '/seg', fps: FPS, out: '/o.mp4' });
  assert.match(filterOf(args), /duration=0\.3333/);
  // Cross-dissolve, ne wipe ni slide: plan traži mešanje slike, a ne pomeranje.
  assert.match(filterOf(args), /transition=fade/);
});

test('xfadeArgs: lanac od tri daje dva ulančana xfade-a', () => {
  const filter = filterOf(xfadeArgs(chainOf(linked([5, 5, 5])),
    { segDir: '/seg', fps: FPS, out: '/o.mp4' }));
  const steps = filter.split(';');
  assert.equal(steps.length, 2);
  assert.match(steps[0], /^\[0:v\]\[1:v\]xfade=/);
  assert.match(steps[1], /^\[[^\]]+\]\[2:v\]xfade=/);
  assert.match(steps[1], /offset=10\.0{2,}/, 'drugi prelaz pada na 10s (120+120 frejmova)');
  assert.ok(steps[1].endsWith('[v]'));
});

test('xfadeArgs: broj frejmova izlaza je zakucan na zbir baznih', () => {
  const chain = chainOf(linked([5, 5, 5]));
  const args = xfadeArgs(chain, { segDir: '/seg', fps: FPS, out: '/o.mp4' });
  assert.equal(args[idx(args, '-frames:v') + 1], String(chain.frames));
  assert.equal(args[idx(args, '-frames:v') + 1], '360');
});

test('xfadeArgs: izlaz je isti profil kao segmenti, bez audia i bez -copyts', () => {
  const args = xfadeArgs(chainOf(linked([5, 5])), { segDir: '/seg', fps: FPS, out: '/o.mp4' });
  assert.ok(args.includes('-an'));
  assert.equal(args[idx(args, '-pix_fmt') + 1], 'yuv420p');
  assert.equal(args[idx(args, '-crf') + 1], '18');
  assert.ok(!args.includes('-copyts'));
  assert.equal(args[idx(args, '-map') + 1], '[v]');
});

// ---------------------------------------------------------------- renderUnits + validate

test('renderUnits: delovi lanca umesto lanca, end card ostaje', () => {
  const plan = dissolvePlan(storyboardOfBeats([['B01', [5, 5], 'B01'], ['B02', [5], null]]));
  assert.deepEqual(renderUnits(plan).map((u) => u.id), ['01', '02', '03', 'endcard']);
});

test('validate: rezerva za prelaz se traži od izvora, ne pretpostavlja', async () => {
  const dir = episodeWithClips(2);
  const media = { narration: 'narration.mp3', endcard: 'endcard.jpeg' };
  const short = async () => ({ duration: 5, start: 0 });
  const plan = planCuts(linked([5, 5]), { outroStart: null, dissolveFrames: D });
  const found = await validate(plan, dir, media, { probe: short });
  assert.equal(found.length, 1, 'produženi prvi deo traži 5.333s, a klip ima 5s');
  assert.match(found[0], /shot 01/);
  rm(dir);
});

test('validate: gotova mapa izvora se koristi umesto novog probe-a', async () => {
  const dir = episodeWithClips(2);
  const media = { narration: 'narration.mp3', endcard: 'endcard.jpeg' };
  const sb = linked([5, 5]);
  let calls = 0;
  const counting = async () => { calls += 1; return { duration: 10.01, start: 0 }; };
  const plan = dissolvePlan(sb);
  assert.deepEqual(await validate(plan, dir, media,
    { probe: counting, sources: sourcesOf(sb) }), []);
  assert.equal(calls, 0);
  rm(dir);
});

// ---------------------------------------------------------------- inspectSources

test('inspectSources: jedan probe po fajlu, i kad dva shota dele klip', async () => {
  const dir = episodeWithClips(2);
  let calls = 0;
  const counting = async () => { calls += 1; return { duration: 10.01, start: 0 }; };
  const map = await inspectSources(
    ['shots/part01.mp4', 'shots/part02.mp4', 'shots/part01.mp4'], dir, { probe: counting });
  assert.equal(calls, 2);
  assert.equal(map.size, 2);
  assert.equal(map.get('shots/part01.mp4').available, 10.01);
  rm(dir);
});

test('inspectSources: dostupno je duration - start, kao F1 i C05', async () => {
  const dir = episodeWithClips(1);
  const offset = async () => ({ duration: 10, start: 0.5 });
  const map = await inspectSources(['shots/part01.mp4'], dir, { probe: offset });
  assert.equal(map.get('shots/part01.mp4').available, 9.5);
  rm(dir);
});

test('inspectSources: fajl kojeg nema i probe koji pukne su podaci, ne pad', async () => {
  const dir = episodeWithClips(1);
  const boom = async () => { throw new Error('nije video fajl'); };
  const map = await inspectSources(['shots/part01.mp4', 'shots/part09.mp4'], dir, { probe: boom });
  assert.equal(map.get('shots/part09.mp4').exists, false);
  assert.equal(map.get('shots/part01.mp4').exists, true);
  assert.match(map.get('shots/part01.mp4').error, /nije video fajl/);
  assert.equal(map.get('shots/part01.mp4').available, null);
  rm(dir);
});

// ---------------------------------------------------------------- build sa lancem

test('build: lanac renderuje delove pa ih spaja jednim xfade prolazom', async () => {
  const dir = episodeWithClips(3);
  const calls = [];
  const plan = dissolvePlan(linked([5, 5, 5]));
  const report = await build(plan, dir, buildOpts({ run: fakeRun(calls) }));

  assert.equal(report.built, 5, '3 dela + lanac + end card');
  const xf = calls.filter((a) => a.includes('-filter_complex'));
  assert.equal(xf.length, 1);
  assert.equal(report.dissolves, 2);
  rm(dir);
});

test('build: drugo pokretanje ne dira ni delove ni lanac', async () => {
  const dir = episodeWithClips(3);
  const plan = dissolvePlan(linked([5, 5, 5]));
  await build(plan, dir, buildOpts({ run: fakeRun([]) }));

  const calls = [];
  const again = await build(plan, dir, buildOpts({ run: fakeRun(calls) }));
  assert.equal(again.built, 0);
  assert.equal(calls.length, 2, 'ostaju samo concat i mux');
  rm(dir);
});

test('build: zamenjen deo lanca regeneriše taj deo i lanac, ali ne i ostale delove', async () => {
  const dir = episodeWithClips(3);
  const plan = dissolvePlan(linked([5, 5, 5]));
  await build(plan, dir, buildOpts({ run: fakeRun([]) }));

  const clip = path.join(dir, 'shots', 'part02.mp4');
  fs.writeFileSync(clip, 'novi klip iz Flow-a, druge veličine');
  const later = new Date(Date.now() + 10_000);
  fs.utimesSync(clip, later, later);

  const calls = [];
  const report = await build(plan, dir, buildOpts({ run: fakeRun(calls) }));
  assert.equal(report.built, 2, 'deo 02 i lanac');
  const shots = calls.filter((a) => a.includes('-frames:v') && !a.includes('-filter_complex'));
  assert.equal(shots.length, 1);
  assert.match(shots[0][idx(shots[0], '-i') + 1], /part02\.mp4$/);
  assert.equal(calls.filter((a) => a.includes('-filter_complex')).length, 1);
  rm(dir);
});

test('build: concat lista nosi ime lanca, ne imena delova', async () => {
  const dir = episodeWithClips(3);
  const sb = storyboardOfBeats([['B01', [5, 5], 'B01'], ['B02', [5], null]]);
  await build(dissolvePlan(sb), dir, buildOpts({ run: fakeRun([]) }));
  const list = fs.readFileSync(path.join(dir, '.cache', 'concat.txt'), 'utf8');
  assert.equal(list, "file 'seg/chain-01.mp4'\nfile 'seg/03.mp4'\nfile 'seg/endcard.mp4'\n");
  rm(dir);
});

test('chainRecipe: promenjen broj frejmova prelaza daje drugi recept', () => {
  const dir = episodeWithClips(2);
  const opts = { dir, width: 1920, height: 1080, fps: FPS };
  const sb = linked([5, 5]);
  const a = chainOf(sb);
  const b = planCuts(sb, { outroStart: null, dissolveFrames: 4, sources: sourcesOf(sb) })
    .segments.find((s) => s.kind === 'chain');
  assert.deepEqual(chainRecipe(a, opts), chainRecipe(a, opts));
  assert.notDeepEqual(chainRecipe(a, opts), chainRecipe(b, opts));
  // Duzina prelaza stoji u receptu i sama, ne samo posredno kroz frejmove delova: recept je
  // i dijagnostika na disku (`chain-NN.json`), pa mora da kaze cime je lanac slepljen.
  assert.equal(chainRecipe(a, opts).dissolve, D);
  assert.equal(chainRecipe(b, opts).dissolve, 4);
  rm(dir);
});

// ---------------------------------------------------------------- qc-report.md

const qcCtx = (over = {}) => {
  const sb = over.storyboard ?? linked([5, 5, 5]);
  const plan = over.plan ?? dissolvePlan(sb);
  return {
    episode: 'test', res: '1080p', width: 1920, height: 1080, out: 'final.mp4',
    plan, sources: over.sources ?? sourcesOf(sb),
    at: new Date('2026-09-05T12:00:00Z'), measured: null,
    ...over,
  };
};

test('qcReport: na ispravnoj epizodi nema nijedan ERROR', () => {
  const md = qcReport(qcCtx());
  assert.ok(!md.includes('ERROR'), md);
  assert.match(md, /# QC izveštaj/);
});

test('qcReport: nedostajući part je ERROR i imenuje se', () => {
  const sb = linked([5, 5]);
  const sources = sourcesOf(sb);
  sources.set('shots/part02.mp4', {
    source: 'shots/part02.mp4', file: 'shots/part02.mp4', exists: false,
    duration: null, start: null, available: null, error: null,
  });
  const md = qcReport(qcCtx({ storyboard: sb, sources, plan: planCuts(sb, { outroStart: null }) }));
  assert.ok(md.includes('ERROR'));
  assert.match(md, /shots\/part02\.mp4/);
});

test('qcReport: prekratak izvor je ERROR sa oba broja', () => {
  const sb = linked([9]);
  const sources = sourcesOf(sb, 6);
  const md = qcReport(qcCtx({ storyboard: sb, sources, plan: planCuts(sb, { outroStart: null }) }));
  assert.ok(md.includes('ERROR'));
  assert.match(md, /6s/);
  assert.match(md, /9s/);
});

test('qcReport: drift se iskazuje i u sekundama i u frejmovima', () => {
  const sb = linked([5, 5]);
  sb.narration_duration = 9.9;
  const md = qcReport(qcCtx({ storyboard: sb, plan: planCuts(sb, { outroStart: null }) }));
  assert.match(md, /0\.1s/);
  assert.match(md, /frejm/);
});

test('qcReport: rep end carda nije drift', () => {
  const md = qcReport(qcCtx());
  assert.match(md, /rep/i);
  assert.ok(!md.includes('ERROR'));
});

test('qcReport: drift do ±0.2s je OK, preko toga ERROR', () => {
  const mk = (narr) => {
    const sb = linked([5, 5]);
    sb.narration_duration = narr;
    return qcReport(qcCtx({ storyboard: sb, plan: planCuts(sb, { outroStart: null }) }));
  };
  assert.ok(!mk(9.9).includes('ERROR'), 'drift +0.1s je unutar prihvatanja');
  assert.ok(mk(9.5).includes('ERROR'), 'drift +0.5s mora da se vidi');
});

test('qcReport: izmereno koje se ne poklapa sa planom je ERROR', () => {
  assert.ok(!qcReport(qcCtx({ measured: { duration: 16.5 } })).includes('ERROR'));
  assert.ok(qcReport(qcCtx({ measured: { duration: 16 } })).includes('ERROR'));
});

test('qcReport: shot sa manje od 50% iskorišćenja je kandidat za regeneraciju', () => {
  const sb = linked([4]);
  const md = qcReport(qcCtx({ storyboard: sb, sources: sourcesOf(sb, 10),
    plan: planCuts(sb, { outroStart: null }) }));
  assert.match(md, /Kandidati za regeneraciju/);
  assert.match(md, /shots\/part01\.mp4/);
  assert.match(md, /40%/);
});

test('qcReport: iskorišćenje dela lanca meri se bazom, ne produženjem za prelaz', () => {
  const sb = linked([4, 4]);
  const sources = sourcesOf(sb, 10);
  const md = qcReport(qcCtx({ storyboard: sb, sources, plan: dissolvePlan(sb, { sources }) }));
  const sekcija = md.split('## Kandidati za regeneraciju')[1].split('\n## ')[0];
  // Deo 01 je produžen na 104 frejma zbog prelaza, ali gledalac vidi 96 = 4s od 10s klipa.
  assert.match(sekcija, /^\| 01 \|.*\| 4s \| 40% \|$/m);
});

test('qcReport: tačno 50% nije kandidat, 49.9% jeste', () => {
  const pola = linked([5]);
  const ispod = linked([4.875]); // 117 frejmova; 4.99 bi se zaokružilo na 120 i dalo tačno 50%
  const kandidati = (sb) => {
    const md = qcReport(qcCtx({ storyboard: sb, sources: sourcesOf(sb, 10),
      plan: planCuts(sb, { outroStart: null }) }));
    return /shots\/part01\.mp4/.test(md.split('## Kandidati za regeneraciju')[1].split('\n## ')[0]);
  };
  assert.equal(kandidati(pola), false);
  assert.equal(kandidati(ispod), true);
});

test('qcReport: kandidat skraćen outrom se označava — nije loše generisan, nego odsečen', () => {
  const sb = linked([10, 10]);
  const plan = planCuts(sb, { outroStart: 13 }); // shot 02 se kraća na 3s od 10s klipa
  const md = qcReport(qcCtx({ storyboard: sb, sources: sourcesOf(sb, 10), plan }));
  const sekcija = md.split('## Kandidati za regeneraciju')[1].split('\n## ')[0];
  assert.match(sekcija, /\| 02 [^|]*skra[ćc]en outrom/);
  assert.ok(!/\| 01 /.test(sekcija), 'shot 01 troši ceo klip i nije kandidat');
});

test('qcReport: nigde dva prazna reda zaredom', () => {
  assert.ok(!qcReport(qcCtx()).includes('\n\n\n'));
});

test('qcReport: primenjeni prelazi se broje i uticaj na trajanje je 0s uz kompenzaciju', () => {
  const md = qcReport(qcCtx());
  const sekcija = md.split('## Primenjeni prelazi')[1];
  assert.match(sekcija, /2/);
  assert.match(sekcija, /8 frejmova/);
  assert.match(sekcija, /0s/);
});

test('qcReport: preskočen prelaz se prijavljuje sa razlogom', () => {
  const sb = linked([5, 5]);
  const plan = planCuts(sb, { outroStart: null, dissolveFrames: D, sources: sourcesOf(sb, 5) });
  const md = qcReport(qcCtx({ storyboard: sb, plan, sources: sourcesOf(sb, 5) }));
  assert.match(md, /01 → 02/);
  assert.match(md, /rezerv/i);
});

test('qcReport: bez --dissolve sekcija prelaza kaže da ih nema', () => {
  const sb = linked([5, 5]);
  const md = qcReport(qcCtx({ storyboard: sb, plan: planCuts(sb, { outroStart: null }) }));
  assert.match(md.split('## Primenjeni prelazi')[1], /hard cut|nema/i);
  assert.ok(!md.includes('ERROR'));
});

test('qcReport: izbačeni i skraćeni shotovi su u izveštaju', () => {
  const sb = linked([5, 5, 5]);
  const md = qcReport(qcCtx({ storyboard: sb, plan: planCuts(sb, { outroStart: 7 }) }));
  const sekcija = md.split('## Izostavljeni i skraćeni shotovi')[1];
  assert.match(sekcija, /\| 03 \| izostavljen/);
  assert.match(sekcija, /\| 02 \| skraćen/);
});

test('qcReport: izmereno trajanje se poredi sa planom kad ga ima', () => {
  const md = qcReport(qcCtx({ measured: { duration: 16.5, width: 1920, height: 1080, fps: 24, hasAudio: true } }));
  assert.match(md, /Izmereno/i);
  assert.ok(!md.includes('ERROR'));
});

test('writeQcReport: piše qc-report.md u folder epizode i vraća putanju', () => {
  const dir = episodeWithClips(2);
  const file = writeQcReport(dir, qcCtx({ storyboard: linked([5, 5]) }));
  assert.equal(path.basename(file), 'qc-report.md');
  assert.match(fs.readFileSync(file, 'utf8'), /# QC izveštaj/);
  rm(dir);
});

// ---------------------------------------------------------------- main: izveštaj i kad padne

// Epizoda bez ijednog klipa: `inspectSources` nema šta da probe-uje, pa ovaj test ne dira ffmpeg.
test('main: qc-report.md se piše i kad validacija padne — tad je i najpotrebniji', async () => {
  const dir = tmpEpisode({ 'storyboard.json': JSON.stringify(linked([5, 5])) });
  const tiho = console.log;
  console.log = () => {};
  try {
    await assert.rejects(() => main([dir]), /montaža ne može da počne/);
  } finally {
    console.log = tiho;
  }
  const md = fs.readFileSync(path.join(dir, 'qc-report.md'), 'utf8');
  assert.match(md, /shots\/part01\.mp4/);
  assert.ok(md.includes('ERROR'), 'epizoda bez klipova mora da ima ERROR');
  rm(dir);
});

// ---------------------------------------------------------------- parseArgs

test('parseArgs: --dissolve je isključen dok se ne traži', () => {
  assert.equal(parseArgs(['ep']).dissolve, 0);
});

test('parseArgs: oba oblika --dissolve opcije', () => {
  assert.equal(parseArgs(['ep', '--dissolve', '8']).dissolve, 8);
  assert.equal(parseArgs(['ep', '--dissolve=4']).dissolve, 4);
  assert.equal(parseArgs(['ep', '--dissolve', '0']).dissolve, 0);
});

test('parseArgs: --dissolve odbija ne-broj, negativno i necelo', () => {
  assert.throws(() => parseArgs(['ep', '--dissolve', 'malo']), /--dissolve/);
  assert.throws(() => parseArgs(['ep', '--dissolve', '-2']), /--dissolve/);
  assert.throws(() => parseArgs(['ep', '--dissolve', '2.5']), /--dissolve/);
});

test('DEFAULT_DISSOLVE je 8 frejmova iz plana', () => {
  assert.equal(DEFAULT_DISSOLVE, 8);
  assert.ok(Object.keys(RES).includes('1080p'));
});
