// tools/contract.mjs
//
// Izvršni oblik ugovora iz docs/reference/schemas.md — kanonski helperi i rečnici na
// jednom mestu. Uvoze ih `tools/lint.mjs`, `tools/timeline.mjs` i `tests/check-fixtures.mjs`.
//
// Zašto postoji: schemas.md §0 kaže da lint.mjs preuzima helpere iz check-fixtures.mjs, a ne
// piše ih ponovo. Doslovno to nije izvodljivo — check-fixtures.mjs radi ceo posao na uvozu
// (čita fixture, štampa izveštaj, zove process.exit), pa bi `import` iz njega oborio linter.
// Uz to bi tools/ zavisio od tests/, što obrće smer zavisnosti. Namera ugovora (jedna
// definicija, ne dve) ispunjena je ovim modulom: helperi žive ovde, oba potrošača ih uvoze.
//
// S1 liste se NE drže ovde nego se čitaju iz docs/reference/camera-language.md
// (zahtev iz docs/plan/C06-lint-blocking.md: „čitaj ih odatle, ne hardkoduj").

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- helperi (schemas.md §0)

/** Kanonsko brojanje reči (schemas.md §0.6): token sa bar jednim alfanumerikom. */
export const countWords = (text) =>
  String(text).split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;

/** Kanonsko poređenje teksta (schemas.md §0.7): sažeta belina, ignorisana veličina slova. */
export const normalize = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();

/** Kanonska kvantizacija na frejm (schemas.md §0.2). */
export const q = (t, fps) => Math.round((Math.round(t * fps) / fps) * 1000) / 1000;

/** Provera frejm-poravnanja (schemas.md §0.2). */
export const isFrameAligned = (t, fps) => Math.abs(t * fps - Math.round(t * fps)) <= 0.02;

/** Zaokruživanje na 3 decimale (schemas.md §0.1). */
export const round3 = (t) => Math.round(t * 1000) / 1000;

/** Tolerancija na poređenja vremena; vrednosti su zaokružene na 3 decimale (schemas.md §3.7). */
export const EPS = 0.0011;

// ---------------------------------------------------------------- rečnici (schemas.md §3.5, §3.6, §4)

/** Četiri zatvorene ose iz schemas.md §3.5. */
export const TAGS = {
  subject_type: ['character', 'group', 'environment', 'object', 'map-diagram', 'crowd', 'architecture'],
  shot_size: ['XLS', 'LS', 'MS', 'CU', 'ECU', 'aerial'],
  angle: ['eye', 'low', 'high', 'overhead', 'profile'],
  camera_motion: ['locked', 'push', 'pull', 'pan', 'track', 'parallax', 'reveal'],
};

/** Katalog vizuelnih uređaja (schemas.md §3.6). */
export const DEVICES = ['animated-map', 'ledger-accumulation', 'process-cutaway', 'before-after',
  'timeline-seasons', 'macro-object', 'silhouette', 'crowd-as-texture', 'empty-aftermath'];

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** S2: nazivi blokova se traže verzalom, sa dvotačkom (camera-language.md). */
export const S2_BLOCKS = ['CAMERA', 'FRAME LAYOUT', 'FACING', 'SCREEN DIRECTION', 'NOT IN FRAME'];

/** S3: reči koje impliciraju rez unutar klipa (schemas.md §4). */
export const S3_WORDS = ['then', 'later', 'afterwards', 'cuts to', 'meanwhile'];

/** Pragovi iz BLOCKING tabele (docs/plan/C06-lint-blocking.md). */
export const LIMITS = {
  useLen: { min: 3.0, max: 10.0 },   // T2
  motionBelow: 9.0,                  // T3
  imageWords: { min: 90, max: 160 }, // P1
  animWords: { min: 60, max: 100 },  // P2
  t1Drift: 0.2,                      // T1
};

// ---------------------------------------------------------------- S1: liste iz camera-language.md

export const CAMERA_LANGUAGE_FILE = path.join(HERE, '..', 'docs', 'reference', 'camera-language.md');

const SECTION = 'Liste koje provera S1 konzumira';
const FENCE = /```[a-z]*\r?\n([\s\S]*?)\r?\n?```/;

function fencedBlock(section, letter, file) {
  const part = section.split(/^###\s+/m).find((p) => p.startsWith(`${letter}.`));
  if (!part) throw new Error(`${file}: nema pododeljka "### ${letter}." u "## ${SECTION}"`);
  const m = part.match(FENCE);
  if (!m) throw new Error(`${file}: pododeljak "### ${letter}." nema blok koda sa listom`);
  return m[1];
}

/**
 * Čita dve liste koje S1 konzumira iz docs/reference/camera-language.md.
 * Pravilo se time menja na jednom mestu — u dokumentu, ne u kodu (C06).
 *
 * Lista A (zabranjene fraze) je jedna fraza po liniji.
 * Lista B (screen-position tokeni) je više tokena po liniji, razdvojenih sa 2+ razmaka —
 * jedan razmak je unutar tokena (`cropped at`, `left third`), pa se po njemu ne sme deliti.
 *
 * @param {string} [file]
 * @returns {{phrases: string[], tokens: string[], file: string}}
 */
export function loadCameraLanguage(file = CAMERA_LANGUAGE_FILE) {
  let md;
  try {
    md = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`S1 liste se ne mogu pročitati iz ${file}: ${err.message}`);
  }

  const section = md.split(/^##\s+/m).find((s) => s.startsWith(SECTION));
  if (!section) throw new Error(`${file}: nema odeljka "## ${SECTION}"`);

  const phrases = fencedBlock(section, 'A', file)
    .split(/\r?\n/).map((s) => normalize(s)).filter(Boolean);
  const tokens = fencedBlock(section, 'B', file)
    .split(/\r?\n|\s{2,}/).map((s) => normalize(s)).filter(Boolean);

  // Prazna lista bi tiho ugasila S1 — to je najgori mogući ishod ovog parsiranja.
  if (!phrases.length) throw new Error(`${file}: lista A (zabranjene fraze) je prazna`);
  if (!tokens.length) throw new Error(`${file}: lista B (screen-position tokeni) je prazna`);

  return { phrases, tokens, file };
}

// ---------------------------------------------------------------- S1: poređenje

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Granica reči samo tamo gde token počinje/završava se slovom ili cifrom. */
const wordRx = (s) => new RegExp(
  (/^\w/.test(s) ? '\\b' : '') + escape(s) + (/\w$/.test(s) ? '\\b' : ''),
);

/**
 * Deli tekst na jedinice unutar kojih S1 traži screen-position klauzulu.
 *
 * „Ista rečenica" iz camera-language.md ovde znači: prelom reda ili rečenična interpunkcija
 * (`.` `!` `?` `…`) iza koje sledi belina. Promptovi su blokovski, po jedan blok u liniji,
 * pa je prelom reda jednako jaka granica kao tačka; a tačka bez beline iza sebe (`6.5s`,
 * `B.C.`) ne deli. Segmenti se vraćaju normalizovani (schemas.md §0.7).
 */
export function segments(text) {
  return String(text)
    .split(/\r?\n|(?<=[.!?…])\s+/)
    .map((s) => normalize(s))
    .filter(Boolean);
}

/**
 * S1 nad jednim tekstom: zabranjena fraza je prekršaj samo kad u istom segmentu nema
 * nijednog screen-position tokena.
 * @returns {{phrase: string, segment: string}[]}
 */
export function s1Violations(text, lists) {
  const out = [];
  for (const seg of segments(text)) {
    const unlocked = lists.tokens.some((t) => wordRx(t).test(seg));
    if (unlocked) continue;
    for (const ph of lists.phrases) {
      if (wordRx(ph).test(seg)) out.push({ phrase: ph, segment: seg });
    }
  }
  return out;
}

// ---------------------------------------------------------------- ADVISORY (C07)

/** Šest osa pravila razlike R1 (schemas.md §3.5). Redosled je i redosled prikaza. */
export const R1_AXES = ['subject_type', 'shot_size', 'angle', 'location', 'time_light', 'camera_motion'];

/** Tri ose čije deljenje kroz 3+ uzastopna shota diže eskalaciju R1. */
export const R1_ESCALATION_AXES = ['subject_type', 'location', 'time_light'];

/** R1 flag-uje par uzastopnih shotova kad se razlikuje najviše ovoliko osa. */
export const R1_MAX_DIFFERING = 1;

/** R4: „>12 uzastopnih identičnih reči" znači da je 13 već nalaz. */
export const R4_MIN_WORDS = 13;

/**
 * C2: markeri kojima animation prompt deklariše multi-visual klip
 * (`docs/visualPromptEngine.md` §15–17, §30, §37). Traže se verzalom, kao S2 blokovi.
 */
export const MULTI_VISUAL_MARKERS = ['OPENING VISUAL', 'MIDDLE VISUAL', 'FINAL VISUAL',
  'VISUAL TRANSITION', 'VISUAL SEQUENCE', 'TRANSITION 1', 'TRANSITION 2', 'CINEMATIC TRANSITION'];

export const STYLE_STRING_FILE = path.join(HERE, '..', 'docs', 'reference', 'style-string.md');
export const PROMPT_TEMPLATES_FILE = path.join(HERE, '..', 'docs', 'reference', 'prompt-templates.md');

/** Svi blokovi koda iz markdown fajla, redom. */
const fences = (md) => [...md.matchAll(/```[a-z]*\r?\n([\s\S]*?)\r?\n?```/g)].map((m) => m[1]);

/**
 * Kanonski style string iz docs/reference/style-string.md — prvi blok koda koji počinje `STYLE:`.
 * Taj fajl je izvor istine i za ono što R4 briše, pa se čita u vreme izvršavanja, ne hardkoduje.
 * @returns {string}
 */
export function loadStyleString(file = STYLE_STRING_FILE) {
  let md;
  try {
    md = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`kanonski style string se ne može pročitati iz ${file}: ${err.message}`);
  }
  const block = fences(md).map((b) => b.trim()).find((b) => b.startsWith('STYLE:'));
  if (!block) throw new Error(`${file}: nema blok koda koji počinje sa "STYLE:"`);
  return block;
}

/**
 * Fiksne linije animation template-a (`PRESERVE:`, `FORBID:`) iz docs/reference/prompt-templates.md.
 * Template ih zove „fiksne linije, ne šablon za popunjavanje" — stoje doslovno u svakom
 * animation promptu, pa ih R4 briše iz istog razloga iz kojeg briše `locked_description`.
 * @returns {string[]}
 */
export function loadFixedPromptLines(file = PROMPT_TEMPLATES_FILE) {
  let md;
  try {
    md = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`fiksne linije prompta se ne mogu pročitati iz ${file}: ${err.message}`);
  }
  const section = md.split(/^##\s+/m).find((s) => s.startsWith('Animation template'));
  if (!section) throw new Error(`${file}: nema odeljka "## Animation template"`);
  const [block] = fences(section);
  if (!block) throw new Error(`${file}: odeljak "## Animation template" nema blok koda sa šablonom`);

  const lines = block.split(/\r?\n/).map((l) => l.trim())
    .filter((l) => /^(PRESERVE|FORBID):/.test(l));
  for (const name of ['PRESERVE', 'FORBID']) {
    if (!lines.some((l) => l.startsWith(name + ':'))) {
      throw new Error(`${file}: animation template nema fiksnu ${name} liniju`);
    }
  }
  return lines;
}

/**
 * Tokeni nad kojima R4 meri ponavljanje: kanonska normalizacija (§0.7) plus skidanje
 * interpunkcije sa ivica tokena. Bez skidanja `image` i `image.` ne bi bili ista reč, pa bi
 * izuzeće promašilo svaku liniju koju prompt završi tačkom, a šablon ne.
 * @returns {string[]}
 */
export const r4Tokens = (text) => normalize(text)
  .split(/\s+/)
  .map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
  .filter(Boolean);

// ---------------------------------------------------------------- prikaz (C08)

/**
 * Polja koja formateri (`render.mjs`, `shotlist.mjs`) prikazuju.
 *
 * Ovo NIJE lint-ov `SHOT_FIELDS`. Lint proverava polja koja meri i uz njih traži
 * `episode.json` (C1 čita `locked_description` odatle); formater sme da prikaže samo ono
 * što piše u `storyboard.json`-u — zamka iz C08: prvi put kad `.md` ponese informaciju
 * koje nema u izvoru, dva prikaza se razilaze. Otud dva različita spiska, oba namerna.
 */
export const DISPLAY_FIELDS = {
  root: ['schema_version', 'episode', 'generated_at', 'narration_duration', 'fps', 'beats'],
  beat: ['beat_id', 'sentences', 'start', 'end', 'dur', 'device', 'narration_says',
    'viewer_sees', 'shots'],
  shot: ['shot_id', 'beat_id', 'link_group', 't_in', 't_out', 'use_in', 'use_out', 'use_len',
    'motion_budget', 'source_file', 'ingredient_image', 'characters', 'image_prompt',
    'animation_prompt', 'tags'],
};

/**
 * Provera da se nad ovim podacima uopšte može praviti prikaz. Nije nalaz nego razlog da alat
 * stane: `undefined` u sredini `storyboard.md`-a je gori ishod od pada, jer izgleda kao podatak.
 * @param {unknown} storyboard
 * @throws {Error} sa svim problemima odjednom
 */
export function assertDisplayable(storyboard) {
  const bad = [];
  const has = (o, k) => o !== null && typeof o === 'object' && k in o;

  if (storyboard === null || typeof storyboard !== 'object') throw new Error('storyboard.json nije objekat');
  for (const k of DISPLAY_FIELDS.root) if (!has(storyboard, k)) bad.push(`storyboard.json: nedostaje ${k}`);
  if (!Array.isArray(storyboard.beats) || !storyboard.beats.length) {
    bad.push('storyboard.json: beats mora da bude niz sa bar jednim beatom');
  }

  for (const b of Array.isArray(storyboard.beats) ? storyboard.beats : []) {
    const bid = b?.beat_id ?? '(bez beat_id)';
    for (const k of DISPLAY_FIELDS.beat) if (!has(b, k)) bad.push(`beat ${bid}: nedostaje ${k}`);
    if (has(b, 'sentences') && !Array.isArray(b.sentences)) bad.push(`beat ${bid}: sentences nije niz`);
    if (!Array.isArray(b?.shots) || !b.shots.length) {
      bad.push(`beat ${bid}: shots mora da bude niz sa bar jednim shotom`);
      continue;
    }
    for (const s of b.shots) {
      const sid = s?.shot_id ?? '(bez shot_id)';
      for (const k of DISPLAY_FIELDS.shot) if (!has(s, k)) bad.push(`shot ${sid}: nedostaje ${k}`);
      if (has(s, 'characters') && !Array.isArray(s.characters)) bad.push(`shot ${sid}: characters nije niz`);
      // Šest osa se ispisuje po R1_AXES; osa koja fali izašla bi kao `undefined` u redu tagova.
      if (!has(s, 'tags') || s.tags === null || typeof s.tags !== 'object') {
        bad.push(`shot ${sid}: nedostaje tags`);
      } else {
        for (const k of R1_AXES) {
          if (typeof s.tags[k] !== 'string') bad.push(`shot ${sid}: tags.${k} nije string`);
        }
      }
    }
  }

  if (bad.length) {
    throw new Error(`storyboard.json nije prikaziv (${bad.length}):\n` + bad.map((b) => '  - ' + b).join('\n'));
  }
}

/**
 * Zajedničko čitanje ulaza za formatere: folder epizode -> `storyboard.json`, proveren.
 * `episodes/<slug>` skraćenica radi isto kao u `lint.mjs`.
 * @param {string} dir
 * @returns {{dir: string, file: string, storyboard: object}}
 */
export function loadStoryboard(dir) {
  let d = dir;
  if (!fs.existsSync(d) && !d.includes('/') && !d.includes(path.sep)) d = path.join('episodes', d);
  if (!fs.existsSync(d)) throw new Error(`folder epizode ne postoji: ${dir}`);

  const file = path.join(d, 'storyboard.json');
  if (!fs.existsSync(file)) throw new Error(`nema storyboard.json u ${dir}`);

  let storyboard;
  try {
    storyboard = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file} nije ispravan JSON: ${err.message}`);
  }
  assertDisplayable(storyboard);
  return { dir: d, file, storyboard };
}

/**
 * Lanci povezanih shotova jednog beata (`link_group`, schemas.md §3.4). Shotovi ostaju u
 * redosledu tajmlajna; samostalan shot je lanac dužine 1 sa `group: null`.
 * @param {{link_group: string|null}[]} shots
 * @returns {{group: string|null, shots: object[]}[]}
 */
export function linkChains(shots) {
  const out = [];
  for (const s of shots) {
    const prev = out.at(-1);
    if (s.link_group !== null && prev && prev.group === s.link_group) prev.shots.push(s);
    else out.push({ group: s.link_group, shots: [s] });
  }
  return out;
}

/** Oznaka shota u lancu: A, B, C… (Z pa AA za neverovatno duge lance). */
export function chainLetter(i) {
  let n = i;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

/**
 * Srpska gramatika broja: 1 shot · 2 shota · 5 shotova (i 21 shot, 22 shota, 111 shotova).
 * Postoji jer izveštaji ove alatke čita čovek, a „2 shotova" je jedina rečenica u izlazu
 * koja ne izgleda kao da ju je pisao alat koji zna šta radi.
 */
export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (b === 1 && a !== 11) return one;
  if (b >= 2 && b <= 4 && (a < 12 || a > 14)) return few;
  return many;
}
