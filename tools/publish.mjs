// tools/publish.mjs
//
// Mehanički deo publish kompleta: titlovi iz `timing.json` i provera chaptera u `publish.md`.
// Tekstualni deo (naslovi, description, hashtagovi) piše se po docs/publish.md.
//
//   node tools/publish.mjs episodes/<slug>
//     -> piše episodes/<slug>/subtitles.srt
//     -> štampa listu rečenica sa m:ss vremenima (materijal za chaptere)
//     -> ako publish.md postoji, proverava njegove chaptere (izlaz 1 kad ne prolaze)
//
// Zašto SRT a ne JSON: YouTube Studio prima SRT, VTT, SBV i slične formate, JSON ne. SRT je
// najjednostavniji i najmanje problematičan. Naracija u final.mp4 kreće od 0:00 (uvodni klip
// zamenjuje prvi shot, ne pomera zvuk), pa su vremena iz timing.json direktno vremena u videu.
//
// Pravila čitljivosti (uobičajena za titlove): najviše 42 znaka po redu, najviše 2 reda,
// najviše 7s po titlu, najmanje 1s. Duža rečenica se seče na granicama reči, po mogućstvu
// posle zareza.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SUB_DEFAULTS = { maxChars: 42, maxLines: 2, maxDur: 7, minDur: 1, tail: 0.4 };

/** Rečenice -> tokeni sa vremenima. Reči iz timing.json nemaju interpunkciju, pa tekst dolazi iz rečenice. */
function sentenceTokens(timing, sentence) {
  const words = (timing.words || []).filter((w) => w.sentence_id === sentence.id);
  const tokens = sentence.text.split(/\s+/).filter(Boolean);
  if (words.length === tokens.length) {
    return tokens.map((text, i) => ({ text, start: words[i].start, end: words[i].end }));
  }
  // Bez poklapanja: vreme rečenice raspoređeno po dužini tokena.
  const total = tokens.reduce((n, t) => n + t.length + 1, 0);
  let t = sentence.start;
  return tokens.map((text) => {
    const d = ((text.length + 1) / total) * (sentence.end - sentence.start);
    const tok = { text, start: t, end: t + d };
    t += d;
    return tok;
  });
}

const joinLen = (toks) => toks.reduce((n, t, i) => n + t.text.length + (i ? 1 : 0), 0);

/**
 * Deli tokene jedne rečenice na grupe koje staju u jedan titl. Programiranje unazad po granicama
 * reči: prvo najmanje grupa, zatim najujednačenije dužine (zbir kvadrata), uz kaznu za rez koji
 * ne pada posle interpunkcije. Pohlepno punjenje bi ostavljalo siročad tipa „Greece." sama.
 */
export function chunkTokens(tokens, opts = SUB_DEFAULTS) {
  const cap = opts.maxChars * opts.maxLines;
  const NO_PUNCT = 900; // ≈ razlika u ujednačenosti koju prelom posle zareza sme da „plati"
  const n = tokens.length;
  const best = Array(n + 1).fill(null);
  best[0] = { count: 0, cost: 0, prev: -1 };
  for (let i = 1; i <= n; i++) {
    for (let j = i - 1; j >= 0; j--) {
      const group = tokens.slice(j, i);
      const len = joinLen(group);
      const dur = group.at(-1).end - group[0].start;
      if (group.length > 1 && (len > cap || dur > opts.maxDur)) break;
      if (!best[j]) continue;
      const cutPenalty = i < n && !/[,;:.!?]$/.test(tokens[i - 1].text) ? NO_PUNCT : 0;
      const cand = { count: best[j].count + 1, cost: best[j].cost + len * len + cutPenalty, prev: j };
      if (!best[i] || cand.count < best[i].count || (cand.count === best[i].count && cand.cost < best[i].cost)) {
        best[i] = cand;
      }
    }
  }
  const chunks = [];
  for (let i = n; i > 0; i = best[i].prev) chunks.unshift(tokens.slice(best[i].prev, i));
  return chunks;
}

/** Tekst titla u 1 ili 2 reda, prelom tamo gde su redovi najujednačeniji. */
export function wrapLines(text, maxChars = SUB_DEFAULTS.maxChars) {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length);
    if (!best || score < best.score) best = { lines: [a, b], score };
  }
  return best.lines;
}

/** timing.json -> [{ index, start, end, lines }] */
export function buildCues(timing, opts = SUB_DEFAULTS) {
  const cues = [];
  for (const s of timing.sentences) {
    for (const group of chunkTokens(sentenceTokens(timing, s), opts)) {
      const text = group.map((t) => t.text).join(' ');
      cues.push({ start: group[0].start, end: group.at(-1).end, lines: wrapLines(text, opts.maxChars) });
    }
  }
  // Titl ostaje malo posle poslednje reči i traje bar minDur, ali nikad ne preklapa sledeći.
  cues.forEach((c, i) => {
    const next = i + 1 < cues.length ? cues[i + 1].start : Infinity;
    const want = Math.max(c.end + opts.tail, c.start + opts.minDur);
    c.end = Math.min(want, next, timing.duration ?? Infinity);
    c.index = i + 1;
  });
  return cues;
}

export function srtTime(sec) {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(ms % 1000, 3)}`;
}

export function toSrt(cues) {
  return cues.map((c) => `${c.index}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join('\n')}\n`).join('\n');
}

/** m:ss (ili h:mm:ss) za listu rečenica i chaptere. */
export function clock(sec) {
  const t = Math.floor(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Linije oblika `0:00 Naziv` iz teksta. */
export function parseChapters(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.+)$/);
    if (m) out.push({ at: (+(m[1] || 0)) * 3600 + +m[2] * 60 + +m[3], title: m[4].trim(), raw: line.trim() });
  }
  return out;
}

/** YouTube pravila: prvi 0:00, bar 3, rastuće, svaki bar 10s. Vraća listu grešaka. */
export function validateChapters(chapters, duration) {
  const errors = [];
  if (chapters.length < 3) errors.push(`chaptera ima ${chapters.length}, najmanje 3`);
  if (chapters.length && chapters[0].at !== 0) errors.push(`prvi chapter mora da krene od 0:00, a kreće od ${clock(chapters[0].at)}`);
  chapters.forEach((c, i) => {
    const end = i + 1 < chapters.length ? chapters[i + 1].at : duration;
    if (end == null) return;
    if (end <= c.at) errors.push(`"${c.raw}" nije posle prethodnog chaptera`);
    else if (end - c.at < 10) errors.push(`"${c.raw}" traje ${Math.round(end - c.at)}s, najmanje 10s`);
    if (duration != null && c.at >= duration) errors.push(`"${c.raw}" je posle kraja videa`);
  });
  return errors;
}

function main(argv) {
  const dir = argv[0];
  if (!dir) {
    console.error('upotreba: node tools/publish.mjs episodes/<slug>');
    return 2;
  }
  const timing = JSON.parse(fs.readFileSync(path.join(dir, 'timing.json'), 'utf8'));
  const cues = buildCues(timing);
  fs.writeFileSync(path.join(dir, 'subtitles.srt'), toSrt(cues));
  console.log(`subtitles.srt · ${cues.length} titlova · ${clock(timing.duration)}\n`);

  console.log('rečenice (za chaptere):');
  for (const s of timing.sentences) console.log(`  ${clock(s.start).padStart(5)}  ${s.id}  ${s.text}`);

  const pub = path.join(dir, 'publish.md');
  if (!fs.existsSync(pub)) return 0;
  const chapters = parseChapters(fs.readFileSync(pub, 'utf8'));
  const errors = validateChapters(chapters, timing.duration);
  console.log(`\npublish.md · ${chapters.length} chaptera`);
  for (const e of errors) console.log(`  GREŠKA ${e}`);
  if (!errors.length) console.log('  chapteri prolaze YouTube pravila');
  return errors.length ? 1 : 0;
}

if (process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2));
}
