// tools/assemble.mjs
//
// `storyboard.json` + klipovi + narracija + end card -> `final.mp4` (C09 jezgro + C10).
//
//   node tools/assemble.mjs episodes/<slug> [--dissolve 8] [--res 1080p] [--out final-new.mp4]
//
// Pet koraka iz docs/plan/C09-assemble-jezgro.md:
//   1. validacija — svaki shot ima svoj klip i izvor traje bar do `use_out`; pada pre rendera
//   2. po shotu — `-ss use_in -t use_len`, `-an` (Veo audio ide u đubre), scale+fps
//   3. konkatenacija — hard cut svuda osim unutar `link_group`-a (C10)
//   4. narracija — jedini audio stream, od `t=0`
//   5. end card — drži outro deo narracije + 1.5s repa
//
// Still kadrovi (schemas.md §3.3.2): shot sa `render_mode: "still"` nije klip nego jedna slika
// kojoj pokret kamere daje **ovaj alat** — `stillFilter` + `perspective` (ne `zoompan`, koji trza). Korak 2 zato ima tri
// grane umesto dve (klip, slika, end card), a validacija i QC mere sliku rezolucijom umesto
// trajanjem. Sve ostalo — plan rezova, dissolve, konkatenacija, mux — ne zna za razliku.
//
// Dopune iz docs/plan/C10-assemble-dissolve-qc.md:
//   6. `--dissolve N` — cross-dissolve od N frejmova između linked shotova **istog beata**.
//      Između beatova ostaje hard cut: rez na granici beata prati rez u priči.
//   7. `qc-report.md` — piše se uvek, i kad je sve u redu, i kad validacija padne.
//
// Tri stvari koje ovaj alat drže upotrebljivim:
//
//   1. **Nula tajmlajna je prvi dekodirani sempl** (schemas.md §5.4 tačka 1). Nigde `-copyts`,
//      nigde `-itsoffset`, nigde ručno oduzimanje `probe().start`. Alignment (C05) je počeo
//      odatle, pa mora i montaža — inače video i audio nose različit nulti trenutak.
//   2. **Međukorak na disku, ne jedan `filter_complex`.** Svaki shot je zaseban fajl u
//      `.cache/seg/`, uz recept po kojem je nastao. Zamena jednog `partNN.mp4` regeneriše
//      tačno taj segment; sve ostalo se preuzima iz keša. Idempotentnost je zahtev iz plana,
//      ne bonus, a jedan veliki prolaz je nema.
//   3. **Izlaz se ne prepisuje naslepo.** `final.mp4` u legacy epizodama je ručna montaža koju
//      niko ne može da vrati. Alat prepisuje samo fajl za koji u `.cache/assemble.json` ima
//      dokaz da ga je sam napravio; sve drugo traži `--out` ili `--force`.
//
// ffmpeg piše progres na stderr u desetinama kilobajta. `run()` ga skuplja u string i ovaj
// alat ga nikad ne prosleđuje dalje — u konzolu ide jedan red po shotu.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { EPS, STILL_MOTIONS, isStill, linkChains, plural, renderMode, round3 } from './contract.mjs';
import { probe, run } from './ffmpeg.mjs';

// ---------------------------------------------------------------- konstante

/** `--res` iz izvornog plana. 1440p i 2160p su upisani, ali upscale ostaje ručna odluka. */
export const RES = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '1440p': [2560, 1440],
  '2160p': [3840, 2160],
};

/** Izlazni profil iz plana: h264, yuv420p, CRF 18. */
export const ENCODE = {
  crf: 18,
  preset: 'medium',
  pix: 'yuv420p',
  audioBitrate: '192k',
  /** Isti timescale u svim segmentima — concat demuxer sa `-c copy` traži da se poklapaju. */
  timescale: 24000,
};

/** Rep end carda posle poslednje reči narracije (plan, korak 5). */
export const TAIL = 1.5;

/**
 * Koliko se zumira nad still kadrom (schemas.md §3.3.2).
 *
 * Konstanta, ne polje po shotu, iz istog razloga iz kog je `still_motion` zatvoren enum:
 * jedna vrednost daje jedan prepoznatljiv izgled epizode, a per-shot brojka daje 45 malo
 * različitih. Isti broj otvara i marginu po kojoj `pan-*` putuje — bez zuma je nema kuda,
 * jer je Flow slika 43:24, svega 1.4% šira od 16:9.
 *
 * **1.06, ne 1.15** (antikythera-mechanism, final-video01 — prihvaćeni template). Na 1.15 se
 * zum čita kao „slika se uvećava i klizi"; 1.06 sa ease-in-out daje pokret koji se oseća, a ne
 * gleda.
 */
export const STILL_ZOOM = 1.06;

/**
 * Međukanvas pre `perspective`-a, u odnosu na izlaz. Prozor se iseca na dvostrukom kanvasu i
 * posle fiksno smanjuje lanczos-om, pa je i ostatak greške interpolacije ispod pola izlaznog
 * piksela.
 */
export const STILL_SUPERSAMPLE = 2;

/** Jačina zvuka uvodnog klipa ispod narracije kad `episode.json` ne kaže drugačije. */
export const INTRO_VOLUME = 0.2;

/** Fade zvuka uvodnog klipa pred rez, u sekundama. */
export const INTRO_FADE = 0.3;

/** Trajanje cross-dissolve-a iz C10, u frejmovima. Zastava je podrazumevano isključena. */
export const DEFAULT_DISSOLVE = 8;

/** Ispod ovog udela iskorišćenog klipa shot je kandidat za regeneraciju (C10, qc-report). */
export const REGEN_SHARE = 0.5;

/** Ime QC izveštaja; jedno po epizodi, bez obzira na `--out`. */
export const QC_REPORT = 'qc-report.md';

/** Podrazumevana imena kad `episode.json` ne kaže drugačije. */
export const DEFAULT_NARRATION = 'narration.mp3';
export const DEFAULT_ENDCARD = 'endcard.jpeg';

const CACHE = '.cache';
const SEG = 'seg';
const STAMP = 'assemble.json';

// ---------------------------------------------------------------- oblik ulaza

/**
 * Polja koja montaža čita. Nije ni linterov `SHOT_FIELDS` ni `DISPLAY_FIELDS` iz C08:
 * montaža ne prikazuje prompt i ne meri reči, ali bez `t_in`/`t_out` ne zna gde pada outro.
 * Treći spisak je namerno treći (schemas.md §5.7 tačka 5).
 */
export const ASSEMBLE_FIELDS = {
  root: ['schema_version', 'episode', 'narration_duration', 'fps', 'beats'],
  beat: ['beat_id', 'shots'],
  shot: ['shot_id', 'source_file', 't_in', 't_out', 'use_in', 'use_out', 'use_len'],
};

const num = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Provera da se nad ovim dokumentom uopšte može montirati. Pada pre ijednog poziva ffmpeg-a
 * i skuplja sve probleme odjednom — render od nekoliko minuta koji stane na 30. shotu zbog
 * polja koje je falilo od početka je najskuplji mogući način da se to sazna.
 * @param {unknown} storyboard
 * @throws {Error}
 */
export function assertAssemblable(storyboard) {
  const bad = [];
  const has = (o, k) => o !== null && typeof o === 'object' && k in o;

  if (storyboard === null || typeof storyboard !== 'object') throw new Error('storyboard.json nije objekat');
  for (const k of ASSEMBLE_FIELDS.root) if (!has(storyboard, k)) bad.push(`storyboard.json: nedostaje ${k}`);
  // Tip se proverava samo kad polje postoji — inače bi jedan uzrok dao dva reda u istoj poruci.
  if (has(storyboard, 'fps') && (!num(storyboard.fps) || storyboard.fps <= 0)) {
    bad.push('storyboard.json: fps nije pozitivan broj');
  }
  if (has(storyboard, 'narration_duration')
    && (!num(storyboard.narration_duration) || storyboard.narration_duration <= 0)) {
    bad.push('storyboard.json: narration_duration nije pozitivan broj');
  }
  if (!Array.isArray(storyboard.beats) || !storyboard.beats.length) {
    bad.push('storyboard.json: beats mora da bude niz sa bar jednim beatom');
  }

  for (const b of Array.isArray(storyboard.beats) ? storyboard.beats : []) {
    const bid = b?.beat_id ?? '(bez beat_id)';
    for (const k of ASSEMBLE_FIELDS.beat) if (!has(b, k)) bad.push(`beat ${bid}: nedostaje ${k}`);
    if (!Array.isArray(b?.shots) || !b.shots.length) {
      bad.push(`beat ${bid}: shots mora da bude niz sa bar jednim shotom`);
      continue;
    }
    for (const s of b.shots) {
      const sid = s?.shot_id ?? '(bez shot_id)';
      for (const k of ASSEMBLE_FIELDS.shot) if (!has(s, k)) bad.push(`shot ${sid}: nedostaje ${k}`);
      for (const k of ['t_in', 't_out', 'use_in', 'use_out', 'use_len']) {
        if (has(s, k) && !num(s[k])) bad.push(`shot ${sid}: ${k} nije broj`);
      }
      if (has(s, 'source_file') && typeof s.source_file !== 'string') {
        bad.push(`shot ${sid}: source_file nije string`);
      }
      if (num(s?.use_len) && s.use_len <= 0) bad.push(`shot ${sid}: use_len nije pozitivan`);
    }
  }

  if (bad.length) {
    throw new Error(`storyboard.json se ne može montirati (${bad.length}):\n` + bad.map((b) => '  - ' + b).join('\n'));
  }
}

/**
 * Vremenska konzistentnost koju montaža koristi kao matematiku, ne kao ukras: `use_len` određuje
 * koliko se seče, a `t_in`/`t_out` gde to pada na tajmlajnu i time koji shotovi upadaju u outro.
 * Kad se to dvoje razilazi, montaža bi tiho isporučila pomeren video. Ovo su iste invarijante
 * koje meri `lint.mjs` (schemas.md §3.7, tačke 6–8) — ovde se ne mere ponovo nego se traži
 * da su zadovoljene, pa poruka i upućuje na linter.
 * @param {{shot_id: string, t_in: number, t_out: number, use_in: number, use_out: number, use_len: number}[]} shots
 * @returns {string[]} problemi, prazno kad je sve u redu
 */
export function timeProblems(shots) {
  const out = [];
  shots.forEach((s, i) => {
    if (Math.abs(s.t_out - s.t_in - s.use_len) > EPS) {
      out.push(`shot ${s.shot_id}: t_out - t_in (${round3(s.t_out - s.t_in)}) != use_len (${s.use_len})`);
    }
    if (Math.abs(s.use_out - s.use_in - s.use_len) > EPS) {
      out.push(`shot ${s.shot_id}: use_out - use_in (${round3(s.use_out - s.use_in)}) != use_len (${s.use_len})`);
    }
    if (s.use_in < -EPS) out.push(`shot ${s.shot_id}: use_in je negativan (${s.use_in})`);
    const prev = shots[i - 1];
    if (prev && Math.abs(s.t_in - prev.t_out) > EPS) {
      out.push(`shot ${s.shot_id}: t_in ${s.t_in} ne nastavlja t_out ${prev.t_out} shota ${prev.shot_id}`);
    }
  });
  if (shots.length && Math.abs(shots[0].t_in) > EPS) {
    out.push(`shot ${shots[0].shot_id}: tajmlajn ne počinje na 0 nego na ${shots[0].t_in}`);
  }
  return out;
}

// ---------------------------------------------------------------- ulazni fajlovi

/**
 * Imena narracije i end carda. Montaža jeste potrošač `episode.json`-a — za razliku od
 * formatera iz C08, kojima je manifest zabranjen (§5.7 tačka 1). Razlog je konkretan:
 * Marathon end card se zove `endKartica.jpeg`, a Rome narracija stoji pod `narration_file`.
 * Konvencija iz plana (`narration.mp3`, `endcard.jpeg`) ostaje kao rezerva kad manifesta nema.
 * @param {string} dir
 * @returns {{narration: string, endcard: string|null, source: string}}
 */
export function mediaNames(dir) {
  const file = path.join(dir, 'episode.json');
  if (!fs.existsSync(file)) {
    return { narration: DEFAULT_NARRATION, endcard: DEFAULT_ENDCARD, source: 'konvencija' };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file} nije ispravan JSON: ${err.message}`);
  }
  const pick = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback);
  return {
    narration: pick(manifest.narration_file, DEFAULT_NARRATION),
    // `endcard_file: null` je legitimna vrednost i znači „epizoda nema end card".
    endcard: manifest.endcard_file === null ? null : pick(manifest.endcard_file, DEFAULT_ENDCARD),
    source: 'episode.json',
  };
}

/**
 * Uvodni animirani klip iz `episode.json` (`intro_file`, opciono `intro_volume`). Kad postoji,
 * zamenjuje sliku **prvog** shota: iz klipa se uzima tačno onoliko frejmova koliko shot traje,
 * a zvuk klipa ide ispod narracije na `intro_volume` (podrazumevano `INTRO_VOLUME`).
 * Template iz antikythera-mechanism: still epizoda, animiran samo hook.
 * @returns {{file: string, volume: number} | null}
 */
export function introClip(dir) {
  const file = path.join(dir, 'episode.json');
  if (!fs.existsSync(file)) return null;
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (typeof manifest.intro_file !== 'string' || !manifest.intro_file.trim()) return null;
  const volume = num(manifest.intro_volume) ? manifest.intro_volume : INTRO_VOLUME;
  return { file: manifest.intro_file, volume };
}

/**
 * Pravilo template-a: **end card je poslednji shot.** Preuzima sliku na početku poslednjeg
 * shota i drži do kraja narracije + `TAIL`, umesto da pokrije ceo outro od `outro_start`-a.
 * `--outro-start` i dalje nadjačava.
 */
export function endcardStart(storyboard) {
  return storyboard.beats.flatMap((b) => b.shots).at(-1).t_in;
}

/**
 * Odakle dolazi `outro_start`. Kanonski izvor je `timing.json` (schemas.md §2.1); legacy
 * epizoda ga nema, pa plan traži da se za Marathon upiše ručno — otud i polje u korenu
 * `storyboard.json`-a i `--outro-start`. Redosled je od najeksplicitnijeg ka najtišem.
 * @returns {{value: number|null, source: string}}
 */
export function readOutroStart(dir, storyboard, cli = null) {
  if (cli !== null && cli !== undefined) return { value: cli, source: '--outro-start' };

  const file = path.join(dir, 'timing.json');
  if (fs.existsSync(file)) {
    let timing;
    try {
      timing = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new Error(`${file} nije ispravan JSON: ${err.message}`);
    }
    if ('outro_start' in timing) {
      return { value: timing.outro_start, source: 'timing.json' };
    }
  }

  if (num(storyboard.outro_start)) return { value: storyboard.outro_start, source: 'storyboard.json' };
  return { value: null, source: 'nema izvora' };
}

// ---------------------------------------------------------------- plan rezova

const frames = (t, fps) => Math.round(t * fps);

/**
 * Šta ide u video, po redu, u frejmovima.
 *
 * **End card drži outro.** Plan (korak 5) kaže da se `endcard.jpeg` drži koliko traje outro
 * deo narracije + 1.5s repa, a izvorni plan da outro „dobija zaseban end-card shot u montaži".
 * Dakle end card nije rep zalepljen posle svega nego slika koja stoji nad outro delom
 * narracije — CTA se vidi dok se čuje. Posledica koja se mora znati: splitter pokriva **sve**
 * rečenice, pa i outro (schemas.md §3.7 tačka 4), pa shotovi koji padnu iza `outro_start`
 * ovde otpadaju ili se kraćaju. To se prijavljuje, nikad ne ćuti.
 *
 * Bez `outro_start` (legacy epizoda bez skripte) end card je samo rep: `[kraj, kraj + 1.5s]`.
 * Ista formula, jedna grana manje.
 *
 * **Dissolve (C10)** ne dira ovu računicu. Linked shotovi se grupišu u jedan `chain` segment
 * čiji je broj frejmova zbir **baznih** frejmova delova — kompenzacija (a) iz plana vraća tačno
 * onoliko frejmova koliko `xfade` uzme, pa je `totalFrames` isti sa zastavom i bez nje.
 *
 * @param {object} storyboard već proveren sa `assertAssemblable`
 * @param {{outroStart?: number|null, tail?: number, endcard?: string|null,
 *          dissolveFrames?: number, sources?: Map|null}} [opts]
 */
export function planCuts(storyboard, opts = {}) {
  const {
    outroStart = null, tail = TAIL, endcard = DEFAULT_ENDCARD,
    dissolveFrames = 0, sources = null,
  } = opts;
  const fps = storyboard.fps;
  const shots = storyboard.beats.flatMap((b) => b.shots);
  const videoEnd = shots.at(-1).t_out;
  const narration = storyboard.narration_duration;

  // Rez na kojem end card preuzima sliku. Iza kraja poslednjeg shota nema šta da se seče.
  const cut = outroStart === null ? videoEnd : Math.min(outroStart, videoEnd);

  const shotSegments = [];
  const survivors = [];
  const dropped = [];
  const trimmed = [];

  for (const s of shots) {
    const full = s.use_len;
    const len = Math.min(full, cut - s.t_in);
    const n = frames(len, fps);
    if (n < 1) {
      dropped.push({ shot_id: s.shot_id, t_in: s.t_in, use_len: full });
      continue;
    }
    if (n < frames(full, fps)) {
      trimmed.push({ shot_id: s.shot_id, from: full, to: round3(n / fps) });
    }
    shotSegments.push({
      kind: 'shot',
      // Režim i pokret putuju sa segmentom, pa `build` bira granu bez ponovnog čitanja
      // storyboard-a — a lanac sme da meša režime, jer `xfade` radi nad segmentima.
      mode: renderMode(s),
      motion: isStill(s) ? s.still_motion : null,
      id: s.shot_id,
      name: `${s.shot_id}.mp4`,
      source: s.source_file,
      use_in: s.use_in,
      len: round3(n / fps),
      frames: n,
      t_in: s.t_in,
    });
    survivors.push(s);
  }

  const { segments, dissolve } =
    applyDissolve(shotSegments, survivors, { fps, frames: dissolveFrames, sources });

  // Kraj end carda je kraj narracije + rep, ali nikad pre kraja slike koja je već na ekranu.
  const endcardEnd = Math.max(narration, videoEnd) + tail;
  const endcardFrames = frames(Math.max(0, endcardEnd - cut), fps);
  if (endcard && endcardFrames >= 1) {
    segments.push({
      kind: 'endcard',
      id: 'endcard',
      name: 'endcard.mp4',
      source: endcard,
      use_in: 0,
      len: round3(endcardFrames / fps),
      frames: endcardFrames,
      t_in: round3(cut),
    });
  }

  const totalFrames = segments.reduce((a, s) => a + s.frames, 0);
  const duration = round3(totalFrames / fps);
  const hasEndcard = segments.at(-1)?.kind === 'endcard';
  return {
    fps,
    segments,
    dropped,
    trimmed,
    cut: round3(cut),
    outroStart,
    narration,
    tail: hasEndcard ? tail : 0,
    totalFrames,
    duration,
    /**
     * Koliko video traje do kraja narracije — jedini broj koji se sme porediti sa
     * `narration_duration`. Ukupno trajanje je za rep end carda duže i to nije drift.
     */
    coverage: hasEndcard ? round3(duration - tail) : duration,
    dissolve,
  };
}

// ---------------------------------------------------------------- dissolve (C10, korak 6)

/**
 * Grupisanje linked shotova u lance koje `xfade` spaja.
 *
 * **Odabrana je opcija (a) iz plana: kompenzacija trajanja.** `xfade` od N frejmova skraćuje
 * izlaz za N frejmova po prelazu; da se to ne sabere u drift, svaki deo lanca osim poslednjeg
 * dobija tačno N frejmova viška materijala iz sopstvenog izvora. Zbir baznih frejmova ostaje
 * netaknut, pa je plan sa zastavom i bez nje istog trajanja u frejm. Opcija (b) (prihvati
 * skraćenje pa pomeri audio) odbačena je jer bi pomerila nulu tajmlajna, a to je obaveza iz
 * schemas.md §5.4 tačke 1.
 *
 * **Višak se uzima sa repa, ne oko granice.** Plan kaže „produži za pola trajanja prelaza",
 * što po shotu važi samo za lanac od dva; lanac od tri traži 2N viška, a ne 3·N/2. Zato se
 * računa po granici, a ne po shotu, i celih N ide na rep levog dela. Simetrična varijanta
 * (N/2 sa svake strane) traži `use_in ≥ N/2`, a `use_in` je u praksi 0 — Marathon lanac B05
 * ima sva tri shota na `use_in: 0` i sa njom ne bi imao nijedan prelaz.
 *
 * Prelaz otpada tiho samo u kodu, nikad u izveštaju: svaki preskočeni ide u `skipped` sa
 * razlogom i završi u `qc-report.md`.
 *
 * @param {object[]} segs segmenti shotova, u redosledu tajmlajna
 * @param {object[]} shots isti shotovi (nose `link_group`)
 * @param {{fps: number, frames: number, sources: Map|null}} opts
 */
function applyDissolve(segs, shots, { fps, frames: D, sources }) {
  const applied = [];
  const skipped = [];
  if (!D || D <= 0 || segs.length < 2) {
    return { segments: segs, dissolve: { frames: D > 0 ? D : 0, applied, skipped, lost: 0 } };
  }

  const segById = new Map(segs.map((s) => [s.id, s]));
  const out = [];
  let extra = 0;

  for (const chain of linkChains(shots)) {
    const parts = chain.shots.map((s) => segById.get(s.shot_id));
    if (parts.length < 2) {
      out.push(...parts);
      continue;
    }

    // Granica preživljava samo kad oba dela imaju bar D frejmova i kad izvor levog dela
    // ima D frejmova rezerve iza svog reza. Bez mape izvora rezerva se ne proverava —
    // `planCuts` ostaje čista funkcija kad je pozvana bez nje.
    const keep = [];
    for (let i = 0; i + 1 < parts.length; i += 1) {
      const [a, b] = [parts[i], parts[i + 1]];
      const edge = { after: a.id, before: b.id, group: chain.group };
      const tooShort = [a, b].find((p) => p.frames <= D);
      if (tooShort) {
        keep.push(false);
        skipped.push({ ...edge, reason: `deo ${tooShort.id} je kraći od prelaza (${tooShort.frames} ≤ ${D} frejmova)` });
        continue;
      }
      if (sources) {
        const src = sources.get(a.source);
        const need = round3(a.use_in + (a.frames + D) / fps);
        const have = src && src.exists ? src.available : null;
        if (have === null || have < need - 1 / fps) {
          keep.push(false);
          skipped.push({ ...edge, reason: `nema rezerve u izvoru ${a.source} (treba do ${round3(need)}s, ima ${have === null ? '—' : `${have}s`})` });
          continue;
        }
      }
      keep.push(true);
    }

    // Preživele granice lepe delove u podlance; prekinuta granica deli lanac, ne ruši ga ceo.
    const runs = [];
    parts.forEach((p, i) => {
      if (i > 0 && keep[i - 1]) runs.at(-1).push(p);
      else runs.push([p]);
    });

    for (const run of runs) {
      if (run.length < 2) {
        out.push(run[0]);
        continue;
      }
      const last = run.length - 1;
      const withReserve = run.map((p, i) => {
        const n = i === last ? p.frames : p.frames + D;
        return { ...p, base: p.frames, frames: n, len: round3(n / fps) };
      });
      const total = run.reduce((a, p) => a + p.frames, 0);
      extra += withReserve.reduce((a, p) => a + p.frames, 0) - total;
      for (let i = 0; i < last; i += 1) {
        applied.push({ after: run[i].id, before: run[i + 1].id, group: chain.group, frames: D });
      }
      out.push({
        kind: 'chain',
        id: chain.group,
        name: `chain-${run[0].id}.mp4`,
        frames: total,
        len: round3(total / fps),
        t_in: run[0].t_in,
        dissolve: D,
        parts: withReserve,
      });
    }
  }

  // Ono što `xfade` uzme minus ono što je kompenzacija vratila. Nula je dokaz da (a) drži;
  // zakucana nula ne bi bila dokaz ničega.
  return { segments: out, dissolve: { frames: D, applied, skipped, lost: applied.length * D - extra } };
}

/**
 * Segmenti nad kojima se stvarno radi ffmpeg posao: lanac se zamenjuje svojim delovima.
 * Validacija i QC mere izvore, a lanac nema jedan izvor.
 */
export const renderUnits = (plan) =>
  plan.segments.flatMap((s) => (s.kind === 'chain' ? s.parts : [s]));

// ---------------------------------------------------------------- validacija (korak 1)

/**
 * Korak 1 iz plana: svaki shot ima svoj klip i izvor je ≥ `use_out`, plus narracija i end card
 * postoje. Vraća **sve** probleme, ne prvi — 33 puta pokrenuti render da bi se saznalo za 33
 * fajla je tačno ono ponašanje koje ovaj korak postoji da spreči.
 *
 * Trajanje izvora se meri na osi prvog dekodiranog sempla (`duration − start`), isto kao F1 u
 * `lint.mjs` i isto kao narracija u C05 — `-ss` računa odatle.
 *
 * @param {object} plan iz `planCuts`
 * @param {string} dir folder epizode
 * @param {{narration: string, endcard: string|null}} media
 * @param {{probe?: Function}} [inject]
 * @returns {Promise<string[]>}
 */
export async function validate(plan, dir, media, { probe: probeFn = probe, sources = null } = {}) {
  const problems = [];
  const tol = 1 / plan.fps;
  const units = renderUnits(plan);

  const narration = path.join(dir, media.narration);
  if (!fs.existsSync(narration)) problems.push(`nema narracije ${media.narration}`);

  const src = sources ?? await inspectSources(
    units.filter((u) => u.kind !== 'endcard').map((u) => u.source), dir, { probe: probeFn });

  for (const seg of units) {
    if (seg.kind === 'endcard') {
      // still slika; trajanje se pravi `-loop 1`, pa se ne meri
      if (!fs.existsSync(path.join(dir, seg.source))) problems.push(`nema end card slike ${seg.source}`);
      continue;
    }
    if (seg.mode === 'still') {
      // Isto važi i za still kadar: trajanje pravi `-loop 1`. Traži se da slika postoji;
      // da li je dovoljno velika za zum meri QC izveštaj, jer to nije razlog da montaža stane.
      if (!fs.existsSync(path.join(dir, seg.source))) {
        problems.push(`shot ${seg.id}: nema slike ${seg.source}`);
      }
      continue;
    }
    const info = src.get(seg.source);
    if (!info || !info.exists) {
      problems.push(`shot ${seg.id}: nema klipa ${seg.source}`);
      continue;
    }
    if (info.error) {
      problems.push(`shot ${seg.id}: ${seg.source} se ne može pročitati: ${info.error}`);
      continue;
    }
    if (info.available === null) {
      problems.push(`shot ${seg.id}: ${seg.source} — ffmpeg ne prijavljuje trajanje`);
      continue;
    }
    const need = round3(seg.use_in + seg.len);
    if (info.available < need - tol) {
      problems.push(`shot ${seg.id}: ${seg.source} traje ${info.available}s, a treba do ${need}s`);
    }
  }

  return problems;
}

/**
 * Jedan `probe()` po izvornom fajlu, deljen između plana dissolve-a, validacije i QC izveštaja.
 * Bez ovoga bi isti klip bio otvoren tri puta, a `probe()` je pun spawn ffmpeg-a.
 *
 * Nepostojeći fajl i probe koji pukne su **podaci**, ne izuzetak: QC izveštaj postoji baš zato
 * da ih izlista, a ne da stane na prvom.
 *
 * @param {string[]} files putanje relativne u odnosu na folder epizode; ponavljanja se skupljaju
 * @returns {Promise<Map<string, {source: string, file: string, exists: boolean,
 *   duration: number|null, start: number|null, available: number|null, width: number|null,
 *   height: number|null, error: string|null}>>}
 */
export async function inspectSources(files, dir, { probe: probeFn = probe } = {}) {
  const map = new Map();
  for (const source of files) {
    if (map.has(source)) continue;
    const file = path.join(dir, source);
    const row = { source, file, exists: false, duration: null, start: null, available: null,
      width: null, height: null, error: null };
    if (!fs.existsSync(file)) {
      map.set(source, row);
      continue;
    }
    row.exists = true;
    try {
      const p = await probeFn(file);
      row.duration = p.duration ?? null;
      row.start = p.start ?? 0;
      // Dimenzije su tu zbog still kadrova: slika se ne meri trajanjem nego rezolucijom.
      row.width = p.width ?? null;
      row.height = p.height ?? null;
      // Dostupno se meri na osi prvog dekodiranog sempla, isto kao F1 i C05 (§5.4 tačka 1).
      row.available = row.duration === null ? null : round3(row.duration - row.start);
    } catch (err) {
      row.error = err.message.split('\n')[0];
    }
    map.set(source, row);
  }
  return map;
}

// ---------------------------------------------------------------- ffmpeg argumenti (koraci 2–5)

/**
 * Filter lanac: prvo fps (manje frejmova za skaliranje), pa uklapanje u okvir bez razvlačenja,
 * pa **konverzija opsega boje**.
 *
 * `format=yuv420p` na kraju nije kozmetika ni duplikat `-pix_fmt`-a. JPEG se dekodira kao
 * `yuvj420p` — pun opseg — i bez ove konverzije izlazi iz lanca takav, pa ga libx264 i tagira
 * punim opsegom. Veo klipovi u isto vreme izlaze kao `yuv420p`, ograničeni. Posle
 * `concat -c copy` zaglavlje toka nosi tag prvog segmenta, pa plejer koji mu veruje prikaže
 * end card sa ugašenim crnim i spaljenim belim: siva RGB 20 je u still segmentu čuvana kao
 * Y=20 umesto Y≈31. Nad Veo klipom je ovo no-op — provereno `framemd5` poređenjem, semplovi
 * su identični pre i posle.
 */
export function videoFilter(width, height, fps) {
  return [
    `fps=${fps}`,
    `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    'setsar=1',
    `format=${ENCODE.pix}`,
  ].join(',');
}

/**
 * Zajednički izlazni profil. Tagovi opsega i primara idu uz konverziju iz `videoFilter`-a:
 * bez njih izlaz ostaje netagovan, pa se ista slika u dva plejera vidi različito.
 */
const encodeArgs = () => [
  '-c:v', 'libx264', '-preset', ENCODE.preset, '-crf', String(ENCODE.crf),
  '-pix_fmt', ENCODE.pix, '-fps_mode', 'cfr', '-video_track_timescale', String(ENCODE.timescale),
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
];

/**
 * Korak 2: jedan shot -> jedan segment.
 *
 * `-ss` ide **posle** `-i` (odluka iz plana): pre `-i` je brzo ali seče na keyframe, a pošto
 * se zbog `scale`+`fps` ionako re-enkodira, tačno sečenje ne košta ništa dodatno.
 *
 * `-an` je razlog zašto ovaj alat postoji u ovom obliku — Flow klipovi nose sopstveni audio
 * i bez ovoga bi se u finalu čuo ispod narracije.
 *
 * Prozor čitanja je za dva frejma duži od traženog, a broj frejmova je zakucan `-frames:v`:
 * `-t` sam po sebi ume da isporuči frejm više ili manje na granici, a 33 takve greške se
 * sabiraju u drift koji T1 vidi.
 */
export function shotArgs(seg, { dir, width, height, fps, out }) {
  return [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-i', path.join(dir, seg.source),
    '-ss', String(seg.use_in),
    '-t', String(round3(seg.len + 2 / fps)),
    '-an',
    '-vf', videoFilter(width, height, fps),
    '-frames:v', String(seg.frames),
    ...encodeArgs(),
    out,
  ];
}

/**
 * Filter lanac still kadra: jedna slika -> pokret kamere (schemas.md §3.3.2).
 *
 * Tri odluke stoje u ovom lancu:
 *
 * 1. **Popunjava, ne uokviruje.** `increase` + `crop`, ne `decrease` + `pad` kao klip putanja.
 *    Flow slika je 2752×1536 (43:24), pa bi je `pad` na 1920×1080 spustio na 1071.6 px visine
 *    i dodao 4 px crne trake gore i dole — na svakoj slici u epizodi.
 * 2. **`perspective`, ne `zoompan`.** `zoompan` iseca prozor u celim pikselima, pa i na
 *    dvostrukom kanvasu slika trza (izmereno RMS 0.4–0.55 px, vrh ~1 px po frejmu) — to je
 *    „treperenje" koje je vraćeno u antikythera-mechanism. `perspective` sa `eval=frame` prima
 *    float uglove prozora i razvlači ga na ceo kanvas (`cubic`, uvek uvećanje), pa fiksno 2×
 *    smanjenje (lanczos). Izmereno trzanje ~0.005 px.
 * 3. **Ease-in-out (sinus), ne linearno.** `p = 0.5 − 0.5·cos(π·on/k)`: pokret kreće i staje
 *    mekano, pa hard cut ne preseče kameru u punoj brzini. `on` je redni broj frejma nad
 *    `-loop 1` ulazom, od 0 do N−1.
 *
 * `hold` namerno nema pokret: postoji da bi rez imao gde da stane. Isto i kadar od jednog
 * frejma — nema po čemu da se pomera.
 *
 * @param {number} width @param {number} height @param {number} fps
 * @param {string} motion jedan od `STILL_MOTIONS`
 * @param {number} frames broj izlaznih frejmova
 * @returns {string}
 */
export function stillFilter(width, height, fps, motion, frames) {
  if (!STILL_MOTIONS.includes(motion)) {
    throw new Error(`nepoznat still_motion "${motion}" — očekuje se ${STILL_MOTIONS.join(' | ')}`);
  }

  const sw = width * STILL_SUPERSAMPLE;
  const sh = height * STILL_SUPERSAMPLE;
  const fill = [
    `fps=${fps}`,
    `scale=${sw}:${sh}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${sw}:${sh}`,
  ];

  // Statičan kadar ne treba da prođe kroz perspective; skalira se pravo u izlaz.
  if (motion === 'hold' || frames < 2) return fillFilter(width, height, fps);

  const k = frames - 1;                              // poslednji frejm je `on = k`
  const d = round3(STILL_ZOOM - 1);                  // koliko zum putuje
  const p = `(0.5-0.5*cos(PI*on/${k}))`;             // ease-in-out, 0 -> 1

  // `z` je zum u trenutku, `fx` udeo slobodne margine levo od prozora (0.5 = centar).
  // `pan-*` putuje po margini koju otvara sam zum: `W - W/z`.
  const { z, fx } = {
    push: { z: `(1+${d}*${p})`, fx: '0.5' },
    pull: { z: `(${STILL_ZOOM}-${d}*${p})`, fx: '0.5' },
    'pan-right': { z: `${STILL_ZOOM}`, fx: p },
    'pan-left': { z: `${STILL_ZOOM}`, fx: `(1-${p})` },
  }[motion];

  const w = `(W/${z})`;
  const h = `(H/${z})`;
  const x0 = `(${fx}*(W-${w}))`;
  const y0 = `(0.5*(H-${h}))`;
  const x1 = `(${x0}+${w})`;
  const y1 = `(${y0}+${h})`;
  const q = (s) => `'${s}'`;
  const corners = `x0=${q(x0)}:y0=${q(y0)}:x1=${q(x1)}:y1=${q(y0)}:x2=${q(x0)}:y2=${q(y1)}:x3=${q(x1)}:y3=${q(y1)}`;

  return [
    ...fill,
    'format=yuv444p',
    `perspective=${corners}:interpolation=cubic:sense=source:eval=frame`,
    `scale=${width}:${height}:flags=lanczos`,
    `format=${ENCODE.pix}`,
    'setsar=1',
  ].join(',');
}

/**
 * Slika bez pokreta, popunjena na izlaz: `hold` still kadar i end card. `increase` + `crop`
 * iz istog razloga kao u `stillFilter` — Flow slika 43:24 bi na `pad`-u dobila crne trake.
 */
export function fillFilter(width, height, fps) {
  return [
    `fps=${fps}`,
    `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${width}:${height}`,
    `format=${ENCODE.pix}`,
    'setsar=1',
  ].join(',');
}

/**
 * Still kadar -> segment. Bez `-ss` (slika nema unutrašnji tajmlajn) i bez `-tune stillimage`
 * (pokret postoji, a tune cilja raspodelu bitova za nepomičnu sliku — end card ga zadržava,
 * on jeste nepomičan).
 *
 * Broj frejmova je zakucan `-frames:v` iz istog razloga kao na klip putanji: `-t` ume da
 * isporuči frejm više ili manje, a 45 takvih grešaka je drift koji T1 vidi.
 */
export function stillArgs(seg, { dir, width, height, fps, out }) {
  return [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-loop', '1', '-framerate', String(fps), '-t', String(round3(seg.len + 2 / fps)),
    '-i', path.join(dir, seg.source),
    '-an',
    '-vf', stillFilter(width, height, fps, seg.motion, seg.frames),
    '-frames:v', String(seg.frames),
    ...encodeArgs(),
    out,
  ];
}

/** Korak 5: still slika -> segment iste dužine kao outro + rep. */
export function endcardArgs(seg, { dir, width, height, fps, out }) {
  return [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-loop', '1', '-framerate', String(fps), '-t', String(round3(seg.len + 2 / fps)),
    '-i', path.join(dir, seg.source),
    '-an',
    '-vf', fillFilter(width, height, fps),
    '-frames:v', String(seg.frames),
    ...encodeArgs(), '-tune', 'stillimage',
    out,
  ];
}

/** `xfade` prima sekunde; frejmovi se ne dele okruglo (8/24 = 0.333…), pa ide puna preciznost. */
const fmt6 = (t) => Number(t).toFixed(6);

/**
 * Korak 6: lanac linked shotova -> jedan segment, sa `xfade` na svakoj unutrašnjoj granici.
 *
 * **`offset` pada na kraj baznog dela, ne produženog.** `xfade` počinje prelaz na `offset` i
 * od tog trenutka meša drugi ulaz, pa je izlaz `A + B − D`. Kad je `offset` = bazna dužina A,
 * B počinje tačno tamo gde je i pre stajao — jedina varijanta koja ne pomeri sve iza sebe.
 * Zato se produženje uzima sa repa levog dela: ono se potroši unutar prelaza i ne izlazi napolje.
 *
 * Broj frejmova izlaza je zakucan iz istog razloga kao u `shotArgs`: prelaz na granici ume da
 * isporuči frejm više ili manje, a lanac po lanac se to sabere u drift.
 */
export function xfadeArgs(seg, { segDir, fps, out }) {
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y'];
  for (const p of seg.parts) args.push('-i', path.join(segDir, p.name));

  const dur = fmt6(seg.dissolve / fps);
  const filters = [];
  let label = '0:v';
  let offset = seg.parts[0].base;
  for (let i = 1; i < seg.parts.length; i += 1) {
    const next = i === seg.parts.length - 1 ? 'v' : `x${i}`;
    filters.push(`[${label}][${i}:v]xfade=transition=fade:duration=${dur}:offset=${fmt6(offset / fps)}[${next}]`);
    label = next;
    offset += seg.parts[i].base;
  }

  return [
    ...args,
    '-filter_complex', filters.join(';'),
    '-map', '[v]',
    '-an',
    '-frames:v', String(seg.frames),
    ...encodeArgs(),
    out,
  ];
}

/** Sadržaj liste za concat demuxer. Apostrof u imenu fajla razbio bi navode. */
export function concatText(names) {
  return names.map((n) => `file '${String(n).replace(/'/g, "'\\''")}'`).join('\n') + '\n';
}

/** Korak 3: hard cut između svih segmenata. Bez re-enkodiranja — svi su već isti profil. */
export function concatArgs(listFile, out) {
  return [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', '-movflags', '+faststart',
    out,
  ];
}

/**
 * Korak 4: narracija kao jedini audio stream, od `t=0`.
 *
 * Nigde `-copyts` ni `-itsoffset` (schemas.md §5.4 tačka 1). Nema ni `-shortest`: video je za
 * rep end carda duži od narracije i `-shortest` bi baš taj rep odsekao.
 */
export function muxArgs(video, audio, out, intro = null) {
  if (!intro) {
    return [
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
      '-i', video, '-i', audio,
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', ENCODE.audioBitrate,
      '-movflags', '+faststart',
      out,
    ];
  }
  // Uvodni klip: njegov zvuk ide ispod narracije samo dok je klip na ekranu, tiho i sa fade-om
  // pred rez. Narracija je mono, pa se razvlači na oba kanala; `normalize=0` jer bi `amix`
  // inače prepolovio i narraciju.
  const cut = fmt6(intro.len);
  const fadeAt = fmt6(Math.max(0, intro.len - INTRO_FADE));
  const graph = [
    '[1:a]aresample=44100,pan=stereo|c0=c0|c1=c0[nar]',
    `[2:a]aresample=44100,atrim=0:${cut},asetpts=PTS-STARTPTS,volume=${intro.volume},` +
      `afade=t=out:st=${fadeAt}:d=${INTRO_FADE}[sfx]`,
    '[nar][sfx]amix=inputs=2:duration=first:normalize=0[a]',
  ].join(';');
  return [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-i', video, '-i', audio, '-i', intro.file,
    '-filter_complex', graph,
    '-map', '0:v:0', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', ENCODE.audioBitrate,
    '-movflags', '+faststart',
    out,
  ];
}

// ---------------------------------------------------------------- keš segmenata

/**
 * Recept po kojem je segment nastao. Kad se bilo šta u njemu promeni — drugi `use_in`, druga
 * rezolucija, zamenjen `partNN.mp4` — segment se pravi ponovo; inače se preuzima s diska.
 * Zamenjen izvor se prepoznaje po veličini i vremenu izmene, jer heš od 2.5 MB po shotu na
 * svakom pokretanju košta više nego što vredi.
 */
export function recipe(seg, { dir, width, height, fps }) {
  const file = path.join(dir, seg.source);
  let stat = null;
  try {
    const st = fs.statSync(file);
    stat = { size: st.size, mtimeMs: Math.round(st.mtimeMs) };
  } catch {
    stat = null;
  }
  return {
    // v:2 — popravka opsega boje (`format=yuv420p` + color tagovi). Keširani segmenti
    // napravljeni pre nje moraju da postanu nevažeći, inače popravka preskoči baš one
    // epizode zbog kojih postoji.
    // v:3 — still pokret preko `perspective`-a sa ease-in-out i end card bez `pad`-a.
    v: 3,
    kind: seg.kind,
    mode: seg.mode ?? 'clip',
    motion: seg.motion ?? null,
    zoom: seg.mode === 'still' ? STILL_ZOOM : null,
    source: seg.source,
    stat,
    use_in: seg.use_in,
    frames: seg.frames,
    width,
    height,
    fps,
    crf: ENCODE.crf,
    preset: ENCODE.preset,
    pix: ENCODE.pix,
  };
}

/**
 * Recept lanca nosi recepte svih delova, pa zamenjen `partNN.mp4` ruši i deo i lanac — a ne
 * ostale delove. Bez toga bi lanac ostao slepljen od starih segmenata i zamena bi bila tiha.
 */
export function chainRecipe(seg, opts) {
  return {
    // Ide u korak sa `recipe()`: delovi već nose v:2, pa se lanac ionako regeneriše — ali dve
    // verzije koje se razilaze čitaju se kao da su lanci bili izuzeti iz popravke boje.
    v: 3,
    kind: 'chain',
    dissolve: seg.dissolve,
    frames: seg.frames,
    parts: seg.parts.map((p) => recipe(p, opts)),
  };
}

const sameRecipe = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function cachedRecipe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- zaštita izlaza

const stampFile = (dir) => path.join(dir, CACHE, STAMP);

function readStamp(dir) {
  try {
    return JSON.parse(fs.readFileSync(stampFile(dir), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Sme li se pisati preko postojećeg izlaza. `final.mp4` legacy epizode je ručna montaža koju
 * niko ne može da vrati; ovaj alat prepisuje samo fajl za koji ima dokaz da ga je sam napravio.
 * Idempotentnost time ne strada — sopstveni izlaz se prepisuje bez pitanja.
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function canWrite(dir, outFile, { force = false } = {}) {
  if (force) return { ok: true };
  const abs = path.join(dir, outFile);
  if (!fs.existsSync(abs)) return { ok: true };

  const stamp = readStamp(dir);
  if (stamp && stamp.out === outFile) {
    try {
      const st = fs.statSync(abs);
      if (st.size === stamp.size && Math.round(st.mtimeMs) === stamp.mtimeMs) return { ok: true };
    } catch {
      /* pada u odbijanje ispod */
    }
    return {
      ok: false,
      reason: `${outFile} postoji i izmenjen je posle poslednje montaže (ručno?).\n` +
        '  Pokreni sa --force ako sme da se prepiše, ili sa --out <drugo-ime>.',
    };
  }
  return {
    ok: false,
    reason: `${outFile} postoji, a ovaj alat ga nije napravio — verovatno je ručna montaža.\n` +
      '  Pokreni sa --out final-new.mp4 (preporuka) ili --force ako sme da se prepiše.',
  };
}

function writeStamp(dir, outFile) {
  const abs = path.join(dir, outFile);
  const st = fs.statSync(abs);
  fs.mkdirSync(path.join(dir, CACHE), { recursive: true });
  fs.writeFileSync(stampFile(dir),
    JSON.stringify({ out: outFile, size: st.size, mtimeMs: Math.round(st.mtimeMs) }, null, 2) + '\n',
    'utf8');
}

// ---------------------------------------------------------------- montaža

const slash = (p) => p.replace(/\\/g, '/');
const fmt = (t) => Number(t).toFixed(3).replace(/\.?0+$/, '');

/**
 * Koraci 2–5. Vraća izveštaj; ne štampa ništa sam osim kroz `onProgress`.
 *
 * @param {object} plan iz `planCuts`
 * @param {string} dir
 * @param {object} opts
 * @returns {Promise<{out: string, built: number, cached: number, dissolves: number,
 *                     ms: number, segments: number}>}
 */
export async function build(plan, dir, opts) {
  const { width, height, fps, narration, out, onProgress = () => {} } = opts;
  const runner = opts.run ?? run;

  const cacheDir = path.join(dir, CACHE);
  const segDir = path.join(cacheDir, SEG);
  fs.mkdirSync(segDir, { recursive: true });

  let built = 0;
  let cached = 0;
  let dissolves = 0;
  const started = Date.now();

  /** Jedan segment na disk, uz recept — ili preskočen kad recept već stoji uz gotov fajl. */
  const make = async (seg, want, argsOf, state) => {
    const segFile = path.join(segDir, seg.name);
    const recipeFile = segFile.replace(/\.mp4$/, '.json');
    if (fs.existsSync(segFile) && sameRecipe(want, cachedRecipe(recipeFile))) {
      cached += 1;
      onProgress({ seg, state: 'cached', ms: 0 });
      return;
    }
    const t0 = Date.now();
    await runner(argsOf(segFile));
    fs.writeFileSync(recipeFile, JSON.stringify(want, null, 2) + '\n', 'utf8');
    built += 1;
    onProgress({ seg, state, ms: Date.now() - t0 });
  };

  const opt = { dir, width, height, fps };
  const argsFor = (seg, out_) => {
    if (seg.kind === 'endcard') return endcardArgs(seg, { ...opt, out: out_ });
    if (seg.mode === 'still') return stillArgs(seg, { ...opt, out: out_ });
    return shotArgs(seg, { ...opt, out: out_ });
  };
  const makeShot = (seg) => make(seg, recipe(seg, opt), (out_) => argsFor(seg, out_), 'built');

  for (const seg of plan.segments) {
    if (seg.kind !== 'chain') {
      await makeShot(seg);
      continue;
    }
    // Delovi se keširaju pojedinačno, pa lanac; zamena jednog klipa ne dira ostale delove.
    for (const p of seg.parts) await makeShot(p);
    dissolves += seg.parts.length - 1;
    await make(seg, chainRecipe(seg, opt),
      (out_) => xfadeArgs(seg, { segDir, fps, out: out_ }), 'dissolve');
  }

  const listFile = path.join(cacheDir, 'concat.txt');
  fs.writeFileSync(listFile, concatText(plan.segments.map((s) => slash(path.join(SEG, s.name)))), 'utf8');

  const videoFile = path.join(cacheDir, 'video.mp4');
  onProgress({ state: 'concat' });
  await runner(concatArgs(listFile, videoFile));

  const outFile = path.join(dir, out);
  onProgress({ state: 'mux' });
  const intro = opts.intro
    ? { file: path.join(dir, opts.intro.file), volume: opts.intro.volume, len: plan.segments[0].len }
    : null;
  await runner(muxArgs(videoFile, path.join(dir, narration), outFile, intro));

  return {
    out: outFile, built, cached, dissolves,
    ms: Date.now() - started, segments: plan.segments.length,
  };
}

// ---------------------------------------------------------------- qc-report.md (C10, korak 7)

/** Prihvatanje iz izvorne verifikacije 5 („293.7s ±0.2s"), mereno na pokrivenosti (§5.8 tačka 2). */
export const DRIFT_TOL = 0.2;

const pct = (x) => `${(Math.round(x * 1000) / 10).toFixed(1).replace(/\.0$/, '')}%`;
const signed = (t) => (t > 0 ? `+${fmt(t)}` : fmt(t));
const frameWord = (n) => plural(Math.abs(n), 'frejm', 'frejma', 'frejmova');

/**
 * QC izveštaj iz plana C10: šta fali, koliko je pomereno i **šta regenerisati**.
 *
 * Piše se uvek — i kad je sve u redu, i kad validacija padne. Druga polovina je važnija: kad
 * `assemble` stane, ovo je jedini fajl koji kaže koji klipovi fale, umesto da se to čita iz
 * poruke koja je otišla u istoriju terminala.
 *
 * Meri se **isto što montaža koristi** (`renderUnits`), ne svi shotovi iz storyboard-a — shot
 * koji je outro izbacio nema klip u finalu, pa ni njegov izvor nije greška montaže. Zbog toga
 * ispravna epizoda nema nijedan ERROR, što je uslov gotovog iz plana.
 *
 * `ERROR` se pojavljuje samo u koloni statusa; nijedan tekst ga ne sme sadržati usput.
 *
 * @param {{plan: object, sources: Map, episode?: string, res?: string, width?: number,
 *          height?: number, out?: string, measured?: object|null, at?: Date}} ctx
 * @returns {string} markdown
 */
export function qcReport(ctx) {
  const {
    plan, sources, episode = '(bez imena)', res = '1080p', width = 0, height = 0,
    out = 'final.mp4', measured = null, at = new Date(),
  } = ctx;
  const fps = plan.fps;
  const tol = 1 / fps;
  const units = renderUnits(plan).filter((u) => u.kind !== 'endcard');
  const info = (u) => sources.get(u.source) ?? null;
  const need = (u) => round3(u.use_in + u.len);

  // Slika i klip se mere različitim stvarima: klip trajanjem, slika rezolucijom. Meriti
  // sliku trajanjem znači prijaviti je kao 0% iskorišćenu i tražiti regeneraciju koja nema
  // smisla (schemas.md §5.13).
  const stills = units.filter((u) => u.mode === 'still');
  const clips = units.filter((u) => u.mode !== 'still');

  const missing = units.filter((u) => !info(u)?.exists);
  const unreadable = clips.filter((u) => {
    const i = info(u);
    return i?.exists && (i.error !== null || i.available === null);
  });
  const short = clips.filter((u) => {
    const i = info(u);
    return i?.exists && i.available !== null && i.available < need(u) - tol;
  });

  // Na kraju zuma se vidi `STILL_ZOOM` puta manje slike, pa je toliko i potrebno da se ne
  // dovlači naviše. WARN, ne ERROR: `--res` je odluka koja se donosi posle generisanja slika.
  const needWidth = Math.ceil(width * STILL_ZOOM);
  const smallStills = stills.filter((u) => {
    const i = info(u);
    return i?.exists && typeof i.width === 'number' && i.width > 0 && i.width < needWidth;
  });

  // Iskorišćenje se meri **baznim** delom: produženje za dissolve se potroši unutar prelaza
  // i ne bi smelo da prikaže shot kao bolje iskorišćen nego što jeste.
  const usage = clips.map((u) => {
    const have = info(u)?.available ?? null;
    const used = round3((u.base ?? u.frames) / fps);
    return { id: u.id, source: u.source, used, have, share: have ? used / have : null };
  });
  // Uvodni klip se namerno seče na trajanje hook-a; nizak udeo tu nije bačeno generisanje.
  const introIds = new Set(clips.filter((u) => u.intro).map((u) => u.id));
  const candidates = usage.filter((r) => r.share !== null && r.share < REGEN_SHARE && !introIds.has(r.id));
  // Shot koji je outro odsekao troši malo svog klipa iz sasvim drugog razloga nego shot
  // kome je rez od početka bio kratak. Savet je isti, ali uzrok nije, pa se ne mešaju.
  const trimmedIds = new Set(plan.trimmed.map((t) => t.shot_id));

  const drift = round3(plan.coverage - plan.narration);
  const measuredDrift = measured && measured.duration != null
    ? round3(measured.duration - plan.duration) : null;
  const driftBad = Math.abs(drift) > DRIFT_TOL
    || (measuredDrift !== null && Math.abs(measuredDrift) > tol);

  const d = plan.dissolve ?? { frames: 0, applied: [], skipped: [], lost: 0 };
  const L = [];

  L.push(`# QC izveštaj — ${episode}`, '');
  L.push(`\`tools/assemble.mjs\` · ${res} ${width}×${height} @ ${fps} fps · izlaz \`${out}\``);
  L.push(`Generisano ${at.toISOString()}.`, '');

  L.push('| Provera | Status | Nalaz |', '|---|---|---|');
  L.push(`| Nedostajući partovi | ${missing.length + unreadable.length ? 'ERROR' : 'OK'} | ${missing.length + unreadable.length} od ${units.length} |`);
  L.push(`| Prekratki izvori | ${short.length ? 'ERROR' : 'OK'} | ${short.length} od ${clips.length} |`);
  L.push(`| Ukupni drift | ${driftBad ? 'ERROR' : 'OK'} | ${signed(drift)}s (${signed(Math.round(drift * fps))} ${frameWord(Math.round(drift * fps))}) |`);
  L.push(`| Kandidati za regeneraciju | ${candidates.length ? 'WARN' : 'OK'} | ${candidates.length} od ${clips.length} |`);
  if (stills.length) {
    L.push(`| Still kadrovi | ${smallStills.length ? 'WARN' : 'OK'} | ` +
      `${stills.length} od ${units.length}, ${smallStills.length} ispod ${needWidth} px širine |`);
  }
  L.push(`| Primenjeni prelazi | ${d.skipped.length ? 'WARN' : '—'} | ${d.applied.length} primenjeno, ${d.skipped.length} preskočeno |`);
  L.push('');

  L.push('## Nedostajući partovi', '');
  if (missing.length + unreadable.length === 0) {
    L.push(stills.length
      ? 'Svaki shot u montaži ima svoj izvor na disku — klip ili sliku.'
      : 'Svaki shot u montaži ima svoj klip na disku.');
  } else {
    L.push('| Shot | Klip | Problem |', '|---|---|---|');
    for (const u of missing) L.push(`| ${u.id} | \`${u.source}\` | fajl ne postoji |`);
    for (const u of unreadable) {
      L.push(`| ${u.id} | \`${u.source}\` | ${info(u).error ?? 'ffmpeg ne prijavljuje trajanje'} |`);
    }
  }
  L.push('');

  if (stills.length) {
    L.push('## Still kadrovi', '');
    L.push('Slika kojoj pokret daje montaža (schemas.md §3.3.2). Ne meri se trajanjem — nema ga — ' +
      `nego rezolucijom: na kraju zuma se vidi ${STILL_ZOOM}× manje slike, pa je za ` +
      `${width}×${height} potrebno bar **${needWidth} px** širine. Uža slika se dovlači naviše ` +
      'i to se vidi; nije greška montaže, jer se `--res` bira posle generisanja.', '');
    L.push('| Shot | Slika | Pokret | Dimenzije | Dovoljno |', '|---|---|---|---|---|');
    for (const u of stills) {
      const i = info(u);
      const dim = i?.exists && i.width ? `${i.width}×${i.height}` : '—';
      const ok = !i?.exists || !i.width ? '—' : (i.width < needWidth ? `WARN — treba ${needWidth}` : 'da');
      L.push(`| ${u.id} | \`${u.source}\` | ${u.motion} | ${dim} | ${ok} |`);
    }
    L.push('');
  }

  L.push('## Prekratki izvori', '');
  L.push('Izvor mora da traje bar do kraja svog reza; sa `--dissolve` i za prelaz viška. ' +
    'Still kadrovi se ovde ne pojavljuju — slika nema trajanje.', '');
  if (short.length === 0) {
    L.push('Nijedan izvor nije kraći od onoga što se iz njega seče.');
  } else {
    L.push('| Shot | Klip | Traje | Treba do | Fali |', '|---|---|---|---|---|');
    for (const u of short) {
      L.push(`| ${u.id} | \`${u.source}\` | ${fmt(info(u).available)}s | ${fmt(need(u))}s | ${fmt(round3(need(u) - info(u).available))}s |`);
    }
  }
  L.push('');

  L.push('## Ukupni drift', '');
  L.push(`Pokrivenost ${fmt(plan.coverage)}s prema narraciji ${fmt(plan.narration)}s — ` +
    `razlika ${signed(drift)}s (${signed(Math.round(drift * fps))} ${frameWord(Math.round(drift * fps))}), ` +
    `prihvatanje ±${DRIFT_TOL}s.`);
  L.push(`Ukupno trajanje ${fmt(plan.duration)}s uključuje rep end carda od ${fmt(plan.tail)}s. ` +
    'Taj rep nije drift — poredi se pokrivenost, ne ukupno trajanje (schemas.md §5.8 tačka 2).');
  if (measuredDrift !== null) {
    L.push(`Izmereno na izlazu: ${fmt(measured.duration)}s prema planiranih ${fmt(plan.duration)}s — ` +
      `razlika ${signed(measuredDrift)}s (${Math.round(measuredDrift * fps)} ${frameWord(Math.round(measuredDrift * fps))}).`);
  }
  L.push('');

  L.push('## Kandidati za regeneraciju', '');
  L.push(`Shotovi kod kojih je iskorišćeno manje od ${pct(REGEN_SHARE)} generisanog klipa: ` +
    'bačeno generisanje i, po pravilu, pokret sabijen u premalo vremena. Ovo je direktan ulaz ' +
    'u `at-assemble` — regeneriši ih sa kraćim pokretom pre finalnog reviewa.', '');
  if (!clips.length) {
    L.push('Epizoda nema klipova — svi shotovi su still, a slika se ne generiše ponovo zbog ' +
      'iskorišćenja.');
  } else if (candidates.length === 0) {
    L.push('Nijedan shot ne troši manje od pola svog klipa.');
  } else {
    L.push('| Shot | Klip | Generisano | Iskorišćeno | Udeo |', '|---|---|---|---|---|');
    for (const c of candidates) {
      const zasto = trimmedIds.has(c.id) ? ' (skraćen outrom)' : '';
      L.push(`| ${c.id}${zasto} | \`${c.source}\` | ${fmt(c.have)}s | ${fmt(c.used)}s | ${pct(c.share)} |`);
    }
  }
  L.push('');

  L.push('## Primenjeni prelazi', '');
  if (!d.frames) {
    L.push('Bez `--dissolve` — hard cut između svih shotova.');
  } else {
    L.push(`Cross-dissolve ${d.frames} ${frameWord(d.frames)} (${fmt(round3(d.frames / fps))}s) ` +
      'između linked shotova istog beata; između beatova hard cut, namerno.');
    L.push(`Kompenzacija (a): svaki deo lanca pre prelaza produžen je za ${d.frames} ${frameWord(d.frames)} ` +
      'iz sopstvenog izvora, pa prelaz ne krade trajanje.');
    L.push(`Primenjeno: ${d.applied.length} ${plural(d.applied.length, 'prelaz', 'prelaza', 'prelaza')}. ` +
      `Ukupan uticaj na trajanje: ${fmt(round3(d.lost / fps))}s (${d.lost} ${frameWord(d.lost)}).`);
    if (d.applied.length) {
      L.push('', '| Prelaz | Beat | Frejmova |', '|---|---|---|');
      for (const a of d.applied) L.push(`| ${a.after} → ${a.before} | ${a.group} | ${a.frames} |`);
    }
    if (d.skipped.length) {
      L.push('', 'Preskočeni prelazi (ostao hard cut):', '');
      L.push('| Prelaz | Beat | Razlog |', '|---|---|---|');
      for (const s of d.skipped) L.push(`| ${s.after} → ${s.before} | ${s.group} | ${s.reason} |`);
    }
  }
  L.push('');

  L.push('## Izostavljeni i skraćeni shotovi', '');
  L.push('End card drži outro deo narracije, pa slika iza `outro_start`-a otpada ' +
    '(schemas.md §5.8 tačka 1). Ovo nije greška, ali se ne prećutkuje.', '');
  if (!plan.trimmed.length && !plan.dropped.length) {
    L.push('Nijedan shot nije izostavljen ni skraćen.');
  } else {
    L.push('| Shot | Šta se desilo |', '|---|---|');
    for (const t of plan.trimmed) L.push(`| ${t.shot_id} | skraćen ${fmt(t.from)}s → ${fmt(t.to)}s (prelazi \`outro_start\`) |`);
    for (const x of plan.dropped) L.push(`| ${x.shot_id} | izostavljen — počinje na ${fmt(x.t_in)}s, iza \`outro_start\`-a |`);
  }
  L.push('');

  return L.join('\n');
}

/** Piše izveštaj u folder epizode i vraća putanju. */
export function writeQcReport(dir, ctx) {
  const file = path.join(dir, QC_REPORT);
  fs.writeFileSync(file, qcReport(ctx), 'utf8');
  return file;
}

// ---------------------------------------------------------------- CLI

const USAGE = `node tools/assemble.mjs <folder-epizode> [opcije]

  storyboard.json + shots + narracija + end card -> final.mp4 + qc-report.md.
  Hard cut svuda osim, uz --dissolve, između linked shotova istog beata.

  --dissolve ${DEFAULT_DISSOLVE}         cross-dissolve od N frejmova unutar link_group-a (0 = isključeno)
  --res 1080p          izlazna rezolucija: ${Object.keys(RES).join(' · ')} (podrazumevano 1080p)
  --out final.mp4      ime izlaznog fajla u folderu epizode
  --outro-start 281.7  odakle end card preuzima sliku (inače iz timing.json)
  --force              dozvoli prepisivanje izlaza koji ovaj alat nije napravio
  --dry-run            samo validacija, plan rezova i ${QC_REPORT}, bez rendera
  -h, --help           ovaj tekst`;

export function parseArgs(argv) {
  const out = {
    dir: null, res: '1080p', out: 'final.mp4', outroStart: null, force: false,
    dissolve: 0, dryRun: false, help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    // Vrednost opcije: `--res 1080p` i `--res=1080p` su isto. `i` se pomera samo u prvom obliku.
    const value = (name) => {
      const v = a.startsWith(`${name}=`) ? a.slice(name.length + 1) : argv[(i += 1)];
      if (v === undefined) throw new Error(`${name} traži vrednost\n\n${USAGE}`);
      return v;
    };

    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--force') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--res' || a.startsWith('--res=')) {
      const v = value('--res');
      if (!(v in RES)) throw new Error(`nepoznata rezolucija ${v} (${Object.keys(RES).join(', ')})\n\n${USAGE}`);
      out.res = v;
    } else if (a === '--out' || a.startsWith('--out=')) {
      out.out = value('--out');
    } else if (a === '--dissolve' || a.startsWith('--dissolve=')) {
      // Frejmovi, ne sekunde: prelaz mora da padne na frejm, a 8 frejmova na 24 fps
      // (0.333…s) nije predstavljivo u sekundama po §0.2.
      const v = Number(value('--dissolve'));
      if (!Number.isInteger(v) || v < 0) {
        throw new Error(`--dissolve traži ceo broj frejmova >= 0 (0 isključuje)\n\n${USAGE}`);
      }
      out.dissolve = v;
    } else if (a === '--outro-start' || a.startsWith('--outro-start=')) {
      const v = Number(value('--outro-start'));
      if (!Number.isFinite(v) || v < 0) throw new Error(`--outro-start traži broj sekundi\n\n${USAGE}`);
      out.outroStart = v;
    } else if (a.startsWith('-')) throw new Error(`nepoznata opcija ${a}\n\n${USAGE}`);
    else if (out.dir === null) out.dir = a;
    else throw new Error(`višak argumenta ${a}\n\n${USAGE}`);
  }
  if (!out.help && !out.dir) throw new Error(`nedostaje folder epizode\n\n${USAGE}`);
  return out;
}

/** `episodes/<slug>` skraćenica radi isto kao u `lint.mjs` i formaterima. */
function resolveDir(dir) {
  let d = dir;
  if (!fs.existsSync(d) && !d.includes('/') && !d.includes(path.sep)) d = path.join('episodes', d);
  if (!fs.existsSync(d)) throw new Error(`folder epizode ne postoji: ${dir}`);
  return d;
}

export async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(USAGE);
    return 0;
  }

  const dir = resolveDir(args.dir);
  const file = path.join(dir, 'storyboard.json');
  if (!fs.existsSync(file)) throw new Error(`nema storyboard.json u ${args.dir}`);

  let storyboard;
  try {
    storyboard = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file} nije ispravan JSON: ${err.message}`);
  }
  assertAssemblable(storyboard);

  const shots = storyboard.beats.flatMap((b) => b.shots);
  const timing = timeProblems(shots);
  if (timing.length) {
    throw new Error(`tajmlajn u storyboard.json nije konzistentan (${timing.length}) — pokreni lint:\n` +
      timing.map((t) => '  - ' + t).join('\n'));
  }

  const media = mediaNames(dir);
  const intro = introClip(dir);
  const outro = args.outroStart === null && media.endcard !== null
    ? { value: endcardStart(storyboard), source: 'poslednji shot' }
    : readOutroStart(dir, storyboard, args.outroStart);
  const [width, height] = RES[args.res];

  // Jedan probe po klipu, pre plana: dissolve mora da zna ima li izvor rezervu za produženje,
  // a validacija i QC izveštaj posle čitaju iste izmerene vrednosti umesto da mere ponovo.
  const sources = await inspectSources(
    [...shots.map((s) => s.source_file), ...(intro ? [intro.file] : [])], dir);
  const plan = planCuts(storyboard, {
    outroStart: outro.value, endcard: media.endcard, dissolveFrames: args.dissolve, sources,
  });

  // Uvodni klip preuzima prvi segment: isti broj frejmova, izvor je klip od nule.
  if (intro) {
    const first = plan.segments[0];
    if (first.kind !== 'shot') throw new Error('intro_file traži da prvi segment bude običan shot, ne lanac');
    Object.assign(first, { mode: 'clip', motion: null, source: intro.file, use_in: 0, intro: true });
    console.log(`uvodni klip ${slash(intro.file)} umesto shota ${first.id} · zvuk ${intro.volume}`);
  }

  console.log(`${storyboard.episode} · ${shots.length} ${plural(shots.length, 'shot', 'shota', 'shotova')} · ` +
    `${args.res} ${width}x${height} @ ${plan.fps} fps`);
  console.log(`narracija ${slash(media.narration)} ${fmt(plan.narration)}s · ` +
    `outro_start ${outro.value === null ? '—' : fmt(outro.value)} (${outro.source}) · ` +
    `end card ${media.endcard === null ? '—' : slash(media.endcard)}`);
  for (const t of plan.trimmed) {
    console.log(`  ! shot ${t.shot_id} skraćen ${fmt(t.from)}s -> ${fmt(t.to)}s (upada u outro)`);
  }
  for (const d of plan.dropped) {
    console.log(`  ! shot ${d.shot_id} izostavljen — ceo je iza outro_start-a (${fmt(d.t_in)}s)`);
  }
  if (args.dissolve) {
    console.log(`dissolve ${args.dissolve} frejmova · ${plan.dissolve.applied.length} primenjeno · ` +
      `${plan.dissolve.skipped.length} preskočeno · uticaj na trajanje ${plan.dissolve.lost} frejmova`);
    for (const s of plan.dissolve.skipped) {
      console.log(`  ! prelaz ${s.after} -> ${s.before} preskočen: ${s.reason}`);
    }
  }

  const qc = {
    plan, sources, episode: storyboard.episode, res: args.res, width, height, out: args.out,
  };

  const problems = await validate(plan, dir, media, { sources });
  if (problems.length) {
    // Izveštaj ide na disk **pre** pada: kad montaža stane, ovo je jedini fajl koji kaže
    // šta tačno fali, a poruka u terminalu ode sa istorijom.
    const file = writeQcReport(dir, qc);
    throw new Error(`montaža ne može da počne (${problems.length}):\n` +
      problems.map((p) => '  - ' + p).join('\n') + `\n  detalji: ${slash(file)}`);
  }

  const expected = `${plan.segments.length} ${plural(plan.segments.length, 'segment', 'segmenta', 'segmenata')} · ` +
    `${plan.totalFrames} frejmova · ${fmt(plan.duration)}s ` +
    `(do kraja narracije ${fmt(plan.coverage)}s, rep ${fmt(plan.tail)}s)`;
  console.log(expected);

  if (args.dryRun) {
    console.log(`--dry-run: ništa nije renderovano. -> ${slash(writeQcReport(dir, qc))}`);
    return 0;
  }

  const allowed = canWrite(dir, args.out, { force: args.force });
  if (!allowed.ok) throw new Error(allowed.reason);

  const report = await build(plan, dir, {
    width, height, fps: plan.fps, narration: media.narration, out: args.out, intro,
    onProgress: ({ seg, state, ms }) => {
      if (state === 'built') console.log(`  ${seg.id} · ${seg.frames} frejmova · ${(ms / 1000).toFixed(1)}s`);
      else if (state === 'dissolve') console.log(`  lanac ${seg.id} · ${seg.parts.length} dela · ${(ms / 1000).toFixed(1)}s`);
      else if (state === 'cached') console.log(`  ${seg.id} · iz keša`);
      else if (state === 'concat') console.log('  concat…');
      else if (state === 'mux') console.log('  narracija…');
    },
  });
  writeStamp(dir, args.out);

  const measured = await probe(report.out);
  const drift = round3((measured.duration ?? 0) - plan.duration);
  const qcFile = writeQcReport(dir, { ...qc, measured });

  console.log(`-> ${slash(report.out)}`);
  console.log(`-> ${slash(qcFile)}`);
  console.log(`${report.built} renderovano · ${report.cached} iz keša · ` +
    `${report.dissolves} ${plural(report.dissolves, 'prelaz', 'prelaza', 'prelaza')} · ` +
    `${(report.ms / 1000).toFixed(1)}s ukupno`);
  console.log(`izmereno ${fmt(measured.duration)}s · očekivano ${fmt(plan.duration)}s · ` +
    `razlika ${fmt(drift)}s (${Math.round(drift * plan.fps)} frejmova) · ` +
    `${measured.width}x${measured.height} @ ${measured.fps} fps · audio ${measured.hasAudio ? 'da' : 'NE'}`);

  if (Math.abs(drift) > 1 / plan.fps) {
    console.log('! razlika je preko jednog frejma — proveri segmente u .cache/seg/');
  }
  return 0;
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err.message);
      process.exit(1);
    },
  );
}
