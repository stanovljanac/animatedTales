// tools/flow-risk.mjs
//
// Dva savetodavna pregleda nad `storyboard.json`, pre nego što se promptovi pošalju u Flow:
//
//   node tools/flow-risk.mjs episodes/<slug> [--only 23,26]
//
// 1. FILTER — reči i radnje zbog kojih Flow odbija klip (maloletnici, golotinja, nasilje, odvojen deo
//    tela, samopovređivanje). Svaki nalaz nosi zamenu iz `docs/reference/flow-filter.md` §5.
// 2. PRVI FREJM — `ACTION` i `FRAME LAYOUT` image prompta koji opisuju sredinu scene (predmet u letu,
//    udarac već pao, kuća već gori), a ne pozu neposredno pre radnje (`prompt-templates.md` →
//    „Početni frejm, ne sredina scene").
//
// Alat samo čita i piše na stdout. Exit code je uvek 0: ovo su signali, ne nalazi, kao ADVISORY sloj
// linta. Poruku koju je Flow ispisao ne zamenjuje — kategoriju potvrđuje ona, ne regex.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isStill, loadStoryboard } from './contract.mjs';

const USAGE = `Upotreba: node tools/flow-risk.mjs episodes/<slug> [--only 07,12]

Signali za Flow filter i za početni frejm image prompta. Exit code je uvek 0.`;

/** Blokovi image prompta u kojima se traži rizik. */
const RISK_BLOCKS = ['SUBJECT', 'SUBJECT 2', 'SUBJECT 3', 'ACTION', 'FRAME LAYOUT', 'SCREEN DIRECTION', 'DETAIL', 'NOT IN FRAME'];

/**
 * Kategorije filtera. `re` hvata reč ili frazu, `swap` je predlog zamene (flow-filter.md §5).
 * Uzorci su namerno široki: bolje signal koji se odbaci nego klip koji pada.
 */
export const RISK = [
  {
    code: 'minors',
    label: 'maloletnik',
    re: /\b(baby|babies|infants?|newborns?|toddlers?|child|children|kids?|boys?|girls?|swaddl\w*)\b/gi,
    swap: 'odrasla figura + predmet koji ga označava (veo, zavežljaj, silueta); dete nikad lice ni telo',
  },
  {
    code: 'sexual',
    label: 'golotinja / intima',
    re: /\b(naked|nude|nudity|topless|undress\w*|bathing|bedroom|breasts?|kiss\w*|loincloth|bare[- ](?:chest|chested|skin|torso|shoulders|legs|thighs?)|cropped at the thighs?|embrac\w*)\b/gi,
    swap: 'kratak beli pamučni ogrtač do pojasa i platno do kolena; širi kadar (LS); „embrace" → „stand hand in hand"',
  },
  {
    code: 'violence',
    label: 'nasilje / telo',
    re: /\b(blood\w*|gore|gory|wounds?|wounded|stab\w*|slay\w*|slain|kill\w*|behead\w*|decapitat\w*|sever\w*|dismember\w*|skulls?|corpses?|dead bod(?:y|ies)|sacrific\w*|strik(?:e|es|ing)|struck|kick\w*(?! up)|knock\w*|smash\w*|crush\w*|slash\w*|torture\w*|gnaw\w*)\b/gi,
    swap: 'putanja umesto udarca (sails, bounces, arcs); posledica umesto čina; „red light", „dark stain", „torn cloth"',
  },
  {
    code: 'head-object',
    label: 'predmet koji liči na glavu',
    re: /\b(?:pale|round|real|severed|cut-off|bloody|dead|rolling)\s+heads?\b|\bheads?\b[^.;]{0,40}\b(?:ball|toss\w*|kick\w*|rolls?)\b/gi,
    swap: 'glatka kugla ili bela tikva bez lica; „the pale round ball"; izvor je u slici, ne u promptu',
  },
  {
    code: 'selfharm',
    label: 'samopovređivanje / opasna radnja',
    re: /\b(?:leap\w*|jump\w*|step\w*|throw\w*|dive\w*|plung\w*)\s+(?:\w+\s+){0,3}into\s+(?:the\s+)?(?:flames?|fire|oven|pit|furnace)\b|\b(?:hang(?:s|ed|ing)? (?:himself|herself|themselves|from a rope|by the neck)|noose|drown\w*|poison\w*|suicid\w*|immolat\w*)\b|\bburn\w* alive\b/gi,
    swap: 'stani pre čina (lip of the pit, white glare swells); skok pokriva narracija; posledica u sledećem kadru',
  },
];

/** Reči koje u `ACTION` / `FRAME LAYOUT` označavaju sredinu radnje, ne početak. */
export const MID_ACTION = /\b(in the air|in flight|mid-?air|mid-?leap|airborne|sail(?:s|ing)?|flies|flying|hurl\w*|thrown|throws?|fling\w*|leap(?:s|ing|ed)?|burst(?:s|ing)?|strik(?:e|es|ing)|struck|knock\w*|hits?|smash\w*|crash\w*|collaps\w*|erupt\w*|explod\w*|streak(?:s|ing)?|bolts?|spiral\w*)\b/gi;

/** Blokovi image prompta u kojima se traži sredina scene. */
const MID_BLOCKS = ['ACTION', 'FRAME LAYOUT'];

/** @returns {Record<string, string>} blokovi prompta po nazivu (nazivi verzalom, jedan red po bloku) */
export function blocks(prompt) {
  const out = {};
  for (const line of String(prompt ?? '').split('\n')) {
    const m = /^([A-Z][A-Z0-9 /]*):\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function matchAll(re, text) {
  re.lastIndex = 0;
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    hits.push(m[0]);
    if (m[0] === '') re.lastIndex += 1;
  }
  return hits;
}

/**
 * Signali za jedan shot.
 * @returns {{risk: {code, label, where, terms: string[], swap: string, named?: boolean}[],
 *            mid: {where: string, terms: string[]}[]}}
 */
export function scanShot(shot) {
  const risk = [];
  const mid = [];
  const img = blocks(shot.image_prompt);
  const anim = shot.animation_prompt ? { ANIMATION: String(shot.animation_prompt).replace(/\n/g, ' ') } : {};

  const sources = [
    ...RISK_BLOCKS.filter((b) => img[b] !== undefined).map((b) => [`image ${b}`, img[b], b]),
    ...Object.entries(anim).map(([b, text]) => ['animation', text, b]),
  ];
  for (const cat of RISK) {
    for (const [where, text, block] of sources) {
      // `NOT IN FRAME` se meri samo za maloletnike. Izmereno na hero-twins: shotovi 10 i 21 su
      // prošli Flow sa „blood, skull" i „severed head" u NOT IN FRAME, pa za ostalo to nije okidač.
      if (block === 'NOT IN FRAME' && cat.code !== 'minors') continue;
      const terms = [...new Set(matchAll(cat.re, text).map((s) => s.toLowerCase()))];
      if (!terms.length) continue;
      risk.push({ code: cat.code, label: cat.label, where, terms, swap: cat.swap, named: block === 'NOT IN FRAME' });
    }
  }

  for (const b of MID_BLOCKS) {
    if (img[b] === undefined) continue;
    const terms = [...new Set(matchAll(MID_ACTION, img[b]).map((s) => s.toLowerCase()))];
    if (terms.length) mid.push({ where: `image ${b}`, terms });
  }
  return { risk, mid };
}

/** @returns {{shot_id: string, still: boolean, risk: object[], mid: object[]}[]} samo shotovi sa signalom */
export function scanStoryboard(storyboard, { only = null } = {}) {
  const out = [];
  for (const beat of storyboard.beats) {
    for (const shot of beat.shots) {
      if (only && !only.has(String(shot.shot_id).replace(/^0+/, ''))) continue;
      const { risk, mid } = scanShot(shot);
      if (risk.length || mid.length) out.push({ shot_id: shot.shot_id, still: isStill(shot), risk, mid });
    }
  }
  return out;
}

export function renderReport(results, { slug = '' } = {}) {
  const lines = [`flow-risk${slug ? ` · ${slug}` : ''}`, ''];
  if (!results.length) {
    lines.push('Nema signala.');
    return `${lines.join('\n')}\n`;
  }
  for (const r of results) {
    lines.push(`shot ${r.shot_id}${r.still ? ' (still)' : ''}`);
    for (const m of r.mid) {
      lines.push(`  [prvi frejm] ${m.where}: ${m.terms.join(', ')} — opiši pozu PRE radnje, radnju prebaci u animation prompt`);
    }
    for (const k of r.risk) {
      lines.push(`  [${k.code}] ${k.where}: ${k.terms.join(', ')}${k.named ? ' — dete se ne imenuje ni u NOT IN FRAME' : ''}`);
      lines.push(`      zamena: ${k.swap}`);
    }
    lines.push('');
  }
  const byCode = {};
  for (const r of results) for (const k of r.risk) (byCode[k.code] ??= new Set()).add(r.shot_id);
  const mids = results.filter((r) => r.mid.length).map((r) => r.shot_id);
  lines.push('Zbir:');
  for (const [code, ids] of Object.entries(byCode)) lines.push(`  ${code}: ${[...ids].join(' ')}`);
  if (mids.length) lines.push(`  prvi frejm: ${mids.join(' ')}`);
  lines.push('', 'Alternative: docs/reference/flow-filter.md · Početni frejm: docs/reference/prompt-templates.md');
  return `${lines.join('\n')}\n`;
}

export function parseArgs(argv) {
  const out = { dir: null, only: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--only' || a.startsWith('--only=')) {
      const value = a.startsWith('--only=') ? a.slice('--only='.length) : argv[++i];
      if (value === undefined) throw new Error(`--only traži spisak shotova\n\n${USAGE}`);
      out.only = new Set(value.split(',').map((s) => s.trim().replace(/^0+/, '')).filter(Boolean));
    } else if (a.startsWith('-')) throw new Error(`nepoznata opcija ${a}\n\n${USAGE}`);
    else if (out.dir === null) out.dir = a;
    else throw new Error(`višak argumenta ${a}\n\n${USAGE}`);
  }
  if (!out.help && !out.dir) throw new Error(`nedostaje folder epizode\n\n${USAGE}`);
  return out;
}

export function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  const { storyboard } = loadStoryboard(args.dir);
  process.stdout.write(renderReport(scanStoryboard(storyboard, { only: args.only }), { slug: storyboard.episode }));
  return 0;
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
