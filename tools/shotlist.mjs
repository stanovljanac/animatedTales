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

import { chainLetter, countWords, linkChains, loadStoryboard, plural } from './contract.mjs';

const RULE = '='.repeat(74);
const THIN = '-'.repeat(74);

const fmt = (t) => Number(t).toFixed(3).replace(/\.?0+$/, '');

/**
 * Ime slike koju treba sačuvati posle image prompta.
 *
 * Kad shot ima `ingredient_image`, to je ta putanja — ista slika se generiše i vraća u Flow
 * kao ingredient. Kad je `null`, shot se generiše bez ingredienta, ali `image_prompt` i dalje
 * postoji (obavezno polje), pa se slika i dalje pravi i čuva po konvenciji iz invarijante 13.
 * @param {{shot_id: string, ingredient_image: string|null}} shot
 */
export const imageFile = (shot) => shot.ingredient_image ?? `images/shot${shot.shot_id}.jpeg`;

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

/**
 * @param {object} storyboard već proveren sa `assertDisplayable`
 * @param {{only?: Set<string>|null}} [opts]
 * @returns {string} ceo izlaz, sa završnim prelomom reda
 */
export function renderShotlist(storyboard, { only = null } = {}) {
  const all = storyboard.beats.flatMap((b) => b.shots);
  const kept = only ? all.filter((s) => only.has(s.shot_id)) : all;

  const L = [
    `shotlist — ${storyboard.episode} · ${kept.length} ` +
      `${plural(kept.length, 'shot', 'shota', 'shotova')}` +
      (only ? ` od ${all.length} (--only)` : '') + ' · redosled generisanja',
    'Promptovi se kopiraju doslovno, red po red, bez izmena i bez prelamanja.',
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

        L.push('', THIN,
          `shot ${s.shot_id}   beat ${s.beat_id} · ${where} · ${fmt(s.use_len)}s`,
          THIN,
          '',
          `IMAGE PROMPT (${countWords(s.image_prompt)} ${plural(countWords(s.image_prompt), 'reč', 'reči', 'reči')})`,
          '',
          s.image_prompt,
          '',
          `ANIMATION PROMPT (${countWords(s.animation_prompt)} ${plural(countWords(s.animation_prompt), 'reč', 'reči', 'reči')})`,
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
