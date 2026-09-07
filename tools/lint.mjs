// tools/lint.mjs
//
// Deterministički QA — BLOCKING sloj (C06). Autoritet za tehničku ispravnost i ništa više.
//
//   node tools/lint.mjs episodes/<slug>
//
// Piše `episodes/<slug>/qa-report.md` sa dve strogo odvojene sekcije i vraća exit code 1
// ako ima ijedan BLOCKING nalaz. ADVISORY sloj (C07) meri i prikazuje, ali **nikad ne menja
// exit code** — šumni linter koji stalno laje naučiš da ignorišeš.
//
// Deset provera, sve determinističke, sve sa jednoznačnim odgovorom da/ne
// (docs/plan/C06-lint-blocking.md, docs/reference/schemas.md §4):
//
//   T1  pokrivenost tajmlajna — gapovi, preklapanja, sum(use_len) vs narration_duration (±0.2s)
//   T2  use_len u 3.0–10.0s
//   T3  motion_budget prisutan kad use_len < 9.0
//   S1  zabranjene prostorne fraze bez screen-position klauzule
//   S2  pet obaveznih blokova u image promptu
//   S3  reči koje impliciraju rez unutar klipa, u animation promptu
//   P1  image prompt 90–160 reči
//   P2  animation prompt 60–100 reči
//   C1  locked_description doslovno u image promptu svakog shota gde entitet učestvuje
//   F1  svaki shot ima svoj klip, izvor ≥ use_out
//
// Pet ADVISORY signala (docs/plan/C07-lint-advisory.md, schemas.md §4.1):
//
//   R1  pravilo razlike — uzastopni shotovi dele previše osa, plus eskalacija na 3+ shota
//   R2  miks tipova shotova — samo mera, bez praga
//   R3  upotrebljeni vizuelni uređaji — samo lista
//   R4  ponavljanje n-grama između promptova, >12 uzastopnih identičnih reči
//   C2  broj multi-visual klipova
//
// Nalaz uvek nosi izmerenu i očekivanu vrednost. Bez izmerene vrednosti izveštaj je
// beskorisan za popravku, pa je to ovde invarijanta oblika, ne stil.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { probe } from './ffmpeg.mjs';
import {
  EPS, LIMITS, MULTI_VISUAL_MARKERS, R1_AXES, R1_ESCALATION_AXES, R1_MAX_DIFFERING,
  R4_MIN_WORDS, S2_BLOCKS, S2_BLOCKS_V2, S3_WORDS, TAGS,
  countWords, loadCameraLanguage, loadFixedPromptLines, loadStyleString,
  normalize, q, r4Tokens, round3, s1Violations,
} from './contract.mjs';

/** Redosled kojim se nalazi sortiraju u izveštaju — isti kao BLOCKING tabela. */
export const CHECKS = ['T1', 'T2', 'T3', 'S1', 'S2', 'S3', 'S4', 'S5', 'P1', 'P2', 'C1', 'F1'];

/** ADVISORY kodovi, redosledom ADVISORY tabele. Nikad ne ulaze u exit code. */
export const ADVISORY = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'C2'];

const near = (a, b) => Math.abs(a - b) < EPS;
const fmt = (t) => Number(t).toFixed(3).replace(/\.?0+$/, '');
const slash = (p) => p.replace(/\\/g, '/');

/**
 * @param {string} code jedan od CHECKS
 * @param {string} where `shot 07` | `beat B02` | `episode`
 * @param {string} message ljudska rečenica; mora da sadrži izmerenu vrednost
 * @param {string|number} measured
 * @param {string|number} expected
 */
const finding = (code, where, message, measured, expected) =>
  ({ code, where, message, measured: String(measured), expected: String(expected) });

// ---------------------------------------------------------------- oblik ulaza

const ROOT_FIELDS = ['schema_version', 'episode', 'generated_at', 'narration_duration', 'fps', 'beats'];
const BEAT_FIELDS = ['beat_id', 'start', 'end', 'device', 'shots'];
const SHOT_FIELDS = ['shot_id', 'beat_id', 'link_group', 't_in', 't_out', 'use_in', 'use_out',
  'use_len', 'motion_budget', 'source_file', 'characters', 'image_prompt', 'animation_prompt'];

/**
 * Provera da se nad ovim podacima uopšte može linterizovati. Nije provera iz tabele:
 * pokvaren oblik nije nalaz nego razlog da alat stane, jer bi inače pao na `undefined`
 * usred T1 i prijavio nešto što nema veze sa stvarnim problemom.
 * @throws {Error} sa svim problemima odjednom
 */
export function assertShape(storyboard, episode) {
  const bad = [];
  const has = (o, k) => o !== null && typeof o === 'object' && k in o;

  if (storyboard === null || typeof storyboard !== 'object') throw new Error('storyboard.json nije objekat');
  for (const k of ROOT_FIELDS) if (!has(storyboard, k)) bad.push(`storyboard.json: nedostaje ${k}`);
  if (!Array.isArray(storyboard.beats) || !storyboard.beats.length) {
    bad.push('storyboard.json: beats mora da bude niz sa bar jednim beatom');
  }
  if (typeof storyboard.fps !== 'number' || !(storyboard.fps > 0)) {
    bad.push('storyboard.json: fps nije pozitivan broj');
  }

  for (const b of Array.isArray(storyboard.beats) ? storyboard.beats : []) {
    const bid = b?.beat_id ?? '(bez beat_id)';
    for (const k of BEAT_FIELDS) if (!has(b, k)) bad.push(`beat ${bid}: nedostaje ${k}`);
    if (!Array.isArray(b?.shots) || !b.shots.length) {
      bad.push(`beat ${bid}: shots mora da bude niz sa bar jednim shotom`);
      continue;
    }
    for (const s of b.shots) {
      const sid = s?.shot_id ?? '(bez shot_id)';
      for (const k of SHOT_FIELDS) if (!has(s, k)) bad.push(`shot ${sid}: nedostaje ${k}`);
      if (has(s, 'characters') && !Array.isArray(s.characters)) bad.push(`shot ${sid}: characters nije niz`);
      // Šest osa iz §3.5 su ulaz za R1 i R2. Kad ih nema, `undefined === undefined` bi značilo
      // „shotovi dele osu" — R1 bi merio ništa i ćutao, što je gore od pada.
      if (!has(s, 'tags') || s.tags === null || typeof s.tags !== 'object') {
        bad.push(`shot ${sid}: nedostaje tags`);
      } else {
        for (const k of R1_AXES) {
          if (typeof s.tags[k] !== 'string') bad.push(`shot ${sid}: tags.${k} nije string`);
        }
      }
    }
  }

  for (const k of ['characters', 'locations', 'key_props']) {
    if (!Array.isArray(episode?.[k])) bad.push(`episode.json: ${k} nije niz`);
  }

  if (bad.length) {
    throw new Error(`ulaz nije upotrebljiv za lint (${bad.length}):\n` + bad.map((b) => '  - ' + b).join('\n'));
  }
}

/** Registar zaključanih opisa: id -> entitet, preko sva tri niza (schemas.md §4, C1). */
export function entityIndex(episode) {
  return new Map(
    [...episode.characters, ...episode.locations, ...episode.key_props].map((e) => [e.id, e]),
  );
}

/**
 * Sadržaj jednog bloka image prompta, od `NAZIV:` do sledećeg naziva bloka ili kraja teksta.
 * Vraća `null` kad bloka nema. Nosi S5 (PRIMARY lock mora da stoji baš u `SUBJECT`) i R6.
 */
export function promptBlock(prompt, name) {
  const isHeader = (l) => {
    const c = l.indexOf(':');
    if (c < 1) return false;
    const head = l.slice(0, c);
    return head === head.toUpperCase() && head !== head.toLowerCase();
  };
  const lines = String(prompt).split(String.fromCharCode(10)).map((l) => l.trim());
  const i = lines.findIndex((l) => l.startsWith(name + ':'));
  if (i < 0) return null;
  const out = [lines[i].slice(name.length + 1)];
  for (let j = i + 1; j < lines.length && !isHeader(lines[j]); j++) out.push(lines[j]);
  return out.join(' ').trim();
}

/** Da li tekst imenuje entitet — po `name`, ili po `id` sa crticama pretvorenim u razmake. */
const namesEntity = (text, e) => {
  const t = normalize(text);
  return t.includes(normalize(e.name)) || t.includes(normalize(String(e.id).split('-').join(' ')));
};

// ---------------------------------------------------------------- T1

/**
 * Pokrivenost tajmlajna. Gap i preklapanje se vide samo preko `t_in`/`t_out` — iz `use_*`
 * koordinata (pozicija unutar Flow klipa) ne mogu, zato schemas.md §3.3 drži dve ose.
 */
function checkT1(storyboard) {
  const out = [];
  const fps = storyboard.fps;
  let cursor = 0; // invarijanta 7: tajmlajn počinje na 0.0

  for (const b of storyboard.beats) {
    const first = b.shots[0];
    const last = b.shots.at(-1);
    if (!near(first.t_in, q(b.start, fps))) {
      out.push(finding('T1', `beat ${b.beat_id}`,
        `prvi shot počinje na ${fmt(first.t_in)}s, a beat na ${fmt(q(b.start, fps))}s`,
        `${fmt(first.t_in)}s`, `q(beat.start) = ${fmt(q(b.start, fps))}s`));
    }
    if (!near(last.t_out, q(b.end, fps))) {
      out.push(finding('T1', `beat ${b.beat_id}`,
        `poslednji shot se završava na ${fmt(last.t_out)}s, a beat na ${fmt(q(b.end, fps))}s`,
        `${fmt(last.t_out)}s`, `q(beat.end) = ${fmt(q(b.end, fps))}s`));
    }

    for (const s of b.shots) {
      const where = `shot ${s.shot_id}`;
      if (!near(s.t_in, cursor)) {
        const d = round3(s.t_in - cursor);
        out.push(finding('T1', where,
          `${d > 0 ? 'gap' : 'preklapanje'} od ${fmt(Math.abs(d))}s — t_in ${fmt(s.t_in)}s, ` +
          `a prethodni shot se završava na ${fmt(cursor)}s`,
          `t_in = ${fmt(s.t_in)}s`, `${fmt(cursor)}s (tajmlajn bez rupa)`));
      }
      if (!near(s.t_out, s.t_in + s.use_len)) {
        out.push(finding('T1', where,
          `t_out ${fmt(s.t_out)}s != t_in + use_len (${fmt(s.t_in)} + ${fmt(s.use_len)})`,
          `t_out = ${fmt(s.t_out)}s`, `${fmt(round3(s.t_in + s.use_len))}s`));
      }
      if (!near(s.use_out, s.use_in + s.use_len)) {
        out.push(finding('T1', where,
          `use_out ${fmt(s.use_out)}s != use_in + use_len (${fmt(s.use_in)} + ${fmt(s.use_len)})`,
          `use_out = ${fmt(s.use_out)}s`, `${fmt(round3(s.use_in + s.use_len))}s`));
      }
      cursor = s.t_out;
    }
  }

  const sum = round3(storyboard.beats.flatMap((b) => b.shots).reduce((a, s) => a + s.use_len, 0));
  const drift = round3(Math.abs(sum - storyboard.narration_duration));
  if (drift > LIMITS.t1Drift) {
    out.push(finding('T1', 'episode',
      `sum(use_len) ${fmt(sum)}s vs narration_duration ${fmt(storyboard.narration_duration)}s ` +
      `— drift ${fmt(drift)}s`,
      `${fmt(drift)}s`, `≤ ${LIMITS.t1Drift}s`));
  }
  return out;
}

// ---------------------------------------------------------------- provere po shotu

const MOTION_LINE = /MOTION BUDGET:[^\n]*?(\d+(?:\.\d+)?)\s*s\b/i;

function checkShot(shot, { lists, entities, v = 1 }) {
  const out = [];
  const where = `shot ${shot.shot_id}`;
  const { min: uMin, max: uMax } = LIMITS.useLen;

  // T2 — use_len u granicama
  if (shot.use_len < uMin - EPS || shot.use_len > uMax + EPS) {
    out.push(finding('T2', where,
      `use_len ${fmt(shot.use_len)}s — izvan granica ${uMin.toFixed(1)}–${uMax.toFixed(1)}`,
      `${fmt(shot.use_len)}s`, `${uMin.toFixed(1)}–${uMax.toFixed(1)}s`));
  }

  // T3 — motion_budget kad se pokret mora ugurati u manje od 9s
  if (shot.use_len < LIMITS.motionBelow - EPS) {
    if (shot.motion_budget === null) {
      out.push(finding('T3', where,
        `motion_budget je null, a use_len je ${fmt(shot.use_len)}s`,
        'null', `${fmt(shot.use_len)}s (= use_len)`));
    } else if (!near(shot.motion_budget, shot.use_len)) {
      out.push(finding('T3', where,
        `motion_budget ${fmt(shot.motion_budget)}s != use_len ${fmt(shot.use_len)}s`,
        `${fmt(shot.motion_budget)}s`, `${fmt(shot.use_len)}s`));
    }
  }
  if (shot.motion_budget !== null) {
    // prompt-templates.md: MOTION BUDGET linija nosi isti broj kao shot.motion_budget
    const m = String(shot.animation_prompt).match(MOTION_LINE);
    if (!m) {
      out.push(finding('T3', where,
        'animation prompt nema MOTION BUDGET liniju sa brojem sekundi',
        'nema linije', `MOTION BUDGET: … ${fmt(shot.motion_budget)}s`));
    } else if (!near(Number(m[1]), shot.motion_budget)) {
      out.push(finding('T3', where,
        `MOTION BUDGET u promptu kaže ${m[1]}s, a motion_budget je ${fmt(shot.motion_budget)}s`,
        `${m[1]}s`, `${fmt(shot.motion_budget)}s`));
    }
  }

  // S1 — zabranjene prostorne fraze bez screen-position klauzule.
  // Promptovi se gledaju odvojeno: klauzula na početku animation prompta ne sme da otključa
  // frazu sa kraja image prompta, jer to nije ista rečenica.
  for (const [field, text] of [['image', shot.image_prompt], ['animation', shot.animation_prompt]]) {
    for (const v of s1Violations(text, lists)) {
      out.push(finding('S1', where,
        `${field} prompt: "${v.phrase}" bez screen-position klauzule — „${v.segment}"`,
        `"${v.phrase}"`, 'ista rečenica nosi bar jedan token iz liste B (camera-language.md)'));
    }
  }

  // S2 — obavezni blokovi. Shema 2 uz pet kamera-blokova traži i SUBJECT i DETAIL.
  for (const blk of (v >= 2 ? S2_BLOCKS_V2 : S2_BLOCKS)) {
    if (!String(shot.image_prompt).includes(blk + ':')) {
      out.push(finding('S2', where, `image prompt nema blok ${blk}`,
        'nema bloka', `${blk}:`));
    }
  }

  // S3 — reči koje impliciraju rez unutar klipa
  for (const w of S3_WORDS) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(shot.animation_prompt)) {
      out.push(finding('S3', where,
        `animation prompt sadrži "${w}" — implicira rez unutar klipa`,
        `"${w}"`, 'napredovanje se izražava vremenskim prorezom, ne veznikom'));
    }
  }

  // P1 / P2 — dužine
  for (const [code, field, text, lim] of [
    ['P1', 'image', shot.image_prompt, v >= 2 ? LIMITS.imageWordsV2 : LIMITS.imageWords],
    ['P2', 'animation', shot.animation_prompt, LIMITS.animWords],
  ]) {
    const n = countWords(text);
    if (n < lim.min || n > lim.max) {
      out.push(finding(code, where,
        `${field} prompt ${n} reči — izvan granica ${lim.min}–${lim.max}`,
        `${n} reči`, `${lim.min}–${lim.max}`));
    }
  }

  // C1 — zaključani opis doslovno u image promptu
  for (const id of shot.characters) {
    const e = entities.get(id);
    if (!e) {
      out.push(finding('C1', where,
        `characters navodi "${id}", a taj entitet ne postoji u episode.json`,
        `"${id}"`, 'id iz episode.json (characters | locations | key_props)'));
      continue;
    }
    if (!normalize(shot.image_prompt).includes(normalize(e.locked_description))) {
      out.push(finding('C1', where,
        `locked_description entiteta "${id}" nije doslovno u image promptu`,
        'nema ga', `${countWords(e.locked_description)} reči iz episode.json, doslovno`));
    }
  }

  // S4 / S5 — hijerarhija vizuelne težine. Samo shema 2 (schemas.md §3.3).
  if (v >= 2) {
    const critical = shot.characters.map((id) => entities.get(id))
      .filter((e) => e && e.scale_critical === true);
    if (critical.length && !String(shot.image_prompt).includes('SCALE:')) {
      out.push(finding('S4', where,
        `entitet "${critical[0].id}" je scale_critical, a image prompt nema blok SCALE`,
        'nema bloka', 'SCALE: — 3–4 tvrdnje o veličini'));
    }

    if (shot.characters.length > LIMITS.maxLocks) {
      out.push(finding('S5', where,
        `${shot.characters.length} zaključanih entiteta — najviše ${LIMITS.maxLocks}`,
        `${shot.characters.length}`, `PRIMARY + najviše ${LIMITS.maxLocks - 1} SECONDARY`));
    }

    if (shot.characters.length) {
      const primary = entities.get(shot.characters[0]);
      const subject = promptBlock(shot.image_prompt, 'SUBJECT');
      if (primary && subject === null) {
        out.push(finding('S5', where, 'image prompt nema blok SUBJECT za PRIMARY lock',
          'nema bloka', 'SUBJECT:'));
      } else if (primary && !normalize(subject).includes(normalize(primary.locked_description))) {
        out.push(finding('S5', where,
          `PRIMARY lock "${primary.id}" nije doslovno u bloku SUBJECT`,
          'van SUBJECT bloka', 'ceo locked_description unutar SUBJECT:'));
      }

      const vp = shot.visual_priority;
      if (!Array.isArray(vp) || vp.length < 3 || vp.length > 5) {
        out.push(finding('S5', where,
          'visual_priority mora da bude rangirana lista od 3 do 5 stavki',
          Array.isArray(vp) ? `${vp.length} stavki` : 'nema polja', '3–5 stavki'));
      } else if (primary && !namesEntity(vp[0], primary)) {
        out.push(finding('S5', where,
          `visual_priority[0] ne imenuje PRIMARY lock "${primary.id}"`,
          `"${vp[0]}"`, `stavka koja imenuje ${primary.name}`));
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------- F1

/**
 * Svaki shot ima svoj klip i izvor traje bar do `use_out`, uz toleranciju od jednog frejma.
 *
 * Trajanje se meri na osi prvog dekodiranog sempla (`duration − start`), isto kao za
 * narraciju u C05 (schemas.md §5.4 tačka 1) — `ffmpeg -ss` nad izvorom računa odatle,
 * pa je i provera dostupnog materijala na toj osi.
 */
export async function checkF1(storyboard, dir, { probe: probeFn = probe } = {}) {
  const out = [];
  const tol = 1 / storyboard.fps;

  for (const b of storyboard.beats) {
    for (const s of b.shots) {
      const where = `shot ${s.shot_id}`;
      const file = path.join(dir, s.source_file);

      if (!fs.existsSync(file)) {
        out.push(finding('F1', where, `nema klipa ${s.source_file}`,
          'fajl ne postoji', `${s.source_file} ≥ ${fmt(s.use_out)}s`));
        continue;
      }

      let p;
      try {
        p = await probeFn(file);
      } catch (err) {
        out.push(finding('F1', where, `${s.source_file} se ne može pročitati: ${err.message.split('\n')[0]}`,
          'probe je pao', 'čitljiv video fajl'));
        continue;
      }

      if (p.duration === null) {
        out.push(finding('F1', where, `${s.source_file}: ffmpeg ne prijavljuje trajanje`,
          'duration = N/A', `≥ ${fmt(s.use_out)}s`));
        continue;
      }

      const available = round3(p.duration - (p.start ?? 0));
      if (available < s.use_out - tol) {
        out.push(finding('F1', where,
          `${s.source_file} traje ${fmt(available)}s, a use_out je ${fmt(s.use_out)}s`,
          `${fmt(available)}s`, `≥ ${fmt(s.use_out)}s (tolerancija 1 frejm)`));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- ADVISORY (C07)
//
// Kreativni signali. Mere se i prikazuju, nikad ne blokiraju — `advise()` ne dira exit code,
// a `main()` ga računa isključivo iz BLOCKING nalaza. Vodeće načelo izvornog plana:
// šumni linter koji stalno laje naučiš da ignorišeš. Zato R2 i R3 nemaju prag dok ne postoje
// podaci iz tri epizode, a R4 pre poređenja briše ono što je drugde propisano kao doslovno.

/**
 * ADVISORY signal nema `expected`. R2/R3/C2 su čiste mere bez praga, a R1/R4 mere ono što je
 * autor namerno napisao — „očekivana vrednost" bi bila režiserska odluka, ne činjenica.
 * @param {string} code jedan od ADVISORY
 * @param {string} where `shot 03 → 04` | `shot 03–06` | `episode`
 * @param {string} message ljudska rečenica sa izmerenom vrednošću
 * @param {string|number} measured
 */
const signal = (code, where, message, measured) =>
  ({ code, where, message, measured: String(measured) });

/** Svi shotovi epizode, ravno, u redosledu tajmlajna. */
export const flatShots = (storyboard) => storyboard.beats.flatMap((b) => b.shots);

// ---------------------------------------------------------------- R1

/**
 * Pravilo razlike. Izuzeće je iz schemas.md §3.4: shotovi istog `link_group` namerno dele
 * lokaciju, svetlo i subjekt jer su nastavak istog kadra, pa se niti porede niti ulančavaju
 * u eskalaciju. Poređenje ide na jednakost slugova — zato su `location` i `time_light`
 * slugovi, a ne slobodan tekst (§3.5).
 */
function checkR1(storyboard) {
  const shots = flatShots(storyboard);
  const linked = (a, b) => a.link_group !== null && a.link_group === b.link_group;
  const pairs = [];
  const escalations = [];

  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1];
    const b = shots[i];
    if (linked(a, b)) continue;
    const diff = R1_AXES.filter((k) => a.tags[k] !== b.tags[k]);
    if (diff.length > R1_MAX_DIFFERING) continue;
    pairs.push(signal('R1', `shot ${a.shot_id} → ${b.shot_id}`,
      diff.length === 0
        ? `dele svih ${R1_AXES.length} osa — nijedna se ne razlikuje`
        : `dele ${R1_AXES.length - 1} od ${R1_AXES.length} osa — razlikuje se samo ` +
          `${diff[0]} (${a.tags[diff[0]]} → ${b.tags[diff[0]]})`,
      `${R1_AXES.length - diff.length}/${R1_AXES.length} istih osa`));
  }

  // Eskalacija: 3+ uzastopna shota sa istim subject_type + location + time_light.
  // Lanac se prekida i na linkovanom paru, inače bi A/B/C lanac sam sebe eskalirao.
  let start = 0;
  for (let i = 1; i <= shots.length; i++) {
    const continues = i < shots.length
      && !linked(shots[i - 1], shots[i])
      && R1_ESCALATION_AXES.every((k) => shots[i - 1].tags[k] === shots[i].tags[k]);
    if (continues) continue;
    const run = shots.slice(start, i);
    if (run.length >= 3) {
      const t = run[0].tags;
      escalations.push(signal('R1', `shot ${run[0].shot_id}–${run.at(-1).shot_id}`,
        `eskalacija: ${run.length} uzastopna shota dele ` +
        R1_ESCALATION_AXES.map((k) => `${k}=${t[k]}`).join(' + '),
        `${run.length} shota`));
    }
    start = i;
  }

  return [...escalations, ...pairs];
}

// ---------------------------------------------------------------- R2, R3, C2

/** Miks tipova shotova. Samo mera — nula u nekoj koloni je isto podatak kao i broj. */
function checkR2(storyboard) {
  const shots = flatShots(storyboard);
  // Sve vrednosti enuma, pa i one sa nulom (§3.5); nepoznata vrednost pada na kraj i time se
  // sama vidi, umesto da tiho nestane u zbiru.
  const counts = new Map(TAGS.subject_type.map((v) => [v, 0]));
  for (const s of shots) counts.set(s.tags.subject_type, (counts.get(s.tags.subject_type) ?? 0) + 1);
  return [signal('R2', 'episode',
    `${shots.length} ${shots.length === 1 ? 'shot' : 'shotova'}: ` +
    [...counts].map(([v, n]) => `${n} ${v}`).join(', '),
    `${shots.length} shotova`)];
}

/** Upotrebljeni vizuelni uređaji. Samo lista — koliko ih treba je kreativna procena (§3.6). */
function checkR3(storyboard) {
  const used = new Map();
  let plain = 0;
  for (const b of storyboard.beats) {
    if (b.device === null || b.device === undefined) plain++;
    else used.set(b.device, (used.get(b.device) ?? 0) + 1);
  }
  const list = [...used].sort((a, b) => a[0].localeCompare(b[0], 'en')).map(([d, n]) => `${d} ×${n}`);
  return [signal('R3', 'episode',
    (list.length ? `korišćeni uređaji: ${list.join(', ')}` : 'korišćeni uređaji: nijedan') +
    ` · ${plain} od ${storyboard.beats.length} beatova bez uređaja (device: null)`,
    `${used.size} različitih`)];
}

/**
 * Broj multi-visual klipova. Meri se iz `animation_prompt`-a, ne iz zasebnog polja: klip je
 * multi-visual onda kad prompt to **deklariše** rečnikom iz visualPromptEngine.md §16/§30/§37
 * (fajl obrisan u C12; rečnik živi u contract.MULTI_VISUAL_MARKERS)
 * (`OPENING VISUAL`, `MIDDLE VISUAL`, …), verzalom, isto kao S2 blokovi. Samodeklarisani
 * boolean u JSON-u ne bi merio ništa — autor ga postavi na `false` i signal ćuti — a digao bi
 * i `schema_version` zbog signala koji samo prikazuje broj (schemas.md §5.2, zatvoreno u §5.6).
 */
function checkC2(storyboard) {
  const shots = flatShots(storyboard);
  const hits = shots.filter((s) =>
    MULTI_VISUAL_MARKERS.some((m) => String(s.animation_prompt).includes(m)));
  return [signal('C2', 'episode',
    `${hits.length} od ${shots.length} klipova je multi-visual` +
    (hits.length ? ` — ${hits.map((s) => `shot ${s.shot_id}`).join(', ')}` : ''),
    `${hits.length} klipova`)];
}

// ---------------------------------------------------------------- R4

/**
 * Fraze koje R4 briše iz oba prompta pre poređenja. Bez njih bi R4 lajao na svaki **ispravan**
 * storyboard, jer druga pravila zahtevaju doslovno ponavljanje:
 *
 *   1. `locked_description` iz `episode.json` — C1 (BLOCKING) traži da stoji doslovno u svakom
 *      shotu gde entitet učestvuje; 25–40 reči, pa svaki takav par shotova probija prag od 12.
 *   2. kanonski style string — `style-string.md` kaže da se kopira neizmenjen u svaki prompt.
 *   3. fiksne `PRESERVE` / `FORBID` linije — `prompt-templates.md` ih zove „fiksne linije, ne
 *      šablon za popunjavanje"; `PRESERVE` sama nosi tačno 13 reči, pa bi sama obarala R4.
 *
 * Prva dva izuzeća plan imenuje (C07 §⚠, schemas.md §4.1); treće je isti sudar iz istog razloga,
 * nađen na kanonskom primeru iz `prompt-templates.md` — vidi schemas.md §5.6.
 *
 * Na shemi 2 se istim pravom izuzimaju i blokovi `SCALE` i `DETAIL`, ali ne ovde: njihov
 * sadržaj je različit po shotu, pa ih `checkR4` čita po shotu umesto iz fiksne liste.
 * Duže fraze idu prve, da kraća sadržana fraza ne raspolovi dužu.
 */
export function r4Exemptions(episode, {
  styleString = loadStyleString(), fixedLines = loadFixedPromptLines(),
} = {}) {
  const locked = [...episode.characters, ...episode.locations, ...episode.key_props]
    .map((e) => e.locked_description);
  return [...locked, styleString, ...fixedLines]
    .map(r4Tokens).filter((t) => t.length)
    .sort((a, b) => b.length - a.length);
}

const matchAt = (seg, i, ph) => ph.every((t, k) => seg[i + k] === t);

/** Izbacuje frazu iz niza segmenata; rez deli segment na dva, pa n-gram ne može preko šava. */
function excise(segs, phrase) {
  const out = [];
  for (const seg of segs) {
    let i = 0;
    let start = 0;
    while (i + phrase.length <= seg.length) {
      if (matchAt(seg, i, phrase)) {
        if (i > start) out.push(seg.slice(start, i));
        i += phrase.length;
        start = i;
      } else i++;
    }
    if (start < seg.length) out.push(seg.slice(start));
  }
  return out;
}

/**
 * Barijera između dva segmenta: token sa razmakom na početku. `r4Tokens` deli po belini, pa
 * takav token ne može da nastane iz prompta i ne poklapa se ni sa čim osim sa samim sobom —
 * nijedan n-gram zato ne može da pređe preko mesta gde je izuzeta fraza izrezana.
 */
const BARRIER = (prompt, k) => ` ${prompt}:${k}`;

/** Tokeni prompta bez izuzetih fraza, u segmentima — susedstvo preko reza se ne broji. */
export function r4Segments(text, phrases) {
  let segs = [r4Tokens(text)];
  for (const ph of phrases) segs = excise(segs, ph);
  return segs.filter((s) => s.length);
}

/** Najduži zajednički neprekidni niz tokena. Barijere se nikad ne poklapaju, pa ih ne premošćuje. */
function longestCommonRun(a, b) {
  let best = 0;
  let end = 0;
  let prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) {
          best = cur[j];
          end = i;
        }
      }
    }
    prev = cur;
  }
  return a.slice(end - best, end);
}

/**
 * Ponavljanje n-grama između promptova. Porede se promptovi **različitih** shotova — image i
 * animation prompt istog shota idu dvama različitim generatorima i nikad se ne vide zajedno,
 * pa njihovo preklapanje ništa ne košta; preklapanje kroz shotove je ono od čega epizoda
 * izgleda isto od početka do kraja.
 */
function checkR4(storyboard, episode, opts) {
  const phrases = r4Exemptions(episode, opts);
  const v = storyboard.schema_version || 1;
  const prompts = [];
  for (const s of flatShots(storyboard)) {
    // Shema 2: SCALE i DETAIL su blokovi čiji je posao da se ponavljaju (style-string.md),
    // pa se izuzimaju iz R4 iz istog razloga kao style string i locked_description. Sadržaj
    // im je različit po shotu, pa se ne mogu izuzeti kao fiksna fraza — čitaju se po shotu.
    const extra = v >= 2
      ? ['SCALE', 'DETAIL'].map((b) => promptBlock(s.image_prompt, b))
        .filter(Boolean).map(r4Tokens).filter((t) => t.length)
      : [];
    const ph = extra.length
      ? [...phrases, ...extra].sort((a, b) => b.length - a.length)
      : phrases;
    for (const [field, text] of [['image', s.image_prompt], ['animation', s.animation_prompt]]) {
      const tokens = [];
      r4Segments(text, ph).forEach((seg, k) => {
        if (k) tokens.push(BARRIER(prompts.length, k));
        tokens.push(...seg);
      });
      prompts.push({ shot: s.shot_id, label: `shot ${s.shot_id} ${field}`, tokens });
    }
  }

  // Prefilter: DP se pušta samo nad parovima koji stvarno dele bar jedan n-gram pune dužine.
  const index = new Map();
  prompts.forEach((p, pi) => {
    const seen = new Set();
    for (let i = 0; i + R4_MIN_WORDS <= p.tokens.length; i++) {
      // Prozor koji sadrži barijeru se svejedno ne može poklopiti ni sa jednim drugim
      // promptom — barijera nosi indeks svog prompta — pa mu ovde ne treba zasebna grana.
      const key = p.tokens.slice(i, i + R4_MIN_WORDS).join(' ');
      if (seen.has(key)) continue;
      seen.add(key);
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(pi);
    }
  });

  const pairs = new Set();
  for (const list of index.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (prompts[list[i]].shot === prompts[list[j]].shot) continue;
        pairs.add(`${list[i]}:${list[j]}`);
      }
    }
  }

  const out = [];
  for (const key of [...pairs].sort((a, b) => a.localeCompare(b, 'en'))) {
    const [i, j] = key.split(':').map(Number);
    const run = longestCommonRun(prompts[i].tokens, prompts[j].tokens);
    const shown = run.length > 20 ? run.slice(0, 20).join(' ') + ' …' : run.join(' ');
    out.push(signal('R4', `${prompts[i].label} ↔ ${prompts[j].label}`,
      `${run.length} uzastopnih identičnih reči — „${shown}"`, `${run.length} reči`));
  }
  return out;
}

// ---------------------------------------------------------------- advise

export const sortSignals = (signals) => signals.slice()
  .sort((a, b) => ADVISORY.indexOf(a.code) - ADVISORY.indexOf(b.code));

// ---------------------------------------------------------------- R5

/**
 * Meki ciljni opseg P1. Tvrd plafon nosi P1 (BLOCKING); ovo meri samo raspodelu, da
 * generator ne bi ponovo počeo da puni prompt do plafona. Isključivo shema 2.
 */
function checkR5(storyboard) {
  if ((storyboard.schema_version || 1) < 2) return [];
  const { min, max } = LIMITS.imageSoft;
  return flatShots(storyboard)
    .map((sh) => [sh, countWords(sh.image_prompt)])
    .filter(([, n]) => n < min || n > max)
    .map(([sh, n]) => signal('R5', `shot ${sh.shot_id}`,
      `image prompt ${n} reči — izvan mekog opsega ${min}–${max}`, `${n} reči`));
}

// ---------------------------------------------------------------- R6

/**
 * `SCREEN DIRECTION` popunjen negacijom. Lista praznih formulacija se čita iz
 * camera-language.md (lista D), isto kao liste A i B za S1. Isključivo shema 2.
 */
function checkR6(storyboard, lists) {
  if ((storyboard.schema_version || 1) < 2) return [];
  const nulls = lists.nullDirection || [];
  const out = [];
  for (const sh of flatShots(storyboard)) {
    const dir = promptBlock(sh.image_prompt, 'SCREEN DIRECTION');
    if (dir === null) continue;
    const hit = nulls.find((p) => normalize(dir).includes(p));
    if (hit) {
      out.push(signal('R6', `shot ${sh.shot_id}`,
        `SCREEN DIRECTION ne imenuje nijedan pokret — „${dir}"`, `"${hit}"`));
    }
  }
  return out;
}

/**
 * Ceo ADVISORY sloj nad učitanim JSON-ovima. Ne vraća nalaze nego signale i **ne sme** da
 * učestvuje u exit code-u.
 * @param {{styleString?: string, fixedLines?: string[]}} [opts] izuzeća za R4; podrazumevano se
 *   čitaju iz docs/reference/ u vreme izvršavanja, isto kao S1 liste
 */
export function advise(storyboard, episode, opts = {}) {
  assertShape(storyboard, episode);
  const lists = opts.lists || loadCameraLanguage();
  return sortSignals([
    ...checkR1(storyboard),
    ...checkR2(storyboard),
    ...checkR3(storyboard),
    ...checkR4(storyboard, episode, opts),
    ...checkR5(storyboard),
    ...checkR6(storyboard, lists),
    ...checkC2(storyboard),
  ]);
}

// ---------------------------------------------------------------- lint

/**
 * BLOCKING sloj bez medija — devet provera koje su čista funkcija ulaznih JSON-ova.
 * @returns {{code:string, where:string, message:string, measured:string, expected:string}[]}
 */
export function lintStatic(storyboard, episode, { lists = loadCameraLanguage() } = {}) {
  assertShape(storyboard, episode);
  const entities = entityIndex(episode);
  const out = [...checkT1(storyboard)];
  for (const b of storyboard.beats) {
    const v = storyboard.schema_version || 1;
    for (const s of b.shots) out.push(...checkShot(s, { lists, entities, v }));
  }
  return sortFindings(out);
}

export const sortFindings = (findings) => findings.slice().sort((a, b) =>
  CHECKS.indexOf(a.code) - CHECKS.indexOf(b.code) || a.where.localeCompare(b.where, 'en'));

/**
 * Ceo BLOCKING sloj nad folderom epizode.
 * @param {string} dir folder epizode
 * @param {{media?: boolean, lists?: object, advisory?: object}} [opts] media:false preskače F1
 */
export async function lintEpisode(dir, {
  media = true, lists = loadCameraLanguage(), advisory = {}, ...f1
} = {}) {
  const sbFile = path.join(dir, 'storyboard.json');
  const epFile = path.join(dir, 'episode.json');
  for (const f of [epFile, sbFile]) {
    if (!fs.existsSync(f)) throw new Error(`nema ${slash(path.relative(process.cwd(), f)) || f}`);
  }
  const storyboard = JSON.parse(fs.readFileSync(sbFile, 'utf8'));
  const episode = JSON.parse(fs.readFileSync(epFile, 'utf8'));

  const findings = lintStatic(storyboard, episode, { lists });
  if (media) findings.push(...(await checkF1(storyboard, dir, f1)));

  // ADVISORY se računa odvojeno i nikad ne ulazi u `findings` — exit code je samo BLOCKING.
  const signals = advise(storyboard, episode, advisory);

  return { storyboard, episode, findings: sortFindings(findings), signals, media };
}

// ---------------------------------------------------------------- izveštaj

/**
 * Naslovi ADVISORY pododeljaka. Izveštaj se grupiše po kodu, ne po shotu — sa 30 signala
 * grupisanje po shotu postaje spisak koji niko ne pročita do kraja (C07, „Zamke").
 */
const ADVISORY_TITLES = {
  R1: 'pravilo razlike',
  R2: 'miks tipova shotova',
  R3: 'upotrebljeni vizuelni uređaji',
  R4: 'ponavljanje n-grama između promptova',
  R5: 'dužina image prompta izvan mekog opsega',
  R6: 'SCREEN DIRECTION bez imenovanog pokreta',
  C2: 'multi-visual klipovi',
};

/** Legenda: bez nje se ova dva merenja ne mogu ispravno pročitati. */
const ADVISORY_NOTES = {
  R4: 'Legenda: pre poređenja se iz oba prompta brišu svi `locked_description` iz `episode.json`, ' +
    'kanonski style string (`style-string.md`) i fiksne `PRESERVE`/`FORBID` linije ' +
    '(`prompt-templates.md`). C1 zahteva doslovno ponavljanje `locked_description`-a, pa bi bez ' +
    'tog izuzeća R4 lajao na svaki ispravan storyboard.',
  C2: 'Legenda: meri se deklaracija u `animation_prompt`-u (`OPENING VISUAL`, `MIDDLE VISUAL`, …), ' +
    'ne posebno polje u `storyboard.json`.',
};

/** Izveštaj sa dve strogo odvojene sekcije. ADVISORY ne utiče na exit code. */
export function renderReport({
  storyboard, findings, signals = [], media = true, generatedAt = new Date(),
}) {
  const shots = storyboard.beats.reduce((a, b) => a + b.shots.length, 0);
  const ts = generatedAt.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const blocking = findings.filter((f) => CHECKS.includes(f.code));

  const lines = [
    `# QA report — ${storyboard.episode}`,
    `Generated: ${ts} · storyboard: ${storyboard.beats.length} beatova, ${shots} shotova` +
      (media ? '' : ' · F1 preskočen (--no-media)'),
    '',
    `## BLOCKING  (${blocking.length} ${blocking.length === 1 ? 'nalaz' : 'nalaza'})`,
  ];
  if (blocking.length) {
    for (const f of blocking) lines.push(`- [${f.code}] ${f.where}: ${f.message}`);
  } else {
    lines.push('Nema nalaza.' + (media ? '' : ' (F1 nije pušten)'));
  }
  lines.push('',
    `## ADVISORY  (${signals.length} ${signals.length === 1 ? 'signal' : 'signala'})`,
    'Ne blokira i ne menja exit code. Brojevi se čitaju u kontekstu priče, ne mehanički;',
    'R2 i R3 namerno nemaju prag dok ne postoje podaci iz tri epizode.');

  for (const code of ADVISORY) {
    const of = signals.filter((sg) => sg.code === code);
    lines.push('', `### ${code} — ${ADVISORY_TITLES[code]}  (${of.length})`);
    if (of.length) for (const sg of of) lines.push(`- ${sg.where}: ${sg.message}`);
    else lines.push('Nema signala.');
    if (ADVISORY_NOTES[code]) lines.push('', ADVISORY_NOTES[code]);
  }
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------- CLI

const USAGE = `node tools/lint.mjs <folder-epizode> [opcije]

  Deterministički QA. Piše <folder>/qa-report.md sa dve sekcije: BLOCKING
  (deset provera; exit code 1 ako ima ijedan nalaz) i ADVISORY (pet
  kreativnih signala; nikad ne menja exit code).

  --no-media    preskoči F1 (klipovi još ne postoje — storyboard faza)
  --no-write    ne piši qa-report.md, samo ispiši nalaze
  -h, --help    ovaj tekst`;

export function parseArgs(argv) {
  const out = { dir: null, media: true, write: true, help: false };
  for (const a of argv) {
    if (a === '--no-media') out.media = false;
    else if (a === '--no-write') out.write = false;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('-')) throw new Error(`nepoznata opcija ${a}\n\n${USAGE}`);
    else if (out.dir === null) out.dir = a;
    else throw new Error(`višak argumenta ${a}\n\n${USAGE}`);
  }
  if (!out.help && !out.dir) throw new Error(`nedostaje folder epizode\n\n${USAGE}`);
  return out;
}

export async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(USAGE);
    return 0;
  }

  let dir = args.dir;
  if (!fs.existsSync(dir) && !dir.includes('/') && !dir.includes(path.sep)) {
    dir = path.join('episodes', dir);
  }
  if (!fs.existsSync(dir)) throw new Error(`folder epizode ne postoji: ${args.dir}`);

  const { storyboard, findings, signals, media } = await lintEpisode(dir, { media: args.media });
  const report = renderReport({ storyboard, findings, signals, media });

  if (args.write) {
    const outFile = path.join(dir, 'qa-report.md');
    fs.writeFileSync(outFile, report, 'utf8');
    console.log(`-> ${slash(outFile)}`);
  }

  const shots = storyboard.beats.reduce((a, b) => a + b.shots.length, 0);
  console.log(`${storyboard.episode} · ${storyboard.beats.length} beatova, ${shots} shotova` +
    (media ? '' : ' · F1 preskočen'));
  for (const f of findings) console.log(`  [${f.code}] ${f.where}: ${f.message}`);
  console.log(findings.length
    ? `BLOCKING: ${findings.length} ${findings.length === 1 ? 'nalaz' : 'nalaza'} ` +
      `(${[...new Set(findings.map((f) => f.code))].sort((a, b) => CHECKS.indexOf(a) - CHECKS.indexOf(b)).join(' ')})`
    : 'BLOCKING: 0 nalaza');

  for (const sg of signals) console.log(`  [${sg.code}] ${sg.where}: ${sg.message}`);
  console.log(`ADVISORY: ${signals.length} ${signals.length === 1 ? 'signal' : 'signala'} ` +
    `(${[...new Set(signals.map((sg) => sg.code))].sort((a, b) => ADVISORY.indexOf(a) - ADVISORY.indexOf(b)).join(' ')})` +
    ' — ne utiče na exit code');

  // Exit code je funkcija isključivo BLOCKING nalaza. To je cela poenta dva sloja.
  return findings.length ? 1 : 0;
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
