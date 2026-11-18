// tests/flow-risk.test.mjs
//
//   node --test tests/
//
// tools/flow-risk.mjs: signali za Flow filter i za početni frejm image prompta. Alat ne daje
// presudu nego signal, pa testovi proveravaju da reč koja je u praksi pala (hero-twins, nov 2026)
// jeste uhvaćena, a da reč koja je prošla ili je bezopasna (NOT IN FRAME „blood", „kicking up dust")
// nije.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { blocks, main, parseArgs, renderReport, scanShot, scanStoryboard } from '../tools/flow-risk.mjs';

const prompt = (o) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join('\n');
const shot = (id, image, animation = null, extra = {}) => ({
  shot_id: id, image_prompt: image, animation_prompt: animation, render_mode: 'clip', ...extra,
});
const codes = (r) => r.risk.map((k) => k.code);

test('blocks: čita blokove po nazivu, jedan red po bloku', () => {
  const b = blocks(prompt({ 'SUBJECT 2': 'a', 'FRAME LAYOUT': 'b', ACTION: 'c' }));
  assert.deepEqual(b, { 'SUBJECT 2': 'a', 'FRAME LAYOUT': 'b', ACTION: 'c' });
});

test('samopovređivanje: skok u vatru je uhvaćen, hranjenje vatre nije', () => {
  const bad = scanShot(shot('26', prompt({ ACTION: 'the twins embrace and leap into the flames' })));
  assert.ok(codes(bad).includes('selfharm'));
  const ok = scanShot(shot('26', prompt({ SUBJECT: 'lords feeding great logs into the fire', ACTION: 'the lords stoke an oven' })));
  assert.ok(!codes(ok).includes('selfharm'));
});

test('predmet koji liči na glavu je uhvaćen u slici i u animaciji', () => {
  const r = scanShot(shot('23', prompt({ ACTION: 'the lords knock the real pale head around the court' }),
    '0–1s: a lord strikes the pale round head with his hip'));
  assert.ok(codes(r).includes('head-object'));
  assert.ok(codes(r).includes('violence'));
  assert.ok(r.risk.some((k) => k.where === 'animation'));
});

test('golotinja: „cropped at the thigh" i „embrace" su signal', () => {
  const r = scanShot(shot('18', prompt({ 'FRAME LAYOUT': 'the twins large, cropped at the thigh', ACTION: 'they embrace' })));
  assert.ok(codes(r).includes('sexual'));
});

test('maloletnici: i NOT IN FRAME se meri, za ostale kategorije ne', () => {
  const kid = scanShot(shot('14', prompt({ 'NOT IN FRAME': 'children, any text' })));
  assert.deepEqual(codes(kid), ['minors']);
  const gore = scanShot(shot('21', prompt({ 'NOT IN FRAME': 'blood, a severed head, gore' })));
  assert.deepEqual(codes(gore), [], 'shotovi 10 i 21 su prošli Flow sa tim rečima u NOT IN FRAME');
});

test('„kicking up dust" nije nasilje, „kicks the ball" jeste', () => {
  assert.deepEqual(codes(scanShot(shot('1', '', '0–1s: the rabbit bolts, kicking up dust'))), []);
  assert.ok(codes(scanShot(shot('1', '', '0–1s: a lord kicks the ball'))).includes('violence'));
});

test('prvi frejm: sredina scene u ACTION i FRAME LAYOUT je uhvaćena, poza spremnosti nije', () => {
  const mid = scanShot(shot('23', prompt({ ACTION: 'the pale ball sails across the court', 'FRAME LAYOUT': 'the ball in the air at center' })));
  assert.equal(mid.mid.length, 2);
  const ready = scanShot(shot('23', prompt({
    ACTION: 'the lead lord stands braced with the pale ball drawn back at his hip, ready to send it across the court',
    'FRAME LAYOUT': 'right half — the lords crowding behind him',
  })));
  assert.deepEqual(ready.mid, []);
});

test('SCREEN DIRECTION se ne meri kao sredina scene (on je po definiciji kretanje)', () => {
  const r = scanShot(shot('5', prompt({ ACTION: 'the lord holds the ball', 'SCREEN DIRECTION': 'the ball flies from the right toward the left' })));
  assert.deepEqual(r.mid, []);
});

test('scanStoryboard: izdvaja samo shotove sa signalom i poštuje --only', () => {
  const sb = { episode: 'x', beats: [{ shots: [
    shot('01', prompt({ ACTION: 'a man stands at a table' })),
    shot('02', prompt({ ACTION: 'the twins leap into the flames' })),
    shot('03', prompt({ ACTION: 'a lord strikes a gong' })),
  ] }] };
  assert.deepEqual(scanStoryboard(sb).map((r) => r.shot_id), ['02', '03']);
  assert.deepEqual(scanStoryboard(sb, { only: new Set(['3']) }).map((r) => r.shot_id), ['03']);
});

test('renderReport: izveštaj nosi zamenu i putanju do dokumenta', () => {
  const sb = { episode: 'x', beats: [{ shots: [shot('02', prompt({ ACTION: 'the twins leap into the flames' }))] }] };
  const out = renderReport(scanStoryboard(sb), { slug: 'x' });
  assert.match(out, /shot 02/);
  assert.match(out, /zamena:/);
  assert.match(out, /flow-filter\.md/);
  assert.match(renderReport([]), /Nema signala/);
});

test('parseArgs i main: --only normalizuje nule, exit code je uvek 0', () => {
  assert.deepEqual([...parseArgs(['ep', '--only', '07,12']).only], ['7', '12']);
  assert.throws(() => parseArgs([]), /nedostaje folder/);
  assert.throws(() => parseArgs(['ep', '--nepoznato']), /nepoznata opcija/);
  assert.equal(main(['--help']), 0);
});
