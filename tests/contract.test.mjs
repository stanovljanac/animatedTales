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
  LIMITS, RENDER_MODES, STILL_MOTIONS, STILL_MOTION_CAMERA,
  assertDisplayable, isStill, renderMode,
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
  assert.deepEqual(LIMITS.useLen, { min: 3.0, max: 10.0 });
  assert.deepEqual(LIMITS.stillUseLen, { min: 2.5, max: 9.0 });
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
