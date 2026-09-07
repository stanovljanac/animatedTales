// tests/check-fixtures.mjs
//
// Izvršni oblik ugovora iz docs/reference/schemas.md.
// Čita tests/fixtures/{episode,timing,storyboard}.sample.json i proverava svaku invarijantu
// iz sekcija 1–3, plus svaku BLOCKING proveru iz sekcije 4.
//
//   node tests/check-fixtures.mjs
//
// C06 (lint.mjs) polazi odavde: iste funkcije countWords/normalize/q, isti pragovi.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures');

// ---- kanonski helperi i rečnici (schemas.md 0.2, 0.6, 0.7, 3.5, 3.6) ----
// Jedna definicija za ceo lanac živi u tools/contract.mjs; ovde se re-eksportuje zbog
// potrošača koji su ih uvozili odavde.
import {
  DEVICES, EPS, LIMITS, S2_BLOCKS, S2_BLOCKS_V2, S3_WORDS, SLUG, TAGS,
  countWords, isFrameAligned, loadCameraLanguage, normalize, q, s1Violations,
} from '../tools/contract.mjs';

export { countWords, normalize, q, isFrameAligned };

// S1 liste dolaze iz docs/reference/camera-language.md (C06), ne iz koda.
const S1_LISTS = loadCameraLanguage();

const errs = [];
const ok = (cond, msg) => { if (!cond) errs.push(msg); };
const near = (a, b) => Math.abs(a - b) < EPS;

const episode = JSON.parse(fs.readFileSync(path.join(FIX, 'episode.sample.json'), 'utf8'));
const timing = JSON.parse(fs.readFileSync(path.join(FIX, 'timing.sample.json'), 'utf8'));
const sb = JSON.parse(fs.readFileSync(path.join(FIX, 'storyboard.sample.json'), 'utf8'));
const fps = sb.fps;

// ---- episode.json (schemas.md 1) ----
ok(SLUG.test(episode.slug), 'episode.slug nije kebab slug');
ok(['draft', 'in-progress', 'done'].includes(episode.status), 'episode.status van enuma');
for (const k of ['voice', 'narration_file', 'final_file', 'endcard_file'])
  ok(k in episode, `episode.json: nedostaje polje ${k} (obavezna polja su uvek prisutna, makar kao null)`);

const entities = [...episode.characters, ...episode.locations, ...episode.key_props];
const byId = new Map(entities.map((e) => [e.id, e]));
ok(byId.size === entities.length, 'entity id nije jedinstven preko sva tri niza');
for (const e of entities) {
  ok(SLUG.test(e.id), `entity ${e.id}: id nije kebab slug`);
  ok(typeof e.name === 'string' && e.name.length > 0, `entity ${e.id}: nema name`);
  const n = countWords(e.locked_description);
  ok(n >= 25 && n <= 40, `entity ${e.id}: locked_description ${n} reči (traži se 25–40)`);
}

// ---- storyboard.json (schemas.md 3) ----
// Ugovor od C14 ima dve verzije (schemas.md §3.3.1). Fixture je skelet za **nove** epizode, pa
// stoji na shemi 2; pravila koja se razlikuju biraju se ovde po istom broju po kom ih bira linter.
ok([1, 2].includes(sb.schema_version), 'schema_version nije 1 ni 2');
const V2 = sb.schema_version >= 2;
const P1_LIMIT = V2 ? LIMITS.imageWordsV2 : LIMITS.imageWords;
const BLOCKS = V2 ? S2_BLOCKS_V2 : S2_BLOCKS;
ok(sb.episode === episode.slug, 'storyboard.episode != episode.slug');
ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(sb.generated_at), 'generated_at nije ISO 8601 UTC');
ok(sb.beats.length >= 1, 'nema beatova');

const shots = sb.beats.flatMap((b) => b.shots);
ok(shots.some((s) => s.link_group !== null), 'fixture nema nijedan link_group par');
ok(shots.some((s) => s.link_group === null), 'fixture nema nijedan samostalan shot');

let cursor = 0;
sb.beats.forEach((b, bi) => {
  ok(b.beat_id === 'B' + String(bi + 1).padStart(2, '0'), `${b.beat_id}: beat_id van redosleda`);
  ok(b.shots.length >= 1, `${b.beat_id}: nema shotova`);
  ok(b.sentences.length >= 1, `${b.beat_id}: nema rečenica`);
  ok(near(b.dur, b.end - b.start), `${b.beat_id}: dur != end - start`);
  ok(b.device === null || DEVICES.includes(b.device), `${b.beat_id}: device "${b.device}" van kataloga`);
  ok(typeof b.narration_says === 'string' && b.narration_says.length > 0, `${b.beat_id}: prazan narration_says`);
  ok(typeof b.viewer_sees === 'string' && b.viewer_sees.length > 0, `${b.beat_id}: prazan viewer_sees`);
  // invarijanta 6
  ok(near(b.shots[0].t_in, q(b.start, fps)), `${b.beat_id}: prvi t_in != q(beat.start)`);
  ok(near(b.shots.at(-1).t_out, q(b.end, fps)), `${b.beat_id}: poslednji t_out != q(beat.end)`);
  const sumBeat = b.shots.reduce((a, s) => a + s.use_len, 0);
  ok(near(sumBeat, q(b.end, fps) - q(b.start, fps)), `${b.beat_id}: zbir use_len ne pokriva beat`);

  for (const s of b.shots) {
    const id = `shot ${s.shot_id}`;
    ok(/^\d{2,}$/.test(s.shot_id), `${id}: shot_id nije string sa vodećom nulom`);
    ok(s.beat_id === b.beat_id, `${id}: beat_id ne odgovara roditelju`);
    ok(s.link_group === null || s.link_group === b.beat_id, `${id}: link_group prelazi granicu beata`);

    // invarijante 7–10 / T2 / T3
    ok(near(s.t_in, cursor), `${id}: t_in ${s.t_in} ne nastavlja tajmlajn na ${cursor} (T1: gap/preklapanje)`);
    ok(near(s.t_out, s.t_in + s.use_len), `${id}: t_out != t_in + use_len`);
    ok(near(s.use_out, s.use_in + s.use_len), `${id}: use_out != use_in + use_len`);
    ok(s.use_len >= 3.0 && s.use_len <= 10.0, `${id}: T2 use_len ${s.use_len} van 3.0–10.0`);
    for (const [k, v] of Object.entries({ t_in: s.t_in, t_out: s.t_out, use_in: s.use_in, use_out: s.use_out, use_len: s.use_len }))
      ok(isFrameAligned(v, fps), `${id}: ${k}=${v} nije frejm-poravnato na ${fps}fps`);
    ok(s.use_len >= 9.0 || s.motion_budget !== null, `${id}: T3 motion_budget nedostaje (use_len ${s.use_len} < 9.0)`);
    if (s.motion_budget !== null) ok(near(s.motion_budget, s.use_len), `${id}: motion_budget != use_len`);

    // invarijanta 13 / F1 (postojanje fajla proverava assemble.mjs nad pravom epizodom)
    ok(s.source_file === `shots/part${s.shot_id}.mp4`, `${id}: source_file ne prati konvenciju`);
    ok(s.ingredient_image === null || s.ingredient_image === `images/shot${s.shot_id}.jpeg`,
      `${id}: ingredient_image ne prati konvenciju`);

    // tags (3.5)
    ok(Object.keys(s.tags).length === 6, `${id}: tags nema tačno šest osa`);
    for (const [k, allowed] of Object.entries(TAGS))
      ok(allowed.includes(s.tags[k]), `${id}: tags.${k}="${s.tags[k]}" van enuma`);
    for (const k of ['location', 'time_light'])
      ok(SLUG.test(s.tags[k]), `${id}: tags.${k}="${s.tags[k]}" nije normalizovan slug`);

    // P1 / P2
    const pi = countWords(s.image_prompt), pa = countWords(s.animation_prompt);
    ok(pi >= P1_LIMIT.min && pi <= P1_LIMIT.max,
      `${id}: P1 image_prompt ${pi} reči (${P1_LIMIT.min}–${P1_LIMIT.max})`);
    ok(pa >= LIMITS.animWords.min && pa <= LIMITS.animWords.max,
      `${id}: P2 animation_prompt ${pa} reči (${LIMITS.animWords.min}–${LIMITS.animWords.max})`);

    // S5: redosled `characters` nosi PRIMARY, i njegov lock mora da stoji baš u `SUBJECT` bloku.
    if (V2) {
      ok(Array.isArray(s.visual_priority) && s.visual_priority.length >= 3
        && s.visual_priority.length <= 5, `${id}: S5 visual_priority nije lista od 3–5 stavki`);
      ok(s.characters.length <= LIMITS.maxLocks,
        `${id}: S5 ${s.characters.length} lockova (najviše ${LIMITS.maxLocks})`);
    }

    // S1 / S2 / S3
    for (const blk of BLOCKS) ok(s.image_prompt.includes(blk + ':'), `${id}: S2 nedostaje blok ${blk}`);
    for (const text of [s.image_prompt, s.animation_prompt])
      for (const v of s1Violations(text, S1_LISTS))
        ok(false, `${id}: S1 zabranjena fraza "${v.phrase}" bez screen-position klauzule`);
    for (const w of S3_WORDS) ok(!new RegExp(`\\b${w}\\b`, 'i').test(s.animation_prompt), `${id}: S3 reč "${w}"`);

    // C1 + invarijanta 12
    for (const eid of s.characters) {
      ok(byId.has(eid), `${id}: nepoznat entitet "${eid}"`);
      if (byId.has(eid))
        ok(normalize(s.image_prompt).includes(normalize(byId.get(eid).locked_description)),
          `${id}: C1 locked_description za "${eid}" nije doslovno u image_prompt-u`);
    }

    cursor = s.t_out;
  }
});

// shot_id kontinuitet (invarijanta 2)
shots.forEach((s, i) => ok(s.shot_id === String(i + 1).padStart(2, '0'), `shot ${s.shot_id}: numeracija ima rupu`));

// T1
const sumUse = shots.reduce((a, s) => a + s.use_len, 0);
ok(Math.abs(sumUse - sb.narration_duration) <= 0.2,
  `T1: sum(use_len)=${sumUse.toFixed(3)} vs narration_duration=${sb.narration_duration}`);

// ---- timing.json (schemas.md 2) ----
// Fixture je izrezan iz stvarnog align.mjs run-a nad episodes/night-when-rome-almost-fell:
// prvih 6 rečenica sa svojim rečima, merena vremena, plus outro_start na poslednjoj.
const SENT_ID = /^S\d{2,}$/;
ok(typeof timing.duration === 'number' && timing.duration > 0, 'timing.duration nije pozitivan broj');
ok(['small.en', 'medium.en'].includes(timing.model), `timing.model "${timing.model}" van enuma`);
ok(Array.isArray(timing.sentences) && timing.sentences.length > 0, 'timing.sentences je prazan');
ok(Array.isArray(timing.words), 'timing.words nije niz');
ok('outro_start' in timing, 'timing.json: nedostaje outro_start (null je vrednost, ne odsustvo)');

let maxGap = 0;
timing.sentences.forEach((s, i) => {
  ok(SENT_ID.test(s.id), `timing ${s.id}: id nije oblika S01`);
  ok(s.id === 'S' + String(i + 1).padStart(2, '0'), `timing ${s.id}: numeracija ima rupu`);
  ok(s.end > s.start, `timing ${s.id}: end nije veće od start`);
  ok(near(s.dur, s.end - s.start), `timing ${s.id}: dur != end - start`);
  ok(typeof s.text === 'string' && s.text.length > 0, `timing ${s.id}: nema text`);
  ok(s.confidence >= 0 && s.confidence <= 1, `timing ${s.id}: confidence van 0–1`);
  const prev = timing.sentences[i - 1];
  if (prev) {
    // invarijanta 1
    ok(prev.end <= s.start + EPS, `timing ${s.id}: preklapa se sa ${prev.id}`);
    maxGap = Math.max(maxGap, s.start - prev.end);
  }
});
// invarijante 2 i 3
ok(maxGap <= 1.5 + EPS, `timing: gap od ${maxGap.toFixed(3)}s između rečenica (granica je 1.5s)`);
ok(timing.sentences[0].start >= 0, 'timing: prva rečenica počinje pre nule');
ok(timing.sentences.at(-1).end <= timing.duration + EPS,
  `timing: poslednja rečenica (${timing.sentences.at(-1).end}) prelazi duration ${timing.duration}`);
// invarijanta 5
ok(timing.outro_start === null || timing.sentences.some((s) => near(s.start, timing.outro_start)),
  'timing.outro_start ne pada na start nijedne rečenice');

const sentIds = new Set(timing.sentences.map((s) => s.id));
const sentById = new Map(timing.sentences.map((s) => [s.id, s]));
let wcursor = -Infinity;
for (const w of timing.words) {
  ok(sentIds.has(w.sentence_id), `timing: reč "${w.word}" pokazuje na nepostojeću rečenicu ${w.sentence_id}`);
  ok(typeof w.word === 'string' && w.word.length > 0, 'timing: reč bez teksta');
  ok(w.end >= w.start, `timing: reč "${w.word}" se završava pre nego što počne`);
  ok(w.confidence >= 0 && w.confidence <= 1, `timing: reč "${w.word}" ima confidence van 0–1`);
  ok(w.start >= wcursor - EPS, `timing: reči nisu u rastućem redosledu kod "${w.word}"`);
  wcursor = w.start;
  const s = sentById.get(w.sentence_id);
  if (s) {
    ok(w.start >= s.start - EPS && w.end <= s.end + EPS,
      `timing: reč "${w.word}" je van granica rečenice ${s.id}`);
  }
}

// ---- izveštaj ----
console.log(`episode.sample.json   ${entities.length} entiteta, locked_description: ` +
  entities.map((e) => `${e.id} ${countWords(e.locked_description)}`).join(' · '));
for (const s of shots)
  console.log(`shot ${s.shot_id}  P1=${countWords(s.image_prompt)}  P2=${countWords(s.animation_prompt)}` +
    `  use_len=${s.use_len}  t=${s.t_in.toFixed(3)}→${s.t_out.toFixed(3)}  link_group=${s.link_group}`);
console.log(`timing.sample.json     ${timing.sentences.length} rečenica, ${timing.words.length} reči, ` +
  `duration=${timing.duration}, najveći gap=${maxGap.toFixed(3)}s, ` +
  `ispod 0.85: ${timing.sentences.filter((s) => s.confidence < 0.85).length}`);
console.log(`T1  sum(use_len)=${sumUse.toFixed(3)}  narration_duration=${sb.narration_duration}` +
  `  drift=${(sb.narration_duration - sumUse).toFixed(3)}s`);

if (errs.length) {
  console.error(`\nFAIL — ${errs.length} prekršaja ugovora:\n` + errs.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('\nOK — fixture je usklađen sa docs/reference/schemas.md');
