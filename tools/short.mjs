// tools/short.mjs
//
// `final.mp4` -> vertikalni Short (1080×1920, 24 fps) sa ugrađenim titlovima i izrezom koji prati likove.
//
//   node tools/short.mjs episodes/<slug> <id> [--out fajl.mp4] [--no-captions] [--sheet] [--srt-only]
//
// Sve vezano za Shortove živi u `episodes/<slug>/short/` (shorts.json, shorts.md, shortN.mp4, shortN.srt).
// `<id>` je ključ iz `episodes/<slug>/short/shorts.json`. Dva tipa:
//
// 1. REZ (podrazumevano): neprekinut komad `final.mp4` — ono što YouTube editor ume i sam.
//
//   { "short1": { "from": 0, "to": 44.583, "crops": { "01": [0.24, 0.62], "02": 0.5 } } }
//
//   from, to  vreme u final.mp4 (s); rez se bira na granicu kadra iz storyboard.json
//   crops     po shot_id: središte 9:16 prozora kao deo širine kadra (0 = levo, 1 = desno).
//             Broj = statičan izrez, [a, b] = klizanje od a do b kroz trajanje kadra.
//             Kadar bez zapisa dobija 0.5 (središte) uz upozorenje.
//
// Zašto izrez prati likove: kadrovi su komponovani za 16:9, a samo mali deo je „centralno-bezbedan"
// (notes.md). Fiksni središnji izrez seče Zevsa, Metidu, Poseidona. Zato svaki kadar nosi svoje
// središte; pomak je jedna smoothstep krivulja kroz kadar, pa se čita kao kamera, ne kao rez.
//
// Redosled filtera je namerno: prvo `scale` na visinu 1920, tek onda `crop` 1080×1920. Izrez u
// pikselima izvora (608 px) bi se pomerao u koracima od 1.8 izlaznih piksela i trzao na sporom
// klizanju; izrez posle skaliranja se pomera za ceo izlazni piksel.
//
// 2. MONTAŽA (`"type": "edit"`): Short sastavljen iz izvornih kadrova i delova narracije koji nisu
//    jedan do drugog u dugom videu — hook ispred, preskočene rečenice, skraćene pauze, kadar po kadar
//    sa sopstvenim 9:16 prozorom. To editor ne ume; ugovor i opis su u `short-edit.mjs`.
//
// Početak reči: whisper alignment kasni 0.1–0.14s za stvarnim početkom (silencedetect), a rez
// kadra sedi na alignment vremenu. Zato audio može da krene ranije od slike: `findLead` meri
// kad je govor stvarno počeo, zvuk kreće tada, a prvi kadar se drži (`tpad` clone) toliko. Rez
// koji seče usred reči alat prijavi, ne popravlja ga.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadStoryboard } from './contract.mjs';
import { run } from './ffmpeg.mjs';
import { buildCues, chunkTokens, srtTime } from './publish.mjs';
import { renderEdit } from './short-edit.mjs';

/** Folder u epizodi u kome živi sve vezano za Shortove. */
export const SHORT_DIR = 'short';

export const SHORT = {
  w: 1080,
  h: 1920,
  fps: 24,
  /** Prozor se bira na ovoj visini, širina izvora = 16:9 skalirano na 1920 visine. */
  srcW: 3414,
  fadeIn: 0.03,
  fadeOut: 0.12,
  /** Titl se pojavljuje malo pre glasa; zakasneo titl se oseća kao greška, raniji ne. */
  captionLead: 0.05,
  captionTail: 0.3,
  /** `chunkTokens` limit = maxChars × maxLines = 26 znakova, ~4 reči. */
  chunk: { maxChars: 13, maxLines: 2, maxDur: 3.2, minDur: 0, tail: 0 },
  maxLineChars: 18,
  fontSize: 92,
  font: { file: 'ariblk.ttf', name: 'Arial Black' },
  // ASS boje su &HBBGGRR: zlatna za aktivnu reč, bela za ostale.
  active: '&H28C8FF&',
  idle: '&HFFFFFF&',
  /** Dole 560 px ostaje prazno zbog YouTube-ovog naslova i dugmadi; titl sedi u donjoj trećini. */
  marginV: 560,
  maxDuration: 60,
};

const FRAME = (fps = SHORT.fps) => 1 / fps;

/** Reč koja počinje u poslednjih 0.15s Shorta (ili se završava u prvih 0.05s) ne dobija titl: bila bi na ekranu jedan frejm. */
const EDGE = 0.05;
const EDGE_END = 0.15;

/** Najbliži frejm na mreži. */
export const snapFrame = (t, fps = SHORT.fps) => Math.round((Math.round(t * fps) / fps) * 1e6) / 1e6;

const r3 = (n) => Math.round(n * 1000) / 1000;
const r4 = (n) => Math.round(n * 10000) / 10000;

// ---------------------------------------------------------------- izrez

/** Središte (deo širine) -> levi rub prozora u pikselima skaliranog kadra, ograničen na kadar. */
export function centerToX(center, { srcW = SHORT.srcW, w = SHORT.w } = {}) {
  return Math.min(Math.max(center * srcW - w / 2, 0), srcW - w);
}

/**
 * Izraz za `x` u `crop` filteru. `t` je vreme izlaza, a `offset` koliko je izlaz kasnije od `from`
 * (zadržani prvi kadar). Kadrovi izvan [from, to] se ne pojavljuju.
 * @returns {{expr: string, missing: string[]}}
 */
export function cropExpr(shots, crops, from, to, offset = 0, geom = {}) {
  const missing = [];
  const parts = [];
  for (const s of shots) {
    if (s.t_out <= from + 0.01 || s.t_in >= to - 0.01) continue;
    const spec = crops?.[s.shot_id];
    if (spec == null) missing.push(s.shot_id);
    const [c0, c1] = Array.isArray(spec) ? spec : [spec ?? 0.5, spec ?? 0.5];
    const x0 = r3(centerToX(c0, geom));
    const x1 = r3(centerToX(c1, geom));
    const a = r3(s.t_in - from + offset);
    const b = r3(s.t_out - from + offset);
    const p = `clip((t-${a})/${r3(b - a)},0,1)`;
    const body = x0 === x1 ? `${x0}` : `${x0}+(${r3(x1 - x0)})*(${p}*${p}*(3-2*${p}))`;
    parts.push({ b, body });
  }
  if (!parts.length) return { expr: '0', missing };
  let expr = parts.at(-1).body;
  for (let i = parts.length - 2; i >= 0; i--) expr = `if(lt(t,${parts[i].b}),${parts[i].body},${expr})`;
  return { expr, missing };
}

// ---------------------------------------------------------------- titlovi

/** Tokeni rečenice sa vremenima. Samostalna interpunkcija („—") se lepi za prethodnu reč. */
export function captionTokens(timing, sentence) {
  const tokens = [];
  for (const raw of sentence.text.split(/\s+/).filter(Boolean)) {
    if (tokens.length && !/[\p{L}\p{N}]/u.test(raw)) tokens[tokens.length - 1] += ` ${raw}`;
    else tokens.push(raw);
  }
  const words = (timing.words || []).filter((w) => w.sentence_id === sentence.id);
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

/** Tokeni u 1–2 reda, prelom gde su redovi najujednačeniji. */
export function splitLines(tokens, maxChars = SHORT.maxLineChars) {
  const len = (ts) => ts.reduce((n, t, i) => n + t.text.length + (i ? 1 : 0), 0);
  if (len(tokens) <= maxChars || tokens.length < 2) return [tokens];
  let best = null;
  for (let i = 1; i < tokens.length; i++) {
    const a = tokens.slice(0, i);
    const b = tokens.slice(i);
    const score = Math.max(len(a), len(b));
    if (!best || score < best.score) best = { lines: [a, b], score };
  }
  return best.lines;
}

/** Grupe reči koje staju na ekran odjednom, samo reči koje upadaju u [from, to]. */
export function captionChunks(timing, from, to) {
  const chunks = [];
  for (const s of timing.sentences) {
    if (s.end <= from || s.start >= to) continue;
    const tokens = captionTokens(timing, s).filter((t) => t.end > from + EDGE && t.start < to - EDGE_END);
    if (!tokens.length) continue;
    for (const group of chunkTokens(tokens, SHORT.chunk)) chunks.push(group);
  }
  return chunks;
}

const assTime = (sec) => {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
};

/**
 * ASS sa jednim događajem po reči: ceo prikaz je isti, aktivna reč je zlatna.
 * `shift` je pomak iz vremena videa u vreme Shorta (−from + lead).
 */
export function buildAss(chunks, shift, { font = SHORT.font } = {}) {
  const head = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${SHORT.w}`,
    `PlayResY: ${SHORT.h}`,
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding',
    `Style: Cap,${font.name},${SHORT.fontSize},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,6,3,2,90,90,${SHORT.marginV},1`,
    '',
    '[Events]',
    'Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text',
  ];
  const events = [];
  chunks.forEach((group, ci) => {
    const lines = splitLines(group);
    const chunkEnd = group.at(-1).end + SHORT.captionTail;
    const nextStart = chunks[ci + 1]?.[0].start ?? Infinity;
    group.forEach((tok, k) => {
      const start = tok.start - SHORT.captionLead;
      const end = Math.min(group[k + 1] ? group[k + 1].start - SHORT.captionLead : chunkEnd, nextStart - SHORT.captionLead);
      let n = 0;
      const text = lines
        .map((line) =>
          line
            .map((t) => {
              const on = n++ === k;
              return on ? `{\\1c${SHORT.active}}${t.text}{\\1c${SHORT.idle}}` : t.text;
            })
            .join(' '),
        )
        .join('\\N');
      const pop = k === 0 ? '{\\fscx88\\fscy88\\t(0,90,\\fscx100\\fscy100)}' : '';
      events.push(`Dialogue: 0,${assTime(start + shift)},${assTime(end + shift)},Cap,,0,0,0,,${pop}${text}`);
    });
  });
  return [...head, ...events, ''].join('\n');
}

/** SRT za YouTube Studio (ruta bez ugrađenih titlova): vremena pomerena na 0:00 Shorta. */
export function shortSrt(timing, from, to) {
  const inside = timing.sentences.filter((s) => s.end > from + EDGE && s.start < to - EDGE_END);
  const ids = new Set(inside.map((s) => s.id));
  const sub = { sentences: inside, words: (timing.words || []).filter((w) => ids.has(w.sentence_id)), duration: to };
  const dur = to - from;
  const cues = buildCues(sub)
    .map((c) => ({ ...c, start: Math.max(0, c.start - from), end: Math.min(dur, c.end - from) }))
    .filter((c) => c.end > c.start);
  cues.forEach((c, i) => (c.index = i + 1));
  return cues.map((c) => `${c.index}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join('\n')}\n`).join('\n');
}

// ---------------------------------------------------------------- rezovi i govor

/**
 * Koliko ranije od `from` treba da krene zvuk da se ne odseče prvi slog.
 * Stanje u trenutku reza čita se iz poslednjeg `silencedetect` događaja pre njega: `silence_start`
 * znači tišinu (lead 0), `silence_end` znači da je govor počeo tada.
 * @returns {Promise<{lead: number, cutsWord: boolean}>}
 */
export async function findLead(narration, from, fps = SHORT.fps) {
  if (from <= 0) return { lead: 0, cutsWord: false };
  const w0 = Math.max(0, from - 0.5);
  const { stderr } = await run(['-hide_banner', '-ss', String(w0), '-t', '0.6', '-i', narration,
    '-af', 'silencedetect=noise=-38dB:d=0.04', '-f', 'null', '-'], { check: false });
  const events = [...stderr.matchAll(/silence_(start|end):\s*(-?[\d.]+)/g)]
    .map((m) => ({ type: m[1], t: w0 + Number(m[2]) }))
    .sort((a, b) => a.t - b.t);
  const last = events.filter((e) => e.t <= from + 0.001).at(-1);
  if (!last) return { lead: 0, cutsWord: true };
  if (last.type === 'start') return { lead: 0, cutsWord: false };
  if (from - last.t > 0.3) return { lead: 0, cutsWord: true };
  const lead = Math.ceil((from - last.t + 0.012) * fps) / fps;
  return { lead: Math.min(0.3, Math.max(0, lead)), cutsWord: false };
}

/** Da li je u poslednjih 0.1s pre `to` još govor (rez usred reči). */
export async function endCutsWord(narration, to) {
  const w0 = Math.max(0, to - 0.1);
  const { stderr } = await run(['-hide_banner', '-ss', String(w0), '-t', '0.1', '-i', narration,
    '-af', 'volumedetect', '-f', 'null', '-'], { check: false });
  const m = stderr.match(/max_volume:\s*(-?[\d.]+) dB/);
  return m ? Number(m[1]) > -38 : false;
}

/**
 * Koliko prvih frejmova posle `from` ima crnu traku pri vrhu. Izvorni klip ume da krene sa trakom
 * (greek-gods-part-3, shot01: 7 frejmova), što se u dugom videu ne vidi, ali na vertikalnoj slici
 * je prvi utisak. Takvi frejmovi se zamenjuju prvim čistim (`tpad` clone), pa ostaje poravnanje.
 */
export async function leadingBlackFrames(video, from, fps = SHORT.fps) {
  const { stdout } = await run(['-hide_banner', '-ss', String(Math.max(0, r4(from - FRAME(fps) / 2))), '-t', '0.6', '-i', video,
    '-vf', 'crop=iw:2:0:0,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { check: false });
  const lumas = [...stdout.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
  const n = lumas.findIndex((y) => y > 17.5);
  return n < 0 ? 0 : n;
}

// ---------------------------------------------------------------- render

function fontsDir() {
  return path.join(process.env.WINDIR || 'C:/Windows', 'Fonts');
}

/**
 * Plan jednog Shorta: sve što render treba, bez poziva ffmpeg-a.
 */
export function planShort(spec, shots, { lead = 0, skip = 0, fps = SHORT.fps } = {}) {
  const from = snapFrame(spec.from, fps);
  const to = snapFrame(spec.to, fps);
  const lead2 = Math.round(lead * fps) / fps;
  const duration = r3(lead2 + (to - from));
  const { expr, missing } = cropExpr(shots, spec.crops, from, to, lead2);
  // Slika kreće od `from + skip`, ali `skip` kopija prvog čistog frejma ide ispred, pa frejm k
  // izvora i dalje pada na isto vreme izlaza.
  return { from, to, lead: lead2, skip, padFrames: Math.round(lead2 * fps) + skip, duration, cropX: expr, missing };
}

export async function renderShort(dir, id, { out, captions = true, sheet = false, srtOnly = false } = {}) {
  const shortDir = path.join(dir, SHORT_DIR);
  const specFile = path.join(shortDir, 'shorts.json');
  if (!fs.existsSync(specFile)) throw new Error(`nema ${specFile}`);
  const all = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const spec = all[id];
  if (!spec) throw new Error(`shorts.json nema „${id}" (ima: ${Object.keys(all).join(', ')})`);
  if (spec.type === 'edit') return renderEdit(dir, id, spec, { out: out ?? path.join(shortDir, `${id}.mp4`), captions, srtOnly, sheet });

  const { storyboard } = loadStoryboard(dir);
  const shots = storyboard.beats.flatMap((b) => b.shots);
  const timing = JSON.parse(fs.readFileSync(path.join(dir, 'timing.json'), 'utf8'));
  const video = path.resolve(dir, 'final.mp4');
  const narration = path.resolve(dir, 'narration.mp3');
  const outFile = path.resolve(out ?? path.join(shortDir, `${id}.mp4`));

  if (srtOnly) {
    const [from, to] = [snapFrame(spec.from), snapFrame(spec.to)];
    const srtFile = outFile.replace(/\.mp4$/, '.srt');
    fs.writeFileSync(srtFile, shortSrt(timing, from, to), 'utf8');
    return { outFile: null, srtFile, sheetFile: null, plan: { from, to, duration: r3(to - from), lead: 0 } };
  }

  const from0 = snapFrame(spec.from);
  const { lead, cutsWord } = await findLead(narration, from0);
  if (cutsWord) console.warn(`⚠ ${id}: početak ${from0}s seče usred reči — pomeri „from" na kraj tišine.`);
  const skip = await leadingBlackFrames(video, from0);
  if (skip) console.log(`${id}: prvih ${skip} frejmova izvora ima crnu traku, zamenjeno prvim čistim`);
  const plan = planShort(spec, shots, { lead, skip });
  if (await endCutsWord(narration, plan.to)) console.warn(`⚠ ${id}: kraj ${plan.to}s seče usred reči.`);
  if (plan.duration > SHORT.maxDuration) throw new Error(`${id} traje ${plan.duration}s, a Short sme ${SHORT.maxDuration}s`);
  if (plan.missing.length) console.warn(`⚠ ${id}: kadrovi bez izreza (središte 0.5): ${plan.missing.join(', ')}`);

  const work = fs.mkdtempSync(path.join(os.tmpdir(), `at-${id}-`));
  try {
    let tail = '';
    if (captions) {
      const chunks = captionChunks(timing, plan.from, plan.to);
      fs.writeFileSync(path.join(work, 'cap.ass'), buildAss(chunks, -plan.from + plan.lead), 'utf8');
      fs.mkdirSync(path.join(work, 'fonts'));
      const fontSrc = path.join(fontsDir(), SHORT.font.file);
      if (fs.existsSync(fontSrc)) fs.copyFileSync(fontSrc, path.join(work, 'fonts', SHORT.font.file));
      else console.warn(`⚠ font ${fontSrc} ne postoji, libass bira zamenski`);
      tail = ',ass=cap.ass:fontsdir=fonts';
    }
    const vf =
      `[0:v]scale=${SHORT.srcW}:${SHORT.h}:flags=lanczos` +
      (plan.padFrames ? `,tpad=start=${plan.padFrames}:start_mode=clone` : '') +
      `,crop=${SHORT.w}:${SHORT.h}:x='${plan.cropX}':y=0,setsar=1${tail},format=yuv420p[v]`;
    const af = `[1:a]afade=t=in:st=0:d=${SHORT.fadeIn},afade=t=out:st=${r3(plan.duration - SHORT.fadeOut)}:d=${SHORT.fadeOut}[a]`;
    const half = FRAME() / 2;
    await run([
      '-hide_banner', '-y',
      '-ss', String(Math.max(0, r4(plan.from + plan.skip * FRAME() - half))), '-i', video,
      '-ss', String(Math.max(0, r4(plan.from - plan.lead - half))), '-i', video,
      '-filter_complex', `${vf};${af}`,
      '-map', '[v]', '-map', '[a]', '-t', String(plan.duration),
      '-r', String(SHORT.fps),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
      outFile,
    ], { cwd: work });

    const srtFile = outFile.replace(/\.mp4$/, '.srt');
    fs.writeFileSync(srtFile, shortSrt(timing, plan.from, plan.to), 'utf8');
    let sheetFile = null;
    if (sheet) sheetFile = await makeSheet(outFile, shots, plan, work);
    return { outFile, srtFile, sheetFile, plan };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

/** Po tri frejma (početak, sredina, kraj) svakog kadra iz gotovog Shorta, u jednoj slici. */
async function makeSheet(outFile, shots, plan, work) {
  const inside = shots.filter((s) => s.t_out > plan.from + 0.01 && s.t_in < plan.to - 0.01);
  const frames = [];
  for (const s of inside) {
    const a = Math.max(s.t_in, plan.from) - plan.from + plan.lead;
    const z = Math.min(s.t_out, plan.to) - plan.from + plan.lead;
    for (const t of [a + 0.15, (a + z) / 2, z - 0.2]) frames.push(Math.max(0, Math.round(t * SHORT.fps)));
  }
  const sel = frames.map((n) => `eq(n,${n})`).join('+');
  const sheet = outFile.replace(/\.mp4$/, '-sheet.png');
  await run(['-hide_banner', '-y', '-i', outFile,
    '-vf', `select='${sel}',scale=180:320,tile=6x${Math.ceil(frames.length / 6)}`,
    '-fps_mode', 'vfr', '-frames:v', '1', sheet], { cwd: work });
  return sheet;
}

// ---------------------------------------------------------------- CLI

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const pos = args.filter((a, i) => !a.startsWith('--') && !(i && ['--out'].includes(args[i - 1])));
  if (pos.length < 2) {
    console.error('upotreba: node tools/short.mjs episodes/<slug> <id> [--out fajl.mp4] [--no-captions] [--sheet] [--srt-only]');
    process.exit(2);
  }
  try {
    const r = await renderShort(pos[0], pos[1], { out: val('--out'), captions: !flag('--no-captions'), sheet: flag('--sheet'), srtOnly: flag('--srt-only') });
    console.log(`${pos[1]}: ${r.plan.from}–${r.plan.to}s, ${r.plan.duration}s${r.outFile ? ` (zvuk ranije ${r.plan.lead}s)` : ''}`);
    console.log(`${r.outFile ? `  video: ${r.outFile}\n` : ''}  srt:   ${r.srtFile}${r.sheetFile ? `\n  sheet: ${r.sheetFile}` : ''}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
