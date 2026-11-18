// tests/audio-tags.test.mjs
//
//   node --test tests/
//
// ElevenLabs audio tagovi u script.md: šta je tag, kako se skida, koji su zabranjeni.
// Poslednji test je čuvar nad stvarnim skriptama — nijedna ne sme da sadrži sigh tag.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripAudioTags, listAudioTags, findBannedAudioTags } from '../tools/audio-tags.mjs';
import { parseScript } from '../tools/align.mjs';

// ---------------------------------------------------------------- stripAudioTags

test('stripAudioTags: tag na početku rečenice nestaje zajedno sa razmakom', () => {
  assert.equal(stripAudioTags('[chuckles] The birds won.'), 'The birds won.');
});

test('stripAudioTags: tag usred reda ostavlja tačno jedan razmak', () => {
  assert.equal(
    stripAudioTags('The birds won. [short pause] In 1932, farmers were in trouble.'),
    'The birds won. In 1932, farmers were in trouble.',
  );
  assert.equal(stripAudioTags('He agreed, [short pause] on conditions.'), 'He agreed, on conditions.');
});

test('stripAudioTags: razmak ispred interpunkcije posle taga otpada', () => {
  assert.equal(stripAudioTags('So who won [thoughtful]?'), 'So who won?');
  assert.equal(stripAudioTags('Until next time [short pause].'), 'Until next time.');
});

test('stripAudioTags: više tagova za redom, i višeredni tekst', () => {
  assert.equal(stripAudioTags('[short pause] [thoughtful] So who won?'), 'So who won?');
  assert.equal(stripAudioTags('[happy] One.\n[annoyed] Two.'), 'One.\nTwo.');
});

test('stripAudioTags: tekst bez tagova ostaje bajt-u-bajt isti', () => {
  const s = '  Indented  line with   odd spacing .\n\n- list';
  assert.equal(stripAudioTags(s), s);
});

test('stripAudioTags: Markdown link, [1] i [...] nisu tagovi', () => {
  assert.equal(stripAudioTags('See [the map](http://x.y) now.'), 'See [the map](http://x.y) now.');
  assert.equal(stripAudioTags('Note [1] and [...] stay.'), 'Note [1] and [...] stay.');
});

test('stripAudioTags: tag sa više reči, velika slova i crtica', () => {
  assert.equal(stripAudioTags('[Long Pause] Silence.'), 'Silence.');
  assert.equal(stripAudioTags('[low-voiced] Quiet now.'), 'Quiet now.');
  assert.equal(stripAudioTags("[strong French accent] Bonjour."), 'Bonjour.');
});

// ---------------------------------------------------------------- listAudioTags

test('listAudioTags: redom, bez zagrada, malim slovima', () => {
  assert.deepEqual(
    listAudioTags('[Thoughtful] One. [short pause] Two. [chuckles] Three.'),
    ['thoughtful', 'short pause', 'chuckles'],
  );
  assert.deepEqual(listAudioTags('No tags here.'), []);
});

// ---------------------------------------------------------------- findBannedAudioTags

test('findBannedAudioTags: [sighs] i bliski oblici su zabranjeni', () => {
  assert.deepEqual(findBannedAudioTags('[sighs] After the war.'), ['[sighs]']);
  assert.deepEqual(findBannedAudioTags('[Sigh] [sighing] [sighs heavily] Ok.'),
    ['[Sigh]', '[sighing]', '[sighs heavily]']);
});

test('findBannedAudioTags: ostali tagovi prolaze, uključujući „exhales" i reč sigh u tekstu', () => {
  assert.deepEqual(findBannedAudioTags('[thoughtful] [chuckles] [short pause] [exhales] [annoyed]'), []);
  assert.deepEqual(findBannedAudioTags('He let out a sigh of relief.'), []);
});

// ---------------------------------------------------------------- parseScript + tagovi

const texts = (md) => parseScript(md).sentences.map((s) => s.text);

test('parseScript: tag posle tačke ne lepi rečenice i ne ulazi u tekst', () => {
  assert.deepEqual(
    texts('Australia sent soldiers. [chuckles] The birds won. [short pause] In 1932, farmers were in trouble.'),
    ['Australia sent soldiers.', 'The birds won.', 'In 1932, farmers were in trouble.'],
  );
});

test('parseScript: tag usred rečenice ne deli rečenicu', () => {
  assert.deepEqual(texts('He agreed, [short pause] on conditions. Then he left.'),
    ['He agreed, on conditions.', 'Then he left.']);
});

test('parseScript: tag na početku pasusa i pred ## OUTRO', () => {
  const md = '[thoughtful] One.\n\n[short pause] Two.\n\n## OUTRO\n\n[happy] If you like it, subscribe.';
  const p = parseScript(md);
  assert.deepEqual(p.sentences.map((s) => s.text), ['One.', 'Two.', 'If you like it, subscribe.']);
  assert.equal(p.outroIndex, 2);
});

test('parseScript: red samo sa tagom ne prekida pasus', () => {
  assert.deepEqual(texts('He walked\n[short pause]\nhome slowly.'), ['He walked home slowly.']);
});

test('parseScript: segment koji je samo tag nije rečenica', () => {
  assert.deepEqual(texts('One.\n\n[short pause]\n\nTwo.'), ['One.', 'Two.']);
});

test('parseScript: tagovani i netagovani tekst daju iste rečenice', () => {
  const plain = 'Australia sent soldiers. The birds won.\n\nIn 1932, farmers were in trouble. So who won?';
  const tagged = '[thoughtful] Australia sent soldiers. [chuckles] The birds won.\n\n' +
    '[short pause] In 1932, farmers were in trouble. [thoughtful] So who won?';
  assert.deepEqual(parseScript(tagged).sentences, parseScript(plain).sentences);
});

// ---------------------------------------------------------------- čuvar nad stvarnim skriptama

test('sve skripte u episodes/: nijedan zabranjen tag, nijedna rečenica sa zagradom', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'episodes');
  const scripts = fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(root, d.name, 'script.md'))
    .filter((f) => fs.existsSync(f));
  assert.ok(scripts.length > 0, 'nema nijedne skripte — putanja u testu je pogrešna');
  for (const file of scripts) {
    const md = fs.readFileSync(file, 'utf8');
    const name = path.basename(path.dirname(file));
    assert.deepEqual(findBannedAudioTags(md), [], `${name}/script.md sadrži zabranjen audio tag`);
    for (const s of parseScript(md).sentences) {
      assert.ok(!/[[\]]/.test(s.text), `${name}/script.md ${s.id}: zagrada je ostala u rečenici: ${s.text}`);
    }
  }
});
