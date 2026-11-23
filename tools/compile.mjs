// tools/compile.mjs
//
// Sklapa više gotovih epizoda u jednu novu — „compilation" (docs/series/greek-gods.md §8).
// Nova epizoda je REZ postojećih: priča svakog dela ostaje, a rekap na početku nastavaka i
// outro / end kartica na kraju otpadaju. Montažu zatim radi običan `assemble.mjs`, pa svi
// delovi dobijaju isti template (zum, jačina zvuka klipova) bez obzira kad su prvi put sklopljeni.
//
//   node tools/compile.mjs episodes/<slug> [--dry-run] [--no-audio] [--no-link]
//
// Ulaz je `episodes/<slug>/compile.json`:
//
//   {
//     "slug": "greek-gods-compilation",
//     "title": "…", "protagonists": ["…"], "notes": "…",
//     "runs": [
//       { "episode": "greek-gods-part-1", "prefix": "1", "from": "S01", "to": "S54", "chapter": "…" },
//       { "episode": "greek-gods-part-2", "prefix": "2", "from": "S02", "to": "S02", "visual": "07" },
//       { "episode": "greek-gods-part-2", "prefix": "2", "from": "S10", "to": "S53" }
//     ]
//   }
//
//   run      neprekinut niz rečenica jednog dela (`from`..`to`, uključivo). Kadrovi dolaze iz
//            storyboard-a tog dela, a narracija iz njegovog `narration.mp3`.
//   prefix   cifra dela; `shot_id` u novoj epizodi je prefix + stari id („209"), pa su svi različiti
//            i ostaju numerički kakve traži `freeze_tail`.
//   visual   shot dela koji pokriva ceo run umesto kadrova iz storyboard-a — za rečenicu koja se
//            vadi iz sredine dela („most"), kad njen originalni kadar prikazuje nešto što se već
//            videlo. Dva uzastopna still-a iste slike se spajaju u jedan (jedan pokret kamere).
//   chapter  naslov poglavlja koje počinje na ovom runu (vreme ide u compile-report.md).
//   audio    run bez izvornog dela: sopstveni snimljen fajl (`framing/intro.mp3`) i `text` koji izgovara
//            (niz rečenica ili string; stavka može biti `{ text, start, end }` sa izmerenim vremenom
//            govora u sekundama fajla, pa titlovi prate stvarni govor). Kadrovi su eksplicitni: `shots: [{ episode, prefix, shot,
//            weight?, at? }]`; `weight` je relativno trajanje (podrazumevano 1), `at` početak kadra u
//            sekundama fajla. `hold` dodaje sekunde tišine na kraju uz poslednji kadar (mesto za
//            YouTube završni ekran). Fajl koji fali zaustavlja alat — nikad montaža bez dela.
//   lead, tail  tišina pre prve i posle poslednje reči u sekundama (podrazumevano COMPILE.*); `lead`
//            zadat runu koji prati kadrove produžava prvi kadar unazad, pa služi za duži predah
//            posle mosta.
//
// Odluke koje ovaj alat drži:
//
//   1. Rez zvuka je na STVARNOJ tišini (`lineBounds` iz short-edit.mjs), ne na vremenu iz
//      alignmenta, koje kasni 0.1–0.17s: rez po alignmentu odseče početak reči. Prozor nikad ne
//      zalazi u govor susedne rečenice (`COMPILE.guard`).
//   2. Zvuk i slika se seku ISTIM prozorom. Prozor traje ceo broj frejmova, a granice kadrova su
//      stari t_in/t_out pomereni za početak prozora i zaokruženi na frejm — ukupno trajanje video-a
//      je tačno zbir prozora i poklapa se sa novom narracijom do na semplove.
//   3. Kadar koji počinje pre prozora (rečenica iz sredine beata) skraćuje se na glavi: still sme
//      uvek, klip do `maxHeadTrim` (use_in se pomera). Kadar koji prelazi kraj prozora skraćuje se
//      na repu. Produženje kadra (prozor počinje ranije od kadra) traži da izvor ima rezervu;
//      ako je nema, `assemble` to prijavi kao prekratak izvor.
//   4. Novi `storyboard.json` je montažni dokument, ne prompt-dokument: nosi vremena, izvore i
//      poreklo (`origin`) svakog kadra, ne i image/animation promptove — oni žive u izvornim
//      delovima. Zato ga ne obrađuju `lint.mjs` ni `render.mjs`.
//   5. Mediji se NE kopiraju: izvorni fajlovi se tvrdo povezuju u `shots/<prefix>/` (isti disk,
//      0 bajtova), pa je folder samostalan i kad se izvorni deo premesti. Bez tvrdog linka
//      (drugi disk, FAT) pada se na kopiju.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isStill, renderMode, round3 } from './contract.mjs';
import { probe, run as ffmpegRun } from './ffmpeg.mjs';
import { clock } from './publish.mjs';
import { lineBounds, speechGaps } from './short-edit.mjs';

export const COMPILE = {
  fps: 24,
  /** Tišina ispred prve reči u prozoru: slika stiže ispred glasa. */
  lead: 0.1,
  /** Tišina posle poslednje reči kad prozor nije vezan za kraj kadra (`visual`). */
  tail: 0.7,
  /** Koliko prozor ostaje daleko od govora susedne rečenice. */
  guard: 0.06,
  /** Tišina ispred prve reči kad prozor počinje na početku kadra. */
  startGuard: 0.05,
  /** Najviše koliko se sme odseći sa glave klipa (still je neograničen). */
  maxHeadTrim: 0.6,
  /** Fade na ivicama preseka; ivice su u tišini, ovo je samo osiguranje od klika. */
  fade: 0.01,
  /** Koliko aligned kraj rečenice sme da kasni za stvarnim (lineBounds greši kad nema tišine). */
  offsetSlack: 0.35,
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slash = (p) => p.replace(/\\/g, '/');
const pad2 = (id) => String(id).padStart(2, '0');

// ---------------------------------------------------------------- učitavanje delova

/**
 * Stvarni početak i kraj govora svake rečenice. `lineBounds` kraj traži u prvoj tišini posle
 * rečenice, pa tamo gde rečenica prelazi pravo u sledeću (nema tišine) vrati kraj sledeće —
 * zato se kraj ograničava na aligned kraj + `offsetSlack`.
 */
export function sentenceBounds(gaps, sentences, o = COMPILE) {
  return sentences.map((s, i) => {
    const b = lineBounds(gaps, sentences, i);
    return { onset: b.onset, offset: Math.min(b.offset, s.end + o.offsetSlack) };
  });
}

/** Sve što planiranje treba od jednog dela, bez ikakvog ffmpeg-a (pa se testira nad izmišljenim). */
export function makePart({ slug, prefix, dir, storyboard, timing, manifest = {}, gaps = [], o = COMPILE }) {
  const sentences = timing.sentences;
  const shots = [];
  for (const b of storyboard.beats) for (const s of b.shots) shots.push({ ...s, beat_id: b.beat_id, beat: b });
  return {
    slug, prefix, dir, storyboard, timing, manifest, sentences, shots,
    bounds: sentenceBounds(gaps, sentences, o),
    duration: timing.duration,
    narration: path.join(dir, manifest.narration_file ?? 'narration.mp3'),
  };
}

// ---------------------------------------------------------------- prozor (zvuk + slika)

/**
 * Prozor narracije jednog runa u vremenu izvornog dela: [W0, W1], ceo broj frejmova.
 *
 * Početak je pre prve reči (`lead`), ali nikad pre kraja prethodne rečenice. Kad run prati
 * kadrove, početak se vezuje za početak kadra koji je tada na ekranu — da se prvom kadru ne dodaje
 * višak — osim ako taj kadar počinje mnogo pre rečenice (rečenica iz sredine beata).
 * Kraj je kraj poslednjeg kadra (ili poslednja reč + `tail` za `visual`), ali nikad u govoru
 * sledeće rečenice.
 */
export function planWindow(part, run, o = COMPILE) {
  const { sentences, bounds, shots, duration } = part;
  const idx = (id) => sentences.findIndex((s) => s.id === id);
  const iFrom = idx(run.from);
  const iTo = idx(run.to ?? run.from);
  if (iFrom < 0 || iTo < 0 || iTo < iFrom) {
    throw new Error(`${part.slug}: rečenice ${run.from}..${run.to ?? run.from} ne postoje ili su obrnute`);
  }
  const lead = run.lead ?? o.lead;
  const onset = bounds[iFrom].onset;
  const offset = bounds[iTo].offset;
  const prevOffset = iFrom > 0 ? bounds[iFrom - 1].offset : 0;
  const nextOnset = iTo + 1 < sentences.length ? bounds[iTo + 1].onset : duration;
  const lo = iFrom > 0 ? prevOffset + 0.04 : 0;

  let w0;
  let natural;
  let shotRange = null;
  if (run.visual) {
    w0 = onset - lead;
    natural = offset + (run.tail ?? o.tail);
  } else {
    // Prvi kadar je onaj koji je na ekranu čim rečenica počne; poslednji onaj koji je na ekranu
    // pred kraj poslednje rečenice. Kadrovi izvan tog raspona nisu deo runa, ma koliko se
    // prozor (koji počinje pre prve reči) preklapao sa njihovim repom.
    const a = sentences[iFrom].start;
    const z = sentences[iTo].end;
    const iFirst = shots.findIndex((s) => s.t_out > a + 0.05);
    let iLast = -1;
    shots.forEach((s, k) => { if (s.t_in < z - 0.02) iLast = k; });
    if (iFirst < 0 || iLast < iFirst) {
      throw new Error(`${part.slug} ${run.from}..${run.to ?? run.from}: nijedan kadar ne pokriva rečenice`);
    }
    const first = shots[iFirst];
    if (first.t_in >= onset - 0.4) w0 = Math.min(first.t_in, onset - o.startGuard);
    else w0 = onset - lead;
    // `lead` zadat u runu je izričit zahtev za više tišine ispred (duži predah posle mosta);
    // prvi kadar se tada produžava unazad, što je bezbedno samo za still ili klip sa rezervom.
    if (run.lead != null) w0 = Math.min(w0, onset - run.lead);
    natural = shots[iLast].t_out;
    shotRange = [iFirst, iLast];
  }
  w0 = Math.max(w0, lo, 0);
  const w1raw = Math.min(natural, nextOnset - o.guard, duration);
  const frames = Math.floor((w1raw - w0) * o.fps + 1e-6);
  const w1 = w0 + frames / o.fps;
  if (frames < 1 || w1 < offset + 0.15) {
    throw new Error(`${part.slug} ${run.from}..${run.to ?? run.from}: prozor ${w0.toFixed(3)}–${w1.toFixed(3)} ne obuhvata ` +
      `govor (kraj reči ${offset.toFixed(3)}, sledeća rečenica ${nextOnset.toFixed(3)})`);
  }
  return { iFrom, iTo, w0, w1, frames, onset, offset, nextOnset, shotRange, lead: onset - w0, tail: w1 - offset };
}

/**
 * Kadrovi jednog runa, u frejmovima od početka prozora. Vraća [{shot, start, len, useIn, trimmed}].
 * `start` i `len` su celi frejmovi; kadrovi pločaju prozor bez rupa (prvi počinje na 0, svaki
 * sledeći tamo gde je prethodni stao, poslednji staje na kraju prozora).
 */
export function planShots(part, run, win, o = COMPILE) {
  const { fps } = o;
  if (run.visual) {
    const s = part.shots.find((x) => x.shot_id === pad2(run.visual));
    if (!s) throw new Error(`${part.slug}: visual ${run.visual} nije shot tog dela`);
    return [{ part, shot: s, start: 0, len: win.frames, useIn: isStill(s) ? 0 : (run.use_in ?? 0), trimmed: 0 }];
  }
  const inWindow = part.shots.slice(win.shotRange[0], win.shotRange[1] + 1)
    .filter((s) => s.t_in < win.w1 - 1e-6);

  const rows = inWindow.map((s, k) => ({
    part,
    shot: s,
    start: k === 0 ? 0 : Math.min(win.frames, Math.max(0, Math.round((s.t_in - win.w0) * fps))),
  }));
  // Kadar kraći od frejma posle zaokruživanja ispada; ostali ga ne primećuju.
  const kept = rows.filter((r, k) => k === 0 || r.start > rows[k - 1].start);
  kept.forEach((r, k) => { r.len = (k + 1 < kept.length ? kept[k + 1].start : win.frames) - r.start; });

  const head = kept[0];
  const headTrim = Math.max(0, win.w0 - head.shot.t_in);
  if (!isStill(head.shot) && headTrim > o.maxHeadTrim) {
    throw new Error(`${part.slug} kadar ${head.shot.shot_id} počinje ${headTrim.toFixed(2)}s pre prozora ` +
      `(${win.w0.toFixed(2)}s) — klip se ne seče toliko; daj run-u \`visual\` ili početak na početku beata`);
  }
  return kept.map((r, k) => ({
    part,
    shot: r.shot,
    start: r.start,
    len: r.len,
    useIn: round3(r.shot.use_in + (k === 0 && !isStill(r.shot) ? headTrim : 0)),
    trimmed: k === 0 ? headTrim : 0,
  }));
}

// ---------------------------------------------------------------- spoljni audio (uvod, završetak)

/** Tekst runa u rečenice: niz ostaje kakav je, string se seče posle `.`, `!`, `?`. */
export function splitSentences(text) {
  if (Array.isArray(text)) return text.map((t) => String(t).trim()).filter(Boolean);
  return String(text).split(/(?<=[.!?])\s+/).map((t) => t.trim()).filter(Boolean);
}

/**
 * Rečenice spoljnog fajla. Stavka može biti i `{ text, start, end }` sa izmerenim vremenom govora u
 * sekundama fajla (iz `speechGaps`); tada sve stavke moraju imati vreme, a titlovi prate stvarni govor
 * umesto srazmerne raspodele po slovima. Vraća [{ text, start?, end? }].
 */
export function externalSentences(text) {
  if (!Array.isArray(text) || !text.some((x) => x && typeof x === 'object')) {
    return splitSentences(text).map((t) => ({ text: t }));
  }
  let prevEnd = 0;
  return text.map((x, i) => {
    const t = String(x?.text ?? '').trim();
    if (!t || typeof x.start !== 'number' || typeof x.end !== 'number' || !(x.end > x.start)) {
      throw new Error(`text[${i}]: stavka sa vremenom traži \`text\`, \`start\` i \`end\` (end > start), ` +
        'a sve stavke u nizu moraju biti takve');
    }
    if (x.start < prevEnd - 1e-6) throw new Error(`text[${i}]: počinje (${x.start}s) pre kraja prethodne stavke (${prevEnd}s)`);
    prevEnd = x.end;
    return { text: t, start: round3(x.start), end: round3(x.end) };
  });
}

/**
 * „Deo" za snimljen fajl koji nije ni u jednoj epizodi. Govor je između prve i poslednje tišine
 * koja dotiče ivice fajla; rečenice dele taj raspon srazmerno broju slova — dovoljno za granice
 * kadrova i za titlove, a tačno vreme reči (`at`) se zadaje po potrebi kad se fajl čuje. Kad stavke
 * teksta nose vreme (`externalSentences`), koristi se ono i srazmerna raspodela otpada.
 */
export function makeExternalPart({ slug, file, text, duration, gaps = [] }) {
  const items = externalSentences(text);
  if (!items.length) throw new Error(`${slug}: run sa audio fajlom traži \`text\``);
  if (items[0].start != null) {
    if (items.at(-1).end > duration + 0.05) {
      throw new Error(`${slug}: stavka teksta se završava na ${items.at(-1).end}s, a fajl traje ${duration}s`);
    }
    const sentences = items.map((it, i) => ({
      id: `T${String(i + 1).padStart(2, '0')}`, start: it.start, end: it.end, dur: round3(it.end - it.start),
      text: it.text, confidence: null,
    }));
    return {
      slug, prefix: 'x', dir: path.dirname(file), storyboard: { beats: [] },
      timing: { duration, sentences, words: [] }, manifest: {}, sentences, shots: [],
      bounds: sentences.map((s) => ({ onset: s.start, offset: s.end })),
      duration, narration: file, external: true,
    };
  }
  const parts = items.map((it) => it.text);
  const first = gaps[0];
  const last = gaps.at(-1);
  const onset = first && first.s <= 0.02 ? first.e : 0;
  const offset = last && last.e >= duration - 0.05 ? last.s : duration;
  if (offset - onset < 0.5) throw new Error(`${slug}: u fajlu nema govora (${onset.toFixed(2)}–${offset.toFixed(2)}s)`);
  const chars = parts.reduce((n, t) => n + t.length, 0);
  let t = onset;
  const sentences = parts.map((text_, i) => {
    const span = ((offset - onset) * text_.length) / chars;
    const s = { id: `T${String(i + 1).padStart(2, '0')}`, start: round3(t), end: round3(t + span), text: text_, confidence: null };
    s.dur = round3(s.end - s.start);
    t += span;
    return s;
  });
  return {
    slug, prefix: 'x', dir: path.dirname(file), storyboard: { beats: [] },
    timing: { duration, sentences, words: [] }, manifest: {}, sentences, shots: [],
    bounds: sentences.map((s) => ({ onset: s.start, offset: s.end })),
    duration, narration: file, external: true,
  };
}

/** Prozor spoljnog fajla: od malo pre govora do malo posle njega, pa `hold` sekundi tišine. */
export function planExternalWindow(part, run, o = COMPILE) {
  const lead = run.lead ?? o.lead;
  const onset = part.bounds[0].onset;
  const offset = part.bounds.at(-1).offset;
  const w0 = Math.max(0, onset - lead);
  const audioFrames = Math.floor((Math.min(part.duration, offset + (run.tail ?? o.tail)) - w0) * o.fps + 1e-6);
  const padFrames = Math.round((run.hold ?? 0) * o.fps);
  if (audioFrames < 1) throw new Error(`${part.slug}: prozor spoljnog fajla je prazan`);
  return {
    iFrom: 0, iTo: part.sentences.length - 1, w0, w1: w0 + audioFrames / o.fps,
    frames: audioFrames + padFrames, padFrames, onset, offset, nextOnset: part.duration, shotRange: null,
    lead: onset - w0, tail: audioFrames / o.fps + w0 - offset,
  };
}

/**
 * Kadrovi spoljnog runa: kadar po zapisu iz `run.shots`. Početak je `at` (sekunde fajla) ili, bez
 * njega, srazmeran zbiru težina; poslednji kadar traje do kraja prozora (i preko držanja).
 */
export function planExternalShots(run, win, shotOf, o = COMPILE) {
  const specs = run.shots ?? [];
  if (!specs.length) throw new Error('run sa audio fajlom traži `shots`');
  const weights = specs.map((x) => x.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const starts = specs.map((x, k) => {
    const even = Math.round((acc / total) * win.frames);
    acc += weights[k];
    if (k === 0) return 0;
    return typeof x.at === 'number' ? Math.round((x.at - win.w0) * o.fps) : even;
  });
  const rows = specs.map((x, k) => {
    const { part, shot } = shotOf(x);
    const len = (k + 1 < specs.length ? starts[k + 1] : win.frames) - starts[k];
    if (len < 1) throw new Error(`kadar ${x.shot} (${x.episode}) ispada: \`at\` nije posle prethodnog kadra`);
    return { part, shot, start: starts[k], len, useIn: 0, trimmed: 0, external: true };
  });
  return rows;
}

// ---------------------------------------------------------------- tajmlajn

/**
 * Plan svih runova -> ravna lista kadrova na novom tajmlajnu (celi frejmovi), i prozori sa
 * pomakom. Dva uzastopna still-a iste slike (isti deo, isti `source_file`) postaju jedan kadar.
 */
export function layout(planned, o = COMPILE) {
  const { fps } = o;
  let t = 0;
  const flat = [];
  const windows = [];
  for (const p of planned) {
    windows.push({ ...p.win, run: p.run, part: p.part, offsetFrames: t });
    for (const r of p.shots) {
      flat.push({
        part: r.part ?? p.part, shot: r.shot, run: p.run, external: r.external === true,
        startF: t + r.start, lenF: r.len, useIn: r.useIn,
      });
    }
    t += p.win.frames;
  }
  const merged = [];
  for (const x of flat) {
    const prev = merged.at(-1);
    if (prev && isStill(x.shot) && isStill(prev.shot) && prev.part === x.part
      && prev.shot.source_file === x.shot.source_file && prev.startF + prev.lenF === x.startF) {
      prev.lenF += x.lenF;
      prev.mergedFrom = (prev.mergedFrom ?? 1) + 1;
    } else {
      merged.push({ ...x });
    }
  }
  return { shots: merged, windows, totalFrames: t, duration: round3(t / fps) };
}

/** Novi shot_id: prefix dela + stari id. */
export const newShotId = (part, shot) => `${part.prefix}${pad2(shot.shot_id)}`;

/** Putanja medija u novoj epizodi. */
export const newSource = (part, shot) => `shots/${part.prefix}/${path.basename(shot.source_file)}`;

/** `freeze_tail` novih shot_id-ova: odobrenja iz izvornih delova za kadrove koji su ostali. */
export function freezeTailFor(shots) {
  const out = new Set();
  for (const x of shots) {
    const approved = x.part.manifest.freeze_tail;
    if (!Array.isArray(approved)) continue;
    if (approved.map(pad2).includes(pad2(x.shot.shot_id))) out.add(newShotId(x.part, x.shot));
  }
  return [...out].sort();
}

/** Montažni storyboard.json (v. odluku 4). */
export function buildStoryboard(slug, laid, narrationDuration, o = COMPILE) {
  const { fps } = o;
  const ids = new Set();
  const beats = [];
  let cur = null;
  for (const x of laid.shots) {
    const id = newShotId(x.part, x.shot);
    if (ids.has(id)) throw new Error(`shot ${id} se pojavljuje dvaput — svaki kadar sme da uđe u compilation jednom`);
    ids.add(id);
    const tIn = round3(x.startF / fps);
    const tOut = round3((x.startF + x.lenF) / fps);
    const useLen = round3(tOut - tIn);
    const key = `${x.external ? 'framing:' : ''}${x.part.slug}:${x.shot.beat_id}`;
    if (!cur || cur.key !== key) {
      cur = {
        key,
        beat: {
          beat_id: `B${String(beats.length + 1).padStart(3, '0')}`,
          origin: { episode: x.part.slug, beat_id: x.shot.beat_id, ...(x.external ? { framing: true } : {}) },
          narration_says: x.external ? null : (x.shot.beat?.narration_says ?? null),
          start: tIn, end: tOut, dur: useLen, shots: [],
        },
      };
      beats.push(cur.beat);
    }
    cur.beat.end = tOut;
    cur.beat.dur = round3(cur.beat.end - cur.beat.start);
    cur.beat.shots.push({
      shot_id: id,
      beat_id: cur.beat.beat_id,
      link_group: null,
      t_in: tIn,
      t_out: tOut,
      use_in: x.useIn,
      use_out: round3(x.useIn + useLen),
      use_len: useLen,
      motion_budget: useLen,
      gen_len: x.shot.gen_len ?? null,
      render_mode: renderMode(x.shot),
      still_motion: isStill(x.shot) ? x.shot.still_motion : null,
      source_file: newSource(x.part, x.shot),
      ingredient_image: null,
      characters: x.shot.characters ?? [],
      origin: { episode: x.part.slug, shot_id: x.shot.shot_id, source_file: x.shot.source_file },
    });
  }
  return {
    schema_version: 2,
    episode: slug,
    generated_at: new Date().toISOString(),
    generated_by: 'tools/compile.mjs',
    narration_duration: narrationDuration,
    fps,
    beats,
  };
}

/** timing.json nove epizode: rečenice i reči pomerene u novo vreme (za titlove i chaptere). */
export function buildTiming(laid, narrationDuration) {
  const sentences = [];
  const words = [];
  const fps = COMPILE.fps;
  let n = 0;
  for (const w of laid.windows) {
    const base = w.offsetFrames / fps;
    const span = w.frames / fps;
    const map = (t) => round3(base + Math.min(span, Math.max(0, t - w.w0)));
    const ids = new Map();
    for (let i = w.iFrom; i <= w.iTo; i += 1) {
      const s = w.part.sentences[i];
      n += 1;
      const id = `S${String(n).padStart(3, '0')}`;
      ids.set(s.id, id);
      const start = map(s.start);
      const end = map(s.end);
      sentences.push({
        id, start, end, dur: round3(end - start), text: s.text, confidence: s.confidence ?? null,
        origin: { episode: w.part.slug, id: s.id },
      });
    }
    for (const word of w.part.timing.words ?? []) {
      if (!ids.has(word.sentence_id)) continue;
      words.push({
        sentence_id: ids.get(word.sentence_id), word: word.word,
        start: map(word.start), end: map(word.end), confidence: word.confidence ?? null,
      });
    }
  }
  return { duration: narrationDuration, model: 'compile', sentences, words };
}

/** Poglavlja: početak svakog runa sa `chapter`. */
export function chapterList(laid) {
  return laid.windows
    .filter((w) => w.run.chapter)
    .map((w) => ({ title: w.run.chapter, start: round3(w.offsetFrames / COMPILE.fps) }));
}

// ---------------------------------------------------------------- ffmpeg

/** ffmpeg argumenti: prozori narracije jedan za drugim u jedan mp3. */
export function narrationArgs(windows, out, o = COMPILE) {
  const inputs = [];
  const filters = [];
  const labels = [];
  const idxOf = new Map();
  for (const w of windows) {
    if (!idxOf.has(w.part.narration)) {
      idxOf.set(w.part.narration, idxOf.size);
      inputs.push('-i', w.part.narration);
    }
  }
  windows.forEach((w, k) => {
    const i = idxOf.get(w.part.narration);
    const span = w.frames / o.fps;
    const audioSpan = (w.frames - (w.padFrames ?? 0)) / o.fps;
    const f = Math.min(o.fade, audioSpan / 4);
    // `apad` produžava prozor tišinom do punih `span` sekundi (držanje poslednjeg kadra).
    const pad = w.padFrames ? `,apad=whole_dur=${span.toFixed(6)}` : '';
    filters.push(`[${i}:a]atrim=start=${w.w0.toFixed(6)}:end=${w.w1.toFixed(6)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${f},afade=t=out:st=${(audioSpan - f).toFixed(6)}:d=${f}${pad}[a${k}]`);
    labels.push(`[a${k}]`);
  });
  filters.push(`${labels.join('')}concat=n=${labels.length}:v=0:a=1[out]`);
  return [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '[out]', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '192k',
    out,
  ];
}

/** Tvrdi link, a kad nije moguće (drugi disk) kopija. Vraća 'link' | 'copy' | 'ok' (već tu). */
export function linkOrCopy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    const a = fs.statSync(src);
    const b = fs.statSync(dest);
    if (a.size === b.size && a.ino === b.ino && a.dev === b.dev) return 'ok';
    if (a.size === b.size && a.mtimeMs === b.mtimeMs) return 'ok';
    fs.rmSync(dest);
  }
  try {
    fs.linkSync(src, dest);
    return 'link';
  } catch {
    fs.copyFileSync(src, dest);
    return 'copy';
  }
}

// ---------------------------------------------------------------- izveštaj

export function reportMarkdown({ slug, laid, chapters, narration, warnings, mediaCount }) {
  const L = [];
  L.push(`# compile-report — ${slug}`, '');
  L.push('> Generisano (`tools/compile.mjs`) — ne menja se rukom. Izvor istine je `compile.json`.', '');
  L.push(`Trajanje ${clock(laid.duration)} (${laid.duration}s, ${laid.totalFrames} frejmova) · ` +
    `${laid.shots.length} kadrova · ${mediaCount} medija povezano · narracija ${narration.toFixed(3)}s`, '');
  L.push('## Poglavlja', '');
  for (const c of chapters) L.push(`- ${clock(c.start)} ${c.title}`);
  L.push('', '## Prozori', '');
  L.push('| Od | Deo | Rečenice | Izvorno vreme | Nova pozicija | Lead | Rep |');
  L.push('|---|---|---|---|---|---|---|');
  laid.windows.forEach((w, k) => {
    const first = w.part.sentences[w.iFrom].id;
    const last = w.part.sentences[w.iTo].id;
    L.push(`| ${k + 1}${w.run.visual ? ' (most)' : ''} | ${w.part.slug} | ${first}..${last} | ` +
      `${w.w0.toFixed(2)}–${w.w1.toFixed(2)}s | ${(w.offsetFrames / COMPILE.fps).toFixed(2)}s | ` +
      `${w.lead.toFixed(2)}s | ${w.tail.toFixed(2)}s |`);
  });
  if (warnings.length) {
    L.push('', '## Upozorenja', '');
    for (const w of warnings) L.push(`- ${w}`);
  }
  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------- CLI

const USAGE = `Upotreba: node tools/compile.mjs episodes/<slug> [--plan compile.json] [--dry-run] [--no-audio] [--no-link]

  --plan F    plan u folderu epizode (podrazumevano compile.json), npr. compile.framed.json
  --dry-run   samo plan i izveštaj u terminalu; ništa se ne piše
  --no-audio  ne pravi narration.mp3 (kad već postoji)
  --no-link   ne povezuje medije u shots/ (kad već postoje)`;

export function parseArgs(argv) {
  const out = { dir: null, plan: 'compile.json', dryRun: false, audio: true, link: true, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--plan' || a.startsWith('--plan=')) {
      const v = a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[++i];
      if (!v) throw new Error(`--plan traži ime fajla\n\n${USAGE}`);
      out.plan = v;
    }
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--no-audio') out.audio = false;
    else if (a === '--no-link') out.link = false;
    else if (a.startsWith('-')) throw new Error(`nepoznata zastavica ${a}\n\n${USAGE}`);
    else if (!out.dir) out.dir = a;
    else throw new Error(`višak argumenta ${a}\n\n${USAGE}`);
  }
  return out;
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

async function loadPart(run, cache, o) {
  if (cache.has(run.episode)) {
    const p = cache.get(run.episode);
    if (p.prefix !== String(run.prefix)) throw new Error(`${run.episode}: dva različita prefiksa (${p.prefix}, ${run.prefix})`);
    return p;
  }
  const dir = path.join(ROOT, 'episodes', run.episode);
  if (!fs.existsSync(dir)) throw new Error(`nema epizode ${run.episode}`);
  const timing = readJson(path.join(dir, 'timing.json'));
  const storyboard = readJson(path.join(dir, 'storyboard.json'));
  const manifest = readJson(path.join(dir, 'episode.json'));
  const gaps = await speechGaps(path.join(dir, manifest.narration_file ?? 'narration.mp3'));
  const part = makePart({ slug: run.episode, prefix: String(run.prefix), dir, storyboard, timing, manifest, gaps, o });
  cache.set(run.episode, part);
  return part;
}

export async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (!args.dir) throw new Error(USAGE);
  const dir = fs.existsSync(args.dir) ? args.dir : path.join(ROOT, 'episodes', args.dir);
  const planFile = path.join(dir, args.plan);
  if (!fs.existsSync(planFile)) throw new Error(`nema ${slash(planFile)}`);
  const plan = readJson(planFile);
  const o = { ...COMPILE, ...(plan.options ?? {}) };
  const slug = plan.slug ?? path.basename(dir);

  const cache = new Map();
  const planned = [];
  for (const run of plan.runs) {
    if (run.audio) {
      const file = path.join(dir, run.audio);
      if (!fs.existsSync(file)) {
        throw new Error(`fali ${slash(file)} — snimi ga po framing.md ili izbaci taj run iz ${args.plan}`);
      }
      const info = await probe(file);
      const ext = makeExternalPart({
        slug: run.audio.replace(/\.[^.]+$/, '').replace(/\W+/g, '-'), file, text: run.text,
        duration: info.duration, gaps: await speechGaps(file),
      });
      for (const sp of run.shots ?? []) await loadPart(sp, cache, o);
      const win = planExternalWindow(ext, run, o);
      const shots = planExternalShots(run, win, (x) => {
        const part = cache.get(x.episode);
        const shot = part.shots.find((s) => s.shot_id === pad2(x.shot));
        if (!shot) throw new Error(`${x.episode}: nema kadra ${x.shot}`);
        return { part, shot };
      }, o);
      planned.push({ run, part: ext, win, shots });
      continue;
    }
    const part = await loadPart(run, cache, o);
    const win = planWindow(part, run, o);
    planned.push({ run, part, win, shots: planShots(part, run, win, o) });
  }
  const laid = layout(planned, o);
  const chapters = chapterList(laid);

  const warnings = [];
  for (let k = 0; k + 1 < laid.windows.length; k += 1) {
    const a = laid.windows[k];
    const b = laid.windows[k + 1];
    const pause = a.tail + (a.padFrames ?? 0) / o.fps + b.lead;
    if (a.part !== b.part || a.iTo + 1 !== b.iFrom) {
      if (pause < 0.6) warnings.push(`prozor ${k + 1} → ${k + 2}: pauza između rečenica samo ${pause.toFixed(2)}s`);
    }
  }
  for (const x of laid.shots) {
    if (x.useIn > 0 && x.useIn > x.shot.use_in + 1e-6) {
      warnings.push(`kadar ${newShotId(x.part, x.shot)} (${x.part.slug}): glava klipa skraćena ${(x.useIn - x.shot.use_in).toFixed(2)}s`);
    }
    if (!isStill(x.shot) && x.shot.use_len && x.lenF / o.fps > x.shot.use_len + 0.05) {
      warnings.push(`kadar ${newShotId(x.part, x.shot)}: produžen ${(x.lenF / o.fps - x.shot.use_len).toFixed(2)}s preko originalnog reza`);
    }
  }

  console.log(`${slug} · ${plan.runs.length} runova · ${laid.shots.length} kadrova · ${clock(laid.duration)} (${laid.duration}s)`);
  for (const c of chapters) console.log(`  ${clock(c.start)}  ${c.title}`);
  for (const w of warnings) console.log(`  ! ${w}`);
  if (args.dryRun) return 0;

  // medije
  let mediaCount = 0;
  if (args.link) {
    const stats = { link: 0, copy: 0, ok: 0 };
    const seen = new Set();
    for (const x of laid.shots) {
      const dest = path.join(dir, newSource(x.part, x.shot));
      if (seen.has(dest)) continue;
      seen.add(dest);
      const src = path.join(x.part.dir, x.shot.source_file);
      if (!fs.existsSync(src)) throw new Error(`nema izvora ${slash(src)}`);
      stats[linkOrCopy(src, dest)] += 1;
      mediaCount += 1;
    }
    console.log(`mediji: ${stats.link} povezano, ${stats.copy} kopirano, ${stats.ok} već tu`);
  }

  // narracija
  const narrationFile = path.join(dir, 'narration.mp3');
  if (args.audio) {
    const { code, stderr } = await ffmpegRun(narrationArgs(laid.windows, narrationFile, o), { check: false });
    if (code !== 0) throw new Error(`ffmpeg (narracija) je pao:\n${stderr}`);
  }
  const info = await probe(narrationFile);
  const narration = info.duration;
  console.log(`narration.mp3 ${narration.toFixed(3)}s (video ${laid.duration}s, razlika ${(narration - laid.duration).toFixed(3)}s)`);
  if (Math.abs(narration - laid.duration) > 0.1) {
    warnings.push(`narracija ${narration.toFixed(3)}s i video ${laid.duration}s se razlikuju za više od 0.1s`);
  }

  const storyboard = buildStoryboard(slug, laid, laid.duration, o);
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(storyboard, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(dir, 'timing.json'), JSON.stringify(buildTiming(laid, laid.duration), null, 2) + '\n', 'utf8');

  const manifestFile = path.join(dir, 'episode.json');
  const prev = fs.existsSync(manifestFile) ? readJson(manifestFile) : {};
  const manifest = {
    slug,
    title: plan.title ?? prev.title ?? slug,
    ...(plan.protagonists ? { protagonists: plan.protagonists } : {}),
    status: prev.status ?? 'draft',
    voice: null,
    narration_file: 'narration.mp3',
    final_file: 'final.mp4',
    endcard_file: null,
    intro_file: null,
    freeze_tail: freezeTailFor(laid.shots),
    notes: plan.notes ?? prev.notes ?? '',
  };
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  fs.writeFileSync(path.join(dir, 'compile-report.md'),
    reportMarkdown({ slug, laid, chapters, narration, warnings, mediaCount }), 'utf8');
  console.log(`-> ${slash(path.join(dir, 'storyboard.json'))}, timing.json, episode.json, compile-report.md`);
  console.log(`dalje: node tools/assemble.mjs ${slash(path.relative(ROOT, dir))}`);
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
