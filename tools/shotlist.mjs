// tools/shotlist.mjs
//
// Produkciona čeklista za Flow — `storyboard.json` -> stdout, u redosledu generisanja (C08).
//
//   node tools/shotlist.mjs episodes/<slug> [--only 07,12,18]
//
// Po shotu: broj, image prompt, animation prompt, koja slika ide kao ingredient i gde se
// šta snima. Promptovi izlaze **doslovno**, bez markdown ukrasa i bez prelamanja — kopiraju
// se direktno u Flow, pa je svaki dodati znak greška u generisanju, ne kozmetika.
//
// Still kadar (schemas.md §3.3.2) izlazi sa jednim promptom i dva koraka umesto tri — pokret
// mu daje montaža, ne Flow. U budžetu kredita se broji odvojeno i ne učestvuje u računu.
//
// Linkovani shotovi (A/B/C istog beata, schemas.md §3.4) izlaze grupisano, sa naznakom da
// dele lokaciju i svetlo: dissolve između kadrova koji to ne dele vidi se kao greška.
//
// `--only` postoji jer Flow nije deterministički — kad se pojedinačni shot odbaci i
// regeneriše, treba ti tih par promptova, ne cela lista od 30. Prima i `07` i `7`.
//
// Izlaz ide na stdout i ništa se ne piše na disk: ovo je radni papir za jednu smenu pred
// Flow-om, ne artefakt epizode. `storyboard.md` (render.mjs) je taj koji se čuva.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chainLetter, countWords, isStill, linkChains, loadStoryboard, plural } from './contract.mjs';

const RULE = '='.repeat(74);
const THIN = '-'.repeat(74);

const fmt = (t) => Number(t).toFixed(3).replace(/\.?0+$/, '');

/**
 * Ime slike koju treba sačuvati posle image prompta.
 *
 * Kad shot ima `ingredient_image`, to je ta putanja — ista slika se generiše i vraća u Flow
 * kao ingredient. Kad je `null`, shot se generiše bez ingredienta, ali `image_prompt` i dalje
 * postoji (obavezno polje), pa se slika i dalje pravi i čuva po konvenciji iz invarijante 13.
 *
 * Na still shotu slika **jeste** izvor, ne ulaz u nešto drugo, pa se čuva pod `source_file`.
 * @param {{shot_id: string, ingredient_image: string|null, source_file: string}} shot
 */
export const imageFile = (shot) =>
  (isStill(shot) ? shot.source_file : shot.ingredient_image ?? `images/shot${shot.shot_id}.jpeg`);

/**
 * Razrešava `--only 07,12,18`. Prima i `7` i `07`; poredi se i doslovno, zbog `shot_id`-jeva
 * koji nisu broj. Nepoznat broj je greška, ne prazan izlaz — tiho ništa je najgori odgovor
 * alatu koji postoji da bi ti dao baš taj prompt.
 * @param {string[]} shots svi `shot_id` iz storyboarda, u redosledu tajmlajna
 * @param {string[]} only traženi id-jevi
 * @returns {Set<string>}
 */
export function resolveOnly(shots, only) {
  const canon = new Map();
  for (const id of shots) {
    canon.set(id, id);
    if (/^\d+$/.test(id)) canon.set(String(Number(id)), id);
  }

  const out = new Set();
  const missing = [];
  for (const raw of only) {
    const key = canon.has(raw) ? raw : String(/^\d+$/.test(raw) ? Number(raw) : raw);
    if (canon.has(key)) out.add(canon.get(key));
    else missing.push(raw);
  }
  if (missing.length) {
    throw new Error(`--only: ${missing.length === 1 ? 'shot ne postoji' : 'shotovi ne postoje'}: ` +
      `${missing.join(', ')}\n  postoje: ${shots.join(', ')}`);
  }
  return out;
}

// ----------------------------------------------------------- Flow krediti
//
// Slika je besplatna, klip nije — ceo budžet epizode je budžet za video. Brojke i
// obrazloženje su u `docs/reference/google-ai-plus.md`; ovde stoje zato što se odluka o
// tieru donosi pred Flow-om, sa ovom listom u ruci, a ne pri čitanju dokumentacije.

/** Kredita po klipu. Slika (Nano Banana) je 0 i ne pojavljuje se u računici. */
export const TIERS = [
  { name: 'Veo 3.1 Lite', cost: 10 },
  { name: 'Veo 3.1 Fast', cost: 20 },
  { name: 'Veo 3.1 Quality', cost: 100 },
];

export const DAILY = 50;          // svima, ne prenosi se u sutra
export const MONTHLY = 200;       // AI Plus, ne prenosi se u naredni mesec
export const CEILING = 30 * DAILY + MONTHLY;

// 1700 -> 1.700; bez regexa i bez toLocaleString, koji zavisi od ICU u okruženju.
const thousands = (n) => {
  const d = String(n);
  let out = '';
  for (let k = 0; k < d.length; k += 1) {
    if (k > 0 && (d.length - k) % 3 === 0) out += '.';
    out += d[k];
  }
  return out;
};

/**
 * Cena liste klipova po tieru.
 *
 * `days` računa **samo dnevne kredite**, jer je 200 mesečnih jednokratno: pokriju četiri
 * dana prvoj epizodi u mesecu i posle ih nema. Broj dana je zato gornja granica koja ne laže
 * u drugoj polovini meseca — a dnevni plafon je ono što stvarno diktira raspored.
 *
 * @param {number} clips broj klipova koji se generiše
 * @returns {{name: string, cost: number, total: number, days: number, overCeiling: boolean}[]}
 */
export function creditPlan(clips) {
  return TIERS.map(({ name, cost }) => {
    const total = clips * cost;
    return { name, cost, total, days: Math.ceil(total / DAILY), overCeiling: total > CEILING };
  });
}

/**
 * Blok o kreditima za zaglavlje čekliste.
 *
 * Still kadrovi se broje odvojeno i **ne ulaze u račun** (schemas.md §3.3.2): ceo smisao tog
 * formata je da budžet epizode padne na nulu, a „45 klipova po 0 kredita" i „45 slika" nisu
 * ista rečenica pred Flow-om. Epizoda bez ijednog klipa zato ne dobija ni tabelu tierova —
 * nema šta da se bira.
 *
 * @param {number} clips broj klipova
 * @param {number} [stills] broj still kadrova
 * @returns {string[]} redovi
 */
export function creditLines(clips, stills = 0) {
  const what = [
    clips ? `${clips} ${plural(clips, 'klip', 'klipa', 'klipova')}` : null,
    stills ? `${stills} ${plural(stills, 'slika', 'slike', 'slika')}` : null,
  ].filter(Boolean).join(' + ') || '0 klipova';

  const out = ['', `FLOW KREDITI — ${what}; slike su besplatne (Nano Banana, 0 kredita)`];

  if (!clips) {
    out.push('  Epizoda je cela od slika — nema šta da se plati i nema tiera da se bira.');
    return out;
  }

  for (const r of creditPlan(clips)) {
    const head = `  ${r.name.padEnd(16)}${String(r.cost).padStart(3)} cr/klip ${thousands(r.total).padStart(7)} cr`;
    out.push(r.overCeiling
      ? `${head}   preko mesečnog plafona (${thousands(CEILING)})`
      : `${head}   ${r.days} ${plural(r.days, 'dan', 'dana', 'dana')} po ${DAILY} cr/dan`);
  }
  out.push(`  Stanje: ${DAILY} cr/dan + ${MONTHLY} cr/mesec (AI Plus); ništa se ne prenosi.`);
  return out;
}

/**
 * @param {object} storyboard već proveren sa `assertDisplayable`
 * @param {{only?: Set<string>|null}} [opts]
 * @returns {string} ceo izlaz, sa završnim prelomom reda
 */
export function renderShotlist(storyboard, { only = null } = {}) {
  const all = storyboard.beats.flatMap((b) => b.shots);
  const kept = only ? all.filter((s) => only.has(s.shot_id)) : all;

  const clips = kept.filter((s) => !isStill(s)).length;
  const L = [
    `shotlist — ${storyboard.episode} · ${kept.length} ` +
      `${plural(kept.length, 'shot', 'shota', 'shotova')}` +
      (only ? ` od ${all.length} (--only)` : '') + ' · redosled generisanja',
    'Promptovi se kopiraju doslovno, red po red, bez izmena i bez prelamanja.',
    ...creditLines(clips, kept.length - clips),
  ];

  for (const b of storyboard.beats) {
    for (const chain of linkChains(b.shots)) {
      const shots = chain.shots.filter((s) => kept.includes(s));
      if (!shots.length) continue;

      // Lanac ostaje lanac i kad `--only` iz njega izvuče jedan shot: dissolve sa susedom
      // i dalje traži istu lokaciju i svetlo, pa naznaka mora da preživi filtriranje.
      if (chain.group !== null) {
        L.push('', RULE,
          `LANAC ${chain.group} — ${chain.shots.length} ` +
            `${plural(chain.shots.length, 'shot', 'shota', 'shotova')} ` +
            `(${chain.shots.map((s) => s.shot_id).join(', ')}), spajaju se dissolve-om.`,
          'Generiši ih sa istom lokacijom i istim svetlom — to je nastavak istog kadra.' +
            (shots.length < chain.shots.length
              ? ` (--only prikazuje ${shots.map((s) => s.shot_id).join(', ')})`
              : ''),
          RULE);
      }

      for (const s of shots) {
        const i = chain.shots.indexOf(s);
        const where = chain.group === null
          ? 'samostalan, tvrd rez'
          : `lanac ${chain.group}, ${chainLetter(i)} od ${chain.shots.length}`;
        const n = countWords(s.image_prompt);

        L.push('', THIN,
          `shot ${s.shot_id}   beat ${s.beat_id} · ${where} · ${fmt(s.use_len)}s` +
            (isStill(s) ? ` · STILL (${s.still_motion})` : ''),
          THIN,
          '',
          `IMAGE PROMPT (${n} ${plural(n, 'reč', 'reči', 'reči')})`,
          '',
          s.image_prompt);

        // Still shot: jedan prompt, dva koraka. Nema klipa, pa nema ni ingredienta ni
        // trajanja koje bi izvor morao da pokrije — pokret pravi montaža (§3.3.2).
        if (isStill(s)) {
          L.push('',
            `POKRET: ${s.still_motion} — daje ga montaža, ne Flow.`,
            '',
            '  [ ] 1. image prompt -> slika',
            `  [ ] 2. sačuvaj sliku kao ${imageFile(s)}`);
          continue;
        }

        const a = countWords(s.animation_prompt);
        L.push('',
          `ANIMATION PROMPT (${a} ${plural(a, 'reč', 'reči', 'reči')})`,
          '',
          s.animation_prompt,
          '',
          '  [ ] 1. image prompt -> slika; sačuvaj je kao ' + imageFile(s),
          '  [ ] 2. animation prompt -> klip; ingredient: ' +
            (s.ingredient_image === null
              ? 'nema (ingredient_image: null), generiši bez ulazne slike'
              : s.ingredient_image),
          `  [ ] 3. sačuvaj klip kao ${s.source_file} (traje bar ${fmt(s.use_out)}s)`);
      }
    }
  }

  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------- CLI

const USAGE = `node tools/shotlist.mjs <folder-epizode> [opcije]

  Produkciona čeklista za Flow, na stdout, u redosledu generisanja.
  Linkovani shotovi izlaze grupisano; promptovi izlaze doslovno.

  --only 07,12,18   samo ti shotovi (prima i 7 i 07)
  -h, --help        ovaj tekst`;

export function parseArgs(argv) {
  const out = { dir: null, only: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--only' || a.startsWith('--only=')) {
      const value = a.startsWith('--only=') ? a.slice('--only='.length) : argv[++i];
      if (value === undefined) throw new Error(`--only traži spisak shotova\n\n${USAGE}`);
      const ids = value.split(',').map((s) => s.trim()).filter(Boolean);
      if (!ids.length) throw new Error(`--only: prazan spisak shotova\n\n${USAGE}`);
      out.only = [...(out.only ?? []), ...ids];
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
  const ids = storyboard.beats.flatMap((b) => b.shots).map((s) => s.shot_id);
  const only = args.only ? resolveOnly(ids, args.only) : null;

  process.stdout.write(renderShotlist(storyboard, { only }));
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
