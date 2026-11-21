// tools/medium.mjs
//
// Medium članak uz svaki video — piše se uz publish komplet, a objavljuje se sam čim video postane
// javan na YouTube-u.
//
//   node tools/medium.mjs episodes/<slug> --check        provera medium.md (pravila iz docs/medium.md)
//   node tools/medium.mjs episodes/<slug> --post         video je javan -> objavi članak na Medium
//   node tools/medium.mjs episodes/<slug> --watch        čekaj da video postane javan, pa objavi
//   node tools/medium.mjs --sweep                        jedan prolaz kroz sve epizode (Task Scheduler, nedeljno)
//   node tools/medium.mjs --login                        prijava na Medium (jednom, u Chrome prozoru alata)
//   node tools/medium.mjs --status                       da li je Chrome profil alata prijavljen na Medium
//   node tools/medium.mjs --profile                      short bio + About stranica profila
//   node tools/medium.mjs --dump <url>                   dijagnostika: šta Medium stranica nudi (selektori)
//   node tools/medium.mjs --install-task | --remove-task Task Scheduler za --sweep: ponedeljak 21:00, bez prozora
//
// Zašto kroz Chrome, a ne Medium API: Medium je prestao da izdaje integration tokene (2023), pa
// objavljivanje preko API-ja za nove naloge ne postoji. Ostaje isto što radi ruka — editor. Alat
// ga vozi kroz pravi Chrome (tools/cdp.mjs), u ISTOM profilu kao flow-images.mjs
// (%LOCALAPPDATA%\AnimatedTales\flow-chrome): prijava jednom, pamti se. Običan Chrome korisnika
// se ne može voziti preko CDP-a (Chrome 136+ ne dozvoljava debug port na podrazumevanom profilu).
//
// Kako alat zna da je video javan: javni RSS feed kanala (poslednjih 15 otpremanja). Dugi video
// se poklapa sa epizodom po naslovu (jedan od 5 iz publish.md) ili po početku description-a;
// Shortovi (link /shorts/) se preskaču. Nije potreban nikakav nalog ni API ključ.
//
// medium.md nosi dva rezervisana mesta, {{VIDEO_URL}} i {{THUMBNAIL}}: video u trenutku pisanja
// još ne postoji. Alat ih popunjava pri objavi; medium.md se ne menja, a rezultat ide u
// medium.json (video, Medium URL), pa se isti članak nikad ne objavi dvaput.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  CDP, DEFAULT_PORT, ensureChrome, ensureWindowShown, openPage, sleep, targetUrl,
} from './cdp.mjs';
import { forms, label, nameRe, parseTitles } from './publish.mjs';

// ------------------------------------------------------------------ konstante

export const CHANNEL = {
  handle: '@AnimatedTales-r4r',
  id: 'UCAd2G0YVuAuTTxGFsaYIsLw',
  url: 'https://www.youtube.com/@AnimatedTales-r4r',
  feed: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCAd2G0YVuAuTTxGFsaYIsLw',
};
export const SITE = 'https://animatedtales.mihailobuilds.com/';

/** Koliko puta --sweep sme da pokuša isti neuspeli članak pre nego što ga prepusti čoveku. */
export const MAX_ATTEMPTS = 3;

export const PH_VIDEO = '{{VIDEO_URL}}';
export const PH_THUMB = '{{THUMBNAIL}}';

export const RULES = {
  minWords: 600,
  maxWords: 1500,
  twoLinksFrom: 800, // od ove dužine članak nosi 2 linka ka videu, ispod nje 1
  maxTitle: 100,
  minTags: 3,
  maxTags: 5,
  maxTagLen: 25,
  maxScriptOverlap: 0.12, // udeo 6-reči nizova članka koji postoje u skripti
  maxDescriptionOverlap: 0.2,
  shingle: 6,
};

/**
 * Tekstovi profila. Short bio je običan tekst (Medium: do 160 znakova, bez linkova), pa kanal i
 * sajt stoje u njemu kao tekst; prave linkove nosi About stranica (Slate editor). Link je u svakom
 * pasusu na kraju, jer se u Medium-ovom editoru kucanje posle linka nastavlja u linku.
 */
export const PROFILE = {
  bio: `Animated stories from history, myth and legend, told as 2D videos. YouTube: ${CHANNEL.handle} · animatedtales.mihailobuilds.com`,
  about: [
    { text: 'Animated Tales tells stories from history, mythology and legend as 2D animated videos: one story, told start to finish, in about five minutes.' },
    {
      text: 'Every article here is the written companion of an episode. Watch the full animated version on ',
      link: { text: 'the Animated Tales YouTube channel', href: CHANNEL.url },
    },
    // Tekst linka ne sme da liči na adresu: Medium bi ga sam pretvorio u pogrešan relativni link.
    { text: 'Every story is also on a map, region by region, on ', link: { text: 'the Animated Tales website', href: SITE } },
  ],
};

// ------------------------------------------------------------------ medium.md -> blokovi

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const IMG_LINKED = /^\[!\[([^\]]*)\]\(([^)\s]+)\)\]\(([^)\s]+)\)$/;
const IMG_PLAIN = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/** Linkovi jednog redovnog teksta: [{ text, url, start, end }] (start/end u `raw`). */
export function inlineLinks(raw) {
  const out = [];
  for (const m of raw.matchAll(LINK_RE)) {
    out.push({ text: m[1], url: m[2], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** Običan tekst bez markdown oznaka. */
export function plainText(raw) {
  return raw
    .replace(LINK_RE, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1$2')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

const wordsOf = (text) => text.split(/\s+/).filter(Boolean);

/**
 * medium.md -> { meta, tags, title, blocks }.
 * blocks: { type: 'h2'|'h3'|'p'|'quote'|'ul'|'image', raw, ... } po redu iza naslova.
 */
export function parseMedium(text) {
  const src = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const meta = {};
  let body = src;
  const fm = src.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (fm) {
    body = src.slice(fm[0].length);
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (m) meta[m[1].toLowerCase()] = m[2].trim();
    }
  }
  const tags = (meta.tags ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const problems = [];
  let title = null;
  const blocks = [];
  for (const chunk of body.split(/\n{2,}/)) {
    const c = chunk.trim();
    if (!c) continue;
    let m;
    if ((m = c.match(/^# (.+)$/))) {
      if (title !== null) problems.push('više od jednog naslova (`# `)');
      else if (blocks.length) problems.push('naslov (`# `) mora da bude prvi posle front matter-a');
      title ??= m[1].trim();
    } else if ((m = c.match(/^(#{2,3}) (.+)$/))) {
      blocks.push({ type: m[1].length === 2 ? 'h2' : 'h3', raw: m[2].trim() });
    } else if ((m = c.match(IMG_LINKED))) {
      blocks.push({ type: 'image', raw: c, alt: m[1], src: m[2], href: m[3] });
    } else if ((m = c.match(IMG_PLAIN))) {
      blocks.push({ type: 'image', raw: c, alt: m[1], src: m[2], href: null });
    } else if (c.split('\n').every((l) => l.startsWith('>'))) {
      blocks.push({ type: 'quote', raw: c.split('\n').map((l) => l.replace(/^>\s?/, '')).join(' ').trim() });
    } else if (c.split('\n').every((l) => /^[-*] /.test(l))) {
      blocks.push({ type: 'ul', raw: c, items: c.split('\n').map((l) => l.replace(/^[-*] /, '').trim()) });
    } else {
      const lines = c.split('\n');
      // Oznaka bloka (naslov, citat, lista, slika) odmah ispod pasusa, bez prazne linije, ne bi
      // postala blok nego običan tekst u pasusu — to se desilo uživo sa „## Naslov“.
      const stray = lines.slice(1).find((l) => /^(#{1,3} |> |[-*] |!\[|\[!\[)/.test(l.trim()));
      if (stray) problems.push(`„${stray.trim().slice(0, 40)}…“ stoji uz prethodni red bez prazne linije — bio bi običan tekst u članku`);
      blocks.push({ type: 'p', raw: lines.map((l) => l.trim()).join(' ') });
    }
  }
  return { meta, tags, title, blocks, problems };
}

const isTextBlock = (b) => b.type !== 'image';
const blockText = (b) => (b.type === 'ul' ? b.items.map(plainText).join(' ') : plainText(b.raw));
const blockRaws = (b) => (b.type === 'ul' ? b.items : [b.raw]);

/** 6-reči nizovi teksta (mala slova, bez interpunkcije i audio tagova u zagradama). */
export function shingles(text, n = RULES.shingle) {
  const toks = text
    .replace(/\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9À-ɏ]+/)
    .filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= toks.length; i++) out.add(toks.slice(i, i + n).join(' '));
  return out;
}

/** Udeo nizova iz `a` koji postoje i u `b` (0..1). */
export function overlap(a, b, n = RULES.shingle) {
  const sa = shingles(a, n);
  if (!sa.size) return 0;
  const sb = shingles(b, n);
  let hit = 0;
  for (const s of sa) if (sb.has(s)) hit++;
  return hit / sa.size;
}

/** Iz publish.md: tekst description-a (do `Chapters:`). */
export function descriptionOf(publishText) {
  const m = String(publishText).match(/^DESCRIPTION:\s*\n([\s\S]*?)(?:\n\s*\n\s*Chapters:|\nHASHTAGS:)/m);
  return m ? m[1].trim() : '';
}

/**
 * Provera medium.md prema docs/medium.md.
 * @param {ReturnType<typeof parseMedium>} parsed
 * @param {{script?: string, publishText?: string, protagonists?: any[]}} [ctx]
 */
export function validateMedium(parsed, ctx = {}) {
  const errors = [];
  const warnings = [];
  const { title, tags, blocks } = parsed;
  errors.push(...parsed.problems);

  // --- front matter i naslov
  if (tags.length < RULES.minTags || tags.length > RULES.maxTags) {
    errors.push(`tags: ${tags.length}, treba ${RULES.minTags}–${RULES.maxTags} (front matter: "tags: A, B, C")`);
  }
  for (const t of tags) {
    if (t.length > RULES.maxTagLen) errors.push(`tag "${t}" ima ${t.length} znakova, najviše ${RULES.maxTagLen}`);
    if (t.startsWith('#')) errors.push(`tag "${t}" bez #`);
  }
  if (!title) errors.push('nema naslova (`# Naslov`)');
  else if (title.length > RULES.maxTitle) errors.push(`naslov ima ${title.length} znakova, najviše ${RULES.maxTitle}`);

  // --- thumbnail odmah ispod naslova
  const first = blocks[0];
  if (!first || first.type !== 'image') {
    errors.push(`prvo ispod naslova mora da bude thumbnail: [![opis](${PH_THUMB})](${PH_VIDEO})`);
  } else {
    if (first.src !== PH_THUMB) errors.push(`slika thumbnaila mora da bude ${PH_THUMB}, a nije: ${first.src}`);
    if (first.href !== PH_VIDEO) errors.push(`slika thumbnaila mora da vodi na ${PH_VIDEO}, a vodi na: ${first.href ?? '—'}`);
    if (first.alt.trim().length < 10) errors.push('alt tekst thumbnaila je prekratak (bar 10 znakova, opiši sliku)');
  }
  if (blocks.slice(1).some((b) => b.type === 'image')) errors.push('u članku sme samo jedna slika (thumbnail ispod naslova)');

  // --- podela na telo i podnožje
  const text = blocks.filter(isTextBlock);
  const footer = text.at(-1);
  const body = text.slice(0, -1);
  if (!footer || footer.type !== 'p') {
    errors.push('poslednji pasus mora da bude podnožje sa linkom ka kanalu i sajtu (docs/medium.md)');
  } else {
    const urls = inlineLinks(footer.raw).map((l) => l.url);
    if (!urls.includes(CHANNEL.url)) errors.push(`podnožje nema link ka kanalu ${CHANNEL.url}`);
    if (!urls.includes(SITE)) errors.push(`podnožje nema link ka sajtu ${SITE}`);
  }

  // --- dužina
  const words = body.reduce((n, b) => n + wordsOf(blockText(b)).length, 0);
  if (words < RULES.minWords) errors.push(`članak ima ${words} reči, najmanje ${RULES.minWords}`);
  if (words > RULES.maxWords) errors.push(`članak ima ${words} reči, najviše ${RULES.maxWords}`);
  const wantLinks = words >= RULES.twoLinksFrom ? 2 : 1;

  // --- linkovi ka videu
  const links = [];
  let before = 0;
  for (const b of body) {
    for (const raw of blockRaws(b)) {
      for (const l of inlineLinks(raw)) {
        if (l.url !== PH_VIDEO) continue;
        const lead = wordsOf(plainText(raw.slice(0, l.start))).length;
        links.push({ ...l, block: b, raw, pos: words ? (before + lead) / words : 0 });
      }
      before += wordsOf(plainText(raw)).length;
    }
  }
  if (links.length !== wantLinks) {
    errors.push(`linkova ka videu u tekstu: ${links.length}, treba ${wantLinks} (${words} reči: ${wantLinks === 2 ? 'od ' + RULES.twoLinksFrom + ' reči idu 2' : 'do ' + (RULES.twoLinksFrom - 1) + ' reči ide 1'}); thumbnail se ne računa`);
  }
  const lastBlocks = body.slice(-2);
  links.forEach((l, i) => {
    const after = l.raw.slice(l.end).replace(/^[*_]+/, '');
    if (!(after === '' || /^[.!?]["”’)]*(\s|$)/.test(after))) {
      errors.push(`link "${l.text}" nije na kraju rečenice ili pasusa`);
    }
    if (/^(click|here|link|this|read more|watch)$/i.test(l.text.trim()) || wordsOf(l.text).length < 3) {
      errors.push(`tekst linka "${l.text}" ne kaže šta čitalac dobija (npr. "the full 2D animated version on YouTube")`);
    }
    const para = plainText(l.raw);
    if (!/2D[- ]animated/i.test(para) || !/YouTube/i.test(para)) {
      errors.push(`pasus sa linkom "${l.text}" mora da kaže da je video "2D animated" i da je na "YouTube"`);
    }
    const last = i === links.length - 1;
    if (last && !lastBlocks.includes(l.block)) errors.push('poslednji link ka videu mora da bude u poslednjem pasusu članka (pre podnožja)');
    if (wantLinks === 2 && i === 0 && (l.pos < 0.3 || l.pos > 0.7)) {
      errors.push(`prvi link ka videu je na ${Math.round(l.pos * 100)}% teksta, treba oko sredine (30–70%)`);
    }
  });

  // --- rezervisana mesta, pravi YouTube link
  const all = blocks.map((b) => b.raw).join('\n');
  for (const m of all.matchAll(/\{\{[^}]*\}\}/g)) {
    if (m[0] !== PH_VIDEO && m[0] !== PH_THUMB) errors.push(`nepoznato rezervisano mesto ${m[0]}`);
  }
  if (/youtube\.com\/watch|youtu\.be\//i.test(all)) errors.push(`pravi YouTube link videa ne ide u medium.md, samo ${PH_VIDEO}`);

  // --- naslov i likovi
  const protagonists = ctx.protagonists ?? [];
  if (title && protagonists.length) {
    const named = protagonists.filter((p) => forms(p).some((f) => nameRe(f).test(title)));
    if (named.length && named.length < protagonists.length) {
      errors.push(`naslov imenuje samo ${named.map(label).join(', ')}; ili svi glavni likovi (${protagonists.map(label).join(', ')}) ili nijedan`);
    }
    const bodyText = body.map(blockText).join(' ');
    const missing = protagonists.filter((p) => !forms(p).some((f) => nameRe(f).test(bodyText)));
    if (missing.length) errors.push(`tekst ne pominje glavne likove: ${missing.map(label).join(', ')}`);
  }
  if (title && ctx.publishText) {
    const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    if (parseTitles(ctx.publishText).some((t) => norm(t.title) === norm(title))) {
      errors.push('naslov je isti kao jedna od YouTube opcija; članak ima svoj naslov (docs/medium.md)');
    }
  }

  // --- različit od videa
  const articleText = body.map(blockText).join('\n');
  let scriptOverlap = null;
  if (ctx.script) {
    scriptOverlap = overlap(articleText, ctx.script);
    if (scriptOverlap > RULES.maxScriptOverlap) {
      errors.push(`članak ponavlja skriptu: ${Math.round(scriptOverlap * 100)}% nizova od ${RULES.shingle} reči je iz script.md, najviše ${Math.round(RULES.maxScriptOverlap * 100)}% — ispričaj istu priču novim rečima`);
    }
  }
  let descOverlap = null;
  const desc = ctx.publishText ? descriptionOf(ctx.publishText) : '';
  if (desc) {
    descOverlap = overlap(articleText, desc);
    if (descOverlap > RULES.maxDescriptionOverlap) {
      warnings.push(`članak preuzima description sa YouTube-a: ${Math.round(descOverlap * 100)}% nizova`);
    }
  }

  return {
    errors,
    warnings,
    stats: { words, videoLinks: links.length, wantLinks, tags: tags.length, scriptOverlap, descOverlap, title },
  };
}

// ------------------------------------------------------------------ blokovi -> HTML za editor

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline markdown -> HTML (tekst se prvo escape-uje, pa se vraćaju linkovi i naglasci). */
export function inlineHtml(raw, vars = {}) {
  const sub = (s) => s.split(PH_VIDEO).join(vars.videoUrl ?? PH_VIDEO).split(PH_THUMB).join(vars.thumbUrl ?? PH_THUMB);
  const links = [];
  const stash = raw.replace(LINK_RE, (_, text, url) => {
    links.push({ text, url });
    return `\u0000${links.length - 1}\u0000`;
  });
  let html = esc(stash)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  html = html.replace(/\u0000(\d+)\u0000/g, (_, i) => {
    const l = links[+i];
    return `<a href="${esc(sub(l.url))}">${esc(l.text)}</a>`;
  });
  return html;
}

/** Telo članka (sve posle thumbnaila) kao HTML koji se lepi u editor. */
export function bodyHtml(blocks, vars = {}) {
  const out = [];
  for (const b of blocks) {
    if (b.type === 'image') continue;
    if (b.type === 'h2') out.push(`<h3>${inlineHtml(b.raw, vars)}</h3>`);
    else if (b.type === 'h3') out.push(`<h4>${inlineHtml(b.raw, vars)}</h4>`);
    else if (b.type === 'quote') out.push(`<blockquote>${inlineHtml(b.raw, vars)}</blockquote>`);
    else if (b.type === 'ul') out.push(`<ul>${b.items.map((i) => `<li>${inlineHtml(i, vars)}</li>`).join('')}</ul>`);
    else out.push(`<p>${inlineHtml(b.raw, vars)}</p>`);
  }
  return out.join('\n');
}

/** Isto što i bodyHtml, kao običan tekst (text/plain deo lepljenja). */
export function bodyText(blocks) {
  return blocks
    .filter(isTextBlock)
    .map((b) => (b.type === 'ul' ? b.items.map((i) => `- ${plainText(i)}`).join('\n') : plainText(b.raw)))
    .join('\n\n');
}

// ------------------------------------------------------------------ YouTube feed

const decodeEntities = (s) => s
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** RSS feed kanala -> [{ id, title, published, url, isShort, description }]. */
export function parseFeed(xml) {
  const out = [];
  for (const m of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const pick = (re) => (e.match(re)?.[1] ?? '');
    const url = pick(/<link rel="alternate" href="([^"]+)"/);
    out.push({
      id: pick(/<yt:videoId>([^<]+)<\/yt:videoId>/),
      title: decodeEntities(pick(/<title>([\s\S]*?)<\/title>/)).trim(),
      published: pick(/<published>([^<]+)<\/published>/),
      url,
      isShort: /\/shorts\//.test(url),
      description: decodeEntities(pick(/<media:description>([\s\S]*?)<\/media:description>/)).trim(),
    });
  }
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

/**
 * Koji dugi video iz feeda je ova epizoda: naslov jedne od 5 opcija iz publish.md, ili isti početak
 * description-a (korisnik je naslov mogao da izmeni, description retko). Shortovi se ne računaju.
 * @returns {{entry: object|null, reason?: string}}
 */
export function matchEpisode(entries, publishText) {
  const titles = new Set(parseTitles(publishText).map((t) => norm(t.title)));
  const descHead = norm(descriptionOf(publishText)).slice(0, 120);
  const hits = entries.filter((e) => {
    if (e.isShort) return false;
    if (titles.has(norm(e.title))) return true;
    return descHead.length >= 60 && norm(e.description).startsWith(descHead);
  });
  if (hits.length === 1) return { entry: hits[0] };
  if (hits.length > 1) return { entry: null, reason: `više videa se poklapa (${hits.map((h) => h.id).join(', ')}) — zadaj --video` };
  return { entry: null, reason: 'video još nije u feedu kanala (ili mu se naslov i description ne poklapaju sa publish.md)' };
}

/** `--video` može biti ID ili bilo koji YouTube link. */
export function videoIdFrom(s) {
  const m = String(s).match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})|^([A-Za-z0-9_-]{11})$/);
  return m ? (m[1] ?? m[2]) : null;
}

export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

export async function fetchFeed() {
  const res = await fetch(CHANNEL.feed, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`feed kanala: HTTP ${res.status}`);
  return parseFeed(await res.text());
}

/** Živi thumbnail videa (najveći koji postoji). Manji od 8 KB je YouTube-ov „nema slike“. */
export async function fetchThumbnail(id) {
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const url = `https://i.ytimg.com/vi/${id}/${name}.jpg`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
    if (!res?.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length >= 8000) return { url, buf, name };
  }
  throw new Error(`thumbnail videa ${id} nije dostupan na i.ytimg.com`);
}

// ------------------------------------------------------------------ epizoda: ulaz i stanje

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

const readIf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined);
const readJsonIf = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined);

/** Sve što alat zna o jednoj epizodi. */
export function loadEpisode(dir) {
  return {
    dir,
    slug: path.basename(path.resolve(dir)),
    mediumText: readIf(path.join(dir, 'medium.md')),
    script: readIf(path.join(dir, 'script.md')),
    publishText: readIf(path.join(dir, 'publish.md')),
    protagonists: readJsonIf(path.join(dir, 'episode.json'))?.protagonists,
    state: readJsonIf(path.join(dir, 'medium.json')),
  };
}

export function saveState(dir, state) {
  fs.writeFileSync(path.join(dir, 'medium.json'), `${JSON.stringify(state, null, 2)}\n`);
}

/** Provera medium.md jedne epizode — koristi je i publish.mjs. Vraća { exists, errors, warnings, stats }. */
export function checkEpisode(dir) {
  const ep = loadEpisode(dir);
  if (ep.mediumText === undefined) return { exists: false, errors: [], warnings: [], stats: null };
  const parsed = parseMedium(ep.mediumText);
  return { exists: true, ...validateMedium(parsed, ep) };
}

/** Ima li epizoda šta da objavi: medium.md postoji i još nije objavljen. */
export const isPending = (ep) => ep.mediumText !== undefined && ep.state?.status !== 'published';

// ------------------------------------------------------------------ preglednik

const MEDIUM = 'https://medium.com/';
const log = (...a) => console.log(...a);

/** Funkcije koje se izvršavaju U stranici (Runtime.evaluate) — samostalne, bez zatvaranja. */
export const inPage = {
  /** Prijavljen korisnik: nema „Sign in“ linka, stranica nije prijava. */
  loggedIn: () => {
    if (!/(^|\.)medium\.com$/.test(location.hostname)) return false;
    if (/^\/m\/(signin|callback)/.test(location.pathname)) return false;
    if (document.querySelector('a[href*="/m/signin"]')) return false;
    return document.readyState !== 'loading' && !!document.body && document.body.innerText.length > 50;
  },

  /** Centar prvog vidljivog elementa koji odgovara selektoru. */
  center: (sels) => {
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          // Skrol samo kad element nije u vidnom polju: plutajući meniji (selekcija) se skrolom gase.
          if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', inline: 'center' });
          const q = el.getBoundingClientRect();
          return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2), sel };
        }
      }
    }
    return null;
  },

  /** Centar vidljivog dugmeta/linka čiji tekst odgovara regularnom izrazu. */
  centerByText: (source, flags, scopeSel) => {
    const re = new RegExp(source, flags);
    const scope = scopeSel ? document.querySelector(scopeSel) ?? document : document;
    const nodes = [...scope.querySelectorAll('button,[role="button"],a,[role="menuitem"],[role="option"],li,span')];
    for (const el of nodes) {
      const t = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
      if (!t || t.length > 60 || !re.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', inline: 'center' });
        const q = el.getBoundingClientRect();
        return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2), text: t };
      }
    }
    return null;
  },

  /** Lepljenje HTML-a u editor kod kursora (isti put kao Ctrl+V). */
  pasteHtml: (html, text) => {
    const sel = getSelection();
    const node = sel && sel.anchorNode;
    const el = node && (node.nodeType === 1 ? node : node.parentElement);
    const target = (el && el.closest('[contenteditable="true"]')) || document.activeElement;
    if (!target) return false;
    const dt = new DataTransfer();
    dt.setData('text/html', html);
    dt.setData('text/plain', text);
    target.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    return true;
  },

  /** Lepljenje slike kao fajla (kao snimak ekrana iz clipboard-a). */
  pasteFile: (b64, mime, name) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], name, { type: mime });
    const sel = getSelection();
    const node = sel && sel.anchorNode;
    const el = node && (node.nodeType === 1 ? node : node.parentElement);
    const target = (el && el.closest('[contenteditable="true"]')) || document.activeElement;
    if (!target) return false;
    const dt = new DataTransfer();
    dt.items.add(file);
    target.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    return true;
  },

  /** Stanje editora: šta je zaista u njemu. */
  editorState: () => {
    // Medium vodi linkove kroz medium.com/r/?url=<kodirano>; poredi se raspakovan oblik.
    const dec = (h) => { try { return decodeURIComponent(h); } catch { return h; } };
    const title = document.querySelector('h3[data-testid="editorTitleParagraph"], h3.graf--title, h3.graf--leading');
    const figs = [...document.querySelectorAll('figure')].map((f) => ({
      img: (f.querySelector('img') || {}).src || null,
      links: [...f.querySelectorAll('a[href]')].map((a) => dec(a.href)),
      caption: (f.querySelector('figcaption') || {}).innerText || '',
    }));
    const root = (title && title.closest('[contenteditable="true"]')) || document.querySelector('[contenteditable="true"]');
    const links = root ? [...root.querySelectorAll('a[href]')].map((a) => ({ href: dec(a.href), text: a.innerText })) : [];
    const headings = root ? [...root.querySelectorAll('h3,h4')].map((h) => h.innerText).filter(Boolean) : [];
    // Markdown koji je procureo u običan tekst (npr. „## Naslov“ u pasusu): nikad se ne objavljuje.
    const leaks = root ? [...root.querySelectorAll('p')].map((p) => p.innerText).filter((t) => /(^|\s)#{1,3}\s|\]\(|\*\*|\{\{/.test(t)).map((t) => t.slice(0, 60)) : [];
    const paras = root ? [...root.querySelectorAll('p')].filter((p) => !p.querySelector('.defaultValue')).map((p) => p.innerText).filter(Boolean) : [];
    return {
      title: title ? (title.querySelector('.defaultValue') ? '' : title.innerText.replace(/ /g, ' ').trim()) : null,
      figures: figs,
      links,
      headings,
      leaks,
      paragraphs: paras.length,
      words: paras.join(' ').split(/\s+/).filter(Boolean).length,
      url: location.href,
    };
  },

  /** Gde je kursor: u naslovu, u opisu slike ili u običnom pasusu. */
  caretIn: () => {
    const sel = getSelection();
    const node = sel && sel.anchorNode;
    const el = node && (node.nodeType === 1 ? node : node.parentElement);
    if (!el) return null;
    if (el.closest('figcaption')) return 'caption';
    if (el.closest('h3.graf--title, [data-testid="editorTitleParagraph"]')) return 'title';
    if (el.closest('figure')) return 'figure';
    if (el.closest('[contenteditable="true"]')) return 'body';
    return 'outside';
  },

  /** Selektuje ceo sadržaj elementa (za Ctrl+K nad opisom slike). */
  selectAllIn: (sels) => {
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
        return true;
      }
    }
    return false;
  },

  /** Polje za unos (INPUT/TEXTAREA) koje trenutno ima fokus, van editora članka. */
  focusedField: () => {
    const a = document.activeElement;
    return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
  },

  /** Dijagnostika: sve što se na stranici može kliknuti ili uneti. */
  dump: () => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const desc = (el) => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      testid: el.getAttribute('data-testid') || undefined,
      role: el.getAttribute('role') || undefined,
      aria: el.getAttribute('aria-label') || undefined,
      placeholder: el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || undefined,
      type: el.getAttribute('type') || undefined,
      href: el.getAttribute('href') || undefined,
      text: (el.innerText || el.value || '').trim().slice(0, 60) || undefined,
      cls: (el.getAttribute('class') || '').slice(0, 60) || undefined,
    });
    const pick = (sel) => [...document.querySelectorAll(sel)].filter(vis).map(desc);
    return {
      url: location.href,
      title: document.title,
      buttons: pick('button,[role="button"]'),
      links: pick('a[href]').slice(0, 60),
      inputs: pick('input,textarea,select'),
      editable: pick('[contenteditable="true"],[contenteditable=""]'),
      testids: [...new Set([...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')))],
      dialogs: pick('[role="dialog"],[aria-modal="true"]'),
    };
  },
};

/** Sesija sa Medium-om u Chrome-u alata. */
export class MediumSession {
  /**
   * @param {{port?: number, shotDir?: string}} [opts]
   */
  constructor({ port = DEFAULT_PORT, shotDir = null } = {}) {
    this.port = port;
    this.shotDir = shotDir;
    this.n = 0;
  }

  /**
   * Sopstveni tab: alat ne preuzima tuđe medium.com tabove (nesačuvan editor bi ga blokirao).
   * `beforeunload` ide automatski „Leave“ — Medium sam čuva nacrt, pa se ništa ne gubi.
   */
  async open() {
    const { wsUrl, launched } = await ensureChrome({ port: this.port, startUrl: 'about:blank' });
    this.cdp = await CDP.connect(wsUrl);
    this.page = await openPage(this.cdp, { newUrl: 'about:blank' });
    await this.page.send('Page.enable').catch(() => {});
    this.cdp.on('Page.javascriptDialogOpening', () => {
      this.page.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    }, this.page.sessionId);
    if (await ensureWindowShown(this.cdp, this.page.targetId).catch(() => false)) {
      log('Chrome prozor je bio minimizovan — vraćen.');
    }
    if (launched) log('Pokrenut Chrome profil alata (prijava u Medium važi odavde).');
    return this;
  }

  /** Zatvara tab alata; kad je `keep`, ostaje otvoren da se vidi gde je stalo. */
  async close({ keep = false } = {}) {
    if (!keep) await this.cdp?.send('Target.closeTarget', { targetId: this.page.targetId }).catch(() => {});
    this.cdp?.close();
  }

  async shot(name) {
    if (!this.shotDir) return;
    this.n += 1;
    const file = path.join(this.shotDir, `${String(this.n).padStart(2, '0')}-${name}.png`);
    await this.page.screenshot(file).catch(() => {});
  }

  /** Prijavljen? Ako nije, `wait` ms čeka ljudsku prijavu u Chrome prozoru. */
  async ensureLoggedIn({ wait = 0 } = {}) {
    const { page } = this;
    const deadline = Date.now() + wait;
    let told = false;
    for (;;) {
      const url = await targetUrl(this.cdp, page.targetId).catch(() => '');
      // Dok je tab na Google prijavi stranica se ne dira — samo se čita URL.
      if (!/accounts\.google\.com/.test(url)) {
        if (!/^https:\/\/medium\.com\//.test(url)) await page.navigate(`${MEDIUM}me/stories/drafts`);
        const ok = await page.evaluate(inPage.loggedIn).catch(() => false);
        if (ok) return true;
      }
      if (Date.now() >= deadline) return false;
      if (!told) {
        told = true;
        await page.navigate(`${MEDIUM}m/signin`).catch(() => {});
        await page.bringToFront().catch(() => {});
        log('Medium nije prijavljen u ovom Chrome profilu.');
        log('  U Chrome prozoru koji je otvoren prijavi se na Medium (npr. „Sign in with Google“).');
        log(`  Čekam do ${Math.round(wait / 60000)} min; posle prijave alat nastavlja sam i prijava ostaje zapamćena.`);
      }
      await sleep(2000);
    }
  }

  async clickAt(pt, what) {
    if (!pt) throw new Error(`ne nalazim: ${what}`);
    await this.page.click(pt.x, pt.y);
  }

  async clickSel(sels, what, { timeout = 15_000 } = {}) {
    const pt = await this.page.waitFor(inPage.center, { args: [sels], timeout, what });
    await this.clickAt(pt, what);
    return pt;
  }

  async clickText(source, what, { flags = 'i', timeout = 15_000, scope = null } = {}) {
    const pt = await this.page.waitFor(inPage.centerByText, { args: [source, flags, scope], timeout, what });
    await this.clickAt(pt, what);
    return pt;
  }

  async state() {
    return this.page.evaluate(inPage.editorState);
  }

  /** Šta Medium nudi na stranici — za podešavanje selektora. */
  async dump(url, outFile) {
    if (url) await this.page.navigate(url);
    await sleep(2500);
    const d = await this.page.evaluate(inPage.dump);
    if (outFile) {
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, JSON.stringify(d, null, 2));
    }
    return d;
  }
}

/**
 * Tekst kao pravi pritisci tastera. Medium-ov editor uklanja svoj placeholder tek na keydown;
 * `Input.insertText` bi tekst upisao u sam placeholder (span.defaultValue) i editor ga ne bi
 * smatrao sadržajem. Zato se kratki tekstovi (naslov, opis slike, teme) kucaju, a samo
 * dugačko telo članka ide kao paste.
 */
export async function typeText(page, text) {
  // Bez windowsVirtualKeyCode: kod izveden iz znaka bi za '.' bio 46 = taster Delete.
  for (const ch of text) {
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
  }
}

/** Opis ispod thumbnaila; nosi link ka videu. */
export const CAPTION = 'Watch the full 2D animated story on YouTube';

const TITLE_SELS = ['h3[data-testid="editorTitleParagraph"]', 'h3.graf--title', 'h3.graf--leading', '[contenteditable="true"] h3'];
const FIG_IMG = 'figure img';

/**
 * Napiše članak u editor i (osim u `draft` režimu) objavi ga.
 * @param {MediumSession} m
 * @param {{title: string, tags: string[], blocks: object[], videoUrl: string, thumb: {buf: Buffer, name: string}, draft?: boolean, publishWait?: number, draftUrl?: string, onDraft?: (url: string) => void, update?: boolean, updateUrl?: string}} a
 * @returns {Promise<{status: 'published'|'draft', url: string}>}
 */
export async function writeArticle(m, a) {
  const { page } = m;
  const vars = { videoUrl: a.videoUrl, thumbUrl: a.videoUrl };

  // 1. nov članak, ili nacrt iz prethodnog (neuspelog) pokušaja — očišćen, da nacrti ne rastu
  await page.navigate(a.draftUrl || `${MEDIUM}new-story`);
  await page.waitFor(() => !!document.querySelector('[contenteditable="true"]'), { timeout: 45_000, what: 'Medium editor' });
  await sleep(1200);
  if (/\/m\/signin/.test(await page.url())) throw new Error('Medium nije prijavljen — pokreni: node tools/medium.mjs --login');
  if (a.draftUrl) await clearEditor(m);
  await m.shot('editor');

  // 2. naslov
  await dismissTips(m);
  await m.clickSel(TITLE_SELS, 'polje za naslov');
  await typeText(page, a.title);
  await sleep(300);
  // Nacrt dobija adresu /p/<id>/edit tek posle autosnimanja; beleži se pre provere naslova, da
  // neuspeo pokušaj ne ostavi siroče nacrt koji sledeći pokušaj ne zna da nađe.
  await page.waitFor(() => /\/p\/[0-9a-f]+\/edit/.test(location.href), { timeout: 8000, what: 'adresa nacrta' }).catch(() => false);
  let st = await m.state();
  if (/\/p\/[0-9a-f]+\/edit/.test(st.url)) a.onDraft?.(st.url);
  // Medium pretvara ' u ’ i " u “ ”, pa se naslov poredi bez razlike u tipografskim navodnicima.
  if (norm(st.title) !== norm(a.title)) throw new Error(`naslov nije upisan kako treba: „${st.title}“`);
  await page.press('Enter');
  await sleep(500);

  // 3. thumbnail kao slika (otpremanje u Medium), pa link ka videu
  await uploadThumbnail(m, a.thumb);
  await dismissTips(m);
  await captionLink(m, a.videoUrl);
  await m.shot('thumbnail');

  // 4. telo članka
  const placed = await page.evaluate(inPage.pasteHtml, bodyHtml(a.blocks, vars), bodyText(a.blocks));
  if (!placed) throw new Error('ne mogu da nalepim telo članka (nema kursora u editoru)');
  await sleep(2500);
  await m.shot('telo');

  // 5. provera: šta je zaista u editoru
  st = await m.state();
  const want = a.blocks.filter((b) => b.type === 'h2' || b.type === 'h3').length;
  const videoLinks = st.links.filter((l) => l.href.includes(a.videoUrl.split('v=')[1])).length;
  const problems = [];
  if (norm(st.title) !== norm(a.title)) problems.push(`naslov „${st.title}“`);
  if (!st.figures.some((f) => f.img)) problems.push('nema thumbnaila');
  if (st.headings.length < want) problems.push(`podnaslova ${st.headings.length} od ${want}`);
  if (videoLinks < 1) problems.push('nijedan link ka videu u tekstu');
  if (st.leaks.length) problems.push(`markdown je procureo u tekst: „${st.leaks[0]}…“`);
  const expectedWords = a.blocks.filter((b) => b.type !== 'image').reduce((n, b) => n + wordsOf(blockText(b)).length, 0);
  if (st.words < expectedWords * 0.9) problems.push(`reči u editoru ${st.words} od ${expectedWords}`);
  if (problems.length) throw new Error(`editor ne sadrži ceo članak: ${problems.join('; ')}`);
  log(`  editor: ${st.words} reči, ${st.headings.length} podnaslova, ${videoLinks} link(a) ka videu, opis thumbnaila ${st.figures[0].links.length ? 'sa linkom' : 'BEZ linka'}`);
  const draftUrl = st.url;

  if (a.draft) return { status: 'draft', url: draftUrl };

  // Već objavljena priča (--force): isti editor, ali umesto Publish stoji „Save and publish“;
  // adresa i teme ostaju kakve jesu.
  if (a.update) {
    await m.clickText('^save and publish$', 'Save and publish');
    await page.waitFor(() => !/\/edit/.test(location.href), { timeout: 60_000, what: 'čuvanje izmena objavljene priče' });
    await m.shot('azurirano');
    return { status: 'published', url: a.updateUrl };
  }

  // 6. objava: Publish (zaglavlje editora) -> stranica /submission -> teme -> Publish
  await m.clickText('^publish$', 'Publish (zaglavlje editora)');
  // Polja za teme nema kad nacrt već ima pet tema, pa se čeka na samu stranicu, ne na polje.
  await page.waitFor(() => /\/submission/.test(location.href) && /Story preview/.test(document.body.innerText),
    { timeout: 30_000, what: 'stranica za objavu (Story preview)' });
  await sleep(1200);
  await m.shot('publish-dijalog');
  await addTags(m, a.tags);
  await m.shot('teme');
  await m.clickText('^publish$', 'Publish (završno dugme)');
  const url = await waitPublished(m, a.title, a.publishWait ?? 90_000);
  await m.shot('objavljeno');
  return { status: 'published', url };
}

/**
 * Medium-ova donja „fioka“ sa savetima za pisanje („Select text to change formatting…“) zauzima
 * donju trećinu prozora i oduzima fokus editoru: klik na opis slike i trostruki klik za link tada
 * završe u fioci. Zatvara se njenim dugmetom (`toggle-drawer`) kad je na ekranu.
 */
async function dismissTips(m) {
  const { page } = m;
  const at = await page.evaluate(() => {
    const b = document.querySelector('.drawer [data-action="toggle-drawer"]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    if (!r.width || !r.height || r.top < 0 || r.top > window.innerHeight - 20) return null;
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  if (!at) return false;
  await page.click(at.x, at.y);
  await sleep(700);
  return true;
}

/** Čisti editor nacrta: Ctrl+A, Delete, dok ne ostane samo placeholder. */
async function clearEditor(m) {
  const { page } = m;
  for (let i = 0; i < 3; i++) {
    const st = await m.state();
    if (!st.title && !st.figures.length && !st.words) return;
    await m.clickSel(TITLE_SELS, 'polje za naslov');
    await page.press('a', ['Control'], ['selectAll']);
    await page.press('Delete');
    await sleep(700);
  }
  const st = await m.state();
  if (st.title || st.figures.length || st.words) throw new Error('ne mogu da očistim nacrt iz prethodnog pokušaja — obriši ga u Medium → Stories → Drafts');
}

async function uploadThumbnail(m, thumb) {
  const { page } = m;
  const before = (await m.state()).figures.length;
  // Prvi put: slika kao fajl iz clipboard-a (isto što Ctrl+V snimka ekrana).
  await page.evaluate(inPage.pasteFile, thumb.buf.toString('base64'), 'image/jpeg', 'thumbnail.jpg');
  const ok = await page.waitFor(
    (n) => document.querySelectorAll('figure img').length > n,
    { args: [before], timeout: 25_000, what: 'slika u editoru' },
  ).catch(() => null);
  if (!ok) throw new Error('thumbnail nije ušao u editor (paste slike nije prošao) — pokreni --dump nad editorom i podesi uploadThumbnail');
  // Čeka se da se otpremanje završi: src je Medium CDN, ne blob/data.
  await page.waitFor(
    () => { const i = document.querySelector('figure img'); return !!i && /^https:\/\/(miro|cdn-images-1)\.medium\.com\//.test(i.src); },
    { timeout: 60_000, what: 'otpremanje thumbnaila na Medium' },
  ).catch(() => { log('  upozorenje: src slike još nije Medium CDN (otpremanje traje ili je drugačiji domen)'); });
  await sleep(800);
}

/**
 * Medium-ov editor ne ume link na samoj slici (lepljenje `<a><img>` odbacuje link, a meni slike
 * ima samo raspored i alt tekst), ali opis ispod slike nosi link. Opis je odmah ispod thumbnaila,
 * pa slika i link čitaocu izgledaju kao jedna celina. Redosled je proban uživo: klik u opis,
 * kucanje, prava selekcija (trostruki klik — JS selekcija ne okida Medium-ov meni), dugme link
 * u highlightMenu-u, polje „Paste a link…“, Enter.
 */
async function captionLink(m, videoUrl) {
  const { page } = m;
  await m.clickSel(['figcaption'], 'opis slike');
  await sleep(300);
  await typeText(page, CAPTION);
  await sleep(300);
  const cap = await page.evaluate(inPage.center, ['figcaption']);
  await page.click(cap.x, cap.y, { clickCount: 3 });
  const sel = '.highlightMenu--active button[data-action="link"]';
  await page.waitFor((q) => !!document.querySelector(q), { args: [sel], timeout: 8000, what: 'Medium-ov meni za link' });
  await m.clickSel([sel], 'dugme link');
  await page.waitFor(inPage.focusedField, { timeout: 8000, what: 'polje „Paste a link…“' });
  await page.insertText(videoUrl);
  await page.press('Enter');
  await sleep(900);
  const id = videoUrl.split('v=')[1];
  const st = await m.state();
  if (!st.figures[0]?.links.some((h) => h.includes(id))) {
    throw new Error('link ka videu ispod thumbnaila nije postavljen — pokreni --dump nad editorom i podesi captionLink');
  }
  // Kursor u prazan pasus ispod slike: tu ide telo članka.
  const pt = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.section-inner > p')].pop();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + 30), y: Math.round(r.top + r.height / 2) };
  });
  if (!pt) throw new Error('nema praznog pasusa ispod slike');
  await page.click(pt.x, pt.y);
  await sleep(400);
  const where = await page.evaluate(inPage.caretIn);
  if (where !== 'body') throw new Error(`kursor posle linka nije u pasusu ispod slike (${where})`);
}

/** Teme koje stranica za objavu već prikazuje kao čipove (linije između „Topics“ i „Publication“). */
const shownTopics = () => {
  const lines = document.body.innerText.split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean);
  const a = lines.indexOf('Topics');
  const b = lines.indexOf('Publication');
  if (a < 0 || b < 0) return [];
  return lines.slice(a + 1, b).filter((l) => !/^add up to|^add (more )?topics?/i.test(l)).map((l) => l.toLowerCase());
};

/**
 * Teme: polje „Add a topic…“ (input, role=combobox); tema + Enter pravi čip. Kad ima pet čipova
 * polje nestaje, pa se u njega klikće tek pre sledeće teme. Već dodate teme (nacrt pamti) se preskaču.
 */
async function addTags(m, tags) {
  const { page } = m;
  const sel = 'input[role="combobox"]';
  const have = await page.evaluate(shownTopics);
  const todo = tags.filter((t) => !have.includes(t.toLowerCase()));
  for (const tag of todo) {
    await m.clickSel([sel], `polje za teme (${tag})`, { timeout: 15_000 });
    await typeText(page, tag);
    await sleep(900); // predlozi stižu sa servera; Enter bira označeni ili upisani tekst
    await page.press('Enter');
    await sleep(700);
  }
  const now = await page.evaluate(shownTopics);
  const missing = tags.filter((t) => !now.includes(t.toLowerCase()));
  if (missing.length) throw new Error(`teme nisu dodate: ${missing.join(', ')} (stranica prikazuje: ${now.join(', ')})`);
}

async function waitPublished(m, title, timeout) {
  const { page } = m;
  // Posle objave Medium vodi na stranicu priče (…/<slug>-<id>) ili prikaže „Your story is published“.
  const done = await page.waitFor(() => {
    const u = location.href;
    if (/\/p\/[0-9a-f]+\/edit/.test(u)) return null;
    if (/medium\.com\/(@[^/]+|[^/]+)\/[^/]+-[0-9a-f]{8,}/.test(u) || /medium\.com\/p\/[0-9a-f]{8,}(\?|$)/.test(u)) return u;
    const txt = document.body ? document.body.innerText : '';
    return /your story is published|story is published|published!/i.test(txt) ? u : null;
  }, { timeout, what: 'objava članka' }).catch(() => null);
  if (!done) throw new Error('nisam potvrdio objavu — proveri Medium → Stories → Drafts / Published');
  // Prava adresa objavljene priče: sa stranice „Published“ po naslovu.
  const pub = await findPublished(m, title).catch(() => null);
  return (pub ?? done).split('?')[0];
}

async function findPublished(m, title) {
  await m.page.navigate(`${MEDIUM}me/stories/public`);
  await sleep(2500);
  return m.page.evaluate((t) => {
    for (const a of document.querySelectorAll('a[href]')) {
      if ((a.innerText || '').trim().startsWith(t.slice(0, 40)) && /medium\.com\/.+-[0-9a-f]{8,}/.test(a.href)) return a.href.split('?')[0];
    }
    return null;
  }, title);
}

/** Short bio (Settings -> Profile information) i About stranica profila. */
export async function writeProfile(m) {
  const { page } = m;

  // 1. short bio: modal „Profile information“ ima jedini textarea na stranici
  await page.navigate(`${MEDIUM}me/settings`);
  await sleep(2500);
  const handle = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href^="/@"]')].find((x) => /^\/@[^/?]+/.test(x.getAttribute('href')));
    return a ? a.getAttribute('href').split('?')[0] : null;
  });
  if (!handle) throw new Error('ne nalazim adresu profila (/@korisnik) na stranici podešavanja');
  await m.clickText('profile information', 'Profile information');
  // prvi textarea na stranici je skriveni g-recaptcha-response
  await m.clickSel(['textarea:not(.g-recaptcha-response)'], 'polje Short bio', { timeout: 15_000 });
  await page.press('a', ['Control'], ['selectAll']);
  await page.press('Delete');
  await typeText(page, PROFILE.bio);
  await sleep(300);
  const typed = await page.evaluate(() => document.activeElement.value);
  if (typed !== PROFILE.bio) throw new Error(`short bio nije upisan kako treba: „${typed}“`);
  await m.shot('bio');
  await m.clickText('^save$', 'Save (short bio)');
  const closed = await page.waitFor(() => !document.querySelector('textarea:not(.g-recaptcha-response)'), { timeout: 6000, what: 'zatvaranje prozora' }).catch(() => false);
  if (!closed) {
    // Save je neaktivan kad se tekst ne razlikuje od sačuvanog: bio je već postavljen.
    await m.clickText('^cancel$', 'Cancel (short bio je već postavljen)');
    await page.waitFor(() => !document.querySelector('textarea:not(.g-recaptcha-response)'), { timeout: 10_000, what: 'zatvaranje prozora Profile information' });
  }
  log(`  short bio (${PROFILE.bio.length}/160)${closed ? '' : ' — već je bio postavljen'}: ${PROFILE.bio}`);

  // 2. About stranica: pasusi, link na kraju svakog koji ga ima
  await page.navigate(`${MEDIUM}${handle.slice(1)}/about`);
  await sleep(2500);
  const start = await page.evaluate(inPage.centerByText, '^(get started|edit)$', 'i', null);
  if (start) await page.click(start.x, start.y);
  const ed = await page.waitFor(inPage.center, { args: [['[data-slate-editor="true"]']], timeout: 20_000, what: 'editor About stranice' });
  await page.click(ed.x, ed.y);
  await sleep(300);
  await page.press('a', ['Control'], ['selectAll']);
  await page.press('Delete');
  await sleep(300);
  for (const [i, para] of PROFILE.about.entries()) {
    if (i) { await page.press('Enter'); await sleep(200); }
    await page.insertText(para.text);
    if (!para.link) continue;
    await page.insertText(para.link.text);
    await sleep(200);
    for (let k = 0; k < para.link.text.length; k++) await page.press('ArrowLeft', ['Shift']);
    await sleep(700);
    await m.clickSel(['button[aria-label^="Link"]'], 'Link (⌘K)'); // ne po tekstu: tooltip „Link (⌘K)“ ima isti tekst
    await page.waitFor(inPage.focusedField, { timeout: 8000, what: 'polje „Type a link…“' });
    await page.insertText(para.link.href);
    await page.press('Enter');
    await sleep(700);
    await page.evaluate(() => document.querySelector('[data-slate-editor="true"]').focus());
    await page.press('End', ['Control']);
  }
  await m.shot('about');
  const res = await page.evaluate(() => {
    const r = document.querySelector('[data-slate-editor="true"]');
    return { paragraphs: r.querySelectorAll('p').length, links: [...r.querySelectorAll('a')].map((a) => a.href.split('?')[0]) };
  });
  const wantLinks = PROFILE.about.filter((p) => p.link).map((p) => p.link.href);
  if (res.paragraphs < PROFILE.about.length || wantLinks.some((u) => !res.links.includes(u))) {
    throw new Error(`About stranica nije kako treba: ${JSON.stringify(res)}`);
  }
  await m.clickText('^save$', 'Save (About)');
  await sleep(2500);
  log(`  About stranica: ${res.paragraphs} pasusa, linkovi: ${res.links.join(', ')}`);
}

// ------------------------------------------------------------------ CLI

const USAGE = `upotreba:
  node tools/medium.mjs episodes/<slug> --check           provera medium.md
  node tools/medium.mjs episodes/<slug> --post [--video ID|URL] [--draft] [--force]
  node tools/medium.mjs episodes/<slug> --watch [--every 10]   (minuta)
  node tools/medium.mjs --sweep [--draft]                 svi neobjavljeni, jedan prolaz
  node tools/medium.mjs --login | --status | --profile
  node tools/medium.mjs --dump <url>                      dijagnostika stranice
  node tools/medium.mjs --install-task | --remove-task

  --draft   napiše članak u Medium editor i staje pre „Publish“
  --force   već objavljen članak: prepiši mu sadržaj iz medium.md (Save and publish)
  --port N  port Chrome-a alata (podrazumevano ${DEFAULT_PORT})`;

export function parseArgs(argv) {
  const out = { dir: null, action: null, draft: false, force: false, every: 10, video: null, port: DEFAULT_PORT, url: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--check': case '--post': case '--watch': case '--sweep': case '--login': case '--profile':
      case '--status': case '--install-task': case '--remove-task':
        out.action = a.slice(2); break;
      case '--dump': out.action = 'dump'; out.url = argv[++i] ?? null; break;
      case '--draft': out.draft = true; break;
      case '--force': out.force = true; break;
      case '--video': out.video = argv[++i]; break;
      case '--every': out.every = Number(argv[++i]); break;
      case '--port': out.port = Number(argv[++i]); break;
      case '-h': case '--help': out.action = 'help'; break;
      default:
        if (a.startsWith('--')) throw new Error(`nepoznata opcija ${a}\n\n${USAGE}`);
        out.dir ??= a;
    }
  }
  if (!out.action && out.dir) out.action = 'check';
  return out;
}

function printCheck(ep, res) {
  log(`medium.md · ${ep.slug}`);
  if (!res.exists) {
    log('  nema medium.md — napiši ga po docs/medium.md (uz publish komplet)');
    return false;
  }
  const s = res.stats;
  log(`  „${s.title ?? '—'}“`);
  log(`  ${s.words} reči · ${s.videoLinks}/${s.wantLinks} link(a) ka videu · ${s.tags} tagova`
    + (s.scriptOverlap != null ? ` · ${Math.round(s.scriptOverlap * 100)}% preklapanja sa skriptom` : ''));
  for (const w of res.warnings) log(`  upozorenje ${w}`);
  for (const e of res.errors) log(`  GREŠKA ${e}`);
  if (!res.errors.length) log('  prolazi pravila iz docs/medium.md');
  return !res.errors.length;
}

/** Epizoda -> video iz feeda (ili zadat) -> članak na Medium. */
async function postEpisode(args, ep, feed) {
  const res = checkEpisode(ep.dir);
  if (!printCheck(ep, res)) return 1;

  if (ep.state?.status === 'published' && !args.force) {
    log(`  već objavljeno: ${ep.state.medium_url} (--force prepisuje sadržaj objavljenog članka)`);
    return 0;
  }
  if (ep.state?.status === 'publishing' && !args.force) {
    log('  prethodni pokušaj je stao usred objave (medium.json: publishing). Proveri Medium → Stories → Published,');
    log('  pa ili upiši medium_url i status "published" u medium.json, ili ponovi sa --force.');
    return 1;
  }
  // --sweep se zove nedeljno: neuspeo članak se ne pokušava u nedogled (nacrt se reciklira, ali
  // pokušaji se ipak ne gomilaju). Posle MAX_ATTEMPTS prolaza (to je tri nedelje) ostaje ručno:
  // --post --force.
  const attemptsSoFar = ep.state?.status === 'failed' ? (ep.state.attempts ?? 1) : 0;
  if (attemptsSoFar >= MAX_ATTEMPTS && !args.force) {
    log(`  ${attemptsSoFar} neuspela pokušaja (medium.json: ${ep.state.error}). Ispravi uzrok pa ručno: node tools/medium.mjs episodes/${ep.slug} --post --force`);
    return 1;
  }

  let id = args.video ? videoIdFrom(args.video) : (ep.state?.video_id ?? null);
  if (args.video && !id) throw new Error(`--video: ne prepoznajem YouTube video u "${args.video}"`);
  if (!id) {
    const hit = matchEpisode(feed ?? await fetchFeed(), ep.publishText ?? '');
    if (!hit.entry) {
      log(`  ${hit.reason}`);
      return 3; // još nije javan: za --watch i --sweep to nije greška
    }
    id = hit.entry.id;
    log(`  video u feedu: ${id} · ${hit.entry.title}`);
  }

  const parsed = parseMedium(ep.mediumText);
  const videoUrl = watchUrl(id);
  const thumb = await fetchThumbnail(id);
  log(`  thumbnail: ${thumb.name} (${Math.round(thumb.buf.length / 1024)} KB)`);

  const shotDir = path.join(ep.dir, 'medium');
  fs.mkdirSync(shotDir, { recursive: true });
  const m = await new MediumSession({ port: args.port, shotDir }).open();
  let keep = false;
  try {
    if (!(await m.ensureLoggedIn())) {
      log('  Medium nije prijavljen u Chrome profilu alata. Pokreni: node tools/medium.mjs --login');
      return 4;
    }
    // Već objavljen članak + --force = izmena sadržaja (Save and publish), ne nova objava.
    const published = ep.state?.status === 'published' ? ep.state : null;
    const update = Boolean(published) && args.force;
    const hexId = published?.medium_url?.match(/-([0-9a-f]{8,})(?:\?|$)/)?.[1];
    let draftUrl = ep.state?.draft_url ?? (update && hexId ? `${MEDIUM}p/${hexId}/edit` : null);
    const base = () => ({
      video_id: id,
      video_url: videoUrl,
      ...(draftUrl ? { draft_url: draftUrl } : {}),
      ...(published ? { medium_url: published.medium_url, published_at: published.published_at } : {}),
    });
    // Tokom izmene status ostaje „published“: --sweep nikad ne sme da objavi isti članak ispočetka.
    const during = () => ({ ...base(), status: update ? 'published' : args.draft ? 'drafting' : 'publishing', ...(update ? { updating: true } : {}) });
    saveState(ep.dir, { ...during(), started_at: new Date().toISOString() });
    let r;
    try {
      r = await writeArticle(m, {
        title: parsed.title, tags: parsed.tags, blocks: parsed.blocks, videoUrl, thumb, draft: args.draft, draftUrl,
        update, updateUrl: published?.medium_url,
        onDraft: (u) => { draftUrl = u; saveState(ep.dir, during()); },
      });
    } catch (err) {
      await m.shot('greska');
      keep = true; // tab ostaje otvoren: vidi se gde je stalo
      saveState(ep.dir, update
        ? { ...base(), status: 'published', update_error: err.message, at: new Date().toISOString() }
        : { ...base(), status: 'failed', error: err.message, attempts: attemptsSoFar + 1, at: new Date().toISOString() });
      throw err;
    }
    saveState(ep.dir, {
      ...base(),
      status: r.status,
      medium_url: r.url,
      [r.status === 'published' ? (update ? 'updated_at' : 'published_at') : 'drafted_at']: new Date().toISOString(),
    });
    log(r.status === 'published' ? `  ${update ? 'izmenjeno' : 'objavljeno'}: ${r.url}` : `  nacrt u Medium-u (nije objavljen): ${r.url}`);
    return 0;
  } finally {
    await m.close({ keep });
  }
}

// ------------------------------------------------------------------ zadatak za Task Scheduler

export const TASK_NAME = 'AnimatedTales Medium Sweep';

/** Log veći od ovoga pokretač kopira u `<log>.1` pre sledećeg prolaza. */
export const SWEEP_LOG_MAX_BYTES = 200 * 1024;

const pad = (n) => String(n).padStart(2, '0');

/** Lokalno vreme za log: `2026-11-23 21:00:02`. */
export function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Prvi ponedeljak u 21:00 strogo posle `now`, kao `YYYY-MM-DDT21:00:00` (StartBoundary zadatka). */
export function nextMonday2100(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0);
  let ahead = (1 - d.getDay() + 7) % 7; // dana do ponedeljka; 0 = danas
  if (ahead === 0 && d <= now) ahead = 7;
  d.setDate(d.getDate() + ahead);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00:00`;
}

/** Komanda koju zadatak izvršava (isti oblik kao dosad; spoljni navodnici su za `cmd /c`). */
export const sweepCommand = ({ node, script, log: logPath }) => `cmd /c ""${node}" "${script}" --sweep >> "${logPath}" 2>&1"`;

/**
 * Mali VBScript koji pokreće `sweepCommand` sa skrivenim prozorom (stil 0), čeka ga i vraća njegov
 * izlazni kod. Rotacija loga ide ovde, pre `cmd`-a, jer `cmd` drži log otvoren pa ga Node ne
 * može preimenovati.
 */
export function launcherVbs({ node, script, log: logPath, maxBytes = SWEEP_LOG_MAX_BYTES }) {
  const q = (s) => s.replaceAll('"', '""');
  return [
    "' Generisano: node tools/medium.mjs --install-task. Pokreće --sweep bez prozora.",
    'Set sh = CreateObject("WScript.Shell")',
    'Set fso = CreateObject("Scripting.FileSystemObject")',
    `logFile = "${q(logPath)}"`,
    'If fso.FileExists(logFile) Then',
    `  If fso.GetFile(logFile).Size > ${maxBytes} Then`,
    '    fso.CopyFile logFile, logFile & ".1", True',
    '    fso.DeleteFile logFile',
    '  End If',
    'End If',
    `rc = sh.Run("${q(sweepCommand({ node, script, log: logPath }))}", 0, True)`,
    'WScript.Quit rc',
    '',
  ].join('\r\n');
}

/** XML zadatka: nedeljno, ponedeljak u `start`; propušten prolaz se nadoknađuje (StartWhenAvailable). */
export function sweepTaskXml({ vbs, start }) {
  const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Medium članak uz video: nedeljni prolaz (node tools/medium.mjs --sweep).</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${start}</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <DaysOfWeek><Monday /></DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>wscript.exe</Command>
      <Arguments>//B //NoLogo "${esc(vbs)}"</Arguments>
    </Exec>
  </Actions>
</Task>
`;
}

/** `.vbs` i XML za WSH i Task Scheduler idu kao UTF-16LE sa BOM-om (putanja sme da ima bilo koji znak). */
export const utf16leFile = (text) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);

/**
 * Prolaz sa vremenom u logu: početak i kraj (kod, trajanje), i kad `run` pukne (tada kod 1, a
 * greška ide dalje).
 * @param {() => Promise<number>} run
 */
export async function stampedSweep(run, { now = () => new Date(), write = log } = {}) {
  const t0 = now();
  write(`[${stamp(t0)}] sweep: start`);
  let code = 1;
  try {
    code = await run();
    return code;
  } finally {
    const t1 = now();
    write(`[${stamp(t1)}] sweep: kraj (kod ${code}, ${Math.round((t1 - t0) / 1000)} s)`);
  }
}

const episodesDir = () => path.join(ROOT, 'episodes');
const logFile = () => path.join(process.env.LOCALAPPDATA ?? os.homedir(), 'AnimatedTales', 'medium-sweep.log');

/** Jedan prolaz kroz sve epizode sa medium.md koje još nisu objavljene. Vraća najgori izlazni kod. */
async function sweepAll(args) {
  const feed = await fetchFeed();
  const dirs = fs.readdirSync(episodesDir()).map((d) => path.join(episodesDir(), d))
    .filter((d) => fs.existsSync(path.join(d, 'medium.md')));
  let worst = 0;
  for (const dir of dirs) {
    const ep = loadEpisode(dir);
    if (!isPending(ep)) continue;
    log(`\n— ${ep.slug}`);
    try {
      const code = await postEpisode(args, ep, feed);
      if (code !== 0 && code !== 3) worst = code;
    } catch (err) {
      console.error(`  GREŠKA ${err.message}`);
      worst = 1;
    }
  }
  return worst;
}

async function main(argv) {
  const args = parseArgs(argv);
  switch (args.action) {
    case null: case 'help':
      console.log(USAGE);
      return args.action === 'help' ? 0 : 2;

    case 'check': {
      if (!args.dir) { console.error(USAGE); return 2; }
      const ep = loadEpisode(args.dir);
      return printCheck(ep, checkEpisode(args.dir)) ? 0 : 1;
    }

    case 'post': {
      if (!args.dir) { console.error(USAGE); return 2; }
      const code = await postEpisode(args, loadEpisode(args.dir), null);
      return code === 3 ? 3 : code;
    }

    case 'watch': {
      if (!args.dir) { console.error(USAGE); return 2; }
      log(`Čekam da video epizode ${path.basename(path.resolve(args.dir))} postane javan (proveravam na ${args.every} min). Ctrl+C prekida.`);
      for (;;) {
        const code = await postEpisode(args, loadEpisode(args.dir), null);
        if (code !== 3) return code;
        await sleep(args.every * 60_000);
      }
    }

    case 'sweep':
      return stampedSweep(() => sweepAll(args));

    case 'login': {
      const m = await new MediumSession({ port: args.port }).open();
      try {
        const ok = await m.ensureLoggedIn({ wait: 15 * 60_000 });
        log(ok ? 'Medium je spreman: ovaj Chrome profil je prijavljen.' : 'Prijava nije završena za 15 min — pokreni ponovo.');
        return ok ? 0 : 1;
      } finally {
        m.close();
      }
    }

    case 'status': {
      const m = await new MediumSession({ port: args.port }).open();
      try {
        const ok = await m.ensureLoggedIn();
        log(ok ? 'Medium: prijavljen u Chrome profilu alata.' : 'Medium: NIJE prijavljen u Chrome profilu alata (node tools/medium.mjs --login).');
        return ok ? 0 : 4;
      } finally {
        m.close();
      }
    }

    case 'profile': {
      const m = await new MediumSession({ port: args.port, shotDir: path.join(ROOT, 'episodes', '.medium-profile') }).open();
      let keep = false;
      try {
        if (!(await m.ensureLoggedIn())) { log('Medium nije prijavljen. Pokreni: node tools/medium.mjs --login'); return 4; }
        await writeProfile(m);
        return 0;
      } catch (err) {
        await m.shot('greska');
        keep = true;
        throw err;
      } finally {
        await m.close({ keep });
      }
    }

    case 'dump': {
      const m = await new MediumSession({ port: args.port }).open();
      try {
        const out = path.join(os.tmpdir(), 'medium-dump.json');
        const d = await m.dump(args.url, out);
        console.log(JSON.stringify(d, null, 2));
        return 0;
      } finally {
        m.close();
      }
    }

    case 'install-task': {
      const dir = path.dirname(logFile());
      fs.mkdirSync(dir, { recursive: true });
      const vbs = path.join(dir, 'medium-sweep.vbs');
      fs.writeFileSync(vbs, utf16leFile(launcherVbs({ node: process.execPath, script: fileURLToPath(import.meta.url), log: logFile() })));
      const xmlFile = path.join(os.tmpdir(), 'animatedtales-medium-sweep-task.xml');
      fs.writeFileSync(xmlFile, utf16leFile(sweepTaskXml({ vbs, start: nextMonday2100() })));
      try {
        execFileSync('schtasks', ['/Create', '/F', '/TN', TASK_NAME, '/XML', xmlFile], { stdio: 'inherit' });
      } finally {
        fs.rmSync(xmlFile, { force: true });
      }
      log(`Task Scheduler: „${TASK_NAME}“ svakog ponedeljka u 21:00, bez prozora (radi dok si prijavljen na Windows;`);
      log('  ako je računar bio ugašen, prolaz se nadoknađuje čim proradi).');
      log(`Log sa vremenom: ${logFile()}`);
      return 0;
    }

    case 'remove-task':
      execFileSync('schtasks', ['/Delete', '/F', '/TN', TASK_NAME], { stdio: 'inherit' });
      return 0;

    default:
      console.error(USAGE);
      return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => {
    console.error(`GREŠKA ${err.message}`);
    process.exitCode = 1;
  });
}
