// tests/assemble.test.mjs
//
//   node --test tests/
//
// Verifikacija iz docs/plan/C09-assemble-jezgro.md za `tools/assemble.mjs`: validacioni sloj i
// konstrukcija ffmpeg argumenata, **bez pravog rendera**. Pravi render nad Marathonom je V5 i
// pušta se iz komandne linije; ovde se dokazuje ono što render ne bi ni pokazao — da se
// argumenti slažu sa donetim odlukama i da keš zaista preskače posao.
//
// Tri odluke koje ovi testovi čuvaju od tihog vraćanja unazad:
//   - `-ss` ide POSLE `-i` (tačno sečenje; plan, „Odluke koje moraju biti donete")
//   - nigde `-copyts` (schemas.md §5.4 tačka 1 — ista nula na oba kraja lanca)
//   - `-an` na svakom shotu (Veo audio ne sme da procuri ispod narracije)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ENCODE, RES, TAIL, assertAssemblable, build, canWrite, concatArgs, concatText, endcardArgs,
  mediaNames, muxArgs, parseArgs, planCuts, readOutroStart, recipe, shotArgs, timeProblems,
  validate, videoFilter,
} from '../tools/assemble.mjs';

// ---------------------------------------------------------------- pomoćno

const FPS = 24;

/** Shot sa razumnim podrazumevanim vrednostima; testovi menjaju samo ono što mere. */
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

/** Storyboard od `lens` shotova u jednom beatu, položenih jedan za drugim od nule. */
function storyboardOf(lens, root = {}) {
  let t = 0;
  const shots = lens.map((len, i) => {
    const s = shot(i + 1, Math.round(t * 1000) / 1000, len);
    t += len;
    return s;
  });
  return {
    schema_version: 1,
    episode: 'test',
    generated_at: '2026-01-01T00:00:00Z',
    narration_duration: Math.round(t * 1000) / 1000,
    fps: FPS,
    beats: [{ beat_id: 'B01', sentences: ['S01'], start: 0, end: t, dur: t, device: null,
      narration_says: 'x', viewer_sees: 'x', shots }],
    ...root,
  };
}

function tmpEpisode(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-assemble-'));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return dir;
}

const rm = (dir) => fs.rmSync(dir, { recursive: true, force: true });

/** Lažni ffmpeg: pravi izlazni fajl (poslednji argument) i pamti poziv. */
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

// ---------------------------------------------------------------- assertAssemblable

test('assertAssemblable: prolazi na ispravnom dokumentu', () => {
  assert.doesNotThrow(() => assertAssemblable(storyboardOf([5, 5])));
});

test('assertAssemblable: svako obavezno polje shota je obavezno', () => {
  for (const k of ['shot_id', 'source_file', 't_in', 't_out', 'use_in', 'use_out', 'use_len']) {
    const sb = storyboardOf([5]);
    delete sb.beats[0].shots[0][k];
    assert.throws(() => assertAssemblable(sb), new RegExp(`nedostaje ${k}`),
      `brisanje ${k} mora da obori montažu`);
  }
});

test('assertAssemblable: nedostaje polje korena', () => {
  const sb = storyboardOf([5]);
  delete sb.fps;
  assert.throws(() => assertAssemblable(sb), /nedostaje fps/);
});

test('assertAssemblable: skuplja sve probleme odjednom, ne prvi', () => {
  const sb = storyboardOf([5, 5]);
  delete sb.beats[0].shots[0].use_in;
  delete sb.beats[0].shots[1].source_file;
  delete sb.narration_duration;
  try {
    assertAssemblable(sb);
    assert.fail('trebalo je da padne');
  } catch (err) {
    assert.match(err.message, /\(3\)/);
    assert.match(err.message, /nedostaje use_in/);
    assert.match(err.message, /nedostaje source_file/);
    assert.match(err.message, /nedostaje narration_duration/);
  }
});

test('assertAssemblable: vremena moraju da budu brojevi', () => {
  const sb = storyboardOf([5]);
  sb.beats[0].shots[0].use_len = '5';
  assert.throws(() => assertAssemblable(sb), /use_len nije broj/);
});

test('assertAssemblable: prazan beats i prazan shots', () => {
  assert.throws(() => assertAssemblable(storyboardOf([5], { beats: [] })), /bar jednim beatom/);
  const sb = storyboardOf([5]);
  sb.beats[0].shots = [];
  assert.throws(() => assertAssemblable(sb), /bar jednim shotom/);
});

// ---------------------------------------------------------------- timeProblems

test('timeProblems: ispravan tajmlajn nema nalaza', () => {
  assert.deepEqual(timeProblems(storyboardOf([5, 5, 5]).beats[0].shots), []);
});

test('timeProblems: t_out koji ne prati use_len', () => {
  const shots = storyboardOf([5]).beats[0].shots;
  shots[0].t_out = 6;
  const found = timeProblems(shots);
  assert.equal(found.length, 1);
  assert.match(found[0], /t_out - t_in .* != use_len/);
});

test('timeProblems: use_out koji ne prati use_in + use_len', () => {
  const shots = storyboardOf([5]).beats[0].shots;
  shots[0].use_out = 7;
  assert.match(timeProblems(shots)[0], /use_out - use_in/);
});

test('timeProblems: rupa između shotova', () => {
  const shots = storyboardOf([5, 5]).beats[0].shots;
  shots[1].t_in = 5.5;
  shots[1].t_out = 10.5;
  assert.ok(timeProblems(shots).some((p) => /ne nastavlja t_out/.test(p)));
});

test('timeProblems: tajmlajn koji ne počinje na nuli', () => {
  const shots = storyboardOf([5]).beats[0].shots;
  shots[0].t_in = 1;
  shots[0].t_out = 6;
  assert.ok(timeProblems(shots).some((p) => /ne počinje na 0/.test(p)));
});

// ---------------------------------------------------------------- planCuts

test('planCuts: bez outro_start-a end card je samo rep', () => {
  const sb = storyboardOf([5, 5]);
  const plan = planCuts(sb, { outroStart: null });

  assert.equal(plan.segments.length, 3);
  assert.equal(plan.segments.at(-1).kind, 'endcard');
  assert.equal(plan.segments.at(-1).len, TAIL);
  assert.deepEqual(plan.dropped, []);
  assert.deepEqual(plan.trimmed, []);
  assert.equal(plan.duration, 11.5);
  assert.equal(plan.coverage, 10);
  assert.equal(plan.totalFrames, 11.5 * FPS);
});

test('planCuts: end card preuzima sliku od outro_start-a — shot se krati, ostatak otpada', () => {
  const sb = storyboardOf([5, 5, 5]); // narracija 15s
  const plan = planCuts(sb, { outroStart: 7 });

  assert.deepEqual(plan.segments.map((s) => s.id), ['01', '02', 'endcard']);
  assert.deepEqual(plan.trimmed, [{ shot_id: '02', from: 5, to: 2 }]);
  assert.deepEqual(plan.dropped.map((d) => d.shot_id), ['03']);
  assert.equal(plan.segments[1].len, 2);
  // end card ide od 7s do kraja narracije (15s) plus rep
  assert.equal(plan.segments.at(-1).len, 9.5);
  assert.equal(plan.duration, 16.5);
  assert.equal(plan.coverage, 15);
});

test('planCuts: outro_start tačno na granici shota — shot otpada ceo, ništa se ne krati', () => {
  const plan = planCuts(storyboardOf([5, 5, 5]), { outroStart: 10 });
  assert.deepEqual(plan.trimmed, []);
  assert.deepEqual(plan.dropped.map((d) => d.shot_id), ['03']);
  assert.equal(plan.coverage, 15);
});

test('planCuts: outro_start iza kraja poslednjeg shota ne seče ništa', () => {
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: 99 });
  assert.deepEqual(plan.dropped, []);
  assert.deepEqual(plan.trimmed, []);
  assert.equal(plan.cut, 10);
  assert.equal(plan.duration, 11.5);
});

test('planCuts: rez kraći od jednog frejma izbacuje shot umesto da napravi prazan segment', () => {
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: 5 + 1 / (FPS * 4) });
  assert.deepEqual(plan.dropped.map((d) => d.shot_id), ['02']);
  assert.deepEqual(plan.trimmed, []);
});

test('planCuts: bez end card slike nema ni repa', () => {
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: null, endcard: null });
  assert.equal(plan.segments.length, 2);
  assert.ok(plan.segments.every((s) => s.kind === 'shot'));
  assert.equal(plan.tail, 0);
  assert.equal(plan.duration, 10);
  assert.equal(plan.coverage, 10);
});

test('planCuts: trajanje je zbir frejmova, ne zbir sekundi', () => {
  const plan = planCuts(storyboardOf([8.875, 9, 8.875]), { outroStart: null });
  const sum = plan.segments.reduce((a, s) => a + s.frames, 0);
  assert.equal(plan.totalFrames, sum);
  assert.equal(plan.duration, Math.round((sum / FPS) * 1000) / 1000);
  assert.ok(plan.segments.every((s) => Number.isInteger(s.frames)));
});

// Ostali testovi rade sa dužinama koje su tačan broj frejmova, pa se `Math.round` i `Math.floor`
// tu ponašaju isto — a razlika je stvarna čim `use_len` nije frejm-poravnat (invarijantu 10 niko
// ne garantuje kad se lint preskoči). Frejm se bira po najbližem, isto kao `q()` u contract.mjs.
test('planCuts: broj frejmova se zaokružuje na najbliži, ne skraćuje', () => {
  const plan = planCuts(storyboardOf([5.03]), { outroStart: null, endcard: null });
  assert.equal(plan.segments[0].frames, 121); // 5.03 * 24 = 120.72
});

test('planCuts: use_in se prenosi u segment (rez ne počinje uvek od nule)', () => {
  const sb = storyboardOf([5, 5]);
  sb.beats[0].shots[1].use_in = 0.5;
  sb.beats[0].shots[1].use_out = 5.5;
  const plan = planCuts(sb, { outroStart: null });
  assert.equal(plan.segments[1].use_in, 0.5);
});

// ---------------------------------------------------------------- ffmpeg argumenti

const segOf = (sb, i = 0, opts = {}) => planCuts(sb, { outroStart: null, ...opts }).segments[i];

test('shotArgs: -ss ide POSLE -i (tačno sečenje, odluka iz plana)', () => {
  const args = shotArgs(segOf(storyboardOf([5])), { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'o.mp4' });
  assert.ok(idx(args, '-i') < idx(args, '-ss'), `-ss je pre -i: ${args.join(' ')}`);
});

test('shotArgs: -an je prisutan (Veo audio ne sme da uđe u montažu)', () => {
  const args = shotArgs(segOf(storyboardOf([5])), { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'o.mp4' });
  assert.ok(args.includes('-an'));
});

test('shotArgs: broj frejmova je zakucan, prozor čitanja je duži', () => {
  const args = shotArgs(segOf(storyboardOf([5])), { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'o.mp4' });
  assert.equal(args[idx(args, '-frames:v') + 1], String(5 * FPS));
  assert.ok(Number(args[idx(args, '-t') + 1]) > 5, 'prozor -t mora da bude duži od traženog reza');
});

test('shotArgs: izlazni profil je h264 / yuv420p / CRF 18', () => {
  const args = shotArgs(segOf(storyboardOf([5])), { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'o.mp4' });
  assert.equal(args[idx(args, '-c:v') + 1], 'libx264');
  assert.equal(args[idx(args, '-crf') + 1], String(ENCODE.crf));
  assert.equal(args[idx(args, '-pix_fmt') + 1], ENCODE.pix);
  assert.equal(args.at(-1), 'o.mp4');
});

test('shotArgs: putanja izvora je iz polja, ne iz konvencije', () => {
  const sb = storyboardOf([5]);
  sb.beats[0].shots[0].source_file = 'part1.mp4'; // legacy raspored (Marathon)
  const args = shotArgs(segOf(sb), { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'o.mp4' });
  assert.equal(args[idx(args, '-i') + 1], path.join('ep', 'part1.mp4'));
});

test('endcardArgs: still slika se drži -loop 1 pre -i, sa istim brojem frejmova', () => {
  const seg = planCuts(storyboardOf([5]), { outroStart: null }).segments.at(-1);
  const args = endcardArgs(seg, { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'e.mp4' });
  assert.ok(idx(args, '-loop') < idx(args, '-i'), '-loop mora da bude ulazna opcija');
  assert.equal(args[idx(args, '-frames:v') + 1], String(TAIL * FPS));
  assert.ok(args.includes('-an'));
});

test('videoFilter: fps pre skaliranja, lanczos, bez razvlačenja slike', () => {
  const f = videoFilter(1920, 1080, 24);
  assert.ok(f.startsWith('fps=24,'), f);
  assert.match(f, /flags=lanczos/);
  assert.match(f, /force_original_aspect_ratio=decrease/);
  assert.match(f, /pad=1920:1080/);
  assert.match(f, /setsar=1$/);
});

test('nigde -copyts (ista nula na oba kraja lanca, schemas.md §5.4)', () => {
  const sb = storyboardOf([5]);
  const plan = planCuts(sb, { outroStart: null });
  const all = [
    shotArgs(plan.segments[0], { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'o.mp4' }),
    endcardArgs(plan.segments[1], { dir: 'ep', width: 1920, height: 1080, fps: FPS, out: 'e.mp4' }),
    concatArgs('l.txt', 'v.mp4'),
    muxArgs('v.mp4', 'n.mp3', 'f.mp4'),
  ];
  for (const args of all) {
    assert.ok(!args.includes('-copyts'), args.join(' '));
    assert.ok(!args.includes('-itsoffset'), args.join(' '));
  }
});

test('concatText: jedan red po segmentu, apostrof u imenu ne razbija navode', () => {
  assert.equal(concatText(['seg/01.mp4', 'seg/02.mp4']), "file 'seg/01.mp4'\nfile 'seg/02.mp4'\n");
  assert.equal(concatText(["seg/o'brien.mp4"]), "file 'seg/o'\\''brien.mp4'\n");
});

test('concatArgs: concat demuxer bez re-enkodiranja', () => {
  const args = concatArgs('list.txt', 'video.mp4');
  assert.equal(args[idx(args, '-f') + 1], 'concat');
  assert.equal(args[idx(args, '-safe') + 1], '0');
  assert.equal(args[idx(args, '-c') + 1], 'copy');
  assert.equal(args.at(-1), 'video.mp4');
});

test('muxArgs: narracija je jedini audio, video se ne dira, nema -shortest', () => {
  const args = muxArgs('video.mp4', 'narration.mp3', 'final.mp4');
  assert.deepEqual(args.filter((a, i) => args[i - 1] === '-map'), ['0:v:0', '1:a:0']);
  assert.equal(args[idx(args, '-c:v') + 1], 'copy');
  assert.equal(args[idx(args, '-c:a') + 1], 'aac');
  // -shortest bi odsekao rep end carda, koji je duži od narracije
  assert.ok(!args.includes('-shortest'));
});

// ---------------------------------------------------------------- mediaNames / readOutroStart

// Oba imena su namerno različita od konvencije: manifest sa `narration.mp3` ne bi razlikovao
// „pročitano iz episode.json" od „pala je konvencija", pa bi test prolazio i kad alat manifest
// uopšte ne otvara. Marathon i jeste razlog zašto ovo mora da radi — end card mu je `endKartica.jpeg`.
test('mediaNames: imena dolaze iz episode.json, ne iz konvencije', () => {
  const dir = tmpEpisode({
    'episode.json': JSON.stringify({ narration_file: 'voice-take3.mp3', endcard_file: 'endKartica.jpeg' }),
  });
  assert.deepEqual(mediaNames(dir),
    { narration: 'voice-take3.mp3', endcard: 'endKartica.jpeg', source: 'episode.json' });
  rm(dir);
});

test('mediaNames: prazno ime u manifestu pada na konvenciju', () => {
  const dir = tmpEpisode({ 'episode.json': JSON.stringify({ narration_file: '  ' }) });
  assert.equal(mediaNames(dir).narration, 'narration.mp3');
  rm(dir);
});

test('mediaNames: endcard_file null znači da epizoda nema end card', () => {
  const dir = tmpEpisode({ 'episode.json': JSON.stringify({ endcard_file: null }) });
  assert.equal(mediaNames(dir).endcard, null);
  rm(dir);
});

test('mediaNames: bez manifesta važi konvencija iz plana', () => {
  const dir = tmpEpisode({});
  assert.deepEqual(mediaNames(dir), { narration: 'narration.mp3', endcard: 'endcard.jpeg', source: 'konvencija' });
  rm(dir);
});

test('mediaNames: pokvaren manifest pada, ne ćuti', () => {
  const dir = tmpEpisode({ 'episode.json': '{ ne-JSON' });
  assert.throws(() => mediaNames(dir), /nije ispravan JSON/);
  rm(dir);
});

test('readOutroStart: timing.json je kanonski izvor', () => {
  const dir = tmpEpisode({ 'timing.json': JSON.stringify({ outro_start: 205.4 }) });
  assert.deepEqual(readOutroStart(dir, storyboardOf([5])), { value: 205.4, source: 'timing.json' });
  rm(dir);
});

test('readOutroStart: timing.json sa null-om je odgovor, ne rupa', () => {
  const dir = tmpEpisode({ 'timing.json': JSON.stringify({ outro_start: null }) });
  const sb = storyboardOf([5], { outro_start: 3 });
  assert.deepEqual(readOutroStart(dir, sb), { value: null, source: 'timing.json' });
  rm(dir);
});

test('readOutroStart: legacy epizoda ga nosi u storyboard.json-u', () => {
  const dir = tmpEpisode({});
  assert.deepEqual(readOutroStart(dir, storyboardOf([5], { outro_start: 288 })),
    { value: 288, source: 'storyboard.json' });
  rm(dir);
});

test('readOutroStart: --outro-start nadjačava oba izvora', () => {
  const dir = tmpEpisode({ 'timing.json': JSON.stringify({ outro_start: 205.4 }) });
  assert.deepEqual(readOutroStart(dir, storyboardOf([5], { outro_start: 288 }), 10),
    { value: 10, source: '--outro-start' });
  rm(dir);
});

test('readOutroStart: kad ga nigde nema, vrednost je null', () => {
  const dir = tmpEpisode({});
  assert.equal(readOutroStart(dir, storyboardOf([5])).value, null);
  rm(dir);
});

// ---------------------------------------------------------------- validate

const okProbe = async () => ({ duration: 10.01, start: 0, width: 1280, height: 720, fps: 24, hasAudio: true, hasVideo: true });

test('validate: sve na mestu -> nema problema', async () => {
  const dir = tmpEpisode({
    'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x', 'shots/part02.mp4': 'x',
  });
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: null });
  assert.deepEqual(await validate(plan, dir, { narration: 'narration.mp3', endcard: 'endcard.jpeg' },
    { probe: okProbe }), []);
  rm(dir);
});

test('validate: prijavljuje SVE nedostatke odjednom, ne prvi', async () => {
  const dir = tmpEpisode({ 'shots/part01.mp4': 'x' });
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: null });
  const found = await validate(plan, dir, { narration: 'narration.mp3', endcard: 'endcard.jpeg' },
    { probe: okProbe });
  assert.equal(found.length, 3);
  assert.ok(found.some((p) => /nema narracije/.test(p)));
  assert.ok(found.some((p) => /shot 02: nema klipa/.test(p)));
  assert.ok(found.some((p) => /nema end card slike/.test(p)));
  rm(dir);
});

test('validate: izvor kraći od potrebnog je nalaz', async () => {
  const dir = tmpEpisode({ 'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x' });
  const plan = planCuts(storyboardOf([9]), { outroStart: null });
  const short = async () => ({ duration: 6, start: 0 });
  const found = await validate(plan, dir, { narration: 'narration.mp3', endcard: 'endcard.jpeg' },
    { probe: short });
  assert.equal(found.length, 1);
  assert.match(found[0], /traje 6s, a treba do 9s/);
  rm(dir);
});

test('validate: meri na osi prvog sempla (duration - start), kao F1 i C05', async () => {
  const dir = tmpEpisode({ 'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x' });
  const plan = planCuts(storyboardOf([5]), { outroStart: null });
  const offset = async () => ({ duration: 5.2, start: 0.5 }); // dostupno 4.7s, ne 5.2
  const found = await validate(plan, dir, { narration: 'narration.mp3', endcard: 'endcard.jpeg' },
    { probe: offset });
  assert.equal(found.length, 1);
  assert.match(found[0], /traje 4.7s/);
  rm(dir);
});

test('validate: skraćeni shot traži manje materijala nego pun', async () => {
  const dir = tmpEpisode({ 'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x' });
  const short = async () => ({ duration: 4, start: 0 });
  const full = planCuts(storyboardOf([9]), { outroStart: null });
  const cut = planCuts(storyboardOf([9]), { outroStart: 3 });
  const media = { narration: 'narration.mp3', endcard: 'endcard.jpeg' };
  assert.equal((await validate(full, dir, media, { probe: short })).length, 1);
  assert.deepEqual(await validate(cut, dir, media, { probe: short }), []);
  rm(dir);
});

test('validate: end card se ne probe-uje (still slika nema trajanje)', async () => {
  const dir = tmpEpisode({ 'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x' });
  const plan = planCuts(storyboardOf([5]), { outroStart: null });
  let calls = 0;
  const counting = async (f) => { calls += 1; return okProbe(f); };
  await validate(plan, dir, { narration: 'narration.mp3', endcard: 'endcard.jpeg' }, { probe: counting });
  assert.equal(calls, 1, 'probe je pozvan i nad end card slikom');
  rm(dir);
});

test('validate: probe koji pukne je nalaz, ne pad alata', async () => {
  const dir = tmpEpisode({ 'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x' });
  const plan = planCuts(storyboardOf([5]), { outroStart: null });
  const boom = async () => { throw new Error('nije video fajl\ndruga linija'); };
  const found = await validate(plan, dir, { narration: 'narration.mp3', endcard: 'endcard.jpeg' },
    { probe: boom });
  assert.equal(found.length, 1);
  assert.match(found[0], /ne može da pročita|se ne može pročitati/);
  assert.ok(!found[0].includes('druga linija'), 'u nalaz ide samo prva linija greške');
  rm(dir);
});

// ---------------------------------------------------------------- canWrite

test('canWrite: izlaz koji ne postoji sme da se piše', () => {
  const dir = tmpEpisode({});
  assert.deepEqual(canWrite(dir, 'final.mp4'), { ok: true });
  rm(dir);
});

test('canWrite: tuđi final.mp4 se ne prepisuje bez --force', () => {
  const dir = tmpEpisode({ 'final.mp4': 'ručna montaža' });
  const res = canWrite(dir, 'final.mp4');
  assert.equal(res.ok, false);
  assert.match(res.reason, /ovaj alat ga nije napravio/);
  assert.deepEqual(canWrite(dir, 'final.mp4', { force: true }), { ok: true });
  rm(dir);
});

test('canWrite: sopstveni izlaz se prepisuje bez pitanja (idempotentnost)', async () => {
  const dir = tmpEpisode({ 'narration.mp3': 'x', 'endcard.jpeg': 'x', 'shots/part01.mp4': 'x' });
  const plan = planCuts(storyboardOf([5]), { outroStart: null });
  await build(plan, dir, { width: 1920, height: 1080, fps: FPS, narration: 'narration.mp3',
    out: 'final.mp4', run: fakeRun([]) });
  // build ne piše pečat sam — pečat piše CLI posle uspešnog prolaza; simuliramo isto.
  const st = fs.statSync(path.join(dir, 'final.mp4'));
  fs.writeFileSync(path.join(dir, '.cache', 'assemble.json'),
    JSON.stringify({ out: 'final.mp4', size: st.size, mtimeMs: Math.round(st.mtimeMs) }));
  assert.deepEqual(canWrite(dir, 'final.mp4'), { ok: true });

  fs.writeFileSync(path.join(dir, 'final.mp4'), 'ručna izmena posle montaže');
  const res = canWrite(dir, 'final.mp4');
  assert.equal(res.ok, false);
  assert.match(res.reason, /izmenjen je posle poslednje montaže/);
  rm(dir);
});

// ---------------------------------------------------------------- build i keš

const buildOpts = (extra) => ({
  width: 1920, height: 1080, fps: FPS, narration: 'narration.mp3', out: 'final.mp4', ...extra,
});

function episodeWithClips(n) {
  const files = { 'narration.mp3': 'x', 'endcard.jpeg': 'x' };
  for (let i = 1; i <= n; i += 1) files[`shots/part${String(i).padStart(2, '0')}.mp4`] = `clip ${i}`;
  return tmpEpisode(files);
}

test('build: jedan poziv po segmentu, plus concat i mux', async () => {
  const dir = episodeWithClips(2);
  const calls = [];
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: null });
  const report = await build(plan, dir, buildOpts({ run: fakeRun(calls) }));

  assert.equal(report.built, 3);       // 2 shota + end card
  assert.equal(report.cached, 0);
  assert.equal(calls.length, 5);       // + concat + mux
  assert.ok(fs.existsSync(path.join(dir, 'final.mp4')));
  assert.equal(calls.at(-1)[idx(calls.at(-1), '-c:a') + 1], 'aac');
  rm(dir);
});

test('build: drugo pokretanje ne renderuje ništa (keš)', async () => {
  const dir = episodeWithClips(2);
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: null });
  await build(plan, dir, buildOpts({ run: fakeRun([]) }));

  const calls = [];
  const again = await build(plan, dir, buildOpts({ run: fakeRun(calls) }));
  assert.equal(again.built, 0);
  assert.equal(again.cached, 3);
  assert.equal(calls.length, 2, 'ostaju samo concat i mux');
  rm(dir);
});

test('build: zamenjen partNN.mp4 regeneriše tačno taj segment (zahtev iz plana)', async () => {
  const dir = episodeWithClips(3);
  const plan = planCuts(storyboardOf([5, 5, 5]), { outroStart: null });
  await build(plan, dir, buildOpts({ run: fakeRun([]) }));

  const clip = path.join(dir, 'shots', 'part02.mp4');
  fs.writeFileSync(clip, 'novi klip iz Flow-a, druge veličine');
  const later = new Date(Date.now() + 10_000);
  fs.utimesSync(clip, later, later);

  const calls = [];
  const report = await build(plan, dir, buildOpts({ run: fakeRun(calls) }));
  assert.equal(report.built, 1);
  assert.equal(report.cached, 3);
  const rendered = calls.filter((a) => a.includes('-frames:v'));
  assert.equal(rendered.length, 1);
  assert.match(rendered[0][idx(rendered[0], '-i') + 1], /part02\.mp4$/);
  rm(dir);
});

test('build: promenjena rezolucija ruši ceo keš', async () => {
  const dir = episodeWithClips(2);
  const plan = planCuts(storyboardOf([5, 5]), { outroStart: null });
  await build(plan, dir, buildOpts({ run: fakeRun([]) }));

  const report = await build(plan, dir, buildOpts({ ...RES['720p'] && {}, width: 1280, height: 720, run: fakeRun([]) }));
  assert.equal(report.built, 3);
  assert.equal(report.cached, 0);
  rm(dir);
});

test('build: promenjen use_in regeneriše samo taj segment', async () => {
  const dir = episodeWithClips(2);
  const sb = storyboardOf([5, 5]);
  await build(planCuts(sb, { outroStart: null }), dir, buildOpts({ run: fakeRun([]) }));

  sb.beats[0].shots[1].use_in = 0.5;
  sb.beats[0].shots[1].use_out = 5.5;
  const report = await build(planCuts(sb, { outroStart: null }), dir, buildOpts({ run: fakeRun([]) }));
  assert.equal(report.built, 1);
  assert.equal(report.cached, 2);
  rm(dir);
});

test('build: lista za concat prati redosled tajmlajna i završava end card-om', async () => {
  const dir = episodeWithClips(3);
  const plan = planCuts(storyboardOf([5, 5, 5]), { outroStart: null });
  await build(plan, dir, buildOpts({ run: fakeRun([]) }));
  const list = fs.readFileSync(path.join(dir, '.cache', 'concat.txt'), 'utf8');
  assert.equal(list, "file 'seg/01.mp4'\nfile 'seg/02.mp4'\nfile 'seg/03.mp4'\nfile 'seg/endcard.mp4'\n");
  rm(dir);
});

test('recipe: isti ulaz daje isti recept, drugi frejmovi drugi', () => {
  const dir = episodeWithClips(1);
  const plan = planCuts(storyboardOf([5]), { outroStart: null });
  const opts = { dir, width: 1920, height: 1080, fps: FPS };
  assert.deepEqual(recipe(plan.segments[0], opts), recipe(plan.segments[0], opts));
  const other = planCuts(storyboardOf([6]), { outroStart: null }).segments[0];
  assert.notDeepEqual(recipe(plan.segments[0], opts), recipe(other, opts));
  rm(dir);
});

// ---------------------------------------------------------------- parseArgs

test('parseArgs: podrazumevane vrednosti', () => {
  assert.deepEqual(parseArgs(['episodes/marathon']), {
    dir: 'episodes/marathon', res: '1080p', out: 'final.mp4', outroStart: null,
    force: false, dissolve: 0, dryRun: false, help: false,
  });
});

test('parseArgs: oba oblika opcije sa vrednošću', () => {
  assert.equal(parseArgs(['ep', '--res', '720p']).res, '720p');
  assert.equal(parseArgs(['ep', '--res=1440p']).res, '1440p');
  assert.equal(parseArgs(['ep', '--out', 'final-new.mp4']).out, 'final-new.mp4');
  assert.equal(parseArgs(['ep', '--out=final-new.mp4']).out, 'final-new.mp4');
  assert.equal(parseArgs(['ep', '--outro-start', '288']).outroStart, 288);
  assert.equal(parseArgs(['ep', '--outro-start=288.5']).outroStart, 288.5);
});

test('parseArgs: sve rezolucije iz RES prolaze', () => {
  for (const r of Object.keys(RES)) assert.equal(parseArgs(['ep', '--res', r]).res, r);
});

test('parseArgs: odbija nepoznatu rezoluciju i izlistava postojeće', () => {
  assert.throws(() => parseArgs(['ep', '--res', '4k']), /nepoznata rezolucija 4k/);
});

test('parseArgs: odbija nepoznatu opciju, višak argumenta i prazan poziv', () => {
  // `--dissolve` je od C10 poznata opcija; testovi za nju su u assemble-dissolve.test.mjs.
  assert.throws(() => parseArgs(['ep', '--xfade', '8']), /nepoznata opcija --xfade/);
  assert.throws(() => parseArgs(['ep', 'ep2']), /višak argumenta/);
  assert.throws(() => parseArgs([]), /nedostaje folder epizode/);
});

test('parseArgs: opcija bez vrednosti pada', () => {
  assert.throws(() => parseArgs(['ep', '--out']), /--out traži vrednost/);
  assert.throws(() => parseArgs(['ep', '--outro-start', 'juče']), /traži broj sekundi/);
});

test('parseArgs: --help ne traži folder', () => {
  assert.equal(parseArgs(['--help']).help, true);
});
