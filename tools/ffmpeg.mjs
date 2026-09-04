// tools/ffmpeg.mjs
//
// Jedina tačka pristupa ffmpeg-u. Bez npm-a, bez ffprobe-a.
//
//   ffmpegPath()        -> apsolutna putanja do binarnog fajla (keširana u tools/config.json)
//   run(args, opts)     -> { code, stdout, stderr }
//   probe(file)         -> { duration, width, height, fps, hasAudio, hasVideo, start }
//
// ⚠ ffprobe NE POSTOJI u ovom okruženju. `imageio_ffmpeg` isporučuje samo
// ffmpeg-win-x86_64-v7.1.exe, a na PATH-u nema ni ffmpeg ni ffprobe. Zato `probe()`
// parsira stderr od `ffmpeg -hide_banner -i <file>`. Taj poziv nema izlazni fajl pa
// ffmpeg svesno vraća exit code 1 uz "At least one output file must be specified" —
// to je normalan ishod, ne pad. Zbog toga probe() zove run() sa { check: false }.
//
// Preciznost: probe() vraća merene vrednosti onako kako ih ffmpeg ispisuje (duration na
// 2 decimale iz hh:mm:ss.cc, start na 6). Zaokruživanje na 3 decimale iz schemas.md §0.1
// radi se tek kad vrednost ulazi u JSON ugovor, ne ovde.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(HERE, 'config.json');

const PY_SNIPPET = 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())';
const PY_CANDIDATES = [
  process.env.PYTHON ? [process.env.PYTHON, []] : null,
  ['python', []],
  ['py', ['-3']],
  ['python3', []],
].filter(Boolean);

let cached = null; // memoizacija u procesu; config.json je keš između procesa

// ---------------------------------------------------------------- config

export function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfigValue(key, value) {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return; // config.json je artefakt C01; ako ga nema ili je pokvaren, ne pravimo ga ovde
  }
  if (cfg[key] === value) return;
  cfg[key] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------- ffmpegPath

const looksRunnable = (p) => {
  if (!p || typeof p !== 'string') return false;
  if (!p.includes('/') && !p.includes('\\')) return true; // golo ime -> oslanja se na PATH
  return fs.existsSync(p);
};

function discoverViaPython() {
  for (const [cmd, prefix] of PY_CANDIDATES) {
    let r;
    try {
      r = spawnSync(cmd, [...prefix, '-c', PY_SNIPPET], { encoding: 'utf8', timeout: 30000 });
    } catch {
      continue;
    }
    if (r.error || r.status !== 0) continue;
    const out = String(r.stdout || '').trim().split(/\r?\n/).pop();
    if (looksRunnable(out)) return out;
  }
  return null;
}

function discoverOnPath() {
  try {
    const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8', timeout: 15000 });
    if (!r.error && r.status === 0) return 'ffmpeg';
  } catch {
    /* nema ga */
  }
  return null;
}

/**
 * Putanja do ffmpeg binarnog fajla.
 * Redosled: FFMPEG_PATH iz okruženja -> keš u tools/config.json -> imageio_ffmpeg preko
 * pythona (rezultat se upisuje u keš) -> golo `ffmpeg` sa PATH-a.
 * @param {{refresh?: boolean}} [opts] refresh:true preskače oba keša i traži ponovo.
 */
export function ffmpegPath({ refresh = false } = {}) {
  if (!refresh && cached) return cached;

  if (looksRunnable(process.env.FFMPEG_PATH)) {
    cached = process.env.FFMPEG_PATH;
    return cached;
  }

  if (!refresh) {
    const fromCfg = readConfig().ffmpegPath;
    if (looksRunnable(fromCfg)) {
      cached = fromCfg;
      return cached;
    }
  }

  const found = discoverViaPython() ?? discoverOnPath();
  if (!found) {
    throw new Error(
      'ffmpeg nije nađen.\n' +
        '  - tools/config.json "ffmpegPath" je prazan ili pokazuje na nepostojeći fajl\n' +
        `  - nijedan od [${PY_CANDIDATES.map(([c]) => c).join(', ')}] ne izvršava import imageio_ffmpeg\n` +
        '  - ni `ffmpeg` na PATH-u\n' +
        'Popravka: pip install imageio-ffmpeg, ili upiši putanju u tools/config.json, ' +
        'ili postavi FFMPEG_PATH.',
    );
  }
  writeConfigValue('ffmpegPath', found);
  cached = found;
  return cached;
}

// ---------------------------------------------------------------- run

const tail = (text, n) => String(text).trimEnd().split(/\r?\n/).slice(-n).join('\n');

/**
 * Pokreće ffmpeg sa datim argumentima.
 * @param {string[]} args
 * @param {{check?: boolean, cwd?: string, timeout?: number, tailLines?: number}} [opts]
 *   check (podrazumevano true) baca čitljivu grešku kad exit code nije 0.
 *   Pozivi koji svesno očekuju exit != 0 (npr. `-i` bez izlaznog fajla) šalju check:false.
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
export function run(args, opts = {}) {
  const { check = true, cwd, timeout = 0, tailLines = 20 } = opts;
  const bin = ffmpegPath();

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(bin, args, {
        cwd,
        timeout: timeout || undefined,
        windowsHide: true,
        // stdin ugašen: ffmpeg inače ume da stane i čeka odgovor na pitanje
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      reject(new Error(`ffmpeg se ne može pokrenuti (${bin}): ${err.message}`));
      return;
    }

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      stdout += d;
    });
    child.stderr.on('data', (d) => {
      stderr += d;
    });

    child.on('error', (err) => {
      reject(new Error(`ffmpeg se ne može pokrenuti (${bin}): ${err.message}`));
    });

    child.on('close', (code, signal) => {
      const exit = code === null ? -1 : code;
      if (check && exit !== 0) {
        const err = new Error(
          `ffmpeg pao (exit ${exit}${signal ? `, signal ${signal}` : ''})\n` +
            `  binarni fajl: ${bin}\n` +
            `  argumenti: ${args.join(' ')}\n` +
            `  poslednjih ${tailLines} linija stderr-a:\n${tail(stderr, tailLines)}`,
        );
        err.code = exit;
        err.stdout = stdout;
        err.stderr = stderr;
        err.args = args;
        reject(err);
        return;
      }
      resolve({ code: exit, stdout, stderr });
    });
  });
}

// ---------------------------------------------------------------- probe

const round6 = (n) => Math.round(n * 1e6) / 1e6;

const RE_DURATION = /^\s*Duration:\s*(?:(\d+):(\d{2}):(\d{2}(?:\.\d+)?)|N\/A)/m;
const RE_START = /\bstart:\s*(-?[\d.]+)/;
const RE_SIZE = /[,\s](\d{2,5})x(\d{2,5})[,\s]/;
const RE_FPS = /,\s*([\d.]+)\s+fps\b/;
const RE_TBR = /,\s*([\d.]+)\s+tbr\b/;

/**
 * Čita tehnička svojstva medija parsiranjem stderr-a od `ffmpeg -i`.
 * @param {string} file
 * @returns {Promise<{duration: number|null, width: number|null, height: number|null,
 *                    fps: number|null, hasAudio: boolean, hasVideo: boolean, start: number|null}>}
 */
export async function probe(file) {
  if (!fs.existsSync(file)) throw new Error(`probe: fajl ne postoji: ${file}`);

  const { stderr } = await run(['-hide_banner', '-i', file], { check: false, timeout: 60000 });

  if (!/^Input #0/m.test(stderr)) {
    throw new Error(
      `probe: ffmpeg nije prepoznao fajl: ${file}\n` +
        `  poslednjih 10 linija stderr-a:\n${tail(stderr, 10)}`,
    );
  }

  let duration = null;
  const md = stderr.match(RE_DURATION);
  if (md && md[1] !== undefined) {
    duration = round6(Number(md[1]) * 3600 + Number(md[2]) * 60 + Number(md[3]));
  }

  const ms = stderr.match(RE_START);
  const start = ms ? round6(Number(ms[1])) : null;

  // "(attached pic)" je cover art u mp3-u, ne video tok
  const streamLines = stderr.split(/\r?\n/).filter((l) => /^\s*Stream #\d+:\d+/.test(l));
  const videoLines = streamLines.filter((l) => /:\s*Video:/.test(l) && !/attached pic/.test(l));
  const audioLines = streamLines.filter((l) => /:\s*Audio:/.test(l));

  let width = null;
  let height = null;
  let fps = null;
  if (videoLines.length) {
    const v = videoLines[0];
    const size = v.match(RE_SIZE);
    if (size) {
      width = Number(size[1]);
      height = Number(size[2]);
    }
    const f = v.match(RE_FPS) ?? v.match(RE_TBR);
    if (f) fps = round6(Number(f[1]));
  }

  return {
    duration,
    width,
    height,
    fps,
    hasAudio: audioLines.length > 0,
    hasVideo: videoLines.length > 0,
    start,
  };
}
