// tools/publish.mjs
//
// Mehanički deo publish kompleta: titlovi iz `timing.json` i provera chaptera i naslova u `publish.md`.
// Tekstualni deo (naslovi, description, hashtagovi) piše se po docs/publish.md.
//
//   node tools/publish.mjs episodes/<slug>
//     -> piše episodes/<slug>/subtitles.srt
//     -> štampa listu rečenica sa m:ss vremenima (materijal za chaptere)
//     -> ako publish.md postoji, proverava njegove chaptere i naslove prema
//        episode.json.protagonists (izlaz 1 kad ne prolaze) i štampa PLAYLISTS (samo upozorenje)
//     -> proverava i medium.md (Medium članak uz video, docs/medium.md): kad ga nema, samo
//        podseća; kad postoji a ne prolazi pravila, izlaz 1
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
import { checkEpisode as checkMedium } from './medium.mjs';

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

export const TITLE_RULES = { count: 5, maxChars: 100, minFullCast: 3 };

/** TITLE OPTIONS iz publish.md -> [{ n, title, raw }]. Ugao posle poslednjeg „ — " nije deo naslova. */
export function parseTitles(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === 'TITLE OPTIONS:');
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    const m = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (!m) {
      if (out.length) break;
      continue;
    }
    const cut = m[2].lastIndexOf(' — ');
    out.push({ n: +m[1], title: (cut > 0 ? m[2].slice(0, cut) : m[2]).trim(), raw: line.trim() });
  }
  return out;
}

/**
 * PLAYLISTS iz publish.md -> [{ name, id, isNew, note }] ili `null` kad odeljka nema.
 * Stavka: `- Ime (ID) — oznaka`; plejlista koja još ne postoji ima `(new)` umesto ID-ja.
 * 26. nov 2026: plejliste su do sada živele samo u YouTube Studiju i u `data.js` sajta, pa se za
 * neobjavljenu epizodu nije znalo kuda ide; odluka se sad zapisuje pri publishu (docs/publish.md).
 */
export function parsePlaylists(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === 'PLAYLISTS:');
  if (start < 0) return null;
  const out = [];
  for (const line of lines.slice(start + 1)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^-\s+(.+)$/);
    if (!m) break;
    const cut = m[1].lastIndexOf(' — ');
    const head = (cut > 0 ? m[1].slice(0, cut) : m[1]).trim();
    const note = cut > 0 ? m[1].slice(cut + 3).trim() : '';
    const p = head.match(/^(.+?)\s*\(([^()]+)\)$/);
    const tag = p?.[2].trim();
    const isNew = tag?.toLowerCase() === 'new';
    out.push({ name: (p ? p[1] : head).trim(), id: tag && !isNew ? tag : null, isNew, note });
  }
  return out;
}

/** Upozorenja za PLAYLISTS (ADVISORY: ne menjaju izlazni kod). Vraća listu poruka. */
export function validatePlaylists(playlists) {
  if (playlists === null) return ['nema PLAYLISTS — upiši u koje plejliste ide video (docs/publish.md → PLAYLISTS)'];
  if (!playlists.length) return ['PLAYLISTS je prazan — bar jedna plejlista, ili jedna nova sa (new)'];
  return playlists.filter((p) => !p.id && !p.isNew)
    .map((p) => `plejlista „${p.name}" nema ID — prepiši ga iz data.js sajta ili stavi (new)`);
}

/** Ime kao cela reč, bez obzira na velika slova („Zeus's" da, „Zeusian" ne). */
export const nameRe = (name) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');

/** Lik je ime ili niz ravnopravnih oblika (nepoznat lik: ime ili uloga koju naslovi koriste). */
export const forms = (p) => (Array.isArray(p) ? p : [p]);
export const label = (p) => forms(p).join(' / ');

/**
 * Naslov long videa prodaje ceo video: imenuje sve glavne likove (`episode.json.protagonists`)
 * ili nijednog (grupno, „Three Gods Who…"), nikad samo neke — to je naslov za Short o delu priče.
 * Prvi naslov i bar `minFullCast` od pet imenuju sve. Vraća listu grešaka.
 */
export function validateTitles(titles, protagonists, rules = TITLE_RULES) {
  if (!protagonists?.length) {
    return ['episode.json nema "protagonists" — upiši imena likova o kojima je ceo video (docs/publish.md → WHOLE VIDEO, WHOLE CAST)'];
  }
  const errors = [];
  if (titles.length !== rules.count) errors.push(`naslova ima ${titles.length}, treba ${rules.count}`);
  let full = 0;
  for (const t of titles) {
    if (t.title.length > rules.maxChars) {
      errors.push(`naslov ${t.n} ima ${t.title.length} znakova, YouTube prima najviše ${rules.maxChars}`);
    }
    const named = protagonists.filter((p) => forms(p).some((f) => nameRe(f).test(t.title)));
    const missing = protagonists.filter((p) => !named.includes(p)).map(label);
    if (!missing.length) full++;
    else if (t.n === 1) errors.push(`naslov 1 mora da imenuje sve glavne likove, fali: ${missing.join(', ')}`);
    else if (named.length) {
      errors.push(`naslov ${t.n} imenuje samo ${named.map(label).join(', ')} — to je naslov dela priče (Short), ne celog videa; fali: ${missing.join(', ')}`);
    }
  }
  const need = Math.min(rules.minFullCast, rules.count);
  if (full < need) {
    errors.push(`samo ${full} od ${titles.length} naslova imenuje sve glavne likove (${protagonists.map(label).join(', ')}), treba bar ${need}`);
  }
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
  const text = fs.readFileSync(pub, 'utf8');
  const chapters = parseChapters(text);
  const errors = validateChapters(chapters, timing.duration);
  console.log(`\npublish.md · ${chapters.length} chaptera`);
  for (const e of errors) console.log(`  GREŠKA ${e}`);
  if (!errors.length) console.log('  chapteri prolaze YouTube pravila');

  const epFile = path.join(dir, 'episode.json');
  const protagonists = fs.existsSync(epFile) ? JSON.parse(fs.readFileSync(epFile, 'utf8')).protagonists : undefined;
  const titles = parseTitles(text);
  const titleErrors = validateTitles(titles, protagonists);
  console.log(`\npublish.md · ${titles.length} naslova · glavni likovi: ${protagonists?.map(label).join(', ') || '—'}`);
  for (const e of titleErrors) console.log(`  GREŠKA ${e}`);
  if (!titleErrors.length) console.log('  naslovi prodaju ceo video (svi glavni likovi ili nijedan)');

  const playlists = parsePlaylists(text);
  console.log(`\npublish.md · plejliste: ${playlists?.map((p) => p.name + (p.isNew ? ' (nova)' : '')).join(', ') || '—'}`);
  for (const w of validatePlaylists(playlists)) console.log(`  upozorenje ${w}`);

  const medium = checkMedium(dir);
  let mediumErrors = 0;
  if (!medium.exists) {
    console.log('\nmedium.md · nema ga — napiši članak za Medium po docs/medium.md (objavljuje se sam kad video postane javan)');
  } else {
    mediumErrors = medium.errors.length;
    console.log(`\nmedium.md · ${medium.stats.words} reči · ${medium.stats.videoLinks}/${medium.stats.wantLinks} link(a) ka videu`);
    for (const w of medium.warnings) console.log(`  upozorenje ${w}`);
    for (const e of medium.errors) console.log(`  GREŠKA ${e}`);
    if (!mediumErrors) console.log('  medium.md prolazi pravila iz docs/medium.md');
  }
  return errors.length || titleErrors.length || mediumErrors ? 1 : 0;
}

if (process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2));
}
