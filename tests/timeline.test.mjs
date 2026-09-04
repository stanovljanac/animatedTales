// tests/timeline.test.mjs
//
//   node --test tests/
//
// Pokriva tabelu obaveznih slučajeva iz docs/plan/C04-ffmpeg-i-timeline.md (verifikacija V3)
// plus invarijante 6–10 iz docs/reference/schemas.md §3.7 nad svakim rezultatom.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sliceBeat, planTimeline, q, round3, isFrameAligned, DEFAULTS } from '../tools/timeline.mjs';

const FPS = DEFAULTS.fps;
const FRAME = 1 / FPS;
const EPS = 0.0011;

/** Rečenice od zadatih trajanja, jedna za drugom, opciono sa pauzom između. */
function mk(durs, { gap = 0, start = 0 } = {}) {
  const out = [];
  let t = start;
  durs.forEach((d, i) => {
    out.push({
      id: 'S' + String(i + 1).padStart(2, '0'),
      start: round3(t),
      end: round3(t + d),
      dur: round3(d),
      text: `rečenica ${i + 1}`,
    });
    t = round3(t + d + gap);
  });
  return out;
}

/** Reči na svakih `step` sekundi unutar svake rečenice. */
function words(sentences, step = 0.4) {
  const out = [];
  for (const s of sentences) {
    let i = 0;
    for (let t = s.start; t < s.end - 1e-9; t = round3(t + step), i++) {
      out.push({
        sentence_id: s.id,
        word: `w${i}`,
        start: round3(t),
        end: round3(Math.min(t + step * 0.8, s.end)),
        confidence: 0.99,
      });
    }
  }
  return out;
}

/** Invarijante koje moraju da važe za svaki rezultat sliceBeat-a. */
function checkShots(shots, sentences, opts = {}) {
  const lo = q(opts.beatStart ?? sentences[0].start, FPS);
  const hi = q(opts.beatEnd ?? sentences[sentences.length - 1].end, FPS);
  const total = round3(hi - lo);

  assert.ok(shots.length >= 1, 'bar jedan shot');
  let cursor = lo;
  let sum = 0;
  for (const s of shots) {
    assert.ok(Math.abs(s.t_in - cursor) < EPS, `t_in ${s.t_in} ne nastavlja tajmlajn na ${cursor}`);
    assert.ok(Math.abs(s.t_out - (s.t_in + s.use_len)) < EPS, 't_out != t_in + use_len');
    assert.ok(Math.abs(s.use_out - (s.use_in + s.use_len)) < EPS, 'use_out != use_in + use_len');
    for (const [k, v] of Object.entries({
      t_in: s.t_in, t_out: s.t_out, use_in: s.use_in, use_out: s.use_out, use_len: s.use_len,
    })) {
      assert.ok(isFrameAligned(v, FPS), `${k}=${v} nije frejm-poravnato`);
    }
    // T3
    if (s.use_len < 9.0 - EPS) assert.equal(s.motion_budget, s.use_len, 'motion_budget != use_len');
    else assert.equal(s.motion_budget, null, 'motion_budget postavljen na shotu >= 9.0s');
    cursor = s.t_out;
    sum = round3(sum + s.use_len);
  }
  // poslednji shot upija ostatak kvantizacije — tražena je tačna jednakost, ne tolerancija
  assert.equal(round3(cursor), hi, `poslednji t_out ${cursor} != q(beat.end) ${hi}`);
  assert.equal(sum, total, `zbir use_len ${sum} != ${total}`);
}

/** T2 važi samo kad beat uopšte može da se ispoštuje — kratak beat je izuzetak sa upozorenjem. */
function checkBounds(shots) {
  for (const s of shots) {
    assert.ok(s.use_len >= DEFAULTS.minShot - EPS, `T2: use_len ${s.use_len} < 3.0`);
    assert.ok(s.use_len <= DEFAULTS.maxShot + EPS, `T2: use_len ${s.use_len} > 10.0`);
  }
}

/** Svaki rez pada na granicu rečenice. */
function checkCutsOnSentences(shots, sentences) {
  const allowed = new Set(sentences.map((s) => q(s.start, FPS).toFixed(3)));
  for (const s of shots.slice(1)) {
    assert.ok(allowed.has(s.t_in.toFixed(3)), `rez na ${s.t_in} nije granica rečenice`);
  }
}

// ---------------------------------------------------------------- tabela iz C04

test('beat 4.6s -> 1 shot, use = 4.6', () => {
  const s = mk([2.1, 2.5]); // 4.6s
  const { shots, warnings } = sliceBeat(s);
  assert.equal(shots.length, 1);
  assert.ok(Math.abs(shots[0].use_len - 4.6) <= FRAME, `use_len ${shots[0].use_len} nije ~4.6`);
  assert.equal(shots[0].use_in, 0);
  assert.deepEqual(shots[0].sentences, ['S01', 'S02']);
  assert.deepEqual(warnings, []);
  checkShots(shots, s);
  checkBounds(shots);
});

test('beat 23.4s -> 3 shota, svi u [3,10], zbir 23.4', () => {
  const s = mk([3.9, 3.9, 3.9, 3.9, 3.9, 3.9]); // 23.4s
  const { shots, warnings } = sliceBeat(s);
  assert.equal(shots.length, 3);
  const sum = shots.reduce((a, x) => a + x.use_len, 0);
  assert.ok(Math.abs(sum - 23.4) <= 0.05, `zbir ${sum} nije 23.4 ±0.05`);
  assert.deepEqual(warnings, []);
  checkShots(shots, s);
  checkBounds(shots);
  checkCutsOnSentences(shots, s);
});

test('beat 11.5s -> 2 shota ~5.75, nikad 10 + 1.5', () => {
  const s = mk([2.875, 2.875, 2.875, 2.875]); // 11.5s
  const { shots } = sliceBeat(s);
  assert.equal(shots.length, 2);
  for (const x of shots) assert.ok(Math.abs(x.use_len - 5.75) <= FRAME, `use_len ${x.use_len} nije ~5.75`);
  assert.ok(!shots.some((x) => x.use_len > 9.5), 'pojavio se shot od ~10s');
  checkShots(shots, s);
  checkBounds(shots);
  checkCutsOnSentences(shots, s);
});

test('grupa < 3.0s se ne prihvata — podela se pomera umesto da napravi kratak shot', () => {
  const s = mk([2.0, 8.0, 8.0, 5.0]); // 23.0s; naivno (2)(8)(8)(5) ili (2)(8,8)(5) daju grupu od 2.0s
  const { shots } = sliceBeat(s);
  checkShots(shots, s);
  checkBounds(shots);
  checkCutsOnSentences(shots, s);
  assert.deepEqual(shots[0].sentences, ['S01', 'S02'], 'rečenica od 2.0s mora da deli shot sa sledećom');
  assert.equal(shots.length, 3);
});

test('minShot je tvrda granica, ne preporuka — radije rez u rečenici nego shot od 2.5s', () => {
  // (2.5)(8)(8) je jedina podela po granicama rečenica koja staje u maxShot, a prva grupa
  // je ispod 3.0s. Očekivano: podela se odbija i pada se na rez unutar rečenice.
  const s = mk([2.5, 8.0, 8.0]);
  const { shots, warnings } = sliceBeat(s, { words: words(s) });
  checkShots(shots, s);
  checkBounds(shots);
  assert.ok(!shots.some((x) => Math.abs(x.use_len - 2.5) < 0.05), 'napravljen je shot od 2.5s');
  assert.ok(warnings.some((w) => w.code === 'intra-sentence-cut'), 'nema upozorenja o rezu u rečenici');
});

test('use_len < 9.0 -> motion_budget; >= 9.0 -> null', () => {
  const kratki = sliceBeat(mk([2.875, 2.875, 2.875, 2.875])).shots;
  assert.ok(kratki.every((x) => x.motion_budget === x.use_len));

  const s = mk([9.5, 9.5]); // 19.0s -> 2 x 9.5
  const { shots } = sliceBeat(s);
  assert.equal(shots.length, 2);
  assert.ok(shots.every((x) => x.use_len >= 9.0), 'očekivana dva shota od 9.5s');
  assert.ok(shots.every((x) => x.motion_budget === null), 'motion_budget ne sme na shot >= 9.0s');
  checkShots(shots, s);
  checkBounds(shots);
});

test('2 rečenice / 30.5s — ne pada, seče unutar rečenice, diže warning', () => {
  const s = mk([14.0, 16.5]);
  const { shots, warnings } = sliceBeat(s, { words: words(s) });
  checkShots(shots, s);
  checkBounds(shots);
  const intra = warnings.filter((w) => w.code === 'intra-sentence-cut');
  assert.ok(intra.length >= 1, 'nema upozorenja o rezu unutar rečenice');
  assert.ok(intra.every((w) => w.sentence_id && typeof w.at === 'number'));
  // rez zaista pada unutar rečenice, ne na njenoj granici
  const boundaries = new Set(s.map((x) => q(x.start, FPS).toFixed(3)));
  assert.ok(shots.slice(1).some((x) => !boundaries.has(x.t_in.toFixed(3))));
});

test('jedna rečenica 12s — ne pada, seče unutar rečenice, diže warning', () => {
  const s = mk([12.0]);
  const { shots, warnings } = sliceBeat(s, { words: words(s) });
  assert.ok(shots.length >= 2);
  checkShots(shots, s);
  checkBounds(shots);
  assert.ok(warnings.some((w) => w.code === 'intra-sentence-cut'));
});

test('rez unutar rečenice bez vremena po rečima -> blind-cut', () => {
  const s = mk([12.0]);
  const { shots, warnings } = sliceBeat(s); // bez opts.words
  checkShots(shots, s);
  checkBounds(shots);
  assert.ok(warnings.some((w) => w.code === 'blind-cut'), 'očekivan blind-cut');
});

// ---------------------------------------------------------------- ostalo

test('svi rezultati su frejm-poravnati, poslednji shot upija ostatak', () => {
  for (const durs of [[4.6], [7.31], [11.5], [23.4], [3.3, 3.3, 3.3, 3.3, 3.3, 3.3, 3.3]]) {
    const s = mk(durs);
    const { shots } = sliceBeat(s);
    checkShots(shots, s);
  }
});

test('pauze između rečenica: rez pada na početak sledeće rečenice', () => {
  const s = mk([5.0, 5.0, 5.0], { gap: 0.5 }); // 16.0s ukupno, dve pauze od 0.5s
  const { shots } = sliceBeat(s);
  checkShots(shots, s);
  checkBounds(shots);
  checkCutsOnSentences(shots, s);
});

test('beat kraći od 3.0s ne baca nego diže beat-too-short', () => {
  const s = mk([1.4]);
  const { shots, warnings } = sliceBeat(s);
  assert.equal(shots.length, 1);
  assert.ok(Math.abs(shots[0].use_len - 1.4) <= FRAME);
  assert.ok(warnings.some((w) => w.code === 'beat-too-short'));
  checkShots(shots, s);
});

test('beatStart/beatEnd šire od rečenica — tišina se pripaja shotovima', () => {
  const s = mk([4.0, 4.0], { start: 0.5 });
  const { shots } = sliceBeat(s, { beatStart: 0, beatEnd: 9.0 });
  checkShots(shots, s, { beatStart: 0, beatEnd: 9.0 });
  assert.equal(shots[0].t_in, 0);
  assert.equal(shots[shots.length - 1].t_out, q(9.0, FPS));
});

test('sliceBeat baca samo na neispravan ulaz', () => {
  assert.throws(() => sliceBeat([]), TypeError);
  assert.throws(() => sliceBeat([{ id: 'S01', start: 2, end: 1 }]), TypeError);
  assert.throws(() => sliceBeat(mk([3, 3]), { beatStart: 1.0 }), TypeError);
});

// ---------------------------------------------------------------- planTimeline

test('planTimeline: neprekidan tajmlajn od 0.0 preko granica beatova', () => {
  const sentences = mk([4.62, 4.48, 5.2, 4.9, 6.1, 5.4], { gap: 0.3, start: 0.025 });
  const timing = { duration: round3(sentences.at(-1).end + 0.4), sentences, words: words(sentences) };
  const beats = [
    { beat_id: 'B01', sentences: ['S01', 'S02'] },
    { beat_id: 'B02', sentences: ['S03', 'S04'] },
    { beat_id: 'B03', sentences: ['S05', 'S06'] },
  ];
  const { shots, beats: out, warnings } = planTimeline(timing, beats);

  assert.equal(warnings.filter((w) => w.code === 'beat-coverage').length, 0);
  assert.equal(shots[0].t_in, 0, 'tajmlajn mora da počne na 0.0');

  let cursor = 0;
  shots.forEach((s, i) => {
    assert.equal(s.shot_id, String(i + 1).padStart(2, '0'));
    assert.equal(s.source_file, `shots/part${s.shot_id}.mp4`);
    assert.ok(Math.abs(s.t_in - cursor) < EPS, `rupa/preklapanje na shotu ${s.shot_id}`);
    cursor = s.t_out;
  });
  checkBounds(shots);

  // invarijanta 6 i 7
  out.forEach((b, i) => {
    assert.ok(Math.abs(b.shots[0].t_in - q(b.start, FPS)) < EPS, `${b.beat_id}: prvi t_in != q(beat.start)`);
    assert.ok(Math.abs(b.shots.at(-1).t_out - q(b.end, FPS)) < EPS, `${b.beat_id}: poslednji t_out != q(beat.end)`);
    assert.ok(b.shots.every((s) => s.beat_id === b.beat_id));
    if (i + 1 < out.length) assert.equal(b.end, out[i + 1].start, 'beatovi ne popločavaju tajmlajn');
  });

  // invarijanta 11: zbir use_len naspram trajanja narracije
  const sum = shots.reduce((a, s) => a + s.use_len, 0);
  assert.ok(Math.abs(sum - timing.duration) <= 0.5, `zbir ${sum} predaleko od ${timing.duration}`);
});

test('planTimeline: rep tišine u narraciji -> narration-tail warning', () => {
  const sentences = mk([4.0, 4.0, 4.0]);
  const bez = planTimeline({ duration: 12.1, sentences }, [{ beat_id: 'B01', sentences: ['S01', 'S02', 'S03'] }]);
  assert.equal(bez.warnings.filter((w) => w.code === 'narration-tail').length, 0);

  const sa = planTimeline({ duration: 13.5, sentences }, [{ beat_id: 'B01', sentences: ['S01', 'S02', 'S03'] }]);
  assert.ok(sa.warnings.some((w) => w.code === 'narration-tail'));
});

test('planTimeline: nepokrivena rečenica -> beat-coverage warning', () => {
  const sentences = mk([4.0, 4.0, 4.0]);
  const timing = { duration: 12, sentences, words: [] };
  const { warnings } = planTimeline(timing, [{ beat_id: 'B01', sentences: ['S01', 'S02'] }]);
  assert.ok(warnings.some((w) => w.code === 'beat-coverage'));
});

test('planTimeline: nepoznata rečenica u beat mapi baca', () => {
  const sentences = mk([4.0, 4.0]);
  const timing = { duration: 8, sentences, words: [] };
  assert.throws(() => planTimeline(timing, [{ beat_id: 'B01', sentences: ['S01', 'S99'] }]), TypeError);
});
