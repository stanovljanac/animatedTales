// tools/short-edit.mjs
//
// Montažni Short: sastavljen iz delova narracije i izvornih kadrova koji u dugom videu nisu jedan
// do drugog. Ono što YouTube editor ne ume (on iseca jedan neprekinut komad), a zato vredi tokena.
//
//   node tools/short.mjs episodes/<slug> <id> [--sheet] [--srt-only]     (id sa "type": "edit")
//
// Ulaz je `short/shorts.json`:
//
//   "short2": {
//     "type": "edit",
//     "lines": [ { "id": "S47" }, { "id": "S27" }, { "id": "S35", "from": "Leto" } ],
//     "visuals": [
//       { "shot": "40", "at": "S47", "frame": [[0.78, 0.5, 1.12], [0.34, 0.5, 1.12]] },
//       { "shot": "21", "at": "S27", "frame": [[0.24, 0.5, 1], [0.7, 0.5, 1]], "in": 0 }
//     ]
//   }
//
//   lines    rečenice u redosledu Shorta (ne u redosledu videa). `from` / `to` seku rečenicu na reč,
//            `before` je razmak ispred rečenice u sekundama (predah pred poentom, npr. „This was Athena.").
//   visuals  kadrovi u redosledu Shorta. `at` je gde kadar počinje: id rečenice ("S28") ili reč u njoj
//            ("S28:none"). Kadar traje do početka sledećeg. `frame` su ključni prozori [cx, cy, z]:
//            središte 9:16 prozora kao deo kadra (0..1) i zum (1 = cela visina). Jedan = statično,
//            dva = klizanje (ease-in-out), tri i više = linearno kroz tačke. `in` je sekund izvornog
//            klipa gde kadar počinje (podrazumevano 0).
//   opciono  lead, gap, pause, tail, cutLead (v. EDIT).
//
// Odluke koje ovaj alat drži:
//
//   1. Rez zvuka je na STVARNOJ tišini. Rečenica počinje na kraju tišine pre nje i staje na početku
//      tišine posle nje (silencedetect), ne na vremenu iz alignmenta, koje kasni 0.1–0.17s.
//   2. Pauze se skraćuju, ne brišu: razmak između rečenica je `gap`, a unutrašnja pauza duža od
//      `pause` skuplja se na `pause`. Dugi dah naratora ostaje dah, ali ne traje 0.9s.
//   3. Slika vodi glas: kadar se menja `cutLead` PRE nego što reč krene, pa oko stigne pre uha.
//   4. Kadar dolazi iz IZVORA (klip 1080p, slika 2752×1536), ne iz final.mp4: jedan manje
//      uvećanje, a zvuk klipa ide ispod narracije na 15% kao u dugom videu.
//   5. Prozor je `perspective` sa float uglovima (kao still pokret u assemble.mjs): klizanje i
//      zum bez trzanja celih piksela.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadStoryboard } from './contract.mjs';
import { probe, run } from './ffmpeg.mjs';
import { SUB_DEFAULTS, chunkTokens, srtTime, wrapLines } from './publish.mjs';
import { SHORT, SHORT_DIR, buildAss, captionTokens } from './short.mjs';

// Literali, ne SHORT.*: moduli se međusobno uvoze, pa se SHORT ne sme čitati pri učitavanju.
export const EDIT = {
  fps: 24,
  w: 1080,
  h: 1920,
  /** Tišina pre prve reči: prvi kadar se vidi pre glasa. */
  lead: 0.12,
  /** Razmak između rečenica. */
  gap: 0.24,
  /** Unutrašnja pauza duža od ovoga skuplja se na ovo. */
  pause: 0.3,
  /** Poslednji kadar traje ovoliko posle poslednje reči. */
  tail: 0.6,
  /** Slika menja kadar ovoliko pre glasa. */
  cutLead: 0.08,
  /** Zvuk klipova ispod narracije (isto kao CLIP_VOLUME u assemble.mjs). */
  ambient: 0.15,
  /** Najduži Short. */
  maxDuration: 60,
};

const r3 = (n) => Math.round(n * 1000) / 1000;
const r4 = (n) => Math.round(n * 10000) / 10000;
const frame = (t, fps = EDIT.fps) => Math.round(t * fps) / fps;
const norm = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

// ---------------------------------------------------------------- govor

/** Tišine u narraciji: [{s, e}]. Sve što je između njih je govor. */
export async function speechGaps(narration) {
  const { stderr } = await run(['-hide_banner', '-i', narration, '-af', 'silencedetect=noise=-38dB:d=0.1', '-f', 'null', '-'],
    { check: false });
  const gaps = [];
  let s = null;
  for (const m of stderr.matchAll(/silence_(start|end):\s*(-?[\d.]+)/g)) {
    if (m[1] === 'start') s = Math.max(0, Number(m[2]));
    else if (s != null) {
      gaps.push({ s, e: Number(m[2]) });
      s = null;
    }
  }
  return gaps;
}

/**
 * Gde rečenica `i` stvarno počinje i staje. Početak je kraj tišine koja je pre nje (najkasniji kraj
 * među tišinama koje počinju do 0.3s posle alignment početka), kraj je početak prve tišine posle nje.
 */
export function lineBounds(gaps, sentences, i) {
  const s = sentences[i];
  const prev = sentences[i - 1];
  const lo = prev ? prev.end - 0.15 : -1;
  const before = gaps.filter((g) => g.e >= lo && g.s <= s.start + 0.3 && g.e < s.end - 0.3);
  const onset = before.length ? Math.max(...before.map((g) => g.e)) : s.start;
  const after = gaps.find((g) => g.s >= s.end - 0.3 && g.s >= onset + 0.5);
  return { onset, offset: after ? after.s : s.end };
}

function findToken(toks, word, fromIdx = 0) {
  const i = toks.findIndex((t, k) => k >= fromIdx && norm(t.text) === norm(word));
  if (i < 0) throw new Error(`reč „${word}" ne postoji u rečenici (ima: ${toks.map((t) => t.text).join(' ')})`);
  return i;
}

/** Vreme izvora -> vreme Shorta, preko komada koji su ostali posle skraćenja pauza. */
export function mapSrc(pieces, t) {
  for (const p of pieces) if (t >= p.srcA - 1e-9 && t <= p.srcB + 1e-9) return p.outA + (t - p.srcA);
  if (t < pieces[0].srcA) return pieces[0].outA;
  for (let i = 0; i < pieces.length - 1; i++) if (t > pieces[i].srcB && t < pieces[i + 1].srcA) return pieces[i + 1].outA;
  const last = pieces.at(-1);
  return last.outA + (last.srcB - last.srcA);
}

/**
 * Narracija Shorta: za svaku rečenicu komadi izvora, vreme u Shortu i tokeni sa pomerenim vremenima.
 * @returns {{lines: object[], end: number}} `end` je kraj poslednje reči u Shortu
 */
export function planLines(spec, timing, gaps, cfg = EDIT) {
  const sentences = timing.sentences;
  const lead = spec.lead ?? cfg.lead;
  const gap = spec.gap ?? cfg.gap;
  const pause = spec.pause ?? cfg.pause;
  let t = lead;
  const lines = [];
  spec.lines.forEach((ln, k) => {
    // `before` je razmak ispred ove rečenice (za predah pred poentom); podrazumevano `gap`.
    if (k > 0) t = lines[k - 1].outEnd + (ln.before ?? gap);
    const i = sentences.findIndex((s) => s.id === ln.id);
    if (i < 0) throw new Error(`rečenica ${ln.id} ne postoji u timing.json`);
    const toks = captionTokens(timing, sentences[i]);
    const { onset, offset } = lineBounds(gaps, sentences, i);
    let srcA = onset;
    let srcB = offset;
    let fromIdx = 0;
    let toIdx = toks.length - 1;
    if (ln.from) {
      fromIdx = findToken(toks, ln.from);
      const near = gaps.filter((g) => g.e >= toks[fromIdx].start - 0.45 && g.e <= toks[fromIdx].start + 0.3);
      srcA = near.length ? near.reduce((a, b) => (Math.abs(b.e - toks[fromIdx].start) < Math.abs(a.e - toks[fromIdx].start) ? b : a)).e : toks[fromIdx].start;
    }
    if (ln.to) {
      toIdx = findToken(toks, ln.to, fromIdx);
      const near = gaps.filter((g) => g.s >= toks[toIdx].end - 0.3 && g.s <= toks[toIdx].end + 0.45);
      srcB = near.length ? near[0].s : toks[toIdx].end;
    }
    // Unutrašnje pauze duže od `pause` skupljaju se na `pause` (pola sa svake strane reza).
    const keep = pause / 2;
    const inner = gaps.filter((g) => g.s > srcA + 0.05 && g.e < srcB - 0.05 && g.e - g.s > pause + 0.02);
    const pieces = [];
    let cur = srcA;
    let out = t;
    for (const g of inner) {
      pieces.push({ srcA: cur, srcB: g.s + keep, outA: out });
      out += g.s + keep - cur;
      cur = g.e - keep;
    }
    pieces.push({ srcA: cur, srcB, outA: out });
    out += srcB - cur;

    const tokens = toks.slice(fromIdx, toIdx + 1).map((tk) => {
      const start = Math.max(t, Math.min(out, mapSrc(pieces, tk.start)));
      const end = Math.max(start + 0.05, Math.min(out, mapSrc(pieces, tk.end)));
      return { text: tk.text, start, end };
    });
    lines.push({ id: ln.id, index: k, srcA, srcB, pieces, outStart: t, outEnd: out, tokens });
  });
  return { lines, end: lines.at(-1).outEnd };
}

/** Vreme markera ("S28" ili "S28:none") u Shortu, bez cutLead-a. */
export function markerTime(lines, marker) {
  const [id, word] = String(marker).split(':');
  const line = lines.find((l) => l.id === id);
  if (!line) throw new Error(`marker „${marker}": rečenica ${id} nije u lines`);
  if (!word) return line.outStart;
  const tok = line.tokens.find((t) => norm(t.text) === norm(word));
  if (!tok) throw new Error(`marker „${marker}": reči „${word}" nema u rečenici (ima: ${line.tokens.map((t) => t.text).join(' ')})`);
  return tok.start;
}

// ---------------------------------------------------------------- slika

/**
 * Izraz po frejmu za jednu veličinu (`cx`, `cy` ili `z`) kroz ključne tačke. `p` je napredak 0..1.
 * Dve tačke klize ease-in-out, tri i više idu linearno (srednja tačka ne sme da zaustavi kameru).
 */
export function interpExpr(values, frames, { ease } = {}) {
  if (values.length === 1 || frames < 2) return String(r4(values[0]));
  const p = `(on/${frames - 1})`;
  const useEase = ease ? ease !== 'linear' : values.length === 2;
  let expr = String(r4(values.at(-1)));
  for (let j = values.length - 2; j >= 0; j--) {
    const u0 = j / (values.length - 1);
    const u1 = (j + 1) / (values.length - 1);
    const s = `clip((${p}-${r4(u0)})/${r4(u1 - u0)},0,1)`;
    const e = useEase ? `(0.5-0.5*cos(PI*${s}))` : s;
    const seg = `(${r4(values[j])}+(${r4(values[j + 1] - values[j])})*${e})`;
    expr = j === values.length - 2 && j === 0 ? seg : `if(lt(${p},${r4(u1)}),${seg},${expr})`;
  }
  return expr;
}

/**
 * Uglovi `perspective` filtera za 9:16 prozor u kanvasu visine `hc`. Izlaz filtera je veličine
 * kanvasa, a prozor se razvlači na ceo kanvas (uvećanje z); traka 1080 px sleva je Short, ostatak se
 * odseče. Zato leva ivica prozora ide u x0, a prozor je 16:9 (wc/z × hc/z).
 * @param {number[][]} keys [[cx, cy, z], ...]
 */
export function framingCorners(keys, frames, { wc, hc = EDIT.h, w = EDIT.w, ease } = {}) {
  const cx = interpExpr(keys.map((k) => k[0]), frames, { ease });
  const cy = interpExpr(keys.map((k) => k[1]), frames, { ease });
  const z = interpExpr(keys.map((k) => k[2] ?? 1), frames, { ease });
  const x0 = `max(0,min(${wc}-${w}/(${z}),(${cx})*${wc}-${w / 2}/(${z})))`;
  const y0 = `max(0,min(${hc}-${hc}/(${z}),(${cy})*${hc}-${hc / 2}/(${z})))`;
  const x1 = `(${x0}+${wc}/(${z}))`;
  const y1 = `(${y0}+${hc}/(${z}))`;
  const q = (s) => `'${s}'`;
  return `x0=${q(x0)}:y0=${q(y0)}:x1=${q(x1)}:y1=${q(y0)}:x2=${q(x0)}:y2=${q(y1)}:x3=${q(x1)}:y3=${q(y1)}`;
}

/** Kadrovi Shorta sa početkom, trajanjem i izvorom. */
export function planVisuals(spec, lines, total, shots, dir, cfg = EDIT) {
  const cutLead = spec.cutLead ?? cfg.cutLead;
  const byId = new Map(shots.map((s) => [s.shot_id, s]));
  const starts = spec.visuals.map((v, i) => (i === 0 ? 0 : frame(markerTime(lines, v.at) - cutLead, cfg.fps)));
  return spec.visuals.map((v, i) => {
    const shot = byId.get(v.shot);
    if (!shot) throw new Error(`kadar ${v.shot} ne postoji u storyboard.json`);
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : total;
    if (end <= start) throw new Error(`kadar ${v.shot} (${v.at}) ima trajanje ${r3(end - start)}s — redosled ili marker ne valja`);
    const len = r3(end - start);
    return {
      shot: v.shot,
      at: v.at,
      file: path.resolve(dir, shot.source_file),
      kind: shot.render_mode === 'still' ? 'still' : 'clip',
      in: v.in ?? 0,
      start,
      end,
      len,
      frames: Math.round(len * cfg.fps),
      keys: v.frame ?? [[0.5, 0.5, 1]],
      ease: v.ease,
    };
  });
}

// ---------------------------------------------------------------- titlovi

/** SRT iz tokena Shorta (za YouTube Studio; titlovi su u slici i bez njega). */
export function editSrt(lines, total) {
  const cues = [];
  for (const line of lines) {
    for (const group of chunkTokens(line.tokens, SUB_DEFAULTS)) {
      const text = group.map((t) => t.text).join(' ');
      cues.push({ start: group[0].start, end: group.at(-1).end, lines: wrapLines(text, SUB_DEFAULTS.maxChars) });
    }
  }
  cues.forEach((c, i) => {
    const next = i + 1 < cues.length ? cues[i + 1].start : Infinity;
    c.end = Math.min(Math.max(c.end + SUB_DEFAULTS.tail, c.start + SUB_DEFAULTS.minDur), next, total);
    c.index = i + 1;
  });
  return cues.map((c) => `${c.index}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join('\n')}\n`).join('\n');
}

// ---------------------------------------------------------------- render

const ENC = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '24', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];

/** Jedan kadar -> video bez zvuka (međukorak). */
async function renderVisual(v, work, i) {
  const wc = v.canvasW;
  const corners = framingCorners(v.keys, v.frames, { wc, ease: v.ease });
  const vf = [
    `fps=${EDIT.fps}`,
    // out_range=tv: slika iz JPEG-a je full-range, klipovi su TV; u jednom fajlu moraju biti isto.
    `scale=${wc}:${EDIT.h}:flags=lanczos:out_range=tv`,
    'format=yuv444p',
    `perspective=${corners}:interpolation=cubic:sense=source:eval=frame`,
    `crop=${EDIT.w}:${EDIT.h}:0:0`,
    'unsharp=5:5:0.35:5:5:0',
    'format=yuv420p',
    'setsar=1',
  ].join(',');
  const input = v.kind === 'still'
    ? ['-loop', '1', '-framerate', String(EDIT.fps), '-i', v.file]
    : ['-ss', String(Math.max(0, r4(v.in - 1 / EDIT.fps / 2))), '-i', v.file];
  const out = path.join(work, `seg${String(i).padStart(2, '0')}.mp4`);
  await run(['-hide_banner', '-y', ...input, '-vf', vf, '-an', '-frames:v', String(v.frames), ...ENC,
    '-preset', 'fast', '-crf', '12', out]);
  return out;
}

/** Zvuk klipova (15%) kroz ceo Short; stillovi su tišina. */
async function renderAmbient(visuals, work) {
  const args = ['-hide_banner', '-y'];
  const parts = [];
  visuals.forEach((v, i) => {
    const fade = Math.min(0.02, v.len / 4);
    if (v.kind === 'clip' && v.hasAudio) {
      args.push('-ss', String(Math.max(0, r4(v.in - 1 / EDIT.fps / 2))), '-t', String(v.len), '-i', v.file);
      const k = args.filter((a) => a === '-i').length - 1;
      parts.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=${v.len},asetpts=PTS-STARTPTS,volume=${EDIT.ambient},afade=t=in:d=${fade},afade=t=out:st=${r3(v.len - fade)}:d=${fade}[a${i}]`);
    } else {
      parts.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${v.len}[a${i}]`);
    }
  });
  const graph = `${parts.join(';')};${visuals.map((_, i) => `[a${i}]`).join('')}concat=n=${visuals.length}:v=0:a=1[amb]`;
  const out = path.join(work, 'ambient.wav');
  await run([...args, '-filter_complex', graph, '-map', '[amb]', '-c:a', 'pcm_s16le', out]);
  return out;
}

/** Narracija Shorta: komadi `narration.mp3`, razmaci tišine i rep. */
async function renderNarration(narration, lines, total, work, lead) {
  const parts = [];
  const order = [];
  let n = 0;
  const silence = (d) => {
    const lab = `s${n++}`;
    parts.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${r4(d)}[${lab}]`);
    order.push(lab);
  };
  const pieces = lines.flatMap((l) => l.pieces.map((p) => ({ ...p, last: p === l.pieces.at(-1), line: l })));
  silence(lead);
  parts.push(`[0:a]asplit=${pieces.length}${pieces.map((_, k) => `[i${k}]`).join('')}`);
  pieces.forEach((p, k) => {
    const lab = `p${k}`;
    const len = p.srcB - p.srcA;
    parts.push(`[i${k}]atrim=start=${r4(p.srcA)}:end=${r4(p.srcB)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.008,afade=t=out:st=${r4(len - 0.008)}:d=0.008[${lab}]`);
    order.push(lab);
    const next = pieces[k + 1];
    if (next && p.last) silence(next.line.outStart - p.line.outEnd);
  });
  const graph = `${parts.join(';')};${order.map((l) => `[${l}]`).join('')}concat=n=${order.length}:v=0:a=1,apad=whole_dur=${total}[nar]`;
  const out = path.join(work, 'narration.wav');
  await run(['-hide_banner', '-y', '-i', narration, '-filter_complex', graph, '-map', '[nar]', '-t', String(total), '-c:a', 'pcm_s16le', out]);
  return out;
}

/** Po tri frejma svakog kadra iz gotovog Shorta u jednoj slici (provera prozora). */
async function makeSheet(outFile, visuals, work) {
  const frames = [];
  for (const v of visuals) {
    for (const t of [v.start + 0.15, (v.start + v.end) / 2, v.end - 0.15]) frames.push(Math.max(0, Math.round(t * EDIT.fps)));
  }
  const sel = frames.map((n) => `eq(n,${n})`).join('+');
  const sheet = outFile.replace(/\.mp4$/, '-sheet.png');
  await run(['-hide_banner', '-y', '-i', outFile, '-vf', `select='${sel}',scale=180:320,tile=6x${Math.ceil(frames.length / 6)}`,
    '-fps_mode', 'vfr', '-frames:v', '1', sheet], { cwd: work });
  return sheet;
}

/** Tabela plana: šta se čuje i šta se vidi, da se promašaj vidi bez gledanja videa. */
export function describePlan(lines, visuals, total) {
  const out = [`ukupno ${r3(total)}s`, '  narracija:'];
  for (const l of lines) out.push(`    ${l.id.padEnd(4)} ${r3(l.outStart).toFixed(2).padStart(6)}–${r3(l.outEnd).toFixed(2).padStart(6)}  ${l.tokens.map((t) => t.text).join(' ').slice(0, 70)}`);
  out.push('  kadrovi:');
  for (const v of visuals) out.push(`    ${v.shot.padEnd(3)} ${v.kind.padEnd(5)} ${v.start.toFixed(2).padStart(6)}–${v.end.toFixed(2).padStart(6)} (${v.len}s)  na ${v.at}`);
  return out.join('\n');
}

export async function renderEdit(dir, id, spec, { out, captions = true, srtOnly = false, sheet = false } = {}) {
  const timing = JSON.parse(fs.readFileSync(path.join(dir, 'timing.json'), 'utf8'));
  const narration = path.resolve(dir, 'narration.mp3');
  const outFile = path.resolve(out ?? path.join(dir, SHORT_DIR, `${id}.mp4`));
  const gaps = await speechGaps(narration);
  const plan = planLines(spec, timing, gaps);
  const total = frame(plan.end + (spec.tail ?? EDIT.tail), EDIT.fps);
  if (total > (spec.maxDuration ?? EDIT.maxDuration)) throw new Error(`${id} traje ${total}s, a Short sme ${EDIT.maxDuration}s`);

  const srtFile = outFile.replace(/\.mp4$/, '.srt');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(srtFile, editSrt(plan.lines, total), 'utf8');

  const { storyboard } = loadStoryboard(dir);
  const shots = storyboard.beats.flatMap((b) => b.shots);
  const visuals = planVisuals(spec, plan.lines, total, shots, dir);
  console.log(describePlan(plan.lines, visuals, total));
  if (srtOnly) return { outFile: null, srtFile, sheetFile: null, plan: { from: 0, to: total, duration: total, lead: 0 } };

  for (const v of visuals) {
    const info = await probe(v.file);
    v.canvasW = 2 * Math.round((info.width * EDIT.h) / info.height / 2);
    v.hasAudio = info.hasAudio;
    if (v.kind === 'clip' && v.in + v.len > info.duration + 0.05) {
      throw new Error(`kadar ${v.shot}: klip traje ${info.duration}s, a treba ${r3(v.in + v.len)}s (in ${v.in} + ${v.len}s)`);
    }
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), `at-${id}-`));
  try {
    const segs = [];
    for (const [i, v] of visuals.entries()) {
      segs.push(await renderVisual(v, work, i));
      console.log(`  kadar ${v.shot} ${v.len}s`);
    }
    fs.writeFileSync(path.join(work, 'list.txt'), segs.map((f) => `file '${path.basename(f)}'`).join('\n'), 'utf8');
    const ambient = await renderAmbient(visuals, work);
    const nar = await renderNarration(narration, plan.lines, total, work, spec.lead ?? EDIT.lead);

    let sub = '';
    if (captions) {
      const chunks = plan.lines.flatMap((l) => chunkTokens(l.tokens, SHORT.chunk));
      fs.writeFileSync(path.join(work, 'cap.ass'), buildAss(chunks, 0), 'utf8');
      fs.mkdirSync(path.join(work, 'fonts'));
      const fontSrc = path.join(process.env.WINDIR || 'C:/Windows', 'Fonts', SHORT.font.file);
      if (fs.existsSync(fontSrc)) fs.copyFileSync(fontSrc, path.join(work, 'fonts', SHORT.font.file));
      else console.warn(`⚠ font ${fontSrc} ne postoji, libass bira zamenski`);
      sub = 'ass=cap.ass:fontsdir=fonts,';
    }
    const af = `[1:a][2:a]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95,afade=t=in:d=0.03,afade=t=out:st=${r3(total - 0.25)}:d=0.25[a]`;
    await run(['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-i', ambient, '-i', nar,
      '-filter_complex', `[0:v]${sub}format=yuv420p[v];${af}`, '-map', '[v]', '-map', '[a]', '-t', String(total),
      ...ENC, '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', outFile],
    { cwd: work });
    const sheetFile = sheet ? await makeSheet(outFile, visuals, work) : null;
    return { outFile, srtFile, sheetFile, plan: { from: 0, to: total, duration: total, lead: 0 } };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}
