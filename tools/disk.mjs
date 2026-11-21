// tools/disk.mjs
//
// Disk epizoda: izveštaj i bezbedno čišćenje regenerabilnog keša. Plan: Korak 1 (disk).
//
//   node tools/disk.mjs --report                    veličina po epizodi i šta se sme čistiti
//   node tools/disk.mjs --clean [slug ...]          SUVO pokretanje: samo ispiše šta bi obrisao
//   node tools/disk.mjs --clean [slug ...] --yes    briše
//
// `--clean` briše SAMO `.cache/video.mp4`, `.cache/seg/` i `.cache/ambient.wav` (ponovni
// `assemble` ih pravi iz shots/ + narracije). `asr-words.json` i `assemble.json` ostaju:
// `assemble.json` je dokaz da je final.mp4 napravio alat (tools/assemble.mjs, tačka 3).
// Epizoda se čisti samo kad SVE važi:
//   1. javna je (medium.json video_id, spisak `disk.published` u config.json, ili feed kanala),
//   2. nijedan node/ffmpeg proces ne piše u njen folder, i nijedan fajl nije menjan u poslednjih
//      30 min (epizoda u izmeni ili popravci se preskače),
//   3. ulazi za regeneraciju postoje: svi klipovi iz storyboard.json, narracija, timing.json,
//      end kartica i intro ako ih manifest traži, a final_file postoji i prolazi ffprobe.
// Ako se spisak procesa ne može pročitati, ništa se ne briše.
//
// Arhiviranje (`--archive` / `--restore`) nije ovde: dolazi tek pošto se čišćenje proveri na
// jednoj epizodi.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mediaNames, introClip } from './assemble.mjs';
import { probe } from './ffmpeg.mjs';
import { fetchFeed, matchEpisode } from './medium.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const MIN_FINAL_BYTES = 1024 * 1024;

/** Jedini delovi `.cache/` koje ovaj alat sme da obriše. */
export const CACHE_ALLOW = ['video.mp4', 'seg', 'ambient.wav'];

const exists = (p) => fs.existsSync(p);
const mb = (bytes) => `${(bytes / 1048576).toFixed(0)} MB`;

/** Veličina fajla ili foldera (rekurzivno); nepostojeće je 0. */
export function dirSize(p) {
  let st;
  try { st = fs.lstatSync(p); } catch { return 0; }
  if (!st.isDirectory()) return st.size;
  let n = 0;
  for (const e of fs.readdirSync(p)) n += dirSize(path.join(p, e));
  return n;
}

/** Regenerabilni delovi keša koji postoje, sa veličinama. */
export function cacheTargets(epDir) {
  return CACHE_ALLOW
    .map((name) => path.join(epDir, '.cache', name))
    .filter(exists)
    .map((p) => ({ path: p, bytes: dirSize(p) }));
}

/** Najnovija izmena nekog fajla u folderu (ms). Folderi se ne računaju, samo fajlovi. */
export function newestMtimeMs(dir) {
  let newest = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const t = e.isDirectory() ? newestMtimeMs(p) : fs.statSync(p).mtimeMs;
    if (t > newest) newest = t;
  }
  return newest;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slash = (s) => s.replace(/\\/g, '/').toLowerCase();

/** Piše li neki od procesa (komandne linije) u folder ove epizode. Granica reči: part-1 ≠ part-10. */
export function isActiveIn(epDir, procLines) {
  const needles = [slash(path.resolve(epDir)), `episodes/${slash(path.basename(epDir))}`];
  const res = needles.map((n) => new RegExp(escapeRe(n) + '(?![\\w-])'));
  return procLines.some((l) => res.some((re) => re.test(slash(l))));
}

/** Javnost epizode: medium.json, spisak iz config.json ili poklapanje sa feedom kanala. */
export function isPublic(slug, { mediumState, configPublished, feed, publishText }) {
  if (mediumState?.video_id) return { public: true, via: 'medium.json' };
  if (configPublished?.includes(slug)) return { public: true, via: 'config.json' };
  if (publishText && feed?.length && matchEpisode(feed, publishText).entry) return { public: true, via: 'feed' };
  return { public: false };
}

/**
 * Šta nedostaje da bi se `.cache/` ove epizode ponovo napravio. Prazan niz = može da se regeneriše.
 * @returns {Promise<string[]>}
 */
export async function regenProblems(epDir, { probeFn = probe } = {}) {
  const problems = [];
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(epDir, f), 'utf8')); } catch { return undefined; } };

  const sb = read('storyboard.json');
  if (sb === undefined) problems.push('storyboard.json ne postoji ili nije ispravan');
  else {
    for (const beat of sb.beats ?? []) {
      for (const shot of beat.shots ?? []) {
        if (typeof shot.source_file === 'string' && !exists(path.join(epDir, shot.source_file))) {
          problems.push(`klip ${shot.source_file} (shot ${shot.shot_id}) ne postoji`);
        }
      }
    }
  }
  if (!exists(path.join(epDir, 'timing.json'))) problems.push('timing.json ne postoji');

  let names;
  try { names = mediaNames(epDir); } catch (e) { problems.push(`episode.json: ${e.message}`); }
  if (names) {
    if (!exists(path.join(epDir, names.narration))) problems.push(`narracija ${names.narration} ne postoji`);
    if (names.endcard && !exists(path.join(epDir, names.endcard))) problems.push(`end kartica ${names.endcard} ne postoji`);
  }
  try {
    const intro = introClip(epDir);
    if (intro && !exists(path.join(epDir, intro.file))) problems.push(`intro ${intro.file} ne postoji`);
  } catch (e) { problems.push(`intro_file: ${e.message}`); }

  const manifest = read('episode.json');
  const finalName = typeof manifest?.final_file === 'string' && manifest.final_file.trim() ? manifest.final_file : 'final.mp4';
  const finalPath = path.join(epDir, finalName);
  if (!exists(finalPath)) problems.push(`final_file ${finalName} ne postoji`);
  else if (fs.statSync(finalPath).size < MIN_FINAL_BYTES) problems.push(`final_file ${finalName} je manji od 1 MB`);
  else {
    try {
      const info = await probeFn(finalPath);
      if (!(info?.duration > 0)) problems.push(`final_file ${finalName} nema trajanje (ffprobe)`);
    } catch (e) {
      problems.push(`final_file ${finalName} ne prolazi ffprobe: ${String(e.message).split('\n')[0]}`);
    }
  }
  return problems;
}

/**
 * Plan čišćenja jedne epizode. Ništa ne briše.
 * @param {string} epDir
 * @param {{now: number, quietMin: number, public: {public: boolean, via?: string}, procs: string[], probeFn?: Function}} ctx
 */
export async function planClean(epDir, ctx) {
  const reasons = [];
  const targets = cacheTargets(epDir);
  if (!targets.length) reasons.push('nema keša za čišćenje');
  if (!ctx.public?.public) reasons.push('javnost epizode nije potvrđena (medium.json, config.json disk.published ili feed)');
  if (isActiveIn(epDir, ctx.procs ?? [])) reasons.push('neki proces piše u folder epizode');
  if (ctx.now - newestMtimeMs(epDir) < ctx.quietMin * 60_000) reasons.push(`nešto je izmenjeno pre manje od ${ctx.quietMin} min`);
  if (targets.length) {
    for (const p of await regenProblems(epDir, { probeFn: ctx.probeFn })) reasons.push(`keš se ne može regenerisati: ${p}`);
  }
  return {
    slug: path.basename(epDir), dir: epDir, eligible: reasons.length === 0, reasons, targets,
    bytes: targets.reduce((n, t) => n + t.bytes, 0),
  };
}

/**
 * Briše ciljeve iz plana. Pre brisanja proverava SVE ciljeve: moraju biti direktno u `.cache/`
 * epizode i imati dozvoljeno ime. Vraća oslobođene bajtove (0 kad plan nije eligible).
 */
export function applyClean(plan) {
  if (!plan.eligible) return 0;
  const cacheDir = path.resolve(plan.dir, '.cache');
  const checked = plan.targets.map((t) => {
    const r = path.resolve(t.path);
    if (path.dirname(r) !== cacheDir || !CACHE_ALLOW.includes(path.basename(r))) {
      throw new Error(`${t.path} nije dozvoljen cilj čišćenja`);
    }
    return { r, bytes: t.bytes };
  });
  let freed = 0;
  for (const { r, bytes } of checked) {
    fs.rmSync(r, { recursive: true, force: true });
    freed += bytes;
  }
  return freed;
}

// ------------------------------------------------------------------ CLI

/** Komandne linije pokrenutih node/ffmpeg/python procesa (Windows). Baca grešku kad ne uspe. */
export function listProcessCommandLines() {
  const ps = 'Get-CimInstance Win32_Process -Filter "Name=\'node.exe\' OR Name=\'ffmpeg.exe\' OR Name=\'python.exe\'" | ' +
    'ForEach-Object { "$($_.ProcessId)`t$($_.CommandLine)" }';
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 30_000 });
  return out.split(/\r?\n/).filter(Boolean)
    .map((l) => { const i = l.indexOf('\t'); return { pid: Number(l.slice(0, i)), cmd: l.slice(i + 1) }; })
    .filter((p) => p.pid !== process.pid)
    .map((p) => p.cmd);
}

const freeBytes = () => { const s = fs.statfsSync(ROOT); return s.bavail * s.bsize; };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

function usage() {
  console.log(`Upotreba:
  node tools/disk.mjs --report
  node tools/disk.mjs --clean [slug ...] [--yes]     (bez --yes je suvo pokretanje)
  --quiet-min N    koliko minuta bez izmene fajlova (podrazumevano 30)`);
}

async function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const qi = argv.indexOf('--quiet-min');
  const quietMin = qi >= 0 ? Number(argv[qi + 1]) : 30;
  const slugsArg = argv.filter((a, i) => !a.startsWith('--') && !(qi >= 0 && i === qi + 1));
  if (!flags.has('--report') && !flags.has('--clean')) { usage(); return 1; }

  const epsDir = path.join(ROOT, 'episodes');
  const slugs = slugsArg.length ? slugsArg : fs.readdirSync(epsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const config = readJson(path.join(HERE, 'config.json')) ?? {};
  const configPublished = config.disk?.published ?? [];

  let feed = [];
  try { feed = await fetchFeed(); } catch (e) { console.log(`! feed kanala nije dostupan (${e.message}); javnost samo iz medium.json i config.json`); }

  let procs = null;
  try { procs = listProcessCommandLines(); } catch (e) { console.log(`! spisak procesa nije dostupan (${e.message}); brisanje je isključeno`); }

  const plans = [];
  for (const slug of slugs) {
    const epDir = path.join(epsDir, slug);
    if (!exists(epDir)) { console.log(`! ${slug}: folder ne postoji`); continue; }
    const pub = isPublic(slug, {
      mediumState: readJson(path.join(epDir, 'medium.json')),
      configPublished, feed,
      publishText: exists(path.join(epDir, 'publish.md')) ? fs.readFileSync(path.join(epDir, 'publish.md'), 'utf8') : '',
    });
    const plan = await planClean(epDir, { now: Date.now(), quietMin, public: pub, procs: procs ?? [], probeFn: probe });
    plans.push({ ...plan, pub, total: dirSize(epDir), shots: dirSize(path.join(epDir, 'shots')), shorts: dirSize(path.join(epDir, 'short')) });
  }

  if (flags.has('--report')) {
    console.log('epizoda'.padEnd(30), 'ukupno'.padStart(8), 'keš'.padStart(8), 'shots'.padStart(8), 'short'.padStart(8), '  javna   čišćenje');
    for (const p of plans.filter((x) => x.total > 50 * 1048576).sort((a, b) => b.total - a.total)) {
      console.log(p.slug.padEnd(30), mb(p.total).padStart(8), mb(p.bytes).padStart(8), mb(p.shots).padStart(8), mb(p.shorts).padStart(8),
        ' ', (p.pub.public ? `da (${p.pub.via})` : 'ne').padEnd(14), p.eligible ? 'MOŽE' : `blokirano: ${p.reasons[0]}`);
    }
    const elig = plans.filter((p) => p.eligible);
    console.log(`\nza čišćenje: ${elig.length} epizoda, ${mb(elig.reduce((n, p) => n + p.bytes, 0))} · slobodno na disku: ${mb(freeBytes())}`);
    return 0;
  }

  // --clean
  const elig = plans.filter((p) => p.eligible);
  for (const p of plans.filter((x) => !x.eligible && x.targets.length)) console.log(`preskočeno ${p.slug}: ${p.reasons.join('; ')}`);
  for (const p of elig) console.log(`${flags.has('--yes') ? 'briše' : 'bi obrisao'} ${p.slug}: ${p.targets.map((t) => `${path.relative(p.dir, t.path)} (${mb(t.bytes)})`).join(', ')}`);
  if (!flags.has('--yes')) {
    console.log(`\nSUVO POKRETANJE: ništa nije obrisano (${elig.length} epizoda, ${mb(elig.reduce((n, p) => n + p.bytes, 0))}). Dodaj --yes da obriše.`);
    return 0;
  }
  if (procs === null) { console.log('Odbijeno: bez spiska procesa se ništa ne briše.'); return 1; }
  const before = freeBytes();
  let freed = 0;
  for (const p of elig) freed += applyClean(p);
  console.log(`\nobrisano ${mb(freed)} · slobodno na disku: ${mb(before)} -> ${mb(freeBytes())}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => {
    console.error(`greška: ${err.stack ?? err}`);
    process.exitCode = 1;
  });
}
