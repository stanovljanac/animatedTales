// tools/align.mjs
//
// Forced alignment: narration.mp3 + script.md -> timing.json sa merenim granicama rečenica.
//
//   tokenize(text)                    -> normalizovani tokeni (poređenje skripta <-> ASR)
//   parseScript(md)                   -> { sentences, outroIndex }
//   needlemanWunsch(a, b, opts)       -> parovi indeksa, monotono
//   buildTiming(script, asrWords, o)  -> { timing, warnings, stats }
//
// Sve gore je čisto: nijedan poziv fajl-sistemu. I/O sloj (ffmpeg -> wav, whisper_words.py,
// keš, upis timing.json) je na dnu fajla i radi samo iz CLI-ja.
//
//   node tools/align.mjs episodes/<slug> [--model medium.en] [--asr-only] [--force] [--asr-script]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { probe, run as ffmpeg } from './ffmpeg.mjs';

// ---------------------------------------------------------------------------
// Normalizacija tokena — odluka C05
// ---------------------------------------------------------------------------
// Whisper i skripta se razilaze u pisanju, ne u rečima. Zato se obe strane svode na isti
// oblik pre poređenja:
//
//   · mala slova; sve što nije slovo ili cifra otpada  ("Rome," -> rome, "B.C." -> bc)
//   · apostrof time otpada bez deljenja reči           ("don't" -> dont, ne "do nt")
//   · crtica, en/em crta, kosa crta i donja crta dele  ("eye-level" -> eye, level)
//   · "&" -> and, "%" -> percent                       (izgovaraju se, pa se i broje)
//   · ceo broj se širi u reči                          ("390" -> three hundred ninety),
//     decimala preko "point" ("3.5" -> three point five), redni broj preko "first/second/…"
//
// Širenje brojeva postoji zbog jednog slučaja: skripta piše "390 B.C.", a whisper ume da
// napiše "three hundred ninety BC" (ili obrnuto). Pošto se širenje primenjuje na obe strane,
// oba oblika daju isti niz tokena. Poznato ograničenje: godine se izgovaraju u parovima
// ("fourteen fifty three"), a širenje daje kardinal ("one thousand four hundred fifty three") —
// NW to poravna delimično, vreme se i dalje dobije, a pada samo confidence te reči.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
const ORDINALS = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth',
  nine: 'ninth', twelve: 'twelfth' };

/** Ceo broj u reči: 390 -> [three, hundred, ninety]. Bez "and", kao u američkom izgovoru. */
export function numberToWords(n) {
  if (!Number.isFinite(n) || n < 0) return [];
  n = Math.floor(n);
  if (n < 20) return [ONES[n]];
  if (n < 100) {
    const out = [TENS[Math.floor(n / 10)]];
    if (n % 10) out.push(ONES[n % 10]);
    return out;
  }
  if (n < 1000) {
    const out = [ONES[Math.floor(n / 100)], 'hundred'];
    if (n % 100) out.push(...numberToWords(n % 100));
    return out;
  }
  for (const [value, name] of SCALES) {
    if (n >= value) {
      const out = [...numberToWords(Math.floor(n / value)), name];
      if (n % value) out.push(...numberToWords(n % value));
      return out;
    }
  }
  return [String(n)]; // preveliko za izgovor — ostaje kako jeste
}

const toOrdinal = (words) => {
  const last = words[words.length - 1];
  const ord = ORDINALS[last] ?? (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th');
  return [...words.slice(0, -1), ord];
};

/** Jedan token iz skripte/ASR-a -> nula ili više normalizovanih tokena. */
function expandToken(raw) {
  const t = raw.replace(/(?<=\d)[, ](?=\d)/g, ''); // 1,500 -> 1500
  if (/^\d+$/.test(t)) return numberToWords(Number(t));
  if (/^\d+\.\d+$/.test(t)) {
    const [a, b] = t.split('.');
    return [...numberToWords(Number(a)), 'point', ...[...b].map((d) => ONES[Number(d)])];
  }
  if (/^\d+(?:st|nd|rd|th)$/i.test(t)) return toOrdinal(numberToWords(parseInt(t, 10)));
  const bare = t.replace(/[^a-z0-9]/gi, '');
  if (!bare) return [];
  if (/^\d+$/.test(bare)) return numberToWords(Number(bare));
  return [bare.toLowerCase()];
}

/**
 * Tekst -> niz normalizovanih tokena. Isti postupak za skriptu i za ASR izlaz.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return String(text)
    .replace(/&/g, ' and ')
    .replace(/%/g, ' percent ')
    .replace(/[‐-―\-/\\_]+/g, ' ')
    .split(/\s+/)
    .flatMap((t) => (t ? expandToken(t) : []));
}

// ---------------------------------------------------------------------------
// Segmentacija script.md na rečenice — odluka C05
// ---------------------------------------------------------------------------
// Naslovi (`#`…`######`) nisu narracija i izbacuju se; sve ostalo je izgovoreni tekst.
// `## OUTRO` dodatno označava odakle počinje outro (`timing.outro_start`).
//
// Rečenica se prekida na `.` `!` `?` `…` (uz opciono zatvaranje navodnika/zagrade) kad iza
// sledi belina pa veliko slovo, cifra ili navodnik. Iz toga slede tri korisne posledice:
//   · decimale ne dele ("3.5" — iza tačke nema beline),
//   · "390 B.C. the Gauls" ne deli (iza sledi malo slovo),
//   · "He waited... and waited." ne deli.
// Ostaje slučaj skraćenice pred velikim slovom ("Mr. Smith") — zato lista skraćenica ispod,
// plus pravilo da je jedno slovo uvek inicijal ("J. R. Smith").
// Prazan red deli rečenice i bez interpunkcije — pasus u skripti je uvek kraj misli.

const ABBR = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie',
  'bc', 'ad', 'bce', 'ce', 'us', 'uk', 'ussr', 'phd', 'am', 'pm', 'no', 'fig', 'gen', 'capt',
  'sgt', 'lt', 'col', 'rev', 'hon', 'mt', 'ft', 'approx', 'ca', 'cf', 'esp', 'vol', 'ch', 'inc']);

const TERMINATOR = /([.!?…]+["'»”’)\]]*)(\s+)(?=["'«“(\[]?[A-Z0-9])/g;

/** Reč pred tačkom: skraćenica ili inicijal -> tačka ne deli rečenicu. */
function isAbbreviation(before) {
  const m = before.match(/([A-Za-z][A-Za-z.]*)$/);
  if (!m) return false;
  const w = m[1].replace(/\./g, '').toLowerCase();
  return w.length === 1 || ABBR.has(w);
}

/** Jedan pasus -> rečenice. */
export function splitSentences(paragraph) {
  const text = String(paragraph).replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const out = [];
  let last = 0;
  for (const m of text.matchAll(TERMINATOR)) {
    const cut = m.index + m[1].length;
    if (cut <= last) continue;
    if (m[1] === '.' && isAbbreviation(text.slice(last, m.index))) continue;
    out.push(text.slice(last, cut).trim());
    last = cut + m[2].length;
  }
  const tail = text.slice(last).trim();
  if (tail) out.push(tail);
  return out;
}

/** Markdown ukrasi koji se ne izgovaraju. */
const stripMarkdown = (line) =>
  line
    .replace(/^\s{0,3}>\s?/, '')
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .trim();

/**
 * `script.md` -> rečenice sa `id`-jem i sekcijom.
 * @param {string} md
 * @returns {{sentences: Array<{id: string, text: string, section: string}>, outroIndex: number|null}}
 */
export function parseScript(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n');

  const blocks = [];
  let buf = [];
  let section = 'body';
  let fence = false;
  const flush = () => {
    if (buf.length) blocks.push({ text: buf.join(' '), section });
    buf = [];
  };

  for (const raw of lines) {
    if (/^\s*```/.test(raw)) {
      fence = !fence;
      flush();
      continue;
    }
    if (fence) continue;
    const heading = raw.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      if (/^outro\b/i.test(heading[1].trim())) section = 'outro';
      continue;
    }
    const line = stripMarkdown(raw);
    if (!line) flush();
    else buf.push(line);
  }
  flush();

  const sentences = [];
  let outroIndex = null;
  for (const b of blocks) {
    for (const text of splitSentences(b.text)) {
      if (!/[A-Za-z0-9]/.test(text)) continue; // segment bez ijedne reči nije narracija
      if (b.section === 'outro' && outroIndex === null) outroIndex = sentences.length;
      sentences.push({
        id: 'S' + String(sentences.length + 1).padStart(2, '0'),
        text,
        section: b.section,
      });
    }
  }
  return { sentences, outroIndex };
}

// ---------------------------------------------------------------------------
// Needleman–Wunsch — odluka C05
// ---------------------------------------------------------------------------
// Globalno poravnanje nad normalizovanim tokenima. Skorovi: match +1, mismatch −1, gap −1.
// Ključan je odnos, ne apsolutne vrednosti: zamena košta −1, a par brisanje+umetanje −2, pa
// se whisper-ova pogrešno čuta reč poravna sa reči iz skripte (i time joj da vreme) umesto da
// se raspadne na dve rupe. To je cela poenta forced alignmenta — vreme se dobija i za reč koju
// je whisper pogrešio.
//
// Matrica je O(n·m): 600×650 tokena je ~390k ćelija, jedan prolaz ispod 50ms. Bez optimizacija
// dok se ne izmeri da su potrebne.

const DIAG = 0;
const UP = 1;
const LEFT = 2;

/**
 * @param {string[]} a niz tokena iz skripte
 * @param {string[]} b niz tokena iz ASR-a
 * @param {{match?: number, mismatch?: number, gap?: number}} [opts]
 * @returns {Array<{ai: number|null, bi: number|null, match: boolean}>} monotono, redom
 */
export function needlemanWunsch(a, b, opts = {}) {
  const { match = 1, mismatch = -1, gap = -1 } = opts;
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const score = new Float64Array((n + 1) * w);
  const ptr = new Uint8Array((n + 1) * w);

  for (let j = 1; j <= m; j++) {
    score[j] = j * gap;
    ptr[j] = LEFT;
  }
  for (let i = 1; i <= n; i++) {
    score[i * w] = i * gap;
    ptr[i * w] = UP;
  }
  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) {
      const d = score[(i - 1) * w + (j - 1)] + (ai === b[j - 1] ? match : mismatch);
      const u = score[(i - 1) * w + j] + gap;
      const l = score[i * w + (j - 1)] + gap;
      let best = d;
      let dir = DIAG;
      if (u > best) {
        best = u;
        dir = UP;
      }
      if (l > best) {
        best = l;
        dir = LEFT;
      }
      score[i * w + j] = best;
      ptr[i * w + j] = dir;
    }
  }

  const out = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const dir = i === 0 ? LEFT : j === 0 ? UP : ptr[i * w + j];
    if (dir === DIAG) {
      out.push({ ai: i - 1, bi: j - 1, match: a[i - 1] === b[j - 1] });
      i--;
      j--;
    } else if (dir === UP) {
      out.push({ ai: i - 1, bi: null, match: false });
      i--;
    } else {
      out.push({ ai: null, bi: j - 1, match: false });
      j--;
    }
  }
  return out.reverse();
}

// ---------------------------------------------------------------------------
// Sklapanje timing.json-a — odluke C05
// ---------------------------------------------------------------------------
// **Nula na tajmlajnu.** `narration.mp3` epizode *night-when-rome-almost-fell* ima
// `start: 0.025057` u kontejneru (mp3 encoder delay). Odluka: **ofset se ne oduzima i ne
// dodaje — nula je prvi dekodirani semplu.** ffmpeg pri dekodovanju u wav (align.mjs) i pri
// lepljenju audia u montaži (C09) oba počinju od prvog sempla, pa je konvencija ista na oba
// kraja lanca i drifta nema. Uslov koji C09 mora da poštuje: **nikad `-copyts`** nad
// narracijom. Tišina pre prve reči tako ostaje deo tajmlajna i pripada prvom shotu
// (schemas.md §5.3, tačka 2).
//
// **Confidence reči.** ASR verovatnoća kad se normalizovani token poklopi sa skriptom, inače
// 0 — i za zamenu (whisper je čuo drugu reč) i za reč koju uopšte nije čuo. Vreme se i dalje
// uzima iz zamene kad postoji. Confidence rečenice je prosek po njenim rečima (schemas.md §2.2),
// pa prag 0.85 znači „bar 85% reči je prepoznato tačno onako kako piše u skripti".
//
// **Reč bez ijednog ASR parnjaka** dobija vreme linearnom interpolacijom kroz rupu između
// susednih poznatih vremena. Kad je rupa nulte dužine (whisper je preskočio celu rečenicu
// bez pauze), reči dobijaju po 1ms i tajmlajn se pomera unapred — 1ms je ispod frejma (41ms),
// a rečenica je ionako prijavljena upozorenjem `unheard`.

/** Podrazumevane vrednosti; `model` je i jedini dozvoljeni izbor po schemas.md §2.1. */
export const DEFAULTS = {
  model: 'small.en',
  confidenceFloor: 0.85,
  maxGap: 1.5,
  scores: { match: 1, mismatch: -1, gap: -1 },
};

/** Zaokruživanje na 3 decimale (schemas.md §0.1). */
export const round3 = (t) => Math.round(t * 1000) / 1000;

/**
 * Trajanje narracije **na tajmlajnu** — na istoj osi na kojoj su i vremena reči.
 *
 * `probe()` nad mp3-om vraća trajanje mereno od timestamp-a 0, a sadržaj počinje tek na
 * `start` (encoder delay: 0.025057s kod epizode *night-when-rome-almost-fell*). Pošto je nula
 * tajmlajna prvi dekodirani sempl, trajanje na toj osi je `duration - start`. Kad je ASR run
 * izmerio dekodirano trajanje, ono ima prednost — tačnije je od dve decimale koliko ffmpeg
 * ispisuje — ali samo ako se slaže sa kontejnerom u granici od 0.5s (inače je ASR dobio drugi
 * fajl ili je pao usred posla).
 *
 * @param {{duration: number, start?: number|null}} media
 * @param {{audio_duration?: number}} [asr]
 */
export function timelineDuration(media, asr) {
  const container = round3(media.duration - (media.start ?? 0));
  const decoded = typeof asr?.audio_duration === 'number' ? round3(asr.audio_duration) : null;
  return decoded !== null && Math.abs(decoded - container) <= 0.5 ? decoded : container;
}

/** Najmanja dozvoljena širina reči/rečenice kad ASR nije dao ništa. */
const MIN_WIDTH = 0.001;

const warn = (code, message, extra = {}) => ({ code, message, sentence_id: null, at: null, ...extra });

/** Reč iz skripte: bez interpunkcije spolja, sa apostrofom i crticom unutra. */
const bareWord = (raw) => raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');

/**
 * Poravnava ASR reči na rečenice iz skripte i vraća `timing.json` (bez upisa).
 *
 * @param {{sentences: Array<{id: string, text: string, section?: string}>, outroIndex: number|null}} script
 * @param {Array<{word: string, start: number, end: number, probability?: number}>} asrWords
 * @param {{duration?: number, model?: string, confidenceFloor?: number, maxGap?: number}} [opts]
 * @returns {{timing: object, warnings: Array<object>, stats: object}}
 */
export function buildTiming(script, asrWords, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const sentences = script?.sentences;
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new TypeError('buildTiming: script.sentences mora biti neprazan niz');
  }
  const asr = Array.isArray(asrWords) ? asrWords : [];

  // --- reči iz skripte (ground truth) ---
  const words = [];
  sentences.forEach((s, si) => {
    for (const raw of String(s.text).split(/\s+/)) {
      if (!/[A-Za-z0-9]/.test(raw)) continue;
      const tokens = tokenize(raw);
      if (!tokens.length) continue;
      words.push({ si, word: bareWord(raw), tokens, start: null, end: null, conf: 0, heard: false });
    }
  });
  if (!words.length) throw new TypeError('buildTiming: skripta nema nijednu reč');

  const scriptTokens = [];
  const owner = [];
  words.forEach((w, wi) => {
    for (const t of w.tokens) {
      scriptTokens.push(t);
      owner.push(wi);
    }
  });

  // --- tokeni iz ASR-a; reč koja se raširi u k tokena deli svoje vreme na k jednakih delova ---
  const asrTokens = [];
  for (const a of asr) {
    const tokens = tokenize(a.word);
    if (!tokens.length) continue;
    const start = Number(a.start);
    const end = Number(a.end);
    const step = (end - start) / tokens.length;
    tokens.forEach((t, k) => {
      asrTokens.push({
        t,
        start: start + k * step,
        end: k === tokens.length - 1 ? end : start + (k + 1) * step,
        probability: typeof a.probability === 'number' ? a.probability : 0,
      });
    });
  }

  // --- poravnanje ---
  const pairs = needlemanWunsch(scriptTokens, asrTokens.map((t) => t.t), o.scores);
  let matched = 0;
  const hits = words.map(() => []);
  for (const p of pairs) {
    if (p.ai === null) continue;
    const wi = owner[p.ai];
    if (p.bi === null) {
      hits[wi].push(null);
      continue;
    }
    if (p.match) matched++;
    hits[wi].push({ tok: asrTokens[p.bi], match: p.match });
  }

  words.forEach((w, wi) => {
    const seen = hits[wi].filter(Boolean);
    w.heard = seen.length > 0;
    if (w.heard) {
      w.start = Math.min(...seen.map((h) => h.tok.start));
      w.end = Math.max(...seen.map((h) => h.tok.end));
    }
    const sum = hits[wi].reduce((acc, h) => acc + (h && h.match ? h.tok.probability : 0), 0);
    w.conf = sum / w.tokens.length;
  });

  // --- reči bez vremena: linearna interpolacija kroz rupu ---
  const duration = typeof o.duration === 'number' ? o.duration
    : (asrTokens.length ? asrTokens[asrTokens.length - 1].end : 0);

  for (let i = 0; i < words.length; i++) {
    if (words[i].start !== null) continue;
    let j = i;
    while (j < words.length && words[j].start === null) j++;
    const lo = i > 0 ? words[i - 1].end : 0;
    const hi = j < words.length ? words[j].start : Math.max(duration, lo);
    const span = Math.max(hi - lo, 0);
    const k = j - i;
    for (let x = 0; x < k; x++) {
      words[i + x].start = lo + (span * x) / k;
      words[i + x].end = lo + (span * (x + 1)) / k;
    }
    i = j - 1;
  }

  // --- zaokruživanje + monotonost; nulte širine dobijaju MIN_WIDTH ---
  let cursor = 0;
  for (const w of words) {
    let start = Math.max(round3(w.start), cursor);
    let end = Math.max(round3(w.end), start);
    if (end - start < MIN_WIDTH / 2) end = round3(start + MIN_WIDTH);
    w.start = start;
    w.end = end;
    cursor = end;
  }

  // --- rečenice ---
  const out = [];
  const warnings = [];
  sentences.forEach((s, si) => {
    const ws = words.filter((w) => w.si === si);
    if (!ws.length) throw new TypeError(`buildTiming: rečenica ${s.id} nema nijednu reč`);
    const start = ws[0].start;
    const end = ws[ws.length - 1].end;
    const confidence = round3(ws.reduce((a, w) => a + w.conf, 0) / ws.length);
    out.push({
      id: 'S' + String(si + 1).padStart(2, '0'),
      start,
      end,
      dur: round3(end - start),
      text: s.text,
      confidence,
    });
    if (!ws.some((w) => w.heard)) {
      warnings.push(
        warn('unheard', `rečenicu ${out[si].id} whisper nije čuo — vreme joj je interpolirano, ne izmereno`,
          { sentence_id: out[si].id, at: start }),
      );
    }
  });

  for (let i = 1; i < out.length; i++) {
    const gap = round3(out[i].start - out[i - 1].end);
    if (gap > o.maxGap) {
      warnings.push(
        warn('gap', `pauza od ${gap}s pre rečenice ${out[i].id} (granica je ${o.maxGap}s)`,
          { sentence_id: out[i].id, at: out[i - 1].end }),
      );
    }
  }
  for (const s of out) {
    if (s.confidence < o.confidenceFloor) {
      warnings.push(
        warn('low-confidence',
          `rečenica ${s.id} ima confidence ${s.confidence} (< ${o.confidenceFloor}) — ` +
            'razmotri rerun sa --model medium.en',
          { sentence_id: s.id, at: s.start }),
      );
    }
  }

  const timing = {
    duration: round3(duration),
    model: o.model,
    sentences: out,
    words: words.map((w) => ({
      sentence_id: out[w.si].id,
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: round3(w.conf),
    })),
    outro_start: script.outroIndex === null || script.outroIndex === undefined
      ? null
      : (out[script.outroIndex]?.start ?? null),
  };

  const stats = {
    matched,
    total: scriptTokens.length,
    matchRate: scriptTokens.length ? matched / scriptTokens.length : 0,
    asrTokens: asrTokens.length,
    leadIn: out[0].start,
    tail: round3(Math.max(timing.duration - out[out.length - 1].end, 0)),
  };

  return { timing, warnings, stats };
}

// ---------------------------------------------------------------------------
// I/O sloj — koristi ga samo CLI
// ---------------------------------------------------------------------------
// Redosled: ffmpeg dekoduje narraciju u 16 kHz mono wav u temp -> whisper_words.py piše ASR
// reči u `.cache/asr-words.json` -> alignment na `script.md` -> `timing.json`.
//
// **Keš je obavezan.** Bez njega svaki debug ciklus znači nov whisper run od par minuta.
// Keš se poništava sam kad je snimljen drugim modelom; `--force` ga preskače uvek.
//
// **Whisper izlaz se nikad ne štampa.** Python piše u fajl i vraća jednu liniju statusa;
// Node odavde ispisuje samo agregate i po tri rečenice sa oba kraja.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WHISPER_PY = path.join(HERE, 'whisper_words.py');
const MODELS = ['small.en', 'medium.en'];

const PY_CANDIDATES = [
  process.env.PYTHON ? [process.env.PYTHON, []] : null,
  ['python', []],
  ['py', ['-3']],
  ['python3', []],
].filter(Boolean);

const tailLines = (text, n) => String(text).trimEnd().split(/\r?\n/).slice(-n).join('\n');

/** Pokreće whisper_words.py; vraća njegovu liniju statusa. Reči idu u fajl, ne u konzolu. */
function runWhisper(wav, outFile, { model }) {
  const args = [WHISPER_PY, wav, outFile, '--model', model];
  let lastErr = 'nijedan python kandidat nije pokrenut';
  for (const [cmd, prefix] of PY_CANDIDATES) {
    const r = spawnSync(cmd, [...prefix, ...args], {
      encoding: 'utf8',
      timeout: 3600000,
      windowsHide: true,
      // bez ovoga python na Windowsu piše status kroz cp1252 pipe i puca na kraju posla
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.error) {
      lastErr = r.error.message;
      continue;
    }
    if (r.status === 0) return String(r.stdout).trim();
    if (/Traceback/.test(String(r.stderr))) {
      throw new Error(
        `whisper_words.py pao (exit ${r.status}, ${cmd})\n` +
          `  poslednjih 15 linija stderr-a:\n${tailLines(r.stderr, 15)}`,
      );
    }
    lastErr = `${cmd} vratio exit ${r.status}`;
  }
  throw new Error(
    `python se ne može pokrenuti (${PY_CANDIDATES.map(([c]) => c).join(', ')}): ${lastErr}\n` +
      'Popravka: pip install faster-whisper==1.2.1, ili postavi PYTHON na interpreter koji ga ima.',
  );
}

/**
 * ASR reči za epizodu — iz keša ili iz novog whisper run-a.
 * @param {string} dir folder epizode
 * @param {{model?: string, force?: boolean, narration: string}} opts
 * @returns {Promise<{asr: object, cached: boolean, file: string, status: string|null}>}
 */
export async function ensureAsr(dir, { model = DEFAULTS.model, force = false, narration } = {}) {
  const cacheFile = path.join(dir, '.cache', 'asr-words.json');
  if (!force && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (cached.model === model && Array.isArray(cached.words) && cached.words.length) {
        return { asr: cached, cached: true, file: cacheFile, status: null };
      }
    } catch {
      /* pokvaren keš se prepisuje */
    }
  }

  const wav = path.join(os.tmpdir(), `at-align-${path.basename(dir)}-16k.wav`);
  try {
    await ffmpeg(['-y', '-hide_banner', '-loglevel', 'error', '-i', narration,
      '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    const status = runWhisper(wav, cacheFile, { model });
    const asr = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return { asr, cached: false, file: cacheFile, status };
  } finally {
    fs.rmSync(wav, { force: true });
  }
}

/** Transkript kao zamena za script.md — za legacy epizode koje je nemaju (`--asr-script`). */
export function scriptFromAsr(asr) {
  const md = ((asr.segments ?? []).map((s) => s.text).join(' ').trim()
    || (asr.words ?? []).map((w) => w.word).join(' ')).replace(/\s+/g, ' ');
  return { md, script: parseScript(md) };
}

// ---------------------------------------------------------------- CLI

const USAGE = `node tools/align.mjs episodes/<slug> [opcije]

  --model <small.en|medium.en>  ASR model (podrazumevano small.en)
  --asr-only                    stani posle keširanja ASR-a, ne piši timing.json
  --force                       ignoriši keš i pusti whisper ponovo
  --asr-script                  nema script.md: koristi sopstveni transkript kao tekst
                                (legacy epizode; outro_start ostaje null)`;

export function parseArgs(argv) {
  const out = { dir: null, model: DEFAULTS.model, asrOnly: false, force: false, asrScript: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--model') out.model = argv[++i];
    else if (a === '--asr-only') out.asrOnly = true;
    else if (a === '--force') out.force = true;
    else if (a === '--asr-script') out.asrScript = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('-')) throw new Error(`nepoznata opcija ${a}\n\n${USAGE}`);
    else if (out.dir === null) out.dir = a;
    else throw new Error(`višak argumenta ${a}\n\n${USAGE}`);
  }
  if (!out.help) {
    if (!out.dir) throw new Error(`nedostaje folder epizode\n\n${USAGE}`);
    if (!MODELS.includes(out.model)) {
      throw new Error(`model ${out.model} nije dozvoljen — schemas.md §2.1 zna za ${MODELS.join(' i ')}`);
    }
  }
  return out;
}

const fmt = (t) => Number(t).toFixed(3);
const slash = (p) => p.replace(/\\/g, '/');
const preview = (s) =>
  `  ${s.id} ${fmt(s.start)}–${fmt(s.end)}  ${s.text.slice(0, 64)}${s.text.length > 64 ? '…' : ''}`;

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

  let manifest = {};
  const manifestFile = path.join(dir, 'episode.json');
  if (fs.existsSync(manifestFile)) manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const narration = path.join(dir, manifest.narration_file ?? 'narration.mp3');
  if (!fs.existsSync(narration)) throw new Error(`narracija ne postoji: ${narration}`);

  const media = await probe(narration);
  console.log(
    `${path.basename(narration)} · kontejner ${media.duration}s, start ${media.start}s ` +
      '(nula tajmlajna je prvi dekodirani sempl)',
  );

  // Skripta se traži PRE whisper-a: inače run od par minuta prođe pa se tek onda vidi da
  // alignment nema šta da poravnava.
  const scriptFile = path.join(dir, 'script.md');
  if (!args.asrScript && !args.asrOnly && !fs.existsSync(scriptFile)) {
    throw new Error(
      `nema ${slash(scriptFile)}.\n` +
        'Skripta je ground truth za tekst — bez nje alignment nema šta da poravnava.\n' +
        'Za legacy epizodu bez skripte: --asr-script (tekst iz sopstvenog transkripta).',
    );
  }

  const { asr, file, status } = await ensureAsr(dir, {
    model: args.model, force: args.force, narration,
  });
  console.log(status ?? `ASR iz keša: ${slash(path.relative(dir, file))} · ${asr.words.length} reči · `
    + `model ${asr.model} · ${asr.elapsed}s rada`);
  if (args.asrOnly) return 0;

  let script;
  if (args.asrScript) {
    const built = scriptFromAsr(asr);
    script = built.script;
    fs.mkdirSync(path.join(dir, '.cache'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.cache', 'asr-script.md'), built.md + '\n', 'utf8');
  } else {
    script = parseScript(fs.readFileSync(scriptFile, 'utf8'));
  }
  if (!script.sentences.length) throw new Error('skripta nema nijednu rečenicu');

  const duration = timelineDuration(media, asr);
  const { timing, warnings, stats } = buildTiming(script, asr.words, {
    duration, model: args.model,
  });

  const outFile = path.join(dir, 'timing.json');
  fs.writeFileSync(outFile, JSON.stringify(timing, null, 2) + '\n', 'utf8');

  const count = (code) => warnings.filter((w) => w.code === code).length;
  console.log(
    `${timing.duration}s · ${timing.sentences.length} rečenica · ${timing.words.length} reči · `
      + `model ${timing.model} · ${count('gap')} gapova >1.5s · ${count('low-confidence')} rečenica ispod 0.85`,
  );
  console.log(
    `poklapanje ${(stats.matchRate * 100).toFixed(1)}% tokena (${stats.matched}/${stats.total}) · `
      + `lead-in ${fmt(stats.leadIn)}s · rep ${fmt(stats.tail)}s · `
      + `outro_start ${timing.outro_start === null ? 'null' : fmt(timing.outro_start)}`,
  );
  if (count('unheard')) {
    console.log(`⚠ ${count('unheard')} rečenica koje whisper nije čuo — vreme im je interpolirano`);
  }
  for (const s of timing.sentences.slice(0, 3)) console.log(preview(s));
  if (timing.sentences.length > 6) console.log('  …');
  for (const s of timing.sentences.slice(-3)) console.log(preview(s));
  console.log(`-> ${slash(outFile)}`);
  return 0;
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
