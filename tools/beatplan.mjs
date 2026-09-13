// tools/beatplan.mjs
//
// `timing.json` + beat mapa -> checkpoint blok na stdout, pa (uz `--write`) skelet
// `storyboard.json`-a sa praznim promptovima.
//
//   node tools/beatplan.mjs episodes/<slug> --beats beats.json
//   node tools/beatplan.mjs episodes/<slug> --beats beats.json --write
//   node tools/beatplan.mjs episodes/<slug> --beats beats.json --still --write
//
// `--still` menja granice reza **pre** nego što išta bude napisano (2.5–9.0s, cilj 5s umesto
// 8s) i piše skelet still kadrova (schemas.md §3.3.2). Bez toga still format nije dostižan:
// pisac bi dobio 27 rezova od 8s i ručno ih proglasio slikama.
//
// Zašto postoji (C12). `schemas.md` §3 kaže da `storyboard.json` piše „at-storyboard (kroz
// timeline.mjs)", ali `timeline.mjs` je čist modul bez fajl I/O — u repou nije postojalo ništa
// što od izmerenih tajminga i grupisanja rečenica pravi fajl. Skil je tu prazninu mogao da
// popuni samo ad-hoc skriptom po epizodi, a to je tačno ono na šta C12 upozorava: kod koji se
// iznova izmišlja nema testove i nema stabilan format.
//
// Podela posla, i ona je cela poenta ovog alata:
//
//   · **vremena** dolaze iz `planTimeline` — ovaj fajl ne računa nijednu granicu sam;
//   · **kreativne odluke** (grupisanje rečenica u beatove, `device`, `viewer_sees`) dolaze iz
//     beat mape koju piše čovek/`at-storyboard`;
//   · **prompti, tagovi, likovi i linkovanje** se ne popunjavaju — to je C14.
//
// Dve stvari koje alat namerno *ne* dozvoljava:
//
//   1. `narration_says` se **izvodi** iz `timing.json`, nikad ne prepisuje iz beat mape.
//      Skripta je zamrznuta posle rendera narracije; kad bi beat mapa smela da ponese svoj
//      tekst, prvi „samo ću malo da doteram rečenicu" tiho bi razišao `storyboard.json` i
//      `narration.mp3`, a to se otkriva tek na montaži.
//   2. Bez `--write` ništa ne dodiruje disk. Checkpoint je podrazumevano stanje, upis je
//      zaseban svestan korak — beat plan je usko grlo sistema i odobrava se pre nego što
//      nastane ijedan artefakt (C12, „Checkpoint na beat planu").
//
// Determinizam: nigde `new Date()` u građenju skeleta (vreme ulazi kao `generatedAt`), polja
// se ispisuju u kanonskom redosledu iz `contract.DISPLAY_FIELDS`, pa dva pokretanja nad istim
// ulazom daju bajt-identičan fajl — isto pravilo kao za `render.mjs` (schemas.md §5.7 tačka 3).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEVICES, LIMITS, R1_AXES, SLUG, TAGS, assertDisplayable, isStill, plural, round3,
} from './contract.mjs';
import { DEFAULTS, planTimeline } from './timeline.mjs';

/**
 * Granice reza za still epizodu (schemas.md §3.3.2). Min i max dolaze iz istog mesta odakle
 * ih uzima T2; cilj je zaseban broj, jer plafon nije cilj. `motionBelow: 0` isključuje
 * `motion_budget` — nema Veo modela kome bi se zadao.
 */
export const STILL_DEFAULTS = {
  minShot: LIMITS.stillUseLen.min,
  maxShot: LIMITS.stillUseLen.max,
  targetShot: 5.0,
  motionBelow: 0,
};

/** Ciljni opseg koji checkpoint meri, po režimu. Plafon nije cilj, pa se meri sredina. */
const TARGET_BAND = { clip: [7, 9], still: [4, 6] };

const slash = (p) => p.replace(/\\/g, '/');

/**
 * Tagovi nepopunjenog skeleta. Strukturno ispravni (prolaze enumeracije iz §3.5, pa
 * `render.mjs` i `shotlist.mjs` rade nad skeletom odmah), ali identični na svim shotovima —
 * pa R1 na njih laje čim se pusti `lint.mjs`. To je namerno: skelet ne sme da izgleda gotovo.
 * `tbd` prolazi SLUG regex, a nijedna epizoda nema lokaciju koja se tako zove.
 */
export const PLACEHOLDER_TAGS = Object.freeze({
  subject_type: 'environment',
  shot_size: 'MS',
  angle: 'eye',
  location: 'tbd',
  time_light: 'tbd',
  camera_motion: 'locked',
});

/** ISO 8601 UTC bez milisekundi — isti oblik koji `schemas.md` §3.1 traži za `generated_at`. */
export const stamp = (d = new Date()) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

// ---------------------------------------------------------------- beat mapa

/**
 * Učitava i proverava beat mapu. Format je namerno mali — sve što nije kreativna odluka
 * izvodi se iz `timing.json`-a.
 *
 * ```json
 * [
 *   { "beat_id": "B01", "sentences": ["S01", "S02"],
 *     "device": "animated-map",
 *     "viewer_sees": "ANIMATED MAP — granice se šire",
 *     "tags": { "location": "via-flaminia", "time_light": "dawn-overcast" } }
 * ]
 * ```
 *
 * `beat_id` sme da izostane i tada se izvodi iz redosleda; kad stoji, mora da odgovara
 * poziciji (invarijanta 2 traži `B01…Bnn` bez rupa, a mapa je jedino mesto gde rupa može
 * da nastane). `tags` je opcion i gazi samo navedene ose.
 *
 * @param {string} file
 * @returns {Array<{beat_id: string, sentences: string[], device: string|null, viewer_sees: string, tags: object}>}
 */
export function loadBeatMap(file) {
  if (!fs.existsSync(file)) throw new Error(`beat mapa ne postoji: ${slash(file)}`);

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${slash(file)} nije ispravan JSON: ${err.message}`);
  }

  const list = Array.isArray(raw) ? raw : raw?.beats;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`beat mapa mora da bude niz beatova ili { "beats": [...] } sa bar jednim beatom: ${slash(file)}`);
  }

  return list.map((b, i) => {
    const want = `B${String(i + 1).padStart(2, '0')}`;
    const id = b?.beat_id ?? want;
    const where = `beat ${id} (${i + 1}. u mapi)`;

    if (id !== want) throw new Error(`${where}: beat_id mora da bude ${want} — B01…Bnn idu redom, bez rupa`);
    if (!Array.isArray(b?.sentences) || b.sentences.length === 0) {
      throw new Error(`${where}: nema nijednu rečenicu`);
    }
    const device = b.device ?? null;
    if (device !== null && !DEVICES.includes(device)) {
      throw new Error(`${where}: nepoznat device "${device}" — katalog je ${DEVICES.join(' · ')} ili null`);
    }

    const tags = { ...PLACEHOLDER_TAGS };
    for (const [k, v] of Object.entries(b.tags ?? {})) {
      if (!R1_AXES.includes(k)) throw new Error(`${where}: tags.${k} nije jedna od šest osa (${R1_AXES.join(', ')})`);
      if (TAGS[k] && !TAGS[k].includes(v)) throw new Error(`${where}: tags.${k}="${v}" nije iz enumeracije`);
      if (!TAGS[k] && !SLUG.test(v)) throw new Error(`${where}: tags.${k}="${v}" nije normalizovan slug`);
      tags[k] = v;
    }

    return { beat_id: id, sentences: b.sentences, device, viewer_sees: b.viewer_sees ?? '', tags };
  });
}

// ---------------------------------------------------------------- skelet

/**
 * Sklapa skelet `storyboard.json`-a. Vremena su iz `planTimeline`; ovaj sloj ih samo
 * prepakuje u kanonski oblik i dodaje polja koja splitter ne poznaje.
 *
 * @param {object} timing raspakovan `timing.json`
 * @param {Array<object>} beatMap izlaz `loadBeatMap`-a
 * @param {{episode: string, generatedAt?: string, fps?: number}} opts
 * @returns {{storyboard: object, warnings: Array<object>}}
 */
export function buildStoryboard(timing, beatMap, opts = {}) {
  const fps = opts.fps ?? DEFAULTS.fps;
  // Granice reza se biraju **pre** nego što išta bude napisano: tempo reza je jedina stvar
  // koja odlučuje da li niz slika čita kao film ili kao slajdšou (schemas.md §3.3.2).
  const still = opts.still === true;
  const cut = still ? { fps, ...STILL_DEFAULTS } : { fps };
  const plan = planTimeline(timing, beatMap.map((b) => ({ beat_id: b.beat_id, sentences: b.sentences })), cut);
  const meta = new Map(beatMap.map((b) => [b.beat_id, b]));
  const text = new Map(timing.sentences.map((s) => [s.id, s.text ?? '']));

  const beats = plan.beats.map((b) => {
    // Podrazumevane vrednosti se primenjuju i ovde, ne samo u `loadBeatMap`: `buildStoryboard`
    // je javni ulaz i poziva se sa golom mapom (testovi, budući pozivaoci). Skelet sa
    // `tags: {}` prolazi kroz ovaj sloj a pada tek u `assertDisplayable`, tri koraka dalje.
    const src = meta.get(b.beat_id) ?? {};
    const m = {
      device: src.device ?? null,
      viewer_sees: src.viewer_sees ?? '',
      tags: { ...PLACEHOLDER_TAGS, ...(src.tags ?? {}) },
    };
    return {
      beat_id: b.beat_id,
      sentences: b.sentences,
      start: b.start,
      end: b.end,
      dur: b.dur,
      device: m.device,
      // Izvedeno iz timing.json, nikad iz mape — vidi zaglavlje fajla.
      narration_says: b.sentences.map((id) => text.get(id) ?? '').join(' ').trim(),
      viewer_sees: m.viewer_sees,
      shots: b.shots.map((s) => ({
        shot_id: s.shot_id,
        beat_id: b.beat_id,
        link_group: null,
        t_in: s.t_in,
        t_out: s.t_out,
        use_in: s.use_in,
        use_out: s.use_out,
        use_len: s.use_len,
        motion_budget: s.motion_budget,
        // `hold` je namerno najdosadnija vrednost, ne nasumična: skelet koji sam sebe
        // proglasi režiranim gori je od skeleta koji vidno traži da ga neko prođe.
        ...(still ? { render_mode: 'still', still_motion: 'hold' } : {}),
        source_file: still ? `shots/shot${s.shot_id}.jpeg` : s.source_file,
        ingredient_image: null,
        characters: [],
        visual_priority: [],
        image_prompt: '',
        animation_prompt: still ? null : '',
        tags: { ...m.tags },
      })),
    };
  });

  const storyboard = {
    // Nove epizode kreću na shemi 2 (schemas.md §3.3.1). Skelet zato nosi i prazan
    // `visual_priority`: polje koje se ne vidi u skeletu se ne popunjava ni kasnije.
    // Epizode zatečene na shemi 1 ostaju validne — linter bira pravila po ovom broju.
    schema_version: 2,
    episode: opts.episode,
    generated_at: opts.generatedAt ?? stamp(),
    narration_duration: round3(timing.duration),
    fps: plan.fps,
    beats,
  };

  return { storyboard, warnings: plan.warnings };
}

// ---------------------------------------------------------------- checkpoint

/** `41.2` -> `00:41.2`. Minut je uvek dvocifren — kolona brojeva se čita samo ako je poravnata. */
function clock(t) {
  const total = Math.max(0, Number(t));
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
}

/** Prelama tekst na `width`, uvlačeći svaki red posle prvog za `indent` razmaka. */
function wrap(text, width, indent) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const out = [];
  let line = words.shift();
  for (const w of words) {
    if (line.length + 1 + w.length > width) {
      out.push(line);
      line = w;
    } else line += ` ${w}`;
  }
  out.push(line);
  return out.map((l, i) => (i === 0 ? l : ' '.repeat(indent) + l));
}

/** Skraćuje na jedan red i lepi `…` — narracija beata ume da bude tri rečenice. */
function ellipsize(text, width) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  return s.length <= width ? s : `${s.slice(0, width - 1).trimEnd()}…`;
}

const LABEL = 16; // "NARRATION SAYS: " — po njemu se poravnava i "VIEWER SEES:"
const BODY = 62;

/**
 * Blok koji `at-storyboard` pokazuje na checkpointu. Format je ugovor prema korisniku
 * (C12, verifikacija 4) i pokriven je doslovnim testom — ne menjaj ga bez izmene testa.
 *
 * @param {object} storyboard
 * @param {Array<object>} warnings upozorenja `planTimeline`-a
 * @returns {string}
 */
export function checkpoint(storyboard, warnings = []) {
  const L = [];

  for (const b of storyboard.beats) {
    const n = b.shots.length;
    L.push(`${b.beat_id}  [${clock(b.start)}–${clock(b.end)}]  ${b.dur.toFixed(1)}s  ` +
      `→ ${n} ${plural(n, 'shot', 'shota', 'shotova')}`);
    L.push(`     NARRATION SAYS: "${ellipsize(b.narration_says, BODY)}"`);
    const sees = b.viewer_sees.trim() || '— nije popunjeno —';
    L.push(...wrap(sees, BODY, 5 + LABEL).map((l, i) => (i === 0 ? `     VIEWER SEES:    ${l}` : l)));
    L.push('');
  }

  const all = storyboard.beats.flatMap((b) => b.shots);
  const shots = all.length;
  const lens = all.map((s) => s.use_len);
  // Ciljni opseg zavisi od režima: 8s cilj nad slikama bi merio pogrešnu stvar.
  const stills = all.filter(isStill).length;
  const [lo, hi] = TARGET_BAND[stills * 2 > shots ? 'still' : 'clip'];
  const inTarget = lens.filter((v) => v >= lo && v <= hi).length;
  const used = storyboard.beats.map((b) => b.device).filter(Boolean);
  const tally = [...new Set(used)].map((d) => `${d} ×${used.filter((x) => x === d).length}`);

  L.push(`${storyboard.beats.length} ${plural(storyboard.beats.length, 'beat', 'beata', 'beatova')} · ` +
    `${shots} ${plural(shots, 'shot', 'shota', 'shotova')} · ` +
    `prosek ${(lens.reduce((a, v) => a + v, 0) / lens.length).toFixed(2)}s · ` +
    `${inTarget}/${shots} u ciljnom opsegu ${lo}–${hi}s`);
  if (stills) {
    L.push(`režim: ${stills} still · ${shots - stills} ` +
      `${plural(shots - stills, 'klip', 'klipa', 'klipova')} — slike su besplatne`);
  }
  L.push(`uređaji: ${tally.length ? tally.join(' · ') : 'nijedan'} · ` +
    `${storyboard.beats.length - used.length} od ${storyboard.beats.length} bez uređaja (device: null)`);

  if (warnings.length) {
    L.push('');
    L.push(`upozorenja splittera (${warnings.length}) — podaci, ne prekršaji sheme:`);
    for (const w of warnings) {
      const at = w.at === null || w.at === undefined ? '' : ` @ ${w.at}s`;
      L.push(`  ! [${w.code}] ${w.beat_id ?? 'episode'}${at}: ${w.message}`);
    }
  }

  return L.join('\n');
}

// ---------------------------------------------------------------- CLI

const USAGE = `node tools/beatplan.mjs <folder-epizode> --beats <mapa.json> [opcije]

  timing.json + beat mapa -> checkpoint blok, pa uz --write skelet storyboard.json-a
  sa praznim promptovima. Vremena dolaze iz timeline.mjs, kreativne odluke iz mape;
  narration_says se uvek izvodi iz timing.json (skripta je zamrznuta).

  --beats <fajl>        beat mapa: [{ beat_id, sentences, device, viewer_sees, tags }]
  --write               upiši <folder>/storyboard.json (bez ovoga: samo checkpoint)
  --still               epizoda od slika: rez 2.5–9.0s (cilj 5s), render_mode "still"
  --force               dozvoli prepisivanje postojećeg storyboard.json
  --generated-at <ISO>  vrednost za generated_at (podrazumevano: sada, UTC)
  -h, --help            ovaj tekst`;

export function parseArgs(argv) {
  const out = { dir: null, beats: null, write: false, force: false, still: false,
    generatedAt: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') out.write = true;
    else if (a === '--still') out.still = true;
    else if (a === '--force') out.force = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--beats') {
      if (!argv[i + 1] || argv[i + 1].startsWith('-')) throw new Error(`--beats traži putanju\n\n${USAGE}`);
      out.beats = argv[++i];
    } else if (a === '--generated-at') {
      if (!argv[i + 1]) throw new Error(`--generated-at traži ISO 8601 vrednost\n\n${USAGE}`);
      out.generatedAt = argv[++i];
    } else if (a.startsWith('-')) throw new Error(`nepoznata opcija ${a}\n\n${USAGE}`);
    else if (out.dir === null) out.dir = a;
    else throw new Error(`višak argumenta ${a}\n\n${USAGE}`);
  }
  if (out.help) return out;
  if (!out.dir) throw new Error(`nedostaje folder epizode\n\n${USAGE}`);
  if (!out.beats) throw new Error(`nedostaje --beats <mapa.json>\n\n${USAGE}`);
  return out;
}

/** `episodes/<slug>` skraćenica radi isto kao u `lint.mjs` i `render.mjs`. */
function resolveDir(dir) {
  let d = dir;
  if (!fs.existsSync(d) && !d.includes('/') && !d.includes(path.sep)) d = path.join('episodes', d);
  if (!fs.existsSync(d)) throw new Error(`folder epizode ne postoji: ${dir}`);
  return d;
}

export function main(argv, io = {}) {
  const log = io.log ?? console.log;
  const args = parseArgs(argv);
  if (args.help) {
    log(USAGE);
    return 0;
  }

  const dir = resolveDir(args.dir);

  const timingFile = path.join(dir, 'timing.json');
  if (!fs.existsSync(timingFile)) {
    throw new Error(`nema timing.json u ${slash(dir)} — pusti prvo:\n  node tools/align.mjs ${slash(dir)}`);
  }
  const timing = JSON.parse(fs.readFileSync(timingFile, 'utf8'));

  // Slug iz manifesta kad postoji (invarijanta 1 traži poklapanje), inače ime foldera.
  const epFile = path.join(dir, 'episode.json');
  const episode = fs.existsSync(epFile)
    ? (JSON.parse(fs.readFileSync(epFile, 'utf8')).slug ?? path.basename(path.resolve(dir)))
    : path.basename(path.resolve(dir));

  const beatMap = loadBeatMap(args.beats);
  const { storyboard, warnings } = buildStoryboard(timing, beatMap, {
    episode,
    generatedAt: args.generatedAt ?? stamp(),
    still: args.still,
  });
  assertDisplayable(storyboard);

  log(checkpoint(storyboard, warnings));

  const outFile = path.join(dir, 'storyboard.json');
  if (!args.write) {
    log('');
    log(`--write nije zadat: ništa nije upisano. Kad plan bude odobren -> ${slash(outFile)}`);
    return 0;
  }
  if (fs.existsSync(outFile) && !args.force) {
    throw new Error(`${slash(outFile)} već postoji — ponovi sa --force ako zaista treba da se prepiše.\n` +
      'Skelet gazi promptove; kad su prompti već napisani, ovo je gubitak posla.');
  }

  fs.writeFileSync(outFile, `${JSON.stringify(storyboard, null, 2)}\n`, 'utf8');
  log('');
  log(`-> ${slash(outFile)}  (promptovi prazni, tagovi placeholder — popunjava se u C14)`);
  return 0;
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
