// tools/flow-images.mjs
//
// Slike za svaki shot, bez ruku — `storyboard.json` -> Google Flow -> N kandidata po shotu.
//
//   node tools/flow-images.mjs episodes/<slug> [--only 07,12] [--count 4]
//
// Ručni posao koji ovo zamenjuje: novi projekat u Flow-u, Image · 16:9 · x4, prompt po prompt
// nalepljen i poslat, pa čekanje. Alat to radi kroz pravi Chrome (tools/cdp.mjs) i staje tačno
// tamo gde počinje ljudski posao: izbor najbolje slike i animacija.
//
// Posle prolaza ostaje:
//   - Flow projekat sa N slika po shotu, svaka preimenovana u `shot07-2 <Flow-ov naslov>` —
//     ime se vidi na slici u Flow-u i postaje ime fajla kad se slika skine iz Flow-a;
//   - episodes/<slug>/flow/index.html — pregled za izbor: kandidati shot po shot, klik na sliku
//     je otvara u Flow-u, a ispod je animation prompt sa dugmetom za kopiranje;
//   - episodes/<slug>/flow/flow.json — stanje: projekat, media ID-jevi, hash prompta.
//
// Slike se NE skidaju na računar: one žive u Flow-u, a na disk stižu tek konačni videi koje
// korisnik sam skine posle animacije. Skidanje je samo na zahtev (`--download`) i tada daje
// episodes/<slug>/flow/shot07-2.jpeg (1K original) i sličice u pregledu.
//
// Flow-ova pretraga nije put do slika jednog shota: semantička je („Head" vraća i „Woman") i
// nove slike indeksira sa zakašnjenjem. Zato pregled vodi direktno na svaku sliku.
//
// Prolaz se nastavlja sam: gotov shot sa istim promptom se preskače, pa se prekinut rad
// (Ctrl+C, pao internet, zatvoren Chrome) samo pokrene ponovo. Shot čiji je prompt u
// međuvremenu prepisan (QA) generiše se ponovo, a novi kandidati dobijaju sledeće brojeve.
//
// Tri odluke koje drže alat tačnim, sve tri plaćene probom na živom Flow-u:
//
//   1. Prompt ide doslovno. Lepi se kao paste (isto što radi Ctrl+V), pa se tekst iz polja
//      pročita nazad i uporedi sa `storyboard.json` znak po znak. Razlika nije upozorenje nego
//      razlog da se ne pošalje — model između storyboarda i Flow-a je jedina stvar koju ovaj
//      lanac ne sme da ima (docs/reference/flow-board.md).
//   2. Koje slike pripadaju kom shotu ne čita se iz mreže pločica. Mreža je virtuelna (crta se
//      samo deo) i preuređuje se posle svakog preimenovanja, pa nova slika ume da bude van
//      prikaza. Istina je odgovor na zahtev za generisanje: Flow u njemu vraća media ID-jeve i
//      prompt, pa se slika vezuje za shot po promptu, ne po mestu na ekranu.
//   3. Ime i fajl se rade na stranici same slike (`/edit/<mediaId>`), do koje se stiže
//      navigacijom unutar aplikacije — bez ponovnog učitavanja, pa generisanje u toku teče dalje.
//
// Slika je besplatna (0 kredita), pa nema budžeta koji bi ovo kočio; ograničenje je samo
// Flow-ovo vreme generisanja (~20–35s po shotu). Dva prompta idu paralelno.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CDP, DEFAULT_PORT, defaultProfileDir, ensureChrome, ensureWindowShown, openPage, sleep, targetUrl,
} from './cdp.mjs';
import { countWords, isStill, loadStoryboard, plural } from './contract.mjs';
import { resolveOnly } from './shotlist.mjs';

export const FLOW_HOME = 'https://flow.google.com/';
export const PROMPT_ARIA = 'What do you want to create?';
export const ASPECTS = ['16:9', '4:3', '1:1', '3:4', '9:16'];

/** Koliko se čeka jedno generisanje pre nego što se proglasi neuspelim. */
export const GEN_TIMEOUT_MS = 5 * 60_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ------------------------------------------------------------------ čiste funkcije

/** Otisak prompta: isti prompt -> isti otisak, pa se gotov shot ne generiše ponovo. */
export const promptHash = (text) => crypto.createHash('sha256').update(String(text), 'utf8').digest('hex').slice(0, 16);

/** `el-dorado` -> `EL DORADO` — isti oblik kao ručno pravljeni projekti (`HERO TWINS`). */
export const projectNameFor = (slug) => String(slug).split('-').filter(Boolean).join(' ').toUpperCase();

/** `07`, 2 -> `shot07-2` — ime kandidata u Flow-u i na disku. */
export const imageBase = (shotId, k) => `shot${shotId}-${k}`;

const TAG = /^shot[0-9A-Za-z]+-\d+(\s+|$)/;

/**
 * Ime slike u Flow-u: oznaka shota pa Flow-ov naslov (`shot07-2 Gilded man on lake raft`).
 * Oznaka napred, jer se po njoj slika prepoznaje u Flow-u i u imenu skinutog fajla; naslov
 * ostaje, jer jedini kaže šta je na slici. Flow dug naslov sam skraćuje sa „…" i celog naslova
 * nema nigde — „…" zato ostaje, da se vidi da je reč odsečena. Već postojeća oznaka se skida:
 * ponovljeno preimenovanje ne sme da je udvostruči.
 */
export function imageName(shotId, k, title) {
  const clean = String(title ?? '').replace(TAG, '').replace(/\s+/g, ' ').trim();
  return clean ? `${imageBase(shotId, k)} ${clean}` : imageBase(shotId, k);
}

/** Adresa jedne slike u Flow-u — klik iz pregleda vodi pravo na nju. */
export const editUrl = (projectUrl, mediaId) => `${projectUrl.replace(/\/+$/, '')}/edit/${mediaId}`;

/** Prihvata i adresu slike ili adresu sa `?query`; vraća čistu adresu projekta. */
export function normalizeProjectUrl(url) {
  const m = /^https:\/\/flow\.google\.com\/project\/([0-9a-f-]{36})/i.exec(String(url).trim());
  if (!m) throw new Error(`nije adresa Flow projekta: ${url}\n  oblik: https://flow.google.com/project/<id>`);
  return `https://flow.google.com/project/${m[1].toLowerCase()}`;
}

/**
 * Jedan red o tome šta je na slici, za pregled. `ACTION:` pre `SUBJECT:`-a: SUBJECT nosi
 * zaključan opis lika, isti kroz celu epizodu, a ACTION je ono po čemu se kadrovi razlikuju.
 */
export function summaryOf(prompt) {
  const lines = String(prompt ?? '').split('\n');
  const line = lines.find((l) => l.startsWith('ACTION:')) ?? lines.find((l) => l.startsWith('SUBJECT:')) ?? lines[0] ?? '';
  return line.replace(/^(ACTION|SUBJECT):\s*/, '').trim();
}

/** Ekstenzija po `content-type`; `.jpeg` je konvencija repoa (`shots/shot38.jpeg`). */
export function extFor(contentType) {
  if (/png/i.test(contentType)) return 'png';
  if (/webp/i.test(contentType)) return 'webp';
  return 'jpeg';
}

const fmt = (t) => Number(t).toFixed(3).replace(/\.?0+$/, '');

// ------------------------------------------------------------------ Flow-ov mrežni format
//
// Flow razgovara sa serverom kroz Google-ov `batchexecute`: telo zahteva je `f.req=<JSON>`, a
// u njemu je poziv čiji je argument opet JSON u stringu. Odgovor počinje sa `)]}'`, pa idu
// redovi; red koji počinje sa `[` nosi `["wrb.fr", <rpc>, "<JSON rezultata>", …]`.
//
// Ništa se ne čita po indeksima: slika se prepoznaje kao niz koji počinje media ID-jem i u sebi
// nosi tačno poslat prompt. Tako promena rasporeda polja ili imena RPC-a ne kvari vezu.

/** Ima li negde u ugnježdenoj vrednosti tačno ovaj string — i u JSON-u upakovanom u string. */
export function deepHas(x, s, depth = 0) {
  if (x === s) return true;
  if (depth > 16) return false;
  if (typeof x === 'string') {
    if (x.length < s.length || !(x.startsWith('[') || x.startsWith('{'))) return false;
    try {
      return deepHas(JSON.parse(x), s, depth + 1);
    } catch {
      return false;
    }
  }
  if (Array.isArray(x)) return x.some((y) => deepHas(y, s, depth + 1));
  if (x && typeof x === 'object') return Object.values(x).some((y) => deepHas(y, s, depth + 1));
  return false;
}

/** Nosi li telo `batchexecute` zahteva (`f.req=…`) baš ovaj prompt. */
export function requestHasPrompt(postData, prompt) {
  if (!postData || !prompt) return false;
  let freq;
  try {
    freq = new URLSearchParams(postData).get('f.req');
  } catch {
    return false;
  }
  return !!freq && deepHas(freq, prompt);
}

/** Rezultati iz `batchexecute` odgovora: `[{rpc, payload, raw}]`. */
export function batchPayloads(body) {
  const out = [];
  for (const line of String(body ?? '').replace(/^\)\]\}'\s*/, '').split('\n')) {
    if (!line.startsWith('[')) continue;
    let arr;
    try {
      arr = JSON.parse(line);
    } catch {
      continue;
    }
    for (const e of arr) {
      if (!Array.isArray(e) || e[0] !== 'wrb.fr') continue;
      let payload = null;
      try {
        payload = typeof e[2] === 'string' ? JSON.parse(e[2]) : null;
      } catch { /* rezultat nije JSON — ostaje null, a `raw` nosi razlog */ }
      out.push({ rpc: e[1], payload, raw: e });
    }
  }
  return out;
}

/**
 * Slike iz odgovora na generisanje: media ID + Flow-ov naslov, redom kojim ih je Flow vratio.
 * @returns {{media: {mediaId: string, title: string|null}[], error: string|null}}
 */
export function parseGenerated(body, prompt) {
  const entries = batchPayloads(body);
  const media = [];
  const titles = new Map();
  const walk = (x, depth) => {
    if (!Array.isArray(x) || depth > 16) return;
    if (typeof x[0] === 'string' && UUID.test(x[0]) && deepHas(x, prompt)) {
      if (!media.includes(x[0])) media.push(x[0]);
      return;
    }
    if (typeof x[0] === 'string' && !UUID.test(x[0]) && typeof x[4] === 'string' && UUID.test(x[4])) {
      titles.set(x[4].toLowerCase(), x[0]);
    }
    for (const y of x) walk(y, depth + 1);
  };
  for (const e of entries) walk(e.payload, 0);
  if (media.length) {
    return { media: media.map((id) => ({ mediaId: id, title: titles.get(id.toLowerCase()) ?? null })), error: null };
  }
  const why = entries.length
    ? entries.map((e) => JSON.stringify(e.payload === null ? e.raw.slice(2) : e.payload).slice(0, 200)).join(' | ')
    : String(body ?? '').replace(/\s+/g, ' ').slice(0, 200);
  return { media: [], error: `Flow nije vratio nijednu sliku (${why || 'prazan odgovor'})` };
}

// ------------------------------------------------------------------ stanje

export const flowDir = (dir) => path.join(dir, 'flow');
export const stateFile = (dir) => path.join(flowDir(dir), 'flow.json');

export const emptyState = () => ({ version: 1, project_url: null, project_name: null, shots: {} });

export function loadState(dir) {
  const file = stateFile(dir);
  if (!fs.existsSync(file)) return emptyState();
  let s;
  try {
    s = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file} nije ispravan JSON: ${err.message}`);
  }
  return { ...emptyState(), ...s, shots: s.shots ?? {} };
}

/** Upis preko privremenog fajla: prekid usred upisa ne ostavlja polovičan JSON. */
export function saveState(dir, state) {
  const file = stateFile(dir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(state, null, 2) + '\n');
  fs.renameSync(`${file}.tmp`, file);
}

/**
 * Koji shotovi idu u Flow, a koji se preskaču i zašto.
 * @param {object[]} shots svi shotovi, u redosledu tajmlajna
 * @param {object} state `flow.json`
 * @param {{only?: Set<string>|null, redo?: Set<string>}} [opts]
 * @returns {{todo: {shot: object, why: string}[], skip: {shot: object, why: string}[]}}
 */
export function planShots(shots, state, { only = null, redo = new Set() } = {}) {
  const todo = [];
  const skip = [];
  for (const s of shots) {
    if (only && !only.has(s.shot_id)) continue;
    const st = state.shots?.[s.shot_id];
    if (typeof s.image_prompt !== 'string' || !s.image_prompt.trim()) skip.push({ shot: s, why: 'nema image_prompt' });
    else if (redo.has(s.shot_id)) todo.push({ shot: s, why: 'redo' });
    else if (!st) todo.push({ shot: s, why: 'nov' });
    else if (st.status !== 'done') todo.push({ shot: s, why: 'prošli put nije uspeo' });
    else if (st.prompt_hash !== promptHash(s.image_prompt)) todo.push({ shot: s, why: 'prompt je promenjen' });
    else skip.push({ shot: s, why: 'gotov' });
  }
  return { todo, skip };
}

/** Slike gotovog shota kojima fali ime u Flow-u ili fajl na disku. */
export function unfinished(st, { rename = true, download = true } = {}) {
  if (!st || st.status !== 'done') return [];
  return (st.images ?? []).filter((im) => (rename && !im.renamed) || (download && !im.file));
}

/**
 * Upisuje rezultat generisanja u stanje shota. Novi kandidati nastavljaju brojanje (`redo`,
 * promenjen prompt), stari ostaju — u pregledu su označeni kao „stari prompt".
 * @returns {object[]} nove slike
 */
export function recordBatch(state, shot, media, { now = new Date() } = {}) {
  const prev = state.shots[shot.shot_id]?.images ?? [];
  let k = prev.reduce((m, im) => Math.max(m, im.k), 0);
  const h = promptHash(shot.image_prompt);
  const fresh = media.map((m) => ({
    k: (k += 1), media_id: m.mediaId, title: m.title, name: null, renamed: false, file: null, prompt_hash: h,
  }));
  state.shots[shot.shot_id] = {
    status: 'done', prompt_hash: h, updated_at: now.toISOString(), error: null, images: [...prev, ...fresh],
  };
  return fresh;
}

export function recordFailure(state, shot, error, { now = new Date() } = {}) {
  const prev = state.shots[shot.shot_id];
  state.shots[shot.shot_id] = {
    ...(prev ?? {}), status: 'failed', updated_at: now.toISOString(), error, images: prev?.images ?? [],
  };
}

// ------------------------------------------------------------------ pregled (index.html)

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/**
 * `flow/index.html` — svi kandidati shot po shot, u redosledu tajmlajna. Klik na sliku otvara
 * baš tu sliku u Flow-u, gde se bira „Animate". Slike se podrazumevano ne skidaju, pa su
 * kartice bez sličice; sličice (`shot07-2.jpeg`) postoje samo posle `--download`.
 * @param {object} storyboard
 * @param {object} state
 * @param {{now?: Date}} [opts]
 */
export function renderIndex(storyboard, state, { now = new Date() } = {}) {
  const shots = storyboard.beats.flatMap((b) => b.shots);
  const proj = state.project_url;
  const done = shots.filter((s) => state.shots[s.shot_id]?.status === 'done').length;

  const nav = shots.map((s) => {
    const st = state.shots[s.shot_id];
    const cls = !st ? 'todo' : st.status === 'done' ? 'ok' : 'bad';
    return `<a class="${cls}" href="#shot${esc(s.shot_id)}">${esc(s.shot_id)}</a>`;
  }).join('');

  const sections = shots.map((s) => {
    const st = state.shots[s.shot_id];
    const cur = promptHash(s.image_prompt ?? '');
    const id = esc(s.shot_id);
    const still = isStill(s);
    const mode = still
      ? `STILL · ${fmt(s.use_len)}s · ${s.still_motion ?? ''}`
      : `CLIP · ${fmt(s.use_len)}s · Flow ${s.gen_len ?? '?'}s`;
    // Sledeći korak posle izbora, sa svim što mu treba na jednom mestu: za klip animation
    // prompt (doslovno, dugme ga kopira) i dužina u Flow-u; za still samo ime fajla.
    const next = still
      ? `<p class="next">Izabranu skini iz Flow-a i sačuvaj kao <code>shot${id}.jpeg</code> u korenu epizode — pokret daje montaža.</p>`
      : `<div class="next"><button class="copy" data-copy="anim${id}" data-label="Kopiraj animation prompt">Kopiraj animation prompt</button>` +
        `<span>Video · <b>${esc(s.gen_len ?? '?')}s</b> · sačuvaj kao <code>shot${id}.mp4</code></span>` +
        `<details><summary>animation prompt (${countWords(s.animation_prompt ?? '')} reči)</summary>` +
        `<pre id="anim${id}">${esc(s.animation_prompt ?? '')}</pre></details></div>`;
    let body;
    if (!st) body = '<p class="note">još nije generisano</p>';
    else if (st.status !== 'done') body = `<p class="note bad">nije uspelo: ${esc(st.error ?? 'nepoznat razlog')}</p>`;
    else {
      body = '<div class="cands">' + st.images.map((im) => {
        const old = im.prompt_hash && im.prompt_hash !== cur;
        const pic = im.file
          ? `<img src="${esc(im.file)}" alt="${esc(im.name ?? imageBase(s.shot_id, im.k))}" loading="lazy">`
          : `<div class="nofile">${esc(imageBase(s.shot_id, im.k))} · otvori u Flow-u</div>`;
        const href = proj ? editUrl(proj, im.media_id) : '#';
        return `<a class="cand${old ? ' old' : ''}" href="${esc(href)}" target="_blank" rel="noopener">` +
          `${pic}<span>${esc(imageBase(s.shot_id, im.k))}${old ? ' · stari prompt' : ''}</span></a>`;
      }).join('') + '</div>';
    }
    if (st?.status === 'done' && st.images.length && st.images.filter((im) => im.prompt_hash === cur).length === 0) {
      body += '<p class="note bad">prompt je promenjen posle generisanja — ove slike su za stari prompt</p>';
    }
    return `<section id="shot${id}">` +
      `<h2>shot ${id} <small>${esc(mode)} · beat ${esc(s.beat_id)}</small></h2>` +
      `<p class="subject">${esc(summaryOf(s.image_prompt))}</p>${body}${next}</section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="sr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(storyboard.episode)} — Flow kandidati</title>
<style>
  :root { --bg: #111; --fg: #eee; --dim: #999; --card: #1c1c1c; --ok: #5c5; --bad: #e66; --accent: #8ab4f8; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.45 system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 1; background: #000d; backdrop-filter: blur(6px); padding: 12px 16px; border-bottom: 1px solid #333; }
  header h1 { margin: 0 0 6px; font-size: 18px; }
  header p { margin: 0 0 8px; color: var(--dim); }
  header a { color: var(--accent); }
  nav { display: flex; flex-wrap: wrap; gap: 4px; }
  nav a { padding: 2px 7px; border-radius: 4px; background: var(--card); color: var(--fg); text-decoration: none; font-size: 13px; }
  nav a.ok { box-shadow: inset 0 -2px var(--ok); } nav a.bad { box-shadow: inset 0 -2px var(--bad); } nav a.todo { color: var(--dim); }
  main { padding: 8px 16px 48px; }
  section { padding: 18px 0; border-bottom: 1px solid #2a2a2a; scroll-margin-top: 120px; }
  h2 { margin: 0 0 4px; font-size: 17px; } h2 small { color: var(--dim); font-weight: normal; font-size: 13px; }
  .subject { margin: 0 0 10px; color: #ccc; max-width: 110ch; }
  .cands { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
  .cand { display: block; background: var(--card); border-radius: 8px; overflow: hidden; color: var(--fg); text-decoration: none; }
  .cand img, .nofile { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  .nofile { display: grid; place-items: center; color: var(--dim); }
  .cand span { display: block; padding: 6px 8px; font-size: 13px; }
  .cand:hover { outline: 2px solid var(--accent); }
  .cand.old { opacity: .45; }
  .note { color: var(--dim); } .note.bad { color: var(--bad); }
  .next { margin: 10px 0 0; color: var(--dim); }
  .next span { margin-left: 10px; } .next b { color: var(--fg); }
  .next code { color: var(--fg); background: var(--card); padding: 1px 5px; border-radius: 4px; }
  .copy { font: inherit; font-size: 13px; padding: 5px 10px; border-radius: 6px; border: 1px solid #444; background: var(--card); color: var(--fg); cursor: pointer; }
  .copy:hover { border-color: var(--accent); }
  details { margin-top: 6px; } summary { cursor: pointer; font-size: 13px; }
  pre { white-space: pre-wrap; background: var(--card); padding: 10px; border-radius: 6px; font-size: 13px; max-width: 110ch; }
</style>
</head>
<body>
<header>
  <h1>${esc(storyboard.episode)} — kandidati iz Flow-a</h1>
  <p>${done}/${shots.length} ${plural(shots.length, 'shot', 'shota', 'shotova')} generisano · ` +
    `${proj ? `<a href="${esc(proj)}" target="_blank" rel="noopener">${esc(state.project_name ?? 'Flow projekat')}</a> · ` : ''}` +
    `klik na sliku je otvara u Flow-u · osveženo ${esc(now.toISOString().slice(0, 16).replace('T', ' '))} UTC</p>
  <nav>${nav}</nav>
</header>
<main>
${sections}
</main>
<script>
  // Kopira prompt doslovno (textContent čuva prelome redova). Clipboard API na file:// ume da
  // bude zabranjen, pa je rezerva stari execCommand.
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button.copy');
    if (!b) return;
    const text = document.getElementById(b.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.append(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    b.textContent = 'Kopirano ✓';
    setTimeout(() => { b.textContent = b.dataset.label; }, 1500);
  });
</script>
</body>
</html>
`;
}

// ------------------------------------------------------------------ u stranici
//
// Ove funkcije se šalju u Flow tab kao tekst (`Page.evaluate`), pa ne smeju da zatvaraju
// ništa iz ovog modula — sve što im treba dobijaju kao argument.
//
// Flow se menja bez najave. Zato se elementi traže po onome što korisnik vidi (aria-label,
// tekst dugmeta), a ne po klasama, i zato je svaki klik praćen proverom da je uspeo.

/**
 * Prvi vidljiv element po opisu, sa središtem za klik. Element van ekrana se prvo doskroluje.
 * spec: selector, aria, role, label (tekst se završava labelom), text (sadrži), enabled.
 */
function pFind(spec) {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
  };
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const el = [...document.querySelectorAll(spec.selector || '*')].find((e) => {
    if (spec.aria !== undefined && e.getAttribute('aria-label') !== spec.aria) return false;
    if (spec.role !== undefined && e.getAttribute('role') !== spec.role) return false;
    const t = norm(e.innerText);
    if (spec.label !== undefined && t !== spec.label && !t.endsWith(' ' + spec.label)) return false;
    if (spec.text !== undefined && !t.includes(spec.text)) return false;
    return visible(e);
  });
  if (!el) return null;
  if (spec.enabled && (el.disabled || el.getAttribute('aria-disabled') === 'true')) return null;
  // Klik ide u tačku, ne u element: ako je ispred elementa nešto drugo, klik bi otišao tom
  // drugom. Zato se tačka proverava, a element po potrebi dovede u sredinu ekrana.
  const hits = (rr) => {
    const h = document.elementFromPoint(rr.x + rr.width / 2, rr.y + rr.height / 2);
    return !!h && (h === el || el.contains(h));
  };
  let r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth || !hits(r)) {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    r = el.getBoundingClientRect();
    if (!hits(r)) return null;
  }
  return {
    x: r.x + r.width / 2,
    y: r.y + r.height / 2,
    checked: el.getAttribute('aria-checked'),
    pressed: el.getAttribute('aria-pressed'),
    text: norm(el.innerText).slice(0, 120),
    value: 'value' in el ? el.value : null,
  };
}

/** 'in' | 'out' | null (još se učitava). */
function pAuth() {
  if (document.readyState !== 'complete') return null;
  if (location.hostname !== 'flow.google.com' || location.pathname.startsWith('/about')) return 'out';
  if (document.querySelector('[aria-label="Account details"]')) return 'in';
  return null;
}

/** Tekst ProseMirror polja; `<br>` je prelom reda, kao u promptu. */
function pEditorText(aria) {
  const ed = [...document.querySelectorAll('[role=textbox]')].find((e) => e.getAttribute('aria-label') === aria);
  if (!ed) return null;
  return [...ed.children].map((p) => {
    let s = '';
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) s += c.data;
        else if (c.nodeName === 'BR') { if (!c.classList.contains('ProseMirror-trailingBreak')) s += '\n'; }
        else walk(c);
      }
    };
    walk(p);
    return s;
  }).join('\n');
}

/** Paste u polje — isti put kojim ide Ctrl+V. */
function pPaste(aria, text) {
  const ed = [...document.querySelectorAll('[role=textbox]')].find((e) => e.getAttribute('aria-label') === aria);
  if (!ed) return false;
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  return true;
}

/** Tekst obaveštenja (snackbar, alert) — razlog kad Flow odbije prompt. */
function pAlerts() {
  const sel = '[role=alert], mat-snack-bar-container, .mat-mdc-snack-bar-label, [class*=snackbar], [class*=toast]';
  return [...document.querySelectorAll(sel)]
    .map((e) => String(e.innerText || '').replace(/\s+/g, ' ').trim())
    .filter((t) => t && t.length < 300);
}

/** Navigacija unutar aplikacije — bez učitavanja, pa zahtevi u toku teku dalje. */
function pGo(pathname) {
  if (location.pathname.replace(/\/+$/, '') === pathname) return false;
  history.pushState(null, '', pathname);
  dispatchEvent(new PopStateEvent('popstate', { state: null }));
  return true;
}

/** Mreža projekta je spremna: tu je polje „What do you want to create?". */
function pGridReady(pathname, aria) {
  return location.pathname.replace(/\/+$/, '') === pathname &&
    [...document.querySelectorAll('[role=textbox]')].some((e) => e.getAttribute('aria-label') === aria);
}

/**
 * Stranica slike je spremna: slika učitana i polje sa njenim imenom tu. Adresa se menja odmah,
 * a mreža ostaje na ekranu još trenutak — i u njoj je ista slika i polje „Editable text" (ime
 * projekta). Zato se traži da polja za prompt iz mreže više nema, a da je tu polje stranice
 * slike; inače bi se preimenovao projekat umesto slike.
 */
function pImageReady(mediaId, gridAria) {
  if (!location.pathname.endsWith(`/edit/${mediaId}`)) return null;
  const boxes = [...document.querySelectorAll('[role=textbox]')].map((e) => e.getAttribute('aria-label'));
  if (boxes.includes(gridAria) || !boxes.includes('What do you want to change?')) return null;
  const img = [...document.querySelectorAll('img')].find((i) => i.src.includes(mediaId) && i.naturalWidth > 0);
  const inputs = document.querySelectorAll('input[aria-label="Editable text"]');
  if (!img || inputs.length !== 1) return null;
  return { title: inputs[0].value, src: img.src };
}

// ------------------------------------------------------------------ Flow kroz pregledač

export class Flow {
  /**
   * @param {import('./cdp.mjs').Page} page
   * @param {CDP} cdp
   * @param {(line: string) => void} [log]
   */
  constructor(page, cdp, log = console.log) {
    this.page = page;
    this.cdp = cdp;
    this.log = log;
    this.projectUrl = null;
    /** requestId -> {prompt, status: 'pending'|'ok'|'failed', body?, error?} */
    this.requests = new Map();
    this.awaiting = null;
  }

  find(spec) {
    return this.page.evaluate(pFind, spec);
  }

  waitFind(spec, what, timeout = 15_000) {
    return this.page.waitFor(pFind, { args: [spec], timeout, what });
  }

  async clickSpec(spec, what, timeout) {
    const p = await this.waitFind(spec, what, timeout);
    await this.page.click(p.x, p.y);
    return p;
  }

  /** Čeka prijavu. Dok je tab na Google nalogu, ništa se ne izvršava u stranici — samo se čita URL. */
  async ensureLoggedIn({ timeout = 15 * 60_000 } = {}) {
    const url = await this.page.url().catch(() => '');
    if (!url.startsWith(FLOW_HOME)) await this.page.navigate(FLOW_HOME);
    let auth = await this.page.waitFor(pAuth, { timeout: 45_000, what: 'Flow početna strana' }).catch(() => 'out');
    if (auth === 'in') return;

    this.log('');
    this.log('Ovaj Chrome profil nije prijavljen u Google. U Chrome prozoru koji je otvoren:');
    this.log('  klikni „Create with Google Flow" i prijavi se nalogom sa AI Pro pretplatom.');
    this.log('Prijava se pamti u profilu — ovo je jednokratno. Čekam (do 15 min)…');
    await this.page.bringToFront().catch(() => {});

    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      await sleep(3000);
      const u = await targetUrl(this.cdp, this.page.targetId).catch(() => '');
      if (!u.startsWith(FLOW_HOME) || u.startsWith(`${FLOW_HOME}about`)) continue;
      auth = await this.page.evaluate(pAuth).catch(() => null);
      if (auth === 'in') {
        this.log('Prijavljen.');
        return;
      }
    }
    throw new Error('prijava nije završena za 15 min — pokreni alat ponovo kad se prijaviš');
  }

  get projectPath() {
    return new URL(this.projectUrl).pathname.replace(/\/+$/, '');
  }

  async waitGrid(timeout = 45_000) {
    await this.page.waitFor(pGridReady, { args: [this.projectPath, PROMPT_ARIA], timeout, what: 'mreža Flow projekta' });
  }

  async openProject(url) {
    this.projectUrl = url;
    await this.page.navigate(url);
    try {
      await this.waitGrid();
    } catch {
      throw new Error(`projekat ${url} se ne otvara (obrisan?). Pokreni sa --new za nov projekat.`);
    }
  }

  async projectTitle() {
    const p = await this.find({ selector: 'input', aria: 'Editable text' });
    return p?.value ?? null;
  }

  async renameProject(name) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.clickSpec({ selector: 'input', aria: 'Editable text' }, 'ime projekta');
      await sleep(200);
      await this.page.press('a', ['Control'], ['selectAll']);
      await this.page.insertText(name);
      await this.page.press('Enter');
      await sleep(800);
      if (await this.projectTitle() === name) return;
    }
    this.log(`  upozorenje: projekat nije preimenovan u „${name}" — ime menjaš ručno, sve ostalo radi`);
  }

  /** Nov projekat sa početne strane; vraća njegovu adresu. */
  async createProject(name) {
    await this.page.navigate(FLOW_HOME);
    await this.page.waitFor(pAuth, { timeout: 45_000, what: 'Flow početna strana' });
    let created = false;
    for (let attempt = 1; attempt <= 4 && !created; attempt += 1) {
      // Prvi klik posle učitavanja ume da propadne (dugme još nema handler), pa se proverava.
      await this.clickSpec({ selector: 'button', label: 'New project' }, 'dugme New project', 30_000);
      created = await this.page.waitFor(() => /^\/project\/[0-9a-f-]{36}\/?$/i.test(location.pathname),
        { timeout: 8000, what: 'nov projekat' }).catch(() => false);
    }
    if (!created) throw new Error('Flow nije napravio nov projekat posle 4 klika na „New project"');
    this.projectUrl = normalizeProjectUrl(await this.page.url());
    await this.waitGrid();
    await this.renameProject(name);
    return this.projectUrl;
  }

  async pickRadio(label) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const r = await this.waitFind({ selector: '[role=radio]', label }, `opcija ${label}`, 8000);
      if (r.checked === 'true') return;
      await this.page.click(r.x, r.y);
      await sleep(400);
    }
    const r = await this.find({ selector: '[role=radio]', label });
    if (r?.checked !== 'true') throw new Error(`Flow: opcija „${label}" neće da se uključi`);
  }

  /**
   * Image · odnos · xN (i model ako je zadat). Flow ova podešavanja pamti globalno, pa ostaju i
   * za ručni rad posle alata.
   * @returns {Promise<string>} model koji se koristi
   */
  async ensureSettings({ count, aspect, model }) {
    const agent = await this.find({ selector: 'button', label: 'Agent' });
    if (agent?.pressed === 'true') await this.page.click(agent.x, agent.y);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.clickSpec({ selector: 'button', aria: 'Settings trigger' }, 'dugme podešavanja');
      if (await this.waitFind({ selector: '[role=radio]', label: 'Image' }, 'panel podešavanja', 4000).catch(() => null)) break;
      if (attempt === 3) throw new Error('Flow: panel podešavanja se ne otvara');
    }
    await this.pickRadio('Image');
    await this.pickRadio(aspect);

    if (model) {
      const cur = await this.waitFind({ selector: 'button', aria: 'Select model family' }, 'izbor modela');
      if (!cur.text.includes(model)) {
        await this.page.click(cur.x, cur.y);
        await this.clickSpec({ selector: '[role=menuitem]', label: model }, `model ${model}`, 5000)
          .catch(() => { throw new Error(`Flow nema model „${model}" u listi`); });
        await sleep(400);
      }
    }
    const used = (await this.find({ selector: 'button', aria: 'Select model family' }))?.text
      .replace(/arrow_drop_down/g, '').replace(/[^\p{L}\p{N}. -]/gu, '').trim() ?? '?';
    if (model && !used.includes(model)) throw new Error(`Flow: model „${model}" nije izabran (stoji „${used}")`);

    await this.pickRadio(`x${count}`);
    await this.page.press('Escape');
    await this.page.waitFor(() => !document.querySelector('[role=radio]'), { timeout: 5000, what: 'zatvaranje panela' })
      .catch(() => this.page.press('Escape'));
    return used;
  }

  /**
   * Prati zahteve za generisanje. Zahtev se vezuje za prompt koji se upravo šalje (njegovo telo
   * nosi taj prompt), a odgovor se pamti dok ga glavna petlja ne pokupi.
   */
  async watchGenerations() {
    await this.page.send('Network.enable', { maxPostDataSize: 1 << 17 });
    const sid = this.page.sessionId;
    this.cdp.on('Network.requestWillBeSent', async (p) => {
      const prompt = this.awaiting;
      const r = p.request;
      if (!prompt || r.method !== 'POST' || !r.url.startsWith(FLOW_HOME)) return;
      let post = r.postData;
      if (!post && r.hasPostData) {
        post = (await this.page.send('Network.getRequestPostData', { requestId: p.requestId }).catch(() => null))?.postData;
      }
      if (requestHasPrompt(post, prompt)) this.requests.set(p.requestId, { prompt, status: 'pending' });
    }, sid);
    this.cdp.on('Network.loadingFinished', async (p) => {
      const q = this.requests.get(p.requestId);
      if (!q) return;
      try {
        const b = await this.page.send('Network.getResponseBody', { requestId: p.requestId });
        q.body = b.base64Encoded ? Buffer.from(b.body, 'base64').toString('utf8') : b.body;
        q.status = 'ok';
      } catch (err) {
        q.status = 'failed';
        q.error = `odgovor se ne čita: ${err.message}`;
      }
    }, sid);
    this.cdp.on('Network.loadingFailed', (p) => {
      const q = this.requests.get(p.requestId);
      if (q) Object.assign(q, { status: 'failed', error: `zahtev pao: ${p.errorText}` });
    }, sid);
  }

  /** Vraća tab u mrežu projekta (bez učitavanja) — samo odatle se šalje prompt. */
  async toGrid() {
    await this.page.evaluate(pGo, this.projectPath);
    await this.waitGrid(20_000);
  }

  /** Prompt u polje, doslovno — ili greška. */
  async fillPrompt(prompt) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.clickSpec({ selector: '[role=textbox]', aria: PROMPT_ARIA }, 'polje za prompt');
      await sleep(150);
      await this.page.press('a', ['Control'], ['selectAll']);
      await this.page.press('Backspace');
      await sleep(150);
      await this.page.evaluate(pPaste, PROMPT_ARIA, prompt);
      await sleep(300);
      const got = await this.page.evaluate(pEditorText, PROMPT_ARIA);
      if (got === prompt) return;
      let i = 0;
      while (i < Math.min(got?.length ?? 0, prompt.length) && got[i] === prompt[i]) i += 1;
      this.log(`  prompt u Flow polju se razlikuje od storyboard.json na znaku ${i} (pokušaj ${attempt}): ` +
        `${JSON.stringify((got ?? '').slice(i, i + 30))} umesto ${JSON.stringify(prompt.slice(i, i + 30))}`);
    }
    throw new Error('prompt u Flow polju nije doslovno isti kao u storyboard.json — ne šaljem');
  }

  /**
   * Šalje prompt iz mreže projekta i vraća ID zahteva za generisanje — po njemu se posle
   * pokupe slike.
   * @returns {Promise<string>}
   */
  async submit(prompt) {
    await this.fillPrompt(prompt);
    const before = new Set(this.requests.keys());
    this.awaiting = prompt;
    try {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await this.clickSpec({ selector: 'button', aria: 'Start generation', enabled: true }, 'dugme Start generation');
        const deadline = Date.now() + 20_000;
        while (Date.now() < deadline) {
          const id = [...this.requests.keys()].find((k) => !before.has(k) && this.requests.get(k).prompt === prompt);
          if (id) return id;
          await sleep(250);
        }
        const alerts = await this.page.evaluate(pAlerts).catch(() => []);
        if (alerts.length) throw new Error(`Flow nije prihvatio prompt: ${alerts.join(' | ')}`);
        // Polje prazno a zahteva nema — Flow je prompt primio drugim putem koji alat ne prepoznaje.
        if ((await this.page.evaluate(pEditorText, PROMPT_ARIA)) === '') {
          throw new Error('Flow je prihvatio prompt, ali alat ne vidi zahtev za generisanje (promenio se Flow?)');
        }
      }
      throw new Error('Flow nije prihvatio prompt posle 3 klika na Start generation');
    } finally {
      this.awaiting = null;
    }
  }

  /** Otvara stranicu slike (bez učitavanja); vraća njeno trenutno ime i svežu adresu slike. */
  async openImage(mediaId) {
    await this.page.evaluate(pGo, `${this.projectPath}/edit/${mediaId}`);
    return this.page.waitFor(pImageReady, { args: [mediaId, PROMPT_ARIA], timeout: 30_000, what: 'stranica slike' });
  }

  /** Ime slike na njenoj stranici — upis pa provera da je ostao. */
  async renameOpenImage(name) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.clickSpec({ selector: 'input', aria: 'Editable text' }, 'ime slike');
      await sleep(150);
      await this.page.press('a', ['Control'], ['selectAll']);
      await this.page.insertText(name);
      await this.page.press('Enter');
      await sleep(700);
      if ((await this.find({ selector: 'input', aria: 'Editable text' }))?.value === name) return;
    }
    throw new Error('ime se ne upisuje');
  }

  /** Kolačići za flow.google.com — trebaju samo ako slika ide preko `flow.google.com/asb/…`. */
  async cookieHeader() {
    const { cookies } = await this.page.send('Network.getCookies', { urls: [FLOW_HOME] });
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  }
}

/**
 * Skida sliku na disk. Potpisana adresa (`flow-content.google/…?Signature=`) ne traži kolačiće;
 * `flow.google.com/asb/…` traži, pa se šalju samo njoj.
 * @returns {Promise<string>} ime fajla (bez foldera)
 */
export async function download(src, dir, base, cookie) {
  const host = new URL(src).hostname;
  const headers = host === 'flow.google.com' && cookie ? { cookie } : {};
  const res = await fetch(src, { headers, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`nije slika nego ${type || 'nepoznat tip'}`);
  const file = `${base}.${extFor(type)}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
  return file;
}

// ---------------------------------------------------------------- CLI

const USAGE = `node tools/flow-images.mjs <folder-epizode> [opcije]

  Za svaki shot iz storyboard.json pravi slike u Google Flow-u (podrazumevano 4) i staje:
  izbor najbolje i animacija ostaju tebi. Chrome se otvara sa zasebnim profilom; prvi put se
  u njemu prijaviš u Google, posle toga alat ulazi sam.

  Posle prolaza: Flow projekat u kome je svaka slika nazvana shotNN-k i pregled za izbor
  episodes/<slug>/flow/index.html (klik na sliku je otvara u Flow-u; animation prompt je ispod,
  sa dugmetom za kopiranje). Slike se ne skidaju na računar — skidaš samo konačne videe.
  Prekinut prolaz se nastavlja ponovnim pokretanjem — gotovi shotovi se preskaču.
  Chrome prozor alata sme da stoji iza drugih prozora, ali ne minimizovan, i bez drugih tabova
  ispred taba alata dok radi (alat oba vraća sam).

  --only 07,12,18    samo ti shotovi (prima i 7 i 07)
  --redo 07,12       generiši ponovo i ako su gotovi (novi kandidati dobijaju sledeće brojeve)
  --count 4          slika po shotu, 1–4
  --aspect 16:9      ${ASPECTS.join(', ')}
  --model "Nano Banana Pro"
                     model slike; bez ovoga ostaje onaj koji je već izabran u Flow-u
  --parallel 2       koliko promptova se generiše istovremeno, 1–4
  --project "IME"    ime novog projekta (podrazumevano slug velikim slovima: EL DORADO)
  --project-url URL  radi u postojećem projektu umesto da pravi nov
  --new              nov projekat i kad flow.json već ima jedan
  --no-rename        ne preimenuj slike u Flow-u
  --download         skini i slike na disk (episodes/<slug>/flow/shotNN-k.jpeg); bez ovoga
                     se ništa ne skida
  --dry-run          samo ispiši šta bi uradio, bez pregledača
  --login            samo otvori Chrome i sačekaj prijavu u Google
  --port ${DEFAULT_PORT}        port za Chrome DevTools
  -h, --help         ovaj tekst

  Chrome profil: ${defaultProfileDir()}`;

export function parseArgs(argv) {
  const out = {
    dir: null, only: null, redo: null, count: 4, aspect: '16:9', model: null, parallel: 2, project: null,
    projectUrl: null, newProject: false, rename: true, download: false, dryRun: false, login: false,
    port: DEFAULT_PORT, help: false,
  };
  const ids = (v, flag) => {
    const list = v.split(',').map((s) => s.trim()).filter(Boolean);
    if (!list.length) throw new Error(`${flag}: prazan spisak shotova\n\n${USAGE}`);
    return list;
  };
  const int = (v, flag, lo, hi) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`${flag} mora da bude ceo broj ${lo}–${hi}, a ne ${v}`);
    return n;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    const eq = raw.startsWith('--') ? raw.indexOf('=') : -1;
    const flag = eq > 0 ? raw.slice(0, eq) : raw;
    const value = () => {
      if (eq > 0) return raw.slice(eq + 1);
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`${flag} traži vrednost\n\n${USAGE}`);
      i += 1;
      return v;
    };
    switch (flag) {
      case '-h': case '--help': out.help = true; break;
      case '--only': out.only = [...(out.only ?? []), ...ids(value(), flag)]; break;
      case '--redo': out.redo = [...(out.redo ?? []), ...ids(value(), flag)]; break;
      case '--count': out.count = int(value(), flag, 1, 4); break;
      case '--parallel': out.parallel = int(value(), flag, 1, 4); break;
      case '--aspect': {
        out.aspect = value();
        if (!ASPECTS.includes(out.aspect)) throw new Error(`--aspect mora da bude jedno od ${ASPECTS.join(', ')}`);
        break;
      }
      case '--model': out.model = value(); break;
      case '--project': out.project = value(); break;
      case '--project-url': out.projectUrl = normalizeProjectUrl(value()); break;
      case '--new': out.newProject = true; break;
      case '--no-rename': out.rename = false; break;
      case '--download': out.download = true; break;
      case '--no-download': out.download = false; break; // stari naziv; sada je to podrazumevano
      case '--dry-run': out.dryRun = true; break;
      case '--login': out.login = true; break;
      case '--port': out.port = int(value(), flag, 1, 65535); break;
      default:
        if (raw.startsWith('-')) throw new Error(`nepoznata opcija ${raw}\n\n${USAGE}`);
        if (out.dir !== null) throw new Error(`višak argumenta ${raw}\n\n${USAGE}`);
        out.dir = raw;
    }
  }
  if (out.newProject && out.projectUrl) throw new Error('--new i --project-url ne idu zajedno');
  if (!out.help && !out.login && !out.dir) throw new Error(`nedostaje folder epizode\n\n${USAGE}`);
  return out;
}

const pad = (n, w) => String(n).padStart(w, ' ');

/**
 * Veza sa Chrome-om i tab za rad. Tab epizode (adresa njenog projekta) se koristi ponovo; inače
 * alat otvara svoj tab — nikad ne preuzima tab u kome radiš nešto drugo u Flow-u.
 */
async function connectFlow(port, log, { projectUrl = null, anyFlowTab = false } = {}) {
  const { wsUrl, launched } = await ensureChrome({ port, startUrl: FLOW_HOME });
  if (launched) log(`Chrome pokrenut (profil ${defaultProfileDir()}).`);
  const cdp = await CDP.connect(wsUrl);
  const prefix = projectUrl ?? (anyFlowTab || launched ? FLOW_HOME : null);
  const page = await openPage(cdp, { prefix, newUrl: projectUrl ?? FLOW_HOME });
  if (await ensureWindowShown(cdp, page.targetId).catch(() => false)) {
    log('Chrome prozor je bio minimizovan — vraćen. Sme da stoji iza drugih prozora, ali ne minimizovan.');
  }
  // Tab u pozadini svog prozora se ne iscrtava, kao ni minimizovan prozor.
  await page.bringToFront().catch(() => {});
  // Tab ne mora da bude u prvom planu: fokus se emulira, pa klik i kucanje rade iza drugih prozora.
  await page.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
  return { cdp, flow: new Flow(page, cdp, log) };
}

export async function main(argv, log = console.log) {
  const args = parseArgs(argv);
  if (args.help) {
    log(USAGE);
    return 0;
  }

  if (args.login) {
    const { cdp, flow } = await connectFlow(args.port, log, { anyFlowTab: true });
    try {
      await flow.ensureLoggedIn();
      log('Flow je spreman: ovaj Chrome profil je prijavljen.');
    } finally {
      cdp.close();
    }
    return 0;
  }

  const { dir, storyboard } = loadStoryboard(args.dir);
  const slug = storyboard.episode ?? path.basename(path.resolve(dir));
  const shots = storyboard.beats.flatMap((b) => b.shots);
  const ids = shots.map((s) => s.shot_id);
  const only = args.only ? resolveOnly(ids, args.only) : null;
  const redo = args.redo ? resolveOnly(ids, args.redo) : new Set();
  const inScope = (s) => !only || only.has(s.shot_id);

  const state = loadState(dir);
  if (args.newProject) state.project_url = null;
  if (args.projectUrl) state.project_url = args.projectUrl;

  const { todo, skip } = planShots(shots, state, { only, redo });
  const opts = { rename: args.rename, download: args.download };
  const leftovers = shots.filter((s) => inScope(s) && !todo.some((t) => t.shot === s) &&
    unfinished(state.shots[s.shot_id], opts).length);

  const outDir = flowDir(dir);
  const writeIndex = () => {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), renderIndex(storyboard, state));
  };

  log(`flow-images — ${slug} · ${shots.length} ${plural(shots.length, 'shot', 'shota', 'shotova')} u storyboardu · ` +
    `${args.count} ${plural(args.count, 'slika', 'slike', 'slika')} po shotu · ${args.aspect} · ${args.parallel} paralelno`);
  log(`  za generisanje: ${todo.length ? todo.map((t) => t.shot.shot_id + (t.why === 'nov' ? '' : ` (${t.why})`)).join(', ') : 'ništa'}`);
  const done = skip.filter((s) => s.why === 'gotov');
  if (done.length) log(`  već gotovo: ${done.length} (${done.map((s) => s.shot.shot_id).join(', ')})`);
  for (const s of skip.filter((x) => x.why !== 'gotov')) log(`  preskačem ${s.shot.shot_id}: ${s.why}`);
  if (leftovers.length) log(`  dovršavanje imena/fajlova: ${leftovers.map((s) => s.shot_id).join(', ')}`);
  log(`  projekat: ${state.project_url ?? `nov — „${args.project ?? projectNameFor(slug)}"`}`);

  if (args.dryRun) return 0;
  if (!todo.length && !leftovers.length) {
    writeIndex();
    log(`Nema posla. Pregled: ${path.resolve(outDir, 'index.html')}`);
    return 0;
  }

  const { cdp, flow } = await connectFlow(args.port, log, { projectUrl: state.project_url });
  const failed = new Map();
  const t0 = Date.now();
  let windowCheck = 0;
  try {
    await flow.ensureLoggedIn();
    if (state.project_url) {
      await flow.openProject(state.project_url);
      state.project_name = await flow.projectTitle() ?? state.project_name;
    } else {
      state.project_name = args.project ?? projectNameFor(slug);
      state.project_url = await flow.createProject(state.project_name);
      saveState(dir, state);
      log(`Nov projekat „${state.project_name}": ${state.project_url}`);
    }
    await flow.watchGenerations();
    if (todo.length) {
      const model = await flow.ensureSettings({ count: args.count, aspect: args.aspect, model: args.model });
      log(`Podešeno: Image · ${args.aspect} · ${model} · x${args.count}`);
    }
    const cookie = args.download ? await flow.cookieHeader().catch(() => '') : '';

    const queue = todo.map((t) => ({ shot: t.shot, tries: 0 }));
    const total = queue.length;
    const w = String(total).length;
    const order = new Map(queue.map((q, i) => [q.shot.shot_id, i + 1]));
    const tag = (shot) => (order.has(shot.shot_id)
      ? `[${pad(order.get(shot.shot_id), w)}/${total}] shot ${shot.shot_id}`
      : `${' '.repeat(2 * w + 3)} shot ${shot.shot_id}`);
    /** requestId -> {item, t0} */
    const inflight = new Map();
    /** shotovi čije slike čekaju ime i fajl; prvo zaostaci iz ranijih prolaza */
    const finishing = [...leftovers];
    /** slike koje u ovom prolazu nisu uspele — ne pokušavaju se u krug */
    const gaveUp = new Set();

    const finishOne = async () => {
      const shot = finishing[0];
      const im = unfinished(state.shots[shot.shot_id], opts).find((x) => !gaveUp.has(x.media_id));
      if (!im) {
        finishing.shift();
        const st = state.shots[shot.shot_id];
        const named = st.images.filter((x) => x.renamed).length;
        const files = st.images.filter((x) => x.file).length;
        log(`${tag(shot)}  ${args.rename ? `imena ${named}/${st.images.length}` : ''}` +
          `${args.rename && args.download ? ', ' : ''}${args.download ? `fajlovi ${files}/${st.images.length}` : ''}`);
        writeIndex();
        return;
      }
      const base = imageBase(shot.shot_id, im.k);
      try {
        const { title, src } = await flow.openImage(im.media_id);
        if (args.rename && !im.renamed) {
          const name = imageName(shot.shot_id, im.k, title || im.title);
          await flow.renameOpenImage(name);
          Object.assign(im, { renamed: true, name });
        }
        if (args.download && !im.file) im.file = await download(src, outDir, base, cookie);
      } catch (err) {
        gaveUp.add(im.media_id);
        log(`${tag(shot)}  ${base}: ${err.message} (pokušava se pri sledećem pokretanju)`);
      }
      saveState(dir, state);
    };

    while (queue.length || inflight.size || finishing.length) {
      // 0. Minimizovan prozor i tab u pozadini se ne iscrtavaju, a bez iscrtavanja klik čeka u
      //    nedogled. Oba se vraćaju; prozor iza drugih prozora je u redu.
      if (Date.now() - windowCheck > 10_000) {
        windowCheck = Date.now();
        if (await ensureWindowShown(cdp, flow.page.targetId).catch(() => false)) {
          log('  (Chrome prozor je minimizovan — vraćam ga; sme da stoji iza drugih prozora)');
        }
        if (await flow.page.evaluate(() => document.visibilityState).catch(() => 'visible') === 'hidden') {
          await flow.page.bringToFront().catch(() => {});
          log('  (tab alata nije bio aktivan — vraćen; dok alat radi, ne otvaraj druge tabove u tom prozoru)');
        }
      }

      // 1. Dopuni paralelna generisanja. Isti prompt dvaput u letu ne bi se mogao razlikovati.
      const next = queue[0];
      const busy = next && [...inflight.values()].some((f) => f.item.shot.image_prompt === next.shot.image_prompt);
      if (next && inflight.size < args.parallel && !busy && (!next.notBefore || Date.now() >= next.notBefore)) {
        queue.shift();
        next.tries += 1;
        try {
          await flow.toGrid();
          const id = await flow.submit(next.shot.image_prompt);
          inflight.set(id, { item: next, t0: Date.now() });
          log(`${tag(next.shot)}  poslato${next.tries > 1 ? ` (pokušaj ${next.tries})` : ''}`);
        } catch (err) {
          if (/doslovno|promenio se Flow/.test(err.message) || next.tries >= 2) {
            recordFailure(state, next.shot, err.message);
            failed.set(next.shot.shot_id, err.message);
            saveState(dir, state);
            log(`${tag(next.shot)}  NIJE POSLATO: ${err.message}`);
          } else {
            log(`${tag(next.shot)}  nije poslato (${err.message}) — ponovo za 30s`);
            queue.push({ ...next, notBefore: Date.now() + 30_000 });
          }
        }
        continue;
      }

      // 2. Pokupi gotova generisanja.
      for (const [id, f] of inflight) {
        const q = flow.requests.get(id);
        const secs = Math.round((Date.now() - f.t0) / 1000);
        if (q.status === 'pending' && Date.now() - f.t0 < GEN_TIMEOUT_MS) continue;
        inflight.delete(id);
        flow.requests.delete(id);
        const res = q.status === 'ok' ? parseGenerated(q.body, f.item.shot.image_prompt)
          : { media: [], error: q.status === 'pending' ? `nema odgovora posle ${secs}s` : q.error };
        if (res.media.length) {
          const fresh = recordBatch(state, f.item.shot, res.media);
          failed.delete(f.item.shot.shot_id);
          saveState(dir, state);
          if (args.rename || args.download) finishing.push(f.item.shot);
          else writeIndex();
          log(`${tag(f.item.shot)}  ${fresh.length}/${args.count} ${plural(fresh.length, 'slika', 'slike', 'slika')} za ${secs}s`);
        } else if (f.item.tries < 2) {
          log(`${tag(f.item.shot)}  nije uspelo (${res.error}) — ponovo za 30s`);
          queue.push({ ...f.item, notBefore: Date.now() + 30_000 });
        } else {
          recordFailure(state, f.item.shot, res.error);
          failed.set(f.item.shot.shot_id, res.error);
          saveState(dir, state);
          log(`${tag(f.item.shot)}  NIJE USPELO: ${res.error}`);
        }
      }

      // 3. Dok Flow generiše, slike gotovih shotova dobijaju ime i fajl — jedna po jedna.
      if (finishing.length) {
        await finishOne();
        continue;
      }
      await sleep(500);
    }
    await flow.toGrid().catch(() => {});
  } finally {
    saveState(dir, state);
    writeIndex();
    cdp.close();
  }

  const mins = ((Date.now() - t0) / 60_000).toFixed(1);
  log('');
  log(`Gotovo za ${mins} min. Projekat: ${state.project_url}`);
  log(`Pregled: ${path.resolve(outDir, 'index.html')}`);
  if (failed.size) {
    log(`Nije uspelo (${failed.size}): ${[...failed.keys()].join(', ')} — ponovno pokretanje pokušava samo njih.`);
    return 1;
  }
  log('Izbor: otvori pregled, klik na najbolju sliku je otvara u Flow-u; animation prompt je ispod kandidata.');
  return 0;
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (err) => {
    console.error(err.message);
    process.exit(1);
  });
}
