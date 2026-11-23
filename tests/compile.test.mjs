// tests/compile.test.mjs
//
//   node --test "tests/*.test.mjs"
//
// tools/compile.mjs: sklapanje više epizoda u jednu. Planiranje prozora i kadrova, tajmlajn,
// montažni storyboard, titlovi i povezivanje medija — nad izmišljenim delom, bez ffmpeg-a.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { timeProblems } from '../tools/assemble.mjs';
import {
  COMPILE, buildStoryboard, buildTiming, chapterList, freezeTailFor, layout, linkOrCopy, makeExternalPart, makePart,
  narrationArgs, newShotId, newSource, parseArgs, planExternalShots, planExternalWindow, planShots, planWindow,
  externalSentences, splitSentences,
} from '../tools/compile.mjs';

const FPS = 24;

/**
 * Deo od četiri rečenice (po 2s, razmak 1s) sa pravom tišinom između njih:
 *   S01 0–2 · S02 3–5 · S03 6–8 · S04 9–11 (pa tišina do 12)
 * Kadrovi pločaju 0–11.5 po granicama alignmenta (kao u pravoj epizodi).
 */
function fakePart(over = {}) {
  const sentences = [
    { id: 'S01', start: 0, end: 2, text: 'One.' },
    { id: 'S02', start: 3, end: 5, text: 'Two.' },
    { id: 'S03', start: 6, end: 8, text: 'Three.' },
    { id: 'S04', start: 9, end: 11, text: 'Four.' },
  ].map((s) => ({ ...s, dur: s.end - s.start, confidence: 0.9 }));
  const gaps = [{ s: 2.1, e: 2.9 }, { s: 5.1, e: 5.9 }, { s: 8.1, e: 8.9 }, { s: 11.1, e: 12 }];
  const shot = (id, tIn, tOut, extra = {}) => ({
    shot_id: id, link_group: null, t_in: tIn, t_out: tOut, use_in: 0, use_out: tOut - tIn, use_len: tOut - tIn,
    gen_len: 6, source_file: `shots/part${id}.mp4`, render_mode: 'clip', still_motion: null, characters: [],
    ...extra,
  });
  const storyboard = {
    beats: [
      { beat_id: 'B01', narration_says: 'One.', shots: [shot('01', 0, 3)] },
      { beat_id: 'B02', narration_says: 'Two.', shots: [shot('02', 3, 6, { render_mode: 'still', still_motion: 'push', source_file: 'shots/shot02.jpeg' })] },
      { beat_id: 'B03', narration_says: 'Three.', shots: [shot('03', 6, 9)] },
      { beat_id: 'B04', narration_says: 'Four.', shots: [shot('04', 9, 11.5)] },
    ],
  };
  const words = sentences.map((s) => ({ sentence_id: s.id, word: s.text.replace('.', ''), start: s.start, end: s.end - 0.3, confidence: 0.9 }));
  return makePart({
    slug: 'fake-part-1', prefix: '1', dir: '/x/fake-part-1', storyboard,
    timing: { duration: 12, sentences, words }, manifest: {}, gaps, ...over,
  });
}

test('prozor počinje u tišini ispred rečenice i staje pre govora sledeće', () => {
  const part = fakePart();
  const w = planWindow(part, { from: 'S02', to: 'S02' });
  assert.ok(w.w0 >= 2.1 + 0.04 - 1e-9, 'ne zalazi u kraj S01');
  assert.ok(w.w0 <= 2.9, 'počinje pre prve reči');
  assert.ok(w.w1 <= 5.9 - COMPILE.guard + 1e-9, 'ne dira početak S03');
  assert.ok(w.w1 >= w.offset + 0.15, 'obuhvata ceo govor');
  assert.equal(Math.round(w.frames), w.frames, 'ceo broj frejmova');
  assert.ok(Math.abs((w.w1 - w.w0) * FPS - w.frames) < 1e-6);
});

test('prozor prvog runa počinje na 0 i ne ide u negativno', () => {
  const part = fakePart();
  const w = planWindow(part, { from: 'S01', to: 'S01' });
  assert.equal(w.w0, 0);
});

test('prozor nepoznate ili obrnute rečenice je greška', () => {
  const part = fakePart();
  assert.throws(() => planWindow(part, { from: 'S09', to: 'S09' }), /ne postoje/);
  assert.throws(() => planWindow(part, { from: 'S03', to: 'S02' }), /ne postoje ili su obrnute/);
});

test('poslednja rečenica dela: prozor ne prelazi trajanje narracije', () => {
  const part = fakePart();
  const w = planWindow(part, { from: 'S04', to: 'S04' });
  assert.ok(w.w1 <= part.duration + 1e-9);
});

test('visual run: jedan kadar preko celog prozora, rep je zadat', () => {
  const part = fakePart();
  const run = { from: 'S02', to: 'S02', visual: '02', tail: 0.5 };
  const w = planWindow(part, run);
  const shots = planShots(part, run, w);
  assert.equal(shots.length, 1);
  assert.equal(shots[0].shot.shot_id, '02');
  assert.equal(shots[0].start, 0);
  assert.equal(shots[0].len, w.frames);
  assert.ok(Math.abs(w.tail - 0.5) < 1 / FPS + 1e-9);
  assert.throws(() => planShots(part, { from: 'S02', to: 'S02', visual: '77' }, w), /nije shot tog dela/);
});

test('kadrovi runa pločaju prozor bez rupa, a prvi počinje na nuli', () => {
  const part = fakePart();
  const run = { from: 'S01', to: 'S03' };
  const w = planWindow(part, run);
  const rows = planShots(part, run, w);
  assert.deepEqual(rows.map((r) => r.shot.shot_id), ['01', '02', '03']);
  assert.equal(rows[0].start, 0);
  rows.forEach((r, i) => {
    const next = rows[i + 1];
    assert.equal(r.start + r.len, next ? next.start : w.frames);
    assert.ok(r.len >= 1);
  });
});

test('kadar iz prethodnog beata ne ulazi u run, ma koliko se prozor preklapao sa njegovim repom', () => {
  // S03 počinje u 6.0, a prozor kreće ~0.05 ranije; kadar 02 (3–6) ne sme da uđe.
  const part = fakePart();
  const run = { from: 'S03', to: 'S03' };
  const w = planWindow(part, run);
  assert.deepEqual(planShots(part, run, w).map((r) => r.shot.shot_id), ['03']);
});

test('lead zadat u runu produžava prvi kadar unazad (duži predah)', () => {
  const part = fakePart();
  const plain = planWindow(part, { from: 'S03', to: 'S03' });
  const lead = planWindow(part, { from: 'S03', to: 'S03', lead: 0.7 });
  assert.ok(lead.w0 < plain.w0);
  assert.ok(lead.w0 >= 5.1 + 0.04 - 1e-9, 'ipak ne zalazi u govor S02');
});

test('still koji počinje pre prozora se skraćuje na glavi, klip preko praga puca', () => {
  const part = fakePart();
  // S03 iz sredine beata: izmišljeni beat koji nosi S02 i S03 jednim kadrom.
  const wide = (still) => fakePart({
    storyboard: {
      beats: [
        { beat_id: 'B01', shots: [{ shot_id: '01', t_in: 0, t_out: 3, use_in: 0, use_out: 3, use_len: 3, source_file: 'shots/a.mp4', render_mode: 'clip' }] },
        { beat_id: 'B02', shots: [{ shot_id: '02', t_in: 3, t_out: 9, use_in: 0, use_out: 6, use_len: 6, source_file: still ? 'shots/b.jpeg' : 'shots/b.mp4', render_mode: still ? 'still' : 'clip', still_motion: still ? 'pull' : null }] },
        { beat_id: 'B03', shots: [{ shot_id: '03', t_in: 9, t_out: 11, use_in: 0, use_out: 2, use_len: 2, source_file: 'shots/c.mp4', render_mode: 'clip' }] },
      ],
    },
    timing: part.timing,
    gaps: [{ s: 2.1, e: 2.9 }, { s: 5.1, e: 5.9 }, { s: 8.1, e: 8.9 }, { s: 11.1, e: 12 }],
  });
  const run = { from: 'S03', to: 'S03' };
  const stillPart = wide(true);
  const rows = planShots(stillPart, run, planWindow(stillPart, run));
  assert.equal(rows[0].shot.shot_id, '02');
  assert.equal(rows[0].useIn, 0, 'still nema use_in');
  assert.ok(rows[0].trimmed > 1, 'glava je skraćena za više od sekunde');

  const clipPart = wide(false);
  assert.throws(() => planShots(clipPart, run, planWindow(clipPart, run)), /ne seče toliko/);
});

test('layout: pomaci prozora su zbir prethodnih, a ukupno je zbir frejmova', () => {
  const part = fakePart();
  const runs = [{ from: 'S01', to: 'S01' }, { from: 'S03', to: 'S04' }];
  const planned = runs.map((run) => {
    const win = planWindow(part, run);
    return { run, part, win, shots: planShots(part, run, win) };
  });
  const laid = layout(planned);
  assert.equal(laid.windows[0].offsetFrames, 0);
  assert.equal(laid.windows[1].offsetFrames, planned[0].win.frames);
  assert.equal(laid.totalFrames, planned[0].win.frames + planned[1].win.frames);
  assert.equal(laid.duration, Math.round((laid.totalFrames / FPS) * 1000) / 1000);
  const sum = laid.shots.reduce((n, x) => n + x.lenF, 0);
  assert.equal(sum, laid.totalFrames, 'kadrovi pokrivaju tajmlajn do poslednjeg frejma');
});

test('layout: dva uzastopna still-a iste slike postaju jedan kadar', () => {
  const part = fakePart();
  const planned = [
    { run: { from: 'S02', to: 'S02', visual: '02' } },
    { run: { from: 'S02', to: 'S02', visual: '02' } },
  ].map(({ run }) => {
    const win = planWindow(part, run);
    return { run, part, win, shots: planShots(part, run, win) };
  });
  const laid = layout(planned);
  assert.equal(laid.shots.length, 1);
  assert.equal(laid.shots[0].lenF, planned[0].win.frames + planned[1].win.frames);
});

test('layout: klipovi se ne spajaju, ni still-ovi različitih slika', () => {
  const part = fakePart();
  const planned = [
    { run: { from: 'S01', to: 'S01' } },
    { run: { from: 'S01', to: 'S01' } },
  ].map(({ run }) => {
    const win = planWindow(part, run);
    return { run, part, win, shots: planShots(part, run, win) };
  });
  assert.equal(layout(planned).shots.length, 2);
});

test('montažni storyboard prolazi tajmlajn proveru assemble-a i ima jedinstvene shot_id-ove', () => {
  const part = fakePart();
  const runs = [{ from: 'S01', to: 'S02' }, { from: 'S04', to: 'S04' }];
  const planned = runs.map((run) => {
    const win = planWindow(part, run);
    return { run, part, win, shots: planShots(part, run, win) };
  });
  const laid = layout(planned);
  const sb = buildStoryboard('fake', laid, laid.duration);
  const shots = sb.beats.flatMap((b) => b.shots);
  assert.deepEqual(timeProblems(shots), []);
  assert.equal(new Set(shots.map((s) => s.shot_id)).size, shots.length);
  assert.ok(shots.every((s) => /^\d+$/.test(s.shot_id)));
  assert.equal(shots[0].shot_id, newShotId(part, { shot_id: '01' }));
  assert.equal(shots[0].source_file, newSource(part, { source_file: 'shots/part01.mp4' }));
  assert.equal(shots.at(-1).t_out, laid.duration);
  assert.equal(sb.narration_duration, laid.duration);
  assert.equal(sb.fps, FPS);
  // montaža ne traži ništa što bi falilo: svako polje koje assertAssemblable zahteva postoji
  for (const s of shots) for (const k of ['source_file', 't_in', 't_out', 'use_in', 'use_out', 'use_len']) assert.ok(k in s);
});

test('isti kadar dvaput je greška', () => {
  const part = fakePart();
  const planned = [{ from: 'S01', to: 'S01' }, { from: 'S01', to: 'S01' }].map((run) => {
    const win = planWindow(part, run);
    return { run: { ...run }, part, win, shots: planShots(part, run, win) };
  });
  assert.throws(() => buildStoryboard('fake', layout(planned), 1), /dvaput/);
});

test('timing: rečenice i reči su pomereni u novo vreme, redom i unutar trajanja', () => {
  const part = fakePart();
  const runs = [{ from: 'S01', to: 'S01' }, { from: 'S03', to: 'S04' }];
  const planned = runs.map((run) => {
    const win = planWindow(part, run);
    return { run, part, win, shots: planShots(part, run, win) };
  });
  const laid = layout(planned);
  const t = buildTiming(laid, laid.duration);
  assert.deepEqual(t.sentences.map((s) => s.text), ['One.', 'Three.', 'Four.']);
  assert.deepEqual(t.sentences.map((s) => s.id), ['S001', 'S002', 'S003']);
  assert.deepEqual(t.sentences.map((s) => s.origin.id), ['S01', 'S03', 'S04']);
  t.sentences.forEach((s, i) => {
    assert.ok(s.end > s.start);
    assert.ok(s.end <= t.duration + 1e-9);
    if (i) assert.ok(s.start >= t.sentences[i - 1].end - 1e-9, 'redom, bez preklapanja');
  });
  assert.equal(t.words.length, 3);
  assert.ok(t.words.every((w) => t.sentences.some((s) => s.id === w.sentence_id)));
  assert.ok(!('outro_start' in t), 'compilation nema outro');
});

test('poglavlja počinju na pomaku runa koji ih nosi', () => {
  const part = fakePart();
  const runs = [{ from: 'S01', to: 'S01', chapter: 'A' }, { from: 'S03', to: 'S03' }, { from: 'S04', to: 'S04', chapter: 'B' }];
  const planned = runs.map((run) => {
    const win = planWindow(part, run);
    return { run, part, win, shots: planShots(part, run, win) };
  });
  const laid = layout(planned);
  const ch = chapterList(laid);
  assert.deepEqual(ch.map((c) => c.title), ['A', 'B']);
  assert.equal(ch[0].start, 0);
  assert.ok(Math.abs(ch[1].start - (planned[0].win.frames + planned[1].win.frames) / FPS) < 0.001);
});

test('freeze_tail: odobrenje iz izvornog dela prelazi na novi shot_id samo za kadrove koji su ostali', () => {
  const part = fakePart({ manifest: { freeze_tail: ['01', '04'] } });
  const run = { from: 'S01', to: 'S01' };
  const win = planWindow(part, run);
  const laid = layout([{ run, part, win, shots: planShots(part, run, win) }]);
  assert.deepEqual(freezeTailFor(laid.shots), ['101']);
});

test('narrationArgs: po jedan atrim za prozor, jedan ulaz po delu, concat na kraju', () => {
  const a = fakePart();
  const b = fakePart({ slug: 'fake-part-2', prefix: '2', dir: '/x/fake-part-2' });
  const planned = [[a, { from: 'S01', to: 'S01' }], [b, { from: 'S02', to: 'S02' }], [a, { from: 'S04', to: 'S04' }]]
    .map(([part, run]) => {
      const win = planWindow(part, run);
      return { run, part, win, shots: planShots(part, run, win) };
    });
  const laid = layout(planned);
  const args = narrationArgs(laid.windows, 'out.mp3');
  const inputs = args.filter((x, i) => args[i - 1] === '-i');
  assert.equal(inputs.length, 2, 'dva dela, dva ulaza');
  const graph = args[args.indexOf('-filter_complex') + 1];
  assert.equal((graph.match(/atrim=/g) ?? []).length, 3);
  assert.match(graph, /concat=n=3:v=0:a=1\[out\]/);
  assert.equal(args.at(-1), 'out.mp3');
});

test('linkOrCopy: tvrdi link, pa „već tu" kad je isti fajl', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-compile-'));
  const src = path.join(dir, 'src', 'a.mp4');
  fs.mkdirSync(path.dirname(src), { recursive: true });
  fs.writeFileSync(src, 'abc');
  const dest = path.join(dir, 'out', 'shots', '1', 'a.mp4');
  assert.match(linkOrCopy(src, dest), /^(link|copy)$/);
  assert.equal(fs.readFileSync(dest, 'utf8'), 'abc');
  assert.equal(linkOrCopy(src, dest), 'ok');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('parseArgs: folder i zastavice, nepoznata zastavica je greška', () => {
  assert.deepEqual(parseArgs(['episodes/x', '--dry-run']), { dir: 'episodes/x', plan: 'compile.json', dryRun: true, audio: true, link: true, help: false });
  assert.equal(parseArgs(['x', '--plan', 'compile.framed.json']).plan, 'compile.framed.json');
  assert.equal(parseArgs(['x', '--plan=a.json']).plan, 'a.json');
  assert.throws(() => parseArgs(['x', '--plan']), /traži ime fajla/);
  assert.equal(parseArgs(['x', '--no-audio', '--no-link']).audio, false);
  assert.throws(() => parseArgs(['x', '--nesto']), /nepoznata zastavica/);
});

// ---------------------------------------------------------------- spoljni audio (uvod, završetak)

/** Snimljen fajl od 12s: govor 0.2–9.5s, tišina do kraja. */
function fakeExternal(over = {}) {
  return makeExternalPart({
    slug: 'framing-intro', file: '/x/framing/intro.mp3', duration: 12,
    text: ['Twelve gods.', 'It begins with a father who swallowed his own children.'],
    gaps: [{ s: 0, e: 0.2 }, { s: 9.5, e: 12 }], ...over,
  });
}

test('splitSentences: string se seče na interpunkciji, niz ostaje kakav je', () => {
  assert.deepEqual(splitSentences('One. Two! Three? Four'), ['One.', 'Two!', 'Three?', 'Four']);
  assert.deepEqual(splitSentences(['A b.', ' c ']), ['A b.', 'c']);
});

test('makeExternalPart: govor je između tišina na ivicama, rečenice dele raspon srazmerno slovima', () => {
  const part = fakeExternal();
  const [a, b] = part.sentences;
  assert.equal(a.start, 0.2);
  assert.equal(b.end, 9.5);
  assert.ok(Math.abs(a.end - b.start) < 0.002, 'bez rupe između rečenica');
  assert.ok(b.dur > a.dur, 'duža rečenica dobija duži raspon');
  assert.equal(part.external, true);
  assert.deepEqual(part.timing.words, []);
});

test('makeExternalPart: stavke sa izmerenim vremenom zamenjuju srazmernu raspodelu', () => {
  const part = fakeExternal({
    text: [{ text: 'Twelve gods.', start: 0.2, end: 1.4 }, { text: 'One family.', start: 2.1, end: 3.0 }],
  });
  assert.deepEqual(part.sentences.map((s) => [s.start, s.end]), [[0.2, 1.4], [2.1, 3]]);
  assert.deepEqual(part.bounds, [{ onset: 0.2, offset: 1.4 }, { onset: 2.1, offset: 3 }]);
  const win = planExternalWindow(part, { tail: 0.6 });
  assert.ok(Math.abs(win.onset - 0.2) < 1e-9 && Math.abs(win.offset - 3) < 1e-9, 'prozor prati izmerene granice');
});

test('externalSentences: mešanje sa običnim tekstom, preklapanje i prazan raspon su greška', () => {
  assert.deepEqual(externalSentences('A. B.'), [{ text: 'A.' }, { text: 'B.' }]);
  assert.throws(() => externalSentences(['A.', { text: 'B.', start: 1, end: 2 }]), /text\[0\]/);
  assert.throws(() => externalSentences([{ text: 'A.', start: 1, end: 1 }]), /end > start/);
  assert.throws(() => externalSentences([{ text: 'A.', start: 0, end: 2 }, { text: 'B.', start: 1, end: 3 }]), /pre kraja prethodne/);
  assert.throws(() => fakeExternal({ text: [{ text: 'A.', start: 0, end: 20 }] }), /fajl traje/);
});

test('makeExternalPart: fajl bez govora ili bez teksta je greška', () => {
  assert.throws(() => fakeExternal({ gaps: [{ s: 0, e: 12 }] }), /nema govora/);
  assert.throws(() => fakeExternal({ text: [] }), /traži `text`/);
});

test('prozor spoljnog fajla: lead pre govora, rep posle, hold kao tišina preko kraja', () => {
  const part = fakeExternal();
  const w = planExternalWindow(part, { tail: 0.6, hold: 10 });
  assert.ok(w.w0 >= 0 && w.w0 <= 0.2);
  assert.ok(w.w1 <= part.duration);
  assert.equal(w.padFrames, 10 * FPS);
  assert.equal(w.frames, Math.round((w.w1 - w.w0) * FPS) + w.padFrames);
  assert.ok(Math.abs(w.tail - 0.6) < 1 / FPS + 1e-9);
  const noHold = planExternalWindow(part, { tail: 0.6 });
  assert.equal(noHold.padFrames, 0);
  assert.equal(noHold.frames, w.frames - w.padFrames);
});

test('kadrovi spoljnog runa: težine daju srazmerno trajanje, `at` zadaje početak, poslednji ide do kraja', () => {
  const part = fakeExternal();
  const win = planExternalWindow(part, { tail: 0.6 });
  const host = fakePart();
  const shotOf = (x) => ({ part: host, shot: host.shots.find((s) => s.shot_id === x.shot) });
  const even = planExternalShots({ shots: [{ shot: '01' }, { shot: '02' }, { shot: '03' }] }, win, shotOf);
  assert.equal(even[0].start, 0);
  assert.equal(even.reduce((n, r) => n + r.len, 0), win.frames);
  assert.ok(even.every((r) => r.external));
  const heavy = planExternalShots({ shots: [{ shot: '01', weight: 3 }, { shot: '02' }] }, win, shotOf);
  assert.ok(heavy[0].len > heavy[1].len * 2.5, 'težina 3:1');
  const at = planExternalShots({ shots: [{ shot: '01' }, { shot: '02', at: 5 }] }, win, shotOf);
  assert.equal(at[1].start, Math.round((5 - win.w0) * FPS));
  assert.throws(() => planExternalShots({ shots: [{ shot: '01' }, { shot: '02', at: 0 }] }, win, shotOf), /ispada/);
  assert.throws(() => planExternalShots({ shots: [] }, win, shotOf), /traži `shots`/);
});

test('spoljni run u tajmlajnu: kadri iz drugog dela, titlovi sa rečenicama fajla, storyboard bez tuđe naracije', () => {
  const host = fakePart();
  const ext = fakeExternal();
  const run = { audio: 'framing/intro.mp3', shots: [{ shot: '03' }, { shot: '04' }], hold: 2 };
  const win = planExternalWindow(ext, run);
  const rows = planExternalShots(run, win, (x) => ({ part: host, shot: host.shots.find((s) => s.shot_id === x.shot) }));
  const bodyRun = { from: 'S01', to: 'S01' };
  const bodyWin = planWindow(host, bodyRun);
  const planned = [
    { run, part: ext, win, shots: rows },
    { run: bodyRun, part: host, win: bodyWin, shots: planShots(host, bodyRun, bodyWin) },
  ];
  const laid = layout(planned);
  assert.equal(laid.windows[0].part, ext);
  assert.equal(laid.windows[1].offsetFrames, win.frames);
  const sb = buildStoryboard('fake', laid, laid.duration);
  const first = sb.beats[0];
  assert.equal(first.narration_says, null, 'beat uvoda ne nosi naraciju iz originalnog dela');
  assert.equal(first.origin.framing, true);
  assert.deepEqual(timeProblems(sb.beats.flatMap((b) => b.shots)), []);
  const timing = buildTiming(laid, laid.duration);
  assert.deepEqual(timing.sentences.slice(0, 2).map((s) => s.origin.episode), ['framing-intro', 'framing-intro']);
  assert.equal(timing.sentences[2].text, 'One.');
  timing.sentences.forEach((s, i) => { if (i) assert.ok(s.start >= timing.sentences[i - 1].end - 1e-9); });
});

test('narrationArgs: hold se dodaje kao apad do punog trajanja prozora', () => {
  const ext = fakeExternal();
  const host = fakePart();
  const build = (run) => {
    const win = planExternalWindow(ext, run);
    const shots = [{ part: host, shot: host.shots[0], start: 0, len: win.frames, useIn: 0, trimmed: 0 }];
    return { laid: layout([{ run, part: ext, win, shots }]), win };
  };
  const held = build({ tail: 0.5, hold: 3 });
  const graph = narrationArgs(held.laid.windows, 'o.mp3').find((a) => a.includes('apad='));
  assert.match(graph, new RegExp(`apad=whole_dur=${(held.win.frames / FPS).toFixed(6)}`));
  const plain = build({ tail: 0.5 });
  assert.ok(!narrationArgs(plain.laid.windows, 'o.mp3').some((a) => a.includes('apad=')));
});
