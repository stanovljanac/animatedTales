// tests/contract.test.mjs
//
//   node --test tests/
//
// `tools/contract.mjs` je izvršni oblik ugovora, pa mu većinu pokrivenosti daju testovi
// potrošača (lint, render, shotlist, beatplan). Ovde stoji ono što nema svog potrošača:
// režim rendera (`render_mode` / `still_motion`, schemas.md §3.3.2) i granica prikaza koju
// still kadar pomera.
//
// Jedna odluka koju ovi testovi čuvaju: **odsutno `render_mode` znači `clip`**. Da je
// obrnuto — ili da je polje obavezno — svaki zatečeni `storyboard.json` bi u trenutku
// uvođenja polja postao nevažeći, a `schema_version` bi morao na 3.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GEN_COST, GEN_TIERS, LIMITS, RENDER_MODES, STILL_MOTIONS, STILL_MOTION_CAMERA,
  animLimits, assertDisplayable, genCost, genLen, isStill, renderMode,
} from '../tools/contract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOOD = path.join(HERE, 'fixtures', 'good-episode', 'storyboard.json');

const load = () => JSON.parse(fs.readFileSync(GOOD, 'utf8'));

/** Prvi shot fixture-a, prebačen u still režim. */
function stillShot(sb) {
  const s = sb.beats[0].shots[0];
  s.render_mode = 'still';
  s.still_motion = 'push';
  s.animation_prompt = null;
  s.motion_budget = null;
  s.ingredient_image = null;
  s.source_file = `shots/shot${s.shot_id}.jpeg`;
  s.use_in = 0;
  s.use_out = s.use_len;
  return s;
}

// ---------------------------------------------------------------- režim

test('renderMode: odsutno, null i "clip" su ista stvar — zatečeni storyboard ostaje validan', () => {
  assert.equal(renderMode({}), 'clip');
  assert.equal(renderMode({ render_mode: null }), 'clip');
  assert.equal(renderMode({ render_mode: 'clip' }), 'clip');
  assert.equal(isStill({}), false);
});

test('renderMode: "still" se prepoznaje', () => {
  assert.equal(renderMode({ render_mode: 'still' }), 'still');
  assert.equal(isStill({ render_mode: 'still' }), true);
});

test('rečnici: dva režima, pet pokreta, i svaki pokret ima parnjak u camera_motion', () => {
  assert.deepEqual(RENDER_MODES, ['clip', 'still']);
  assert.deepEqual(STILL_MOTIONS, ['push', 'pull', 'pan-left', 'pan-right', 'hold']);
  for (const m of STILL_MOTIONS) {
    assert.equal(typeof STILL_MOTION_CAMERA[m], 'string', `${m} nema očekivan camera_motion`);
  }
  assert.equal(Object.keys(STILL_MOTION_CAMERA).length, STILL_MOTIONS.length);
});

test('granice trajanja: still je uži raspon od klipa, sa nižim podom', () => {
  // Omni 1.2 Flash (2026-11-21): klip do 15s; 10s je granica jeftine sekunde, ne plafon.
  assert.deepEqual(LIMITS.useLen, { min: 3.0, max: 15.0 });
  assert.equal(LIMITS.longClip, 10.0);
  assert.deepEqual(LIMITS.stillUseLen, { min: 2.5, max: 9.0 });
});

// ---------------------------------------------------------------- lestvica generisanja i cena (Omni 1.2)

test('GEN_TIERS: svaka cela sekunda od 3 do 15, ukupno 13', () => {
  assert.deepEqual(GEN_TIERS, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  assert.equal(GEN_TIERS[0], LIMITS.useLen.min);
  assert.equal(GEN_TIERS.at(-1), LIMITS.useLen.max);
});

test('genLen: najmanja cela sekunda koja pokriva use_len; preko 15s nema odgovora', () => {
  assert.equal(genLen(3), 3);
  assert.equal(genLen(3.0004), 3, 'EPS: 3.0004s je i dalje 3s, ne 4s');
  assert.equal(genLen(4.084), 5, 'sa lestvicom 4/6/8/10 ovo je bilo 6s');
  assert.equal(genLen(4.62), 5);
  assert.equal(genLen(7.2), 8);
  assert.equal(genLen(10), 10);
  assert.equal(genLen(10.5), 11);
  assert.equal(genLen(15), 15);
  assert.equal(genLen(15.01), null);
});

test('genCost: 3 kr/s do 10s, 6 kr/s iznad — tabela koju je Flow objavio', () => {
  const flow = { 3: 9, 4: 12, 5: 15, 6: 18, 7: 21, 8: 24, 9: 27, 10: 30, 11: 36, 12: 42, 13: 48, 14: 54, 15: 60 };
  assert.deepEqual(GEN_COST, flow);
  for (const [s, cr] of Object.entries(flow)) assert.equal(genCost(Number(s)), cr, `${s}s`);
});

test('genCost: klip od 15s kosta koliko dva od 10s, a sekunda iznad 10s je duplo skuplja', () => {
  assert.equal(genCost(15), 2 * genCost(10));
  assert.equal(genCost(11) - genCost(10), 6);
  assert.equal(genCost(10) - genCost(9), 3);
});

test('animLimits: iznad 10s generisanja plafon P2 raste, do 10s ostaje 220', () => {
  assert.deepEqual(animLimits(10).hard, LIMITS.animWords);
  assert.deepEqual(animLimits(3).hard, { min: 60, max: 220 });
  assert.deepEqual(animLimits(11).hard, LIMITS.animWordsLong);
  assert.deepEqual(animLimits(15).soft, LIMITS.animSoftLong);
  assert.equal(animLimits(undefined).hard.max, 220, 'shot bez gen_len dobija obican plafon');
  assert.ok(LIMITS.animWordsLong.max > LIMITS.animWords.max);
});

// ---------------------------------------------------------------- prikaz

test('assertDisplayable: still shot sa animation_prompt = null je prikaziv', () => {
  const sb = load();
  stillShot(sb);
  assert.doesNotThrow(() => assertDisplayable(sb));
});

test('assertDisplayable: animation_prompt = null na CLIP shotu i dalje pada', () => {
  const sb = load();
  sb.beats[0].shots[0].animation_prompt = null;
  assert.throws(() => assertDisplayable(sb), /animation_prompt/);
});

test('assertDisplayable: nepoznat render_mode je razlog da alat stane', () => {
  const sb = load();
  sb.beats[0].shots[0].render_mode = 'kenburns';
  assert.throws(() => assertDisplayable(sb), /render_mode/);
});

test('assertDisplayable: still shot bez still_motion pada — prikaz bi ispisao undefined', () => {
  const sb = load();
  const s = stillShot(sb);
  delete s.still_motion;
  assert.throws(() => assertDisplayable(sb), /still_motion/);
});

test('assertDisplayable: still_motion van enuma pada', () => {
  const sb = load();
  stillShot(sb).still_motion = 'zoom-out';
  assert.throws(() => assertDisplayable(sb), /still_motion/);
});
