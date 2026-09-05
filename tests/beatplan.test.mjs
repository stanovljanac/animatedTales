// tests/beatplan.test.mjs
//
//   node --test tests/
//
// Verifikacija za `tools/beatplan.mjs` — most između `timing.json` i `storyboard.json`
// koji je nedostajao do C12 (docs/plan/C12-skills.md, odluka o `beatplan`).
//
// Dva sloja se mere odvojeno:
//
//   1. **Skelet** — oblik `storyboard.json`-a mora da bude bajt-u-bajt kanonski: ista polja,
//      isti redosled, ista prazna mesta. Skelet koji „skoro" liči na fixture prolazi
//      `assertDisplayable` a pada tek u `lint.mjs`, tri koraka kasnije.
//   2. **Checkpoint** — format je deo ugovora prema korisniku (C12, verifikacija 4:
//      „checkpoint format se ispisuje tačno kako je gore prikazan"), pa se poredi doslovno.
//      Format u prozi SKILL.md-a ne može da se verifikuje; ovde može.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEVICES, EPS, R1_AXES, TAGS, assertDisplayable, isFrameAligned } from '../tools/contract.mjs';
import {
  PLACEHOLDER_TAGS, buildStoryboard, checkpoint, loadBeatMap, main, parseArgs, stamp,
} from '../tools/beatplan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');

const timing = () => JSON.parse(fs.readFileSync(path.join(FIX, 'timing.sample.json'), 'utf8'));

/** Beat mapa nad `timing.sample.json`: 6 rečenica u 3 beata. */
const MAP = [
  { beat_id: 'B01', sentences: ['S01', 'S02'], device: 'animated-map', viewer_sees: 'ANIMATED MAP — granice se šire' },
  { beat_id: 'B02', sentences: ['S03', 'S04'], device: null, viewer_sees: 'polje posle bitke, štitovi u blatu' },
  { beat_id: 'B03', sentences: ['S05', 'S06'], device: 'empty-aftermath', viewer_sees: 'prazan forum u sumrak' },
];

const AT = '2026-09-06T00:00:00Z';
const build = (map = MAP, t = timing()) => buildStoryboard(t, map, { episode: 'rome-sample', generatedAt: AT });

const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'beatplan-'));

// ---------------------------------------------------------------- parseArgs

test('parseArgs: folder i --beats su obavezni', () => {
  const a = parseArgs(['episodes/x', '--beats', 'b.json']);
  assert.equal(a.dir, 'episodes/x');
  assert.equal(a.beats, 'b.json');
  assert.equal(a.write, false, 'bez --write se ne piše — checkpoint je podrazumevano stanje');
  assert.equal(a.force, false);

  assert.throws(() => parseArgs([]), /nedostaje folder/);
  assert.throws(() => parseArgs(['episodes/x']), /nedostaje --beats/);
  assert.throws(() => parseArgs(['episodes/x', '--beats']), /--beats traži/);
});

test('parseArgs: nepoznata opcija i višak argumenta padaju, --help ne traži ništa', () => {
  assert.throws(() => parseArgs(['episodes/x', '--beats', 'b.json', '--nope']), /nepoznata opcija --nope/);
  assert.throws(() => parseArgs(['episodes/x', 'y', '--beats', 'b.json']), /višak argumenta y/);
  assert.equal(parseArgs(['--help']).help, true);
  assert.equal(parseArgs(['-h']).help, true);
});

test('parseArgs: --write, --force i --generated-at', () => {
  const a = parseArgs(['e', '--beats', 'b.json', '--write', '--force', '--generated-at', AT]);
  assert.deepEqual([a.write, a.force, a.generatedAt], [true, true, AT]);
});

// ---------------------------------------------------------------- loadBeatMap

test('loadBeatMap: prima i { beats: [...] } i goli niz', () => {
  const dir = tmpdir();
  const bare = path.join(dir, 'bare.json');
  const wrapped = path.join(dir, 'wrapped.json');
  fs.writeFileSync(bare, JSON.stringify(MAP));
  fs.writeFileSync(wrapped, JSON.stringify({ beats: MAP }));
  assert.deepEqual(loadBeatMap(bare), loadBeatMap(wrapped));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadBeatMap: odbija mapu bez rečenica, sa rupom u beat_id i sa nepoznatim uređajem', () => {
  const dir = tmpdir();
  const w = (name, data) => {
    const f = path.join(dir, name);
    fs.writeFileSync(f, JSON.stringify(data));
    return f;
  };

  assert.throws(() => loadBeatMap(w('a.json', [{ beat_id: 'B01', sentences: [] }])), /nema nijednu rečenicu/);
  assert.throws(() => loadBeatMap(w('b.json', [{ beat_id: 'B02', sentences: ['S01'] }])), /B01/);
  assert.throws(
    () => loadBeatMap(w('c.json', [{ beat_id: 'B01', sentences: ['S01'], device: 'moon-logic' }])),
    /nepoznat device "moon-logic"/,
  );
  assert.throws(() => loadBeatMap(w('d.json', { nope: 1 })), /beat mapa/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadBeatMap: beat_id sme da izostane i tada se izvodi iz redosleda', () => {
  const dir = tmpdir();
  const f = path.join(dir, 'm.json');
  fs.writeFileSync(f, JSON.stringify([{ sentences: ['S01'] }, { sentences: ['S02'] }]));
  assert.deepEqual(loadBeatMap(f).map((b) => b.beat_id), ['B01', 'B02']);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- skelet

test('buildStoryboard: koren nosi tačno kanonska polja, u kanonskom redosledu', () => {
  const { storyboard } = build();
  assert.deepEqual(Object.keys(storyboard),
    ['schema_version', 'episode', 'generated_at', 'narration_duration', 'fps', 'beats']);
  assert.equal(storyboard.schema_version, 1);
  assert.equal(storyboard.episode, 'rome-sample');
  assert.equal(storyboard.generated_at, AT);
  assert.equal(storyboard.narration_duration, timing().duration);
  assert.equal(storyboard.fps, 24);
});

test('buildStoryboard: beat i shot nose tačno kanonska polja, u kanonskom redosledu', () => {
  const { storyboard } = build();
  const canonical = JSON.parse(fs.readFileSync(path.join(FIX, 'storyboard.sample.json'), 'utf8'));

  for (const b of storyboard.beats) {
    assert.deepEqual(Object.keys(b), Object.keys(canonical.beats[0]), `beat ${b.beat_id}`);
    for (const s of b.shots) {
      assert.deepEqual(Object.keys(s), Object.keys(canonical.beats[0].shots[0]), `shot ${s.shot_id}`);
    }
  }
});

test('buildStoryboard: skelet prolazi assertDisplayable — render.mjs radi nad njim odmah', () => {
  const { storyboard } = build();
  assert.doesNotThrow(() => assertDisplayable(storyboard));
});

test('buildStoryboard: narration_says se izvodi iz timing.json, ne iz beat mape', () => {
  const t = timing();
  const map = MAP.map((b) => ({ ...b, narration_says: 'PREPRAVLJENA SKRIPTA' }));
  const { storyboard } = build(map, t);

  const byId = new Map(t.sentences.map((s) => [s.id, s.text]));
  for (const b of storyboard.beats) {
    assert.equal(b.narration_says, b.sentences.map((id) => byId.get(id)).join(' '));
    assert.doesNotMatch(b.narration_says, /PREPRAVLJENA/,
      'beat mapa ne sme da prepiše tekst narracije — skripta je zamrznuta posle rendera');
  }
});

test('buildStoryboard: prazna mesta su prazna, ne izmišljena', () => {
  const { storyboard } = build();
  for (const b of storyboard.beats) {
    for (const s of b.shots) {
      assert.equal(s.image_prompt, '');
      assert.equal(s.animation_prompt, '');
      assert.deepEqual(s.characters, []);
      assert.equal(s.ingredient_image, null);
      assert.equal(s.link_group, null, 'linkovanje je kreativna odluka i pripada C14');
    }
  }
});

test('buildStoryboard: placeholder tagovi su strukturno ispravni ali očigledno nepopunjeni', () => {
  const { storyboard } = build();
  const shots = storyboard.beats.flatMap((b) => b.shots);

  for (const s of shots) {
    assert.deepEqual(Object.keys(s.tags).slice().sort(), R1_AXES.slice().sort(),
      'tačno šest osa, ni jedna manje');
    for (const [k, allowed] of Object.entries(TAGS)) {
      assert.ok(allowed.includes(s.tags[k]), `tags.${k}="${s.tags[k]}" mora da bude iz enumeracije`);
    }
  }
  // Svi shotovi dele iste tagove -> R1 mora da laje na skelet. Skelet ne sme da izgleda gotovo.
  const distinct = new Set(shots.map((s) => JSON.stringify(s.tags)));
  assert.equal(distinct.size, 1, 'nepopunjen skelet ima identične tagove svuda, i to je namerno');
});

test('buildStoryboard: beat sme da ponese tagove i oni gaze placeholder', () => {
  const map = MAP.map((b, i) => (i === 1 ? { ...b, tags: { location: 'allia-river', time_light: 'midday-hard-sun' } } : b));
  const { storyboard } = build(map);
  for (const s of storyboard.beats[1].shots) {
    assert.equal(s.tags.location, 'allia-river');
    assert.equal(s.tags.time_light, 'midday-hard-sun');
    assert.equal(s.tags.subject_type, PLACEHOLDER_TAGS.subject_type, 'nenavedena osa ostaje placeholder');
  }
  assert.equal(storyboard.beats[0].shots[0].tags.location, PLACEHOLDER_TAGS.location);
});

test('buildStoryboard: source_file prati invarijantu 13', () => {
  const { storyboard } = build();
  const shots = storyboard.beats.flatMap((b) => b.shots);
  shots.forEach((s, i) => {
    assert.equal(s.shot_id, String(i + 1).padStart(2, '0'));
    assert.equal(s.source_file, `shots/part${s.shot_id}.mp4`);
    assert.equal(s.beat_id, storyboard.beats.find((b) => b.shots.includes(s)).beat_id);
  });
});

test('buildStoryboard: beat.start/end su prepisani iz timing.json neizmenjeni (invarijanta 5)', () => {
  const t = timing();
  const { storyboard } = build(MAP, t);
  const byId = new Map(t.sentences.map((s) => [s.id, s]));

  storyboard.beats.forEach((b, i) => {
    const first = byId.get(b.sentences[0]);
    const next = MAP[i + 1] ? byId.get(MAP[i + 1].sentences[0]) : null;
    if (i > 0) assert.equal(b.start, first.start);
    assert.equal(b.end, next ? next.start : byId.get(b.sentences.at(-1)).end);
    assert.ok(Math.abs(b.dur - (b.end - b.start)) <= EPS);
  });
  assert.equal(storyboard.beats[0].start, 0, 'prvi beat kreće od nule tajmlajna');
});

test('buildStoryboard: tajmlajn je neprekidan i frejm-poravnat (invarijante 6–10)', () => {
  const { storyboard } = build();
  const fps = storyboard.fps;
  const shots = storyboard.beats.flatMap((b) => b.shots);

  for (const s of shots) {
    for (const k of ['t_in', 't_out', 'use_in', 'use_out', 'use_len']) {
      assert.ok(isFrameAligned(s[k], fps), `shot ${s.shot_id}.${k}=${s[k]} nije frejm-poravnat`);
    }
    assert.ok(Math.abs(s.t_out - (s.t_in + s.use_len)) <= EPS);
    assert.ok(Math.abs(s.use_out - (s.use_in + s.use_len)) <= EPS);
    assert.ok(s.use_len >= 3.0 - EPS && s.use_len <= 10.0 + EPS, `use_len ${s.use_len} van 3–10s`);
    assert.equal(s.motion_budget, s.use_len < 9.0 - EPS ? s.use_len : null);
  }
  for (let i = 1; i < shots.length; i++) {
    assert.ok(Math.abs(shots[i].t_in - shots[i - 1].t_out) <= EPS, `rupa pred shot ${shots[i].shot_id}`);
  }
  assert.equal(shots[0].t_in, 0);
});

test('buildStoryboard: dva pokretanja daju bajt-identičan JSON', () => {
  const a = JSON.stringify(build().storyboard);
  const b = JSON.stringify(build().storyboard);
  assert.equal(a, b);
});

test('buildStoryboard: upozorenja splittera stižu do pozivaoca, ne gutaju se', () => {
  const t = timing();
  const { warnings } = build([{ beat_id: 'B01', sentences: ['S01', 'S02'] }], t);
  assert.ok(warnings.some((w) => w.code === 'beat-coverage'),
    'nepokrivene rečenice moraju da izađu kao beat-coverage');
});

test('buildStoryboard: nepoznata rečenica u mapi baca, ne pravi tih skelet', () => {
  assert.throws(() => build([{ beat_id: 'B01', sentences: ['S01', 'S99'] }]), /S99/);
});

// ---------------------------------------------------------------- checkpoint

test('checkpoint: format je doslovno onaj iz C12', () => {
  // Rekonstrukcija primera iz plana: B03 traje 00:41.2–01:04.6 (23.4s) i daje 3 shota.
  // Beat mora da bude treći, ne prvi — `planTimeline` prvi beat uvek spušta na nulu tajmlajna
  // (schemas.md §5.3 tačka 2), pa B01 nikad ne bi mogao da počne na 41.2.
  const bounds = [0, 6.9, 13.8, 20.6, 27.5, 34.4, 41.2, 49.0, 56.8, 64.6];
  const texts = [
    'Rome had spent a century at war with itself.',
    'The republic held, but only just.',
    'Then one man ended the argument.',
    'He crossed a river he was forbidden to cross.',
    'The senate scattered before him.',
    'Within four years there was no one left to oppose him.',
    'Under Caesar, Rome prospered as never before.',
    'Trade routes reached further than any Roman had seen.',
    'Grain moved from Egypt to the Tiber without interruption.',
  ];
  const t = {
    duration: 64.6,
    sentences: texts.map((text, i) => ({
      id: `S0${i + 1}`, start: bounds[i], end: bounds[i + 1], dur: bounds[i + 1] - bounds[i], text,
    })),
    words: [],
  };
  const map = [
    { beat_id: 'B01', sentences: ['S01', 'S02', 'S03'], device: null, viewer_sees: 'forum, građani u grupama' },
    { beat_id: 'B02', sentences: ['S04', 'S05', 'S06'], device: null, viewer_sees: 'reka u zoru, konjica prelazi' },
    {
      beat_id: 'B03',
      sentences: ['S07', 'S08', 'S09'],
      device: 'animated-map',
      viewer_sees: 'ANIMATED MAP — granice se šire, trgovačke rute se iscrtavaju, luke se množe duž obale',
    },
  ];
  const { storyboard } = buildStoryboard(t, map, { episode: 'x', generatedAt: AT });
  const lines = checkpoint(storyboard, []).split('\n');

  // Blok baš tog beata, da se poređenje ne zakači za B01.
  const at = lines.findIndex((l) => l.startsWith('B03'));
  const block = lines.slice(at, at + 4);

  assert.equal(block[0], 'B03  [00:41.2–01:04.6]  23.4s  → 3 shota');
  assert.equal(block[1], '     NARRATION SAYS: "Under Caesar, Rome prospered as never before. Trade routes re…"');
  assert.equal(block[2], '     VIEWER SEES:    ANIMATED MAP — granice se šire, trgovačke rute se iscrtavaju,');
  assert.equal(block[3], '                     luke se množe duž obale');
  assert.match(block[3], /^ {21}\S/, 'nastavak VIEWER SEES-a se poravnava pod tekst, ne pod naziv');
});

test('checkpoint: dugačka narracija se skraćuje na jedan red sa tri tačke', () => {
  const { storyboard } = build();
  for (const l of checkpoint(storyboard, []).split('\n')) {
    assert.ok(l.length <= 100, `red duži od 100 znakova: ${l}`);
  }
  const says = checkpoint(storyboard, []).split('\n').filter((l) => l.includes('NARRATION SAYS:'));
  assert.equal(says.length, 3, 'tačno jedan red po beatu');
  assert.ok(says.some((l) => l.endsWith('…"')), 'duga narracija dobija …');
});

test('checkpoint: upozorenja splittera se ispisuju ispod plana', () => {
  const { storyboard, warnings } = build([{ beat_id: 'B01', sentences: ['S01', 'S02'] }]);
  const out = checkpoint(storyboard, warnings);
  assert.match(out, /beat-coverage/);
});

test('checkpoint: zbirni red nosi broj beatova, shotova i upotrebljene uređaje', () => {
  const { storyboard } = build();
  const out = checkpoint(storyboard, []);
  assert.match(out, /3 beata · 5 shotova|3 beata · \d+ shotova/);
  assert.match(out, /animated-map/);
  assert.match(out, /empty-aftermath/);
});

test('stamp: ISO 8601 UTC bez milisekundi', () => {
  assert.match(stamp(new Date(Date.UTC(2026, 8, 6, 12, 34, 56, 789))), /^2026-09-06T12:34:56Z$/);
});

// ---------------------------------------------------------------- main

test('main: bez --write ne dodiruje disk', () => {
  const dir = tmpdir();
  fs.writeFileSync(path.join(dir, 'timing.json'), JSON.stringify(timing()));
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(MAP));

  const code = main([dir, '--beats', path.join(dir, 'beats.json'), '--generated-at', AT], { log: () => {} });
  assert.equal(code, 0);
  assert.equal(fs.existsSync(path.join(dir, 'storyboard.json')), false,
    'checkpoint je pregled; upis je zaseban, svestan korak');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('main: --write upisuje skelet, drugi put traži --force', () => {
  const dir = tmpdir();
  fs.writeFileSync(path.join(dir, 'timing.json'), JSON.stringify(timing()));
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(MAP));
  const argv = [dir, '--beats', path.join(dir, 'beats.json'), '--write', '--generated-at', AT];

  assert.equal(main(argv, { log: () => {} }), 0);
  const first = fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8');
  assert.ok(first.endsWith('\n'), 'fajl se završava novim redom');
  assert.doesNotThrow(() => assertDisplayable(JSON.parse(first)));

  assert.throws(() => main(argv, { log: () => {} }), /postoji.*--force/s);
  assert.equal(main([...argv, '--force'], { log: () => {} }), 0);
  assert.equal(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'), first, 'ponovni upis je identičan');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('main: nedostajući timing.json daje poruku koja kaže šta da se uradi', () => {
  const dir = tmpdir();
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(MAP));
  assert.throws(() => main([dir, '--beats', path.join(dir, 'beats.json')], { log: () => {} }),
    /timing\.json.*align\.mjs/s);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('main: --help ne traži ni folder ni mapu', () => {
  const out = [];
  assert.equal(main(['--help'], { log: (s) => out.push(s) }), 0);
  assert.match(out.join('\n'), /node tools\/beatplan\.mjs/);
});

test('DEVICES iz kataloga i dalje pokrivaju uređaje iz beat mape', () => {
  for (const b of MAP) if (b.device) assert.ok(DEVICES.includes(b.device));
});
