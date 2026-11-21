// tests/disk.test.mjs
//
//   node --test "tests/*.test.mjs"
//
// tools/disk.mjs: čišćenje regenerabilnog keša (.cache/video.mp4, seg/, ambient.wav) uz stroge
// zaštite. Testovi rade nad privremenim folderima, bez ffmpeg-a i mreže.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  dirSize, cacheTargets, regenProblems, newestMtimeMs, isActiveIn, isPublic, planClean, applyClean,
} from '../tools/disk.mjs';

const okProbe = async () => ({ duration: 240 });

/** Epizoda sa svim ulazima potrebnim za ponovni assemble + keš koji se sme obrisati. */
function makeEpisode({ withShots = true, withFinal = true, cache = true, manifest = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-disk-'));
  const w = (rel, content = 'x') => {
    const f = path.join(dir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, content);
    return f;
  };
  w('episode.json', JSON.stringify({ final_file: 'final.mp4', narration_file: 'narration.mp3', endcard_file: null, ...manifest }));
  w('storyboard.json', JSON.stringify({ beats: [{ shots: [{ shot_id: '01', source_file: 'shots/part01.mp4' }, { shot_id: '02', source_file: 'shots/part02.mp4' }] }] }));
  w('timing.json', '{}');
  w('narration.mp3', 'n');
  if (withShots) { w('shots/part01.mp4', 'a'); w('shots/part02.mp4', 'b'); }
  if (withFinal) w('final.mp4', Buffer.alloc(2 * 1024 * 1024, 1));
  if (cache) {
    w('.cache/video.mp4', Buffer.alloc(1000, 1));
    w('.cache/ambient.wav', Buffer.alloc(500, 1));
    w('.cache/seg/s01.mp4', Buffer.alloc(700, 1));
    w('.cache/seg/s02.mp4', Buffer.alloc(300, 1));
    w('.cache/asr-words.json', '{"keep":true}');
    w('.cache/assemble.json', '{"keep":true}');
  }
  return dir;
}
const old = (dir) => { // sve starije od sat vremena
  const t = new Date(Date.now() - 3 * 3600 * 1000);
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); fs.utimesSync(p, t, t); } };
  walk(dir);
  return dir;
};

test('dirSize sabira fajlove rekurzivno, a nepostojeće je 0', () => {
  const dir = makeEpisode();
  assert.equal(dirSize(path.join(dir, '.cache/seg')), 1000);
  assert.equal(dirSize(path.join(dir, 'nema')), 0);
});

test('cacheTargets vraća samo tri regenerabilna dela, nikad asr-words.json ni assemble.json', () => {
  const dir = makeEpisode();
  const t = cacheTargets(dir);
  assert.deepEqual(t.map((x) => path.relative(dir, x.path).replace(/\\/g, '/')).sort(), ['.cache/ambient.wav', '.cache/seg', '.cache/video.mp4']);
  assert.equal(t.reduce((n, x) => n + x.bytes, 0), 1000 + 500 + 1000);
});

test('regenProblems je prazan kad ima sve ulaze', async () => {
  assert.deepEqual(await regenProblems(makeEpisode(), { probeFn: okProbe }), []);
});

test('regenProblems javlja klip iz storyboard.json koji nedostaje u shots/', async () => {
  const p = await regenProblems(makeEpisode({ withShots: false }), { probeFn: okProbe });
  assert.ok(p.some((m) => /shots\/part01\.mp4/.test(m)), p.join('|'));
});

test('regenProblems javlja da final_file ne postoji', async () => {
  const p = await regenProblems(makeEpisode({ withFinal: false }), { probeFn: okProbe });
  assert.ok(p.some((m) => /final/.test(m)));
});

test('regenProblems javlja final koji ffprobe ne prepoznaje', async () => {
  const bad = async () => { throw new Error('ffmpeg nije prepoznao fajl'); };
  const p = await regenProblems(makeEpisode(), { probeFn: bad });
  assert.ok(p.some((m) => /final/.test(m)));
});

test('regenProblems javlja narraciju i end karticu koje fale', async () => {
  const dir = makeEpisode({ manifest: { endcard_file: 'end.jpeg' } });
  fs.rmSync(path.join(dir, 'narration.mp3'));
  const p = await regenProblems(dir, { probeFn: okProbe });
  assert.ok(p.some((m) => /narration\.mp3/.test(m)));
  assert.ok(p.some((m) => /end\.jpeg/.test(m)));
});

test('regenProblems traži i intro_file kad je naveden', async () => {
  const dir = makeEpisode({ manifest: { intro_file: 'intro.mp4' } });
  const p = await regenProblems(dir, { probeFn: okProbe });
  assert.ok(p.some((m) => /intro\.mp4/.test(m)));
});

test('newestMtimeMs vraća najnoviju izmenu u celom folderu', () => {
  const dir = old(makeEpisode());
  const t = Date.now() - 1000;
  fs.utimesSync(path.join(dir, '.cache/seg/s01.mp4'), new Date(t), new Date(t));
  assert.ok(Math.abs(newestMtimeMs(dir) - t) < 2000);
});

test('isActiveIn prepoznaje proces koji piše u folder epizode, bez obzira na kosu crtu i velika slova', () => {
  const dir = 'F:\\AI\\Animated Tales\\episodes\\hero-twins';
  assert.equal(isActiveIn(dir, ['node tools/assemble.mjs episodes/hero-twins']), true);
  assert.equal(isActiveIn(dir, ['ffmpeg -i "f:/ai/animated tales/episodes/Hero-Twins/.cache/seg/a.mp4"']), true);
  assert.equal(isActiveIn(dir, ['node tools/assemble.mjs episodes/el-dorado']), false);
  assert.equal(isActiveIn(dir, []), false);
});

test('isPublic: medium.json, spisak iz config.json ili poklapanje sa feedom; inače ne', () => {
  const none = { mediumState: null, configPublished: [], feed: [], publishText: '' };
  assert.equal(isPublic('a', { ...none, mediumState: { video_id: 'abc' } }).public, true);
  assert.equal(isPublic('a', { ...none, configPublished: ['a'] }).public, true);
  const publishText = 'TITLE OPTIONS:\n1. The Real Title — angle\n\nDESCRIPTION:\nx\n\nHASHTAGS:\n#a';
  const feed = [{ id: 'v', title: 'The Real Title', isShort: false, description: '' }];
  assert.equal(isPublic('a', { ...none, feed, publishText }).public, true);
  assert.equal(isPublic('a', none).public, false);
  assert.equal(isPublic('a', { ...none, mediumState: {} }).public, false);
});

const ready = { now: Date.now(), quietMin: 30, public: { public: true, via: 'test' }, procs: [], probeFn: okProbe };

test('planClean: epizoda koja ispunjava sve uslove je za čišćenje i ima tačne bajtove', async () => {
  const dir = old(makeEpisode());
  const plan = await planClean(dir, ready);
  assert.equal(plan.eligible, true, plan.reasons.join('|'));
  assert.equal(plan.bytes, 2500);
});

test('planClean odbija epizodu koja nije javna', async () => {
  const plan = await planClean(old(makeEpisode()), { ...ready, public: { public: false } });
  assert.equal(plan.eligible, false);
  assert.ok(plan.reasons.some((r) => /javn/.test(r)));
});

test('planClean odbija epizodu sa svežom izmenom', async () => {
  const plan = await planClean(makeEpisode(), ready); // fajlovi upravo napravljeni
  assert.equal(plan.eligible, false);
  assert.ok(plan.reasons.some((r) => /izmen/.test(r)));
});

test('planClean odbija epizodu u kojoj radi proces', async () => {
  const dir = old(makeEpisode());
  const plan = await planClean(dir, { ...ready, procs: [`node tools/assemble.mjs ${dir}`] });
  assert.equal(plan.eligible, false);
  assert.ok(plan.reasons.some((r) => /proces/.test(r)));
});

test('planClean odbija epizodu čiji se keš ne može regenerisati', async () => {
  const plan = await planClean(old(makeEpisode({ withShots: false })), ready);
  assert.equal(plan.eligible, false);
  assert.ok(plan.reasons.some((r) => /shots\/part01\.mp4/.test(r)));
});

test('planClean: epizoda bez keša nema šta da čisti', async () => {
  const plan = await planClean(old(makeEpisode({ cache: false })), ready);
  assert.equal(plan.eligible, false);
  assert.ok(plan.reasons.some((r) => /keš/.test(r)));
});

test('applyClean briše tri regenerabilna dela, a asr-words.json i assemble.json ostaju', async () => {
  const dir = old(makeEpisode());
  const freed = applyClean(await planClean(dir, ready));
  assert.equal(freed, 2500);
  assert.equal(fs.existsSync(path.join(dir, '.cache/video.mp4')), false);
  assert.equal(fs.existsSync(path.join(dir, '.cache/seg')), false);
  assert.equal(fs.existsSync(path.join(dir, '.cache/ambient.wav')), false);
  assert.equal(fs.existsSync(path.join(dir, '.cache/asr-words.json')), true);
  assert.equal(fs.existsSync(path.join(dir, '.cache/assemble.json')), true);
  assert.equal(fs.existsSync(path.join(dir, 'final.mp4')), true);
  assert.equal(fs.existsSync(path.join(dir, 'shots/part01.mp4')), true);
});

test('applyClean ne dira ništa kad plan nije eligible', async () => {
  const dir = old(makeEpisode());
  const plan = await planClean(dir, { ...ready, public: { public: false } });
  assert.equal(applyClean(plan), 0);
  assert.equal(fs.existsSync(path.join(dir, '.cache/video.mp4')), true);
});

test('applyClean odbija putanju van .cache i van dozvoljenih imena (zaštita u dubini)', async () => {
  const dir = old(makeEpisode());
  const plan = await planClean(dir, ready);
  const evil = { ...plan, targets: [{ path: path.join(dir, 'final.mp4'), bytes: 1 }] };
  assert.throws(() => applyClean(evil), /nije dozvoljen/);
  const evil2 = { ...plan, targets: [{ path: path.join(dir, '.cache', '..', 'final.mp4'), bytes: 1 }] };
  assert.throws(() => applyClean(evil2), /nije dozvoljen/);
  assert.equal(fs.existsSync(path.join(dir, 'final.mp4')), true);
});
