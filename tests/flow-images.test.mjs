// tests/flow-images.test.mjs
//
//   node --test tests/
//
// `tools/flow-images.mjs` bez pregledača: argumenti, imena, Flow-ov mrežni format, plan
// prolaza, stanje i pregled. Deo koji vozi Chrome proverava se samo na živom Flow-u — ovde se
// proverava sve što odlučuje šta će se tamo uraditi i kako će se rezultat pročitati.
//
// Odgovor na generisanje je sintetički, ali iste strukture kao snimljeni odgovor Flow-a
// (nov 2026): niz slika sa media ID-jem i promptom, pa niz naslova koji pokazuju na media ID.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  batchPayloads, deepHas, editUrl, extFor, imageBase, imageName, loadState, main, normalizeProjectUrl,
  parseArgs, parseGenerated, planShots, projectNameFor, promptHash, recordBatch, recordFailure,
  parseThumbnails, renderIndex, renderThumbIndex, requestHasPrompt, saveState, stateFile, summaryOf,
  pImageReady, sameFile, thumbItems, toYoutubeJpeg, unfinished, YT_THUMB,
} from '../tools/flow-images.mjs';
import { probe, run } from '../tools/ffmpeg.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');
const GOOD = path.join(FIX, 'good-episode');
const STILL = path.join(FIX, 'still-episode');

const load = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'));
const shotsOf = (sb) => sb.beats.flatMap((b) => b.shots);

const PROJECT = 'https://flow.google.com/project/ccdd3942-6520-4bc1-bbe6-5289e333e13d';
const ID = (n) => `0000000${n}-aaaa-4bbb-8ccc-${String(n).padStart(12, '0')}`;
const PROMPT = 'STYLE: test, 16:9.\nSUBJECT: a clerk at a desk\nACTION: he writes by candlelight';
const OTHER = 'STYLE: test, 16:9.\nSUBJECT: a raft on a lake';

/** `batchexecute` odgovor sa slikama za `prompt` — oblik snimljen sa Flow-a. */
function generateResponse(prompt, ids, titles = ids.map((_, i) => `Title ${i + 1}`)) {
  const media = ids.map((id, i) => [id, null, `wf-${i}`, null, null, null,
    [[null, 1368668727, null, null, null, null, 1, prompt, null], null, [1, 2], null, null, [3, 4]]]);
  const assets = ids.map((id, i) => [`wf-${i}`, null, null,
    [titles[i], [1, 2], null, null, id, 'BATCH-ID', [5, 6]], PROJECT.split('/').at(-1)]);
  const line = JSON.stringify([['wrb.fr', 'ogiZ0b', JSON.stringify([media, assets]), null, null, null, 'generic'],
    ['di', 21366], ['af.httprm', 21366, '5696067387208647068', 31]]);
  return `)]}'\n\n${line.length}\n${line}\n25\n[["e",4,null,null,29849]]\n`;
}

/** Telo zahteva za generisanje: `f.req` sa promptom u JSON-u upakovanom u string. */
function generateRequest(prompt) {
  const inner = JSON.stringify([null, [[null, null, null, 1368668727, 3, 'BELUGA', null,
    [null, 22, null, null, null, PROJECT.split('/').at(-1)], ['recaptcha-token'], prompt]]]);
  return `f.req=${encodeURIComponent(JSON.stringify([[['ogiZ0b', inner, null, 'generic']]]))}&at=TOKEN%3A123&`;
}

function tmpEpisode(src) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-images-'));
  fs.copyFileSync(path.join(src, 'storyboard.json'), path.join(dir, 'storyboard.json'));
  return dir;
}

// ------------------------------------------------------------------ argumenti

test('parseArgs: podrazumevano 4 slike, 16:9, 2 paralelno, ime da, skidanje slika ne', () => {
  const a = parseArgs(['episodes/el-dorado']);
  assert.equal(a.dir, 'episodes/el-dorado');
  assert.equal(a.count, 4);
  assert.equal(a.aspect, '16:9');
  assert.equal(a.parallel, 2);
  assert.equal(a.rename, true);
  assert.equal(a.download, false, 'slike se ne skidaju na računar osim na zahtev');
  assert.equal(a.model, null);
});

test('parseArgs: --download uključuje skidanje, --no-download ga i dalje isključuje', () => {
  assert.equal(parseArgs(['ep', '--download']).download, true);
  assert.equal(parseArgs(['ep', '--download', '--no-download']).download, false);
});

test('parseArgs: spiskovi shotova se skupljaju, a oblik --opcija=vrednost radi', () => {
  const a = parseArgs(['ep', '--only', '07,12', '--only=3', '--redo', '5', '--count=2', '--no-rename']);
  assert.deepEqual(a.only, ['07', '12', '3']);
  assert.deepEqual(a.redo, ['5']);
  assert.equal(a.count, 2);
  assert.equal(a.rename, false);
});

test('parseArgs: granice i loše vrednosti su greška, ne tiho podrazumevano', () => {
  assert.throws(() => parseArgs(['ep', '--count', '5']), /--count/);
  assert.throws(() => parseArgs(['ep', '--count', '0']), /--count/);
  assert.throws(() => parseArgs(['ep', '--parallel', '9']), /--parallel/);
  assert.throws(() => parseArgs(['ep', '--aspect', '21:9']), /--aspect/);
  assert.throws(() => parseArgs(['ep', '--only']), /traži vrednost/);
  assert.throws(() => parseArgs(['ep', '--only', '--new']), /traži vrednost/);
  assert.throws(() => parseArgs(['ep', '--bogus']), /nepoznata opcija/);
  assert.throws(() => parseArgs(['ep', 'drugi']), /višak argumenta/);
  assert.throws(() => parseArgs([]), /nedostaje folder epizode/);
  assert.throws(() => parseArgs(['ep', '--new', '--project-url', PROJECT]), /ne idu zajedno/);
});

test('parseArgs: --login ne traži epizodu; --project-url se svodi na adresu projekta', () => {
  assert.equal(parseArgs(['--login']).login, true);
  assert.equal(parseArgs(['ep', '--project-url', `${PROJECT}/edit/${ID(1)}?x=1`]).projectUrl, PROJECT);
});

// ------------------------------------------------------------------ imena

test('imageName: oznaka shota napred, Flow-ov naslov iza (i njegov „…"), bez dvostruke oznake', () => {
  assert.equal(imageBase('07', 2), 'shot07-2');
  assert.equal(imageName('07', 2, 'Gilded man on lake raft'), 'shot07-2 Gilded man on lake raft');
  assert.equal(imageName('07', 2, 'Conquistador pointing toward mou…'), 'shot07-2 Conquistador pointing toward mou…');
  assert.equal(imageName('07', 3, 'shot07-2 Gilded man'), 'shot07-3 Gilded man');
  assert.equal(imageName('07', 1, ''), 'shot07-1');
  assert.equal(imageName('07', 1, null), 'shot07-1');
});

test('projectNameFor, editUrl, normalizeProjectUrl', () => {
  assert.equal(projectNameFor('el-dorado'), 'EL DORADO');
  assert.equal(projectNameFor('greek-gods-part-4'), 'GREEK GODS PART 4');
  assert.equal(editUrl(PROJECT, ID(1)), `${PROJECT}/edit/${ID(1)}`);
  assert.equal(editUrl(`${PROJECT}/`, ID(1)), `${PROJECT}/edit/${ID(1)}`);
  assert.equal(normalizeProjectUrl(PROJECT.toUpperCase().replace('HTTPS://FLOW.GOOGLE.COM', 'https://flow.google.com')), PROJECT);
  assert.throws(() => normalizeProjectUrl('https://flow.google.com/'), /nije adresa Flow projekta/);
});

test('summaryOf: ACTION pre SUBJECT-a, pa prvi red', () => {
  assert.equal(summaryOf(PROMPT), 'he writes by candlelight');
  assert.equal(summaryOf(OTHER), 'a raft on a lake');
  assert.equal(summaryOf('samo jedan red'), 'samo jedan red');
  assert.equal(summaryOf(null), '');
});

test('extFor: .jpeg je konvencija repoa', () => {
  assert.equal(extFor('image/jpeg'), 'jpeg');
  assert.equal(extFor('image/png'), 'png');
  assert.equal(extFor('image/webp'), 'webp');
  assert.equal(extFor(''), 'jpeg');
});

test('promptHash: isti prompt isti otisak, jedan znak razlike drugi', () => {
  assert.equal(promptHash(PROMPT), promptHash(String(PROMPT)));
  assert.notEqual(promptHash(PROMPT), promptHash(`${PROMPT} `));
  assert.match(promptHash(PROMPT), /^[0-9a-f]{16}$/);
});

// ------------------------------------------------------------------ Flow-ov mrežni format

test('deepHas: nalazi string i u JSON-u upakovanom u string, a delimičan ne', () => {
  assert.equal(deepHas([1, [2, ['x', PROMPT]]], PROMPT), true);
  assert.equal(deepHas(JSON.stringify([[null, JSON.stringify([PROMPT])]]), PROMPT), true);
  assert.equal(deepHas([PROMPT.slice(0, 20)], PROMPT), false);
  assert.equal(deepHas({ a: { b: [PROMPT] } }, PROMPT), true);
  assert.equal(deepHas(null, PROMPT), false);
});

test('requestHasPrompt: zahtev se prepoznaje po promptu koji nosi', () => {
  const post = generateRequest(PROMPT);
  assert.equal(requestHasPrompt(post, PROMPT), true);
  assert.equal(requestHasPrompt(post, OTHER), false);
  assert.equal(requestHasPrompt('f.req=%5B%5D', PROMPT), false);
  assert.equal(requestHasPrompt('nije-form', PROMPT), false);
  assert.equal(requestHasPrompt(null, PROMPT), false);
});

test('batchPayloads: izvlači wrb.fr rezultate i preskače ostale redove', () => {
  const out = batchPayloads(generateResponse(PROMPT, [ID(1)]));
  assert.equal(out.length, 1);
  assert.equal(out[0].rpc, 'ogiZ0b');
  assert.ok(Array.isArray(out[0].payload));
  assert.deepEqual(batchPayloads(''), []);
  assert.deepEqual(batchPayloads(")]}'\n\n[nije json"), []);
});

test('parseGenerated: media ID-jevi redom i naslovi, samo za svoj prompt', () => {
  const body = generateResponse(PROMPT, [ID(1), ID(2), ID(3), ID(4)], ['A', 'B', 'C…', 'D']);
  const r = parseGenerated(body, PROMPT);
  assert.equal(r.error, null);
  assert.deepEqual(r.media.map((m) => m.mediaId), [ID(1), ID(2), ID(3), ID(4)]);
  assert.deepEqual(r.media.map((m) => m.title), ['A', 'B', 'C…', 'D']);

  // Tuđi odgovor (drugi shot u letu) ne sme da da slike ovom shotu.
  const other = parseGenerated(body, OTHER);
  assert.deepEqual(other.media, []);
  assert.match(other.error, /nijednu sliku/);
});

test('parseGenerated: delimičan rezultat i odgovor bez rezultata', () => {
  assert.equal(parseGenerated(generateResponse(PROMPT, [ID(1), ID(2)]), PROMPT).media.length, 2);
  const failed = `)]}'\n\n${JSON.stringify([['wrb.fr', 'ogiZ0b', null, null, null, [8], 'generic']])}\n`;
  const r = parseGenerated(failed, PROMPT);
  assert.deepEqual(r.media, []);
  assert.match(r.error, /\[8\]/);
  assert.match(parseGenerated('', PROMPT).error, /prazan odgovor/);
});

// ------------------------------------------------------------------ plan i stanje

test('planShots: nov, gotov, promenjen prompt, neuspeo, redo, --only i bez prompta', () => {
  const shots = [
    { shot_id: '01', image_prompt: 'A' },
    { shot_id: '02', image_prompt: 'B' },
    { shot_id: '03', image_prompt: 'C2' },
    { shot_id: '04', image_prompt: 'D' },
    { shot_id: '05', image_prompt: 'E' },
    { shot_id: '06', image_prompt: '  ' },
  ];
  const state = {
    shots: {
      '02': { status: 'done', prompt_hash: promptHash('B'), images: [] },
      '03': { status: 'done', prompt_hash: promptHash('C1'), images: [] },
      '04': { status: 'failed', images: [] },
      '05': { status: 'done', prompt_hash: promptHash('E'), images: [] },
    },
  };
  const { todo, skip } = planShots(shots, state, { redo: new Set(['05']) });
  assert.deepEqual(todo.map((t) => `${t.shot.shot_id}:${t.why}`),
    ['01:nov', '03:prompt je promenjen', '04:prošli put nije uspeo', '05:redo']);
  assert.deepEqual(skip.map((t) => `${t.shot.shot_id}:${t.why}`), ['02:gotov', '06:nema image_prompt']);

  const only = planShots(shots, state, { only: new Set(['02', '03']) });
  assert.deepEqual(only.todo.map((t) => t.shot.shot_id), ['03']);
  assert.deepEqual(only.skip.map((t) => t.shot.shot_id), ['02']);
});

test('recordBatch: novi kandidati nastavljaju brojanje, stari ostaju; recordFailure čuva slike', () => {
  const state = { shots: {} };
  const shot = { shot_id: '07', image_prompt: PROMPT };
  const first = recordBatch(state, shot, [{ mediaId: ID(1), title: 'A' }, { mediaId: ID(2), title: 'B' }]);
  assert.deepEqual(first.map((im) => im.k), [1, 2]);
  assert.equal(state.shots['07'].status, 'done');
  assert.equal(state.shots['07'].prompt_hash, promptHash(PROMPT));

  const again = recordBatch(state, { ...shot, image_prompt: OTHER }, [{ mediaId: ID(3), title: 'C' }]);
  assert.deepEqual(again.map((im) => im.k), [3]);
  assert.equal(state.shots['07'].images.length, 3);
  assert.equal(state.shots['07'].prompt_hash, promptHash(OTHER));
  assert.equal(state.shots['07'].images[0].prompt_hash, promptHash(PROMPT));

  recordFailure(state, shot, 'Flow je odbio');
  assert.equal(state.shots['07'].status, 'failed');
  assert.equal(state.shots['07'].error, 'Flow je odbio');
  assert.equal(state.shots['07'].images.length, 3);
});

test('unfinished: šta fali zavisi od toga da li se traži ime i fajl', () => {
  const st = {
    status: 'done',
    images: [
      { media_id: 'a', renamed: true, file: 'x.jpeg' },
      { media_id: 'b', renamed: false, file: 'y.jpeg' },
      { media_id: 'c', renamed: true, file: null },
    ],
  };
  assert.deepEqual(unfinished(st).map((im) => im.media_id), ['b', 'c']);
  assert.deepEqual(unfinished(st, { rename: false }).map((im) => im.media_id), ['c']);
  assert.deepEqual(unfinished(st, { download: false }).map((im) => im.media_id), ['b']);
  assert.deepEqual(unfinished({ ...st, status: 'failed' }), []);
  assert.deepEqual(unfinished(undefined), []);
});

test('loadState/saveState: prazno stanje kad fajla nema, povratak istog stanja, jasna greška za loš JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-state-'));
  assert.deepEqual(loadState(dir), { version: 1, project_url: null, project_name: null, shots: {} });
  const state = { version: 1, project_url: PROJECT, project_name: 'EL DORADO', shots: { '01': { status: 'done', images: [] } } };
  saveState(dir, state);
  assert.deepEqual(loadState(dir), state);
  assert.equal(fs.existsSync(`${stateFile(dir)}.tmp`), false);
  fs.writeFileSync(stateFile(dir), '{pokvaren');
  assert.throws(() => loadState(dir), /nije ispravan JSON/);
});

// ------------------------------------------------------------------ pregled

test('renderIndex: svaka slika vodi na svoju stranicu u Flow-u; prompt je escapovan i kopira se doslovno', () => {
  const sb = load(GOOD);
  const [s1, s2] = shotsOf(sb);
  const state = { project_url: PROJECT, project_name: 'GOOD', shots: {} };
  recordBatch(state, s1, [{ mediaId: ID(1), title: 'A' }, { mediaId: ID(2), title: 'B' }]);
  state.shots[s1.shot_id].images[0].file = 'shot01-1.jpeg';
  recordFailure(state, s2, 'Flow <odbio>');

  const html = renderIndex(sb, state, { now: new Date('2026-11-14T20:00:00Z') });
  assert.match(html, new RegExp(`href="${PROJECT}/edit/${ID(1)}"`));
  assert.match(html, new RegExp(`href="${PROJECT}/edit/${ID(2)}"`));
  assert.match(html, /<img src="shot01-1\.jpeg"/);
  assert.match(html, /shot01-2 · otvori u Flow-u/, 'slika bez fajla je kartica bez sličice, ne greška');
  assert.match(html, /nije uspelo: Flow &lt;odbio&gt;/);
  assert.match(html, /još nije generisano/);
  assert.match(html, /1\/3 shota generisano/);
  assert.match(html, new RegExp(`data-copy="anim${s1.shot_id}"`));
  assert.match(html, new RegExp(`id="anim${s1.shot_id}"`));
  assert.match(html, new RegExp(`Video · <b>${s1.gen_len}s</b>`));
  assert.match(html, new RegExp(`shot${s1.shot_id}\\.mp4`));

  // Prompt u <pre> mora da se vrati doslovno kroz textContent: samo &, <, >, ", ' su escapovani.
  const pre = html.match(new RegExp(`<pre id="anim${s1.shot_id}">([\\s\\S]*?)</pre>`))[1];
  const back = pre.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  assert.equal(back, s1.animation_prompt);
});

test('renderIndex: still dobija ime fajla umesto animation prompta; stare slike su označene', () => {
  const sb = load(STILL);
  const still = shotsOf(sb).find((s) => s.render_mode === 'still');
  const state = { project_url: PROJECT, project_name: 'STILL', shots: {} };
  recordBatch(state, { ...still, image_prompt: 'stari prompt' }, [{ mediaId: ID(1), title: 'A' }]);
  const html = renderIndex(sb, state);
  const section = html.match(new RegExp(`<section id="shot${still.shot_id}">[\\s\\S]*?</section>`))[0];
  assert.match(section, new RegExp(`shot${still.shot_id}\\.jpeg`));
  assert.doesNotMatch(section, /Kopiraj animation prompt/);
  assert.match(section, /stari prompt/);
  assert.match(section, /prompt je promenjen posle generisanja/);
});

// ------------------------------------------------------------------ main bez pregledača

test('main --dry-run: plan bez pregledača i bez upisa', async () => {
  const dir = tmpEpisode(GOOD);
  const lines = [];
  assert.equal(await main([dir, '--dry-run', '--only', '1,3'], (l) => lines.push(l)), 0);
  const out = lines.join('\n');
  assert.match(out, /za generisanje: 01, 03/);
  assert.match(out, /projekat: nov — „GOOD EPISODE"/);
  assert.equal(fs.existsSync(path.join(dir, 'flow')), false);
});

test('main: kad je sve gotovo, ne otvara pregledač nego samo osveži pregled', async () => {
  const dir = tmpEpisode(GOOD);
  const sb = load(GOOD);
  const state = { version: 1, project_url: PROJECT, project_name: 'GOOD', shots: {} };
  for (const [i, s] of shotsOf(sb).entries()) {
    recordBatch(state, s, [{ mediaId: ID(i + 1), title: 'T' }]);
    Object.assign(state.shots[s.shot_id].images[0], { renamed: true, file: `shot${s.shot_id}-1.jpeg` });
  }
  saveState(dir, state);
  const lines = [];
  assert.equal(await main([dir], (l) => lines.push(l)), 0);
  assert.match(lines.join('\n'), /Nema posla/);
  assert.ok(fs.existsSync(path.join(dir, 'flow', 'index.html')));
});

test('main: slike bez fajla na disku nisu posao — bez --download pregledač se ne otvara', async () => {
  const dir = tmpEpisode(GOOD);
  const sb = load(GOOD);
  const state = { version: 1, project_url: PROJECT, project_name: 'GOOD', shots: {} };
  for (const [i, s] of shotsOf(sb).entries()) {
    recordBatch(state, s, [{ mediaId: ID(i + 1), title: 'T' }]);
    state.shots[s.shot_id].images[0].renamed = true; // imenovano u Flow-u, ništa na disku
  }
  saveState(dir, state);

  const lines = [];
  assert.equal(await main([dir], (l) => lines.push(l)), 0);
  assert.match(lines.join('\n'), /Nema posla/);
  assert.doesNotMatch(lines.join('\n'), /dovršavanje/);

  // Na zahtev (--download) iste slike su zaostatak koji se dovršava.
  const dry = [];
  await main([dir, '--download', '--dry-run'], (l) => dry.push(l));
  assert.match(dry.join('\n'), /dovršavanje imena\/fajlova/);
});

// ------------------------------------------------------------------ thumbnailovi (--thumbnails)

const FENCE = '```';
const THUMB_MD = `# Thumbnailovi — test-ep

## Pregled

| # | Koncept |
|---|---|

## 1. Zlato se prosipa

**Poenta:** Kralj prosipa zlato.
**Natpis (B):** „HE GAVE IT AWAY“ — gore levo, tamnocrvena (#B3161B). Alternative: „X“.
**Naslov uz njega:** Did the King Really Crash Gold?
**Pazi:** pozlaćen lik ne ide spreda.

### 1A — bez teksta (9 reči)

${FENCE}text
STYLE: test, 16:9.
SUBJECT: a king & his <sack>
ACTION: gold falls
${FENCE}

### 1B — sa tekstom (12 reči)

${FENCE}text
STYLE: test, 16:9.
SUBJECT: a king & his <sack>
TEXT: the words "HE GAVE IT AWAY"
ACTION: gold falls
${FENCE}

---

## 2. Vaga

**Poenta:** Vaga se nagnula.
**Natpis (B):** „DID GOLD CRASH?“ — gore desno.
**Naslov uz njega:** The King Who Gave Away Gold, or Did He?

### 2A — bez teksta

${FENCE}text
STYLE: test, 16:9.
SUBJECT: a balance
${FENCE}
`;

function tmpThumbEpisode(md = THUMB_MD) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'flow-thumbs-')), 'test-ep');
  fs.mkdirSync(dir);
  if (md !== null) fs.writeFileSync(path.join(dir, 'thumbnails.md'), md);
  return dir;
}

test('parseArgs --thumbnails: slike se skidaju osim uz --no-download; 1a i 1A su isti prompt', () => {
  const a = parseArgs(['ep', '--thumbnails', '--only', '1a,2B', '--redo=3b']);
  assert.equal(a.thumbnails, true);
  assert.equal(a.download, true, 'izbor thumbnaila je poređenje na disku i na 168×94');
  assert.deepEqual(a.only, ['1A', '2B']);
  assert.deepEqual(a.redo, ['3B']);
  assert.equal(parseArgs(['ep', '--thumbnails', '--no-download']).download, false);
  assert.equal(parseArgs(['ep']).thumbnails, false);
});

test('imageName: thumbnail oznaka thumb1A-k, ni ona se ne udvostručuje', () => {
  assert.equal(imageBase('1A', 2, 'thumb'), 'thumb1A-2');
  assert.equal(imageName('1A', 2, 'King pours gold into crowd', 'thumb'), 'thumb1A-2 King pours gold into crowd');
  assert.equal(imageName('1A', 3, 'thumb1A-2 King pours', 'thumb'), 'thumb1A-3 King pours');
  assert.equal(imageName('1B', 1, '', 'thumb'), 'thumb1B-1');
});

test('parseThumbnails: promptovi doslovno iz text blokova, koncept daje natpis, ugao i naslov', () => {
  const t = parseThumbnails(THUMB_MD.replace(/\n/g, '\r\n'));
  assert.deepEqual(t.prompts.map((p) => `${p.id}:${p.concept}${p.variant}`), ['1A:1A', '1B:1B', '2A:2A']);
  assert.equal(t.prompts[0].prompt, 'STYLE: test, 16:9.\nSUBJECT: a king & his <sack>\nACTION: gold falls');
  assert.match(t.prompts[1].prompt, /^TEXT: the words "HE GAVE IT AWAY"$/m);
  const [c1, c2] = t.concepts;
  assert.deepEqual([c1.n, c1.name, c1.caption, c1.corner, c1.headline],
    [1, 'Zlato se prosipa', 'HE GAVE IT AWAY', 'gore levo', 'Did the King Really Crash Gold?']);
  assert.equal(c1.warn, 'pozlaćen lik ne ide spreda.');
  assert.deepEqual([c2.caption, c2.corner], ['DID GOLD CRASH?', 'gore desno']);
  assert.equal(thumbItems(t)[2].shot_id, '2A');
  assert.equal(thumbItems(t)[2].image_prompt, t.prompts[2].prompt);
});

test('parseThumbnails: prazan red, blok koji fali ili nije zatvoren, ponovljen ili nijedan prompt su greška', () => {
  assert.throws(() => parseThumbnails(THUMB_MD.replace('SUBJECT: a balance', '\nSUBJECT: a balance')), /prazan red u promptu 2A/);
  assert.throws(() => parseThumbnails('## 1. X\n\n### 1A\n\nnema bloka\n'), /nema ```text bloka/);
  assert.throws(() => parseThumbnails(`### 1A\n${FENCE}text\nSTYLE: x\n`), /nije zatvoren/);
  assert.throws(() => parseThumbnails(`### 1A\n${FENCE}text\nA\n${FENCE}\n### 1A\n${FENCE}text\nB\n${FENCE}\n`), /1A se ponavlja/);
  assert.throws(() => parseThumbnails('# samo naslov\n'), /nema nijednog prompta/);
});

test('renderThumbIndex: koncept po koncept, slika vodi u Flow, uz skinutu stoji 168×94, prompt doslovno', () => {
  const t = parseThumbnails(THUMB_MD);
  const items = thumbItems(t);
  const state = { project_url: PROJECT, project_name: 'TEST EP THUMBNAILS', shots: {} };
  recordBatch(state, items[0], [{ mediaId: ID(1), title: 'A' }, { mediaId: ID(2), title: 'B' }]);
  state.shots['1A'].images[0].file = 'thumb1A-1.jpeg';
  recordFailure(state, items[1], 'Flow <odbio>');
  const html = renderThumbIndex('test-ep', t, state, { now: new Date('2026-11-26T10:00:00Z') });
  assert.match(html, /<h2>1\. Zlato se prosipa<\/h2>/);
  assert.match(html, /natpis \(B\): <b>„HE GAVE IT AWAY“<\/b> · gore levo/);
  assert.match(html, /naslov uz njega: <b>Did the King Really Crash Gold\?<\/b>/);
  assert.match(html, /pazi: pozlaćen lik/);
  assert.match(html, new RegExp(`href="${PROJECT}/edit/${ID(1)}"`));
  assert.match(html, /<img class="mini" src="thumb1A-1\.jpeg"[^>]*width="168" height="94"/);
  assert.match(html, /thumb1A-2 · otvori u Flow-u/, 'neskinuta slika je kartica bez sličice');
  assert.match(html, /nije uspelo: Flow &lt;odbio&gt;/);
  assert.match(html, /1\/3 prompta generisano/);
  assert.match(html, /<h3>1B <small>sa tekstom<\/small><\/h3>/);
  const pre = html.match(/<div class="variant" id="t1A">[\s\S]*?<pre>([\s\S]*?)<\/pre>/)[1];
  const back = pre.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  assert.equal(back, t.prompts[0].prompt);
});

test('toYoutubeJpeg: webp 1376×768 iz Flow-a postaje JPEG 1280×720 pod istim imenom, original nestaje', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-yt-'));
  await run(['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x1F2A6B:s=1376x768',
    '-frames:v', '1', path.join(dir, 'thumb2B-3.webp')]);
  const out = await toYoutubeJpeg(dir, 'thumb2B-3.webp', 'thumb2B-3');
  assert.equal(out, 'thumb2B-3.jpeg');
  assert.deepEqual(fs.readdirSync(dir), ['thumb2B-3.jpeg'], 'ni original ni privremeni fajl ne ostaju');
  const p = await probe(path.join(dir, out));
  assert.deepEqual([p.width, p.height], [YT_THUMB.width, YT_THUMB.height]);
  assert.ok(fs.statSync(path.join(dir, out)).size < 2 * 1024 * 1024, 'YouTube prima do 2 MB');

  // Flow ume da vrati i .jpeg: isto ime, pretvaranje ga zamenjuje na mestu.
  fs.renameSync(path.join(dir, out), path.join(dir, 'thumb2B-4.jpeg'));
  assert.equal(await toYoutubeJpeg(dir, 'thumb2B-4.jpeg', 'thumb2B-4'), 'thumb2B-4.jpeg');
  assert.deepEqual(fs.readdirSync(dir), ['thumb2B-4.jpeg']);
});

test('main --thumbnails --dry-run: promptovi iz thumbnails.md, zaseban projekat, ništa se ne piše', async () => {
  const dir = tmpThumbEpisode();
  const lines = [];
  assert.equal(await main([dir, '--thumbnails', '--dry-run'], (l) => lines.push(l)), 0);
  const out = lines.join('\n');
  assert.match(out, /3 prompta u thumbnails\.md · 4 slike po promptu/);
  assert.match(out, /za generisanje: 1A, 1B, 2A/);
  assert.match(out, /projekat: nov — „TEST EP THUMBNAILS"/);
  assert.equal(fs.existsSync(path.join(dir, 'flow')), false);

  const only = [];
  await main([dir, '--thumbnails', '--dry-run', '--only', '2a'], (l) => only.push(l));
  assert.match(only.join('\n'), /za generisanje: 2A$/m);
});

test('main --thumbnails: stanje u thumbnails.json, ne dira flow.json shotova; bez thumbnails.md jasna greška', async () => {
  const dir = tmpThumbEpisode();
  const shotsState = { version: 1, project_url: PROJECT, project_name: 'TEST EP', shots: { '01': { status: 'done', images: [] } } };
  saveState(dir, shotsState);
  const t = parseThumbnails(THUMB_MD);
  const state = { version: 1, project_url: PROJECT, project_name: 'TEST EP THUMBNAILS', shots: {} };
  for (const [i, it] of thumbItems(t).entries()) {
    recordBatch(state, it, [{ mediaId: ID(i + 1), title: 'T' }]);
    Object.assign(state.shots[it.shot_id].images[0], { renamed: true, file: `thumb${it.shot_id}-1.jpeg` });
  }
  saveState(dir, state, 'thumbnails.json');
  assert.equal(stateFile(dir, 'thumbnails.json'), path.join(dir, 'flow', 'thumbnails.json'));

  const lines = [];
  assert.equal(await main([dir, '--thumbnails'], (l) => lines.push(l)), 0);
  assert.match(lines.join('\n'), /Nema posla\. Pregled: .*thumbnails\.html/);
  assert.ok(fs.existsSync(path.join(dir, 'flow', 'thumbnails.html')));
  assert.equal(fs.existsSync(path.join(dir, 'flow', 'index.html')), false, 'pregled shotova se ne prepisuje');
  assert.deepEqual(loadState(dir), shotsState);

  await assert.rejects(main([tmpThumbEpisode(null), '--thumbnails', '--dry-run'], () => {}), /nema thumbnails\.md/);
});

// 26. nov 2026, mansa-musa thumbnailovi 6B/8B/9B/10B: prva slika posle generisanja skinuta je kao
// ista sitna mutna sličica (bajt-za-bajt isti fajl za četiri različite slike), jer je na stranici
// slike u tom trenutku bila učitana samo ona. Stranica nije „spremna" dok slika nije pune veličine.
test('pImageReady: sitna sličica nije slika; čeka se ona pune veličine (1376×768)', () => {
  const MEDIA = '3a29acef-a0e2-463c-bd38-464acf9324bb';
  const img = (src, alt, w, h, box = [800, 450]) => ({
    src, alt, naturalWidth: w, naturalHeight: h, complete: true,
    getBoundingClientRect: () => ({ width: box[0], height: box[1] }),
  });
  const page = (imgs) => ({
    location: { pathname: `/fx/tools/flow/project/p/edit/${MEDIA}` },
    document: {
      querySelectorAll: (sel) => {
        if (sel === 'img') return imgs;
        if (sel === '[role=textbox]') return [{ getAttribute: () => 'What do you want to change?' }];
        if (sel === 'input[aria-label="Editable text"]') return [{ value: 'King holding gold nugget' }];
        return [];
      },
    },
  });
  const saved = { location: globalThis.location, document: globalThis.document };
  try {
    Object.assign(globalThis, page([img('https://flow.google.com/asb/blur', 'Read-only image view', 32, 18)]));
    assert.equal(pImageReady(MEDIA, 'What do you want to create?'), null);

    Object.assign(globalThis, page([
      img('https://flow.google.com/asb/blur', 'Read-only image view', 32, 18),
      img('https://flow.google.com/asb/full', 'Read-only image view', 1376, 768),
    ]));
    assert.deepEqual(pImageReady(MEDIA, 'What do you want to create?'),
      { title: 'King holding gold nugget', src: 'https://flow.google.com/asb/full' });

    // uspravna slika (9:16) je takođe pune veličine
    Object.assign(globalThis, page([img('https://flow.google.com/asb/tall', 'Read-only image view', 768, 1376)]));
    assert.equal(pImageReady(MEDIA, 'What do you want to create?')?.src, 'https://flow.google.com/asb/tall');

    // 26. nov 2026, el-dorado thumbnailovi 8B-1/9B-1/10B-1: posle povratka iz mreže stranica nove
    // slike još pokazuje prethodno otvorenu (pune veličine, učitanu), dok se nova tek učitava. Ta
    // stara adresa se ne prihvata; čeka se nova, i kad obe stoje u stranici.
    Object.assign(globalThis, page([img('https://flow.google.com/asb/prev', 'Read-only image view', 1376, 768)]));
    assert.equal(pImageReady(MEDIA, 'What do you want to create?', 'https://flow.google.com/asb/prev'), null);
    Object.assign(globalThis, page([
      img('https://flow.google.com/asb/prev', 'Read-only image view', 1376, 768),
      img('https://flow.google.com/asb/next', 'Read-only image view', 1376, 768),
    ]));
    assert.equal(pImageReady(MEDIA, 'What do you want to create?', 'https://flow.google.com/asb/prev')?.src,
      'https://flow.google.com/asb/next');
  } finally {
    Object.assign(globalThis, saved);
  }
});

test('sameFile: bajt-za-bajt isti fajl druge slike je duplikat; različit ili nepostojeći nije', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fi-dup-'));
  try {
    fs.writeFileSync(path.join(dir, 'thumb7B-4.jpeg'), 'AAAA');
    fs.writeFileSync(path.join(dir, 'thumb8B-1.jpeg'), 'AAAA');
    fs.writeFileSync(path.join(dir, 'thumb8B-2.jpeg'), 'BBBB');
    const images = [
      { media_id: 'a', file: 'thumb7B-4.jpeg' }, { media_id: 'b', file: 'thumb8B-1.jpeg' },
      { media_id: 'c', file: 'thumb8B-2.jpeg' }, { media_id: 'd', file: null }, { media_id: 'e', file: 'nema.jpeg' },
    ];
    assert.equal(sameFile(dir, images[1], images)?.media_id, 'a');
    assert.equal(sameFile(dir, images[2], images), null);
    assert.equal(sameFile(dir, images[3], images), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
