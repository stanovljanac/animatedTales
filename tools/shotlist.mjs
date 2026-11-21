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
// `--board` je isti radni papir za drugo mesto čitanja: tab u Google Docs-u umesto terminala,
// za smenu van kuće, gde `storyboard.json` ne postoji. Razlike su u zaglavljima, ne u poslu —
// obrazloženje uz `renderBoard`, ceo krug u `docs/reference/flow-board.md`.
//
// Izlaz ide na stdout i ništa se ne piše na disk: ovo je radni papir za jednu smenu pred
// Flow-om, ne artefakt epizode. `storyboard.md` (render.mjs) je taj koji se čuva.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LIMITS, chainLetter, countWords, genCost, genLen, isStill, linkChains, loadStoryboard, plural,
} from './contract.mjs';

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
// dužini klipa donosi pred Flow-om, sa ovom listom u ruci, a ne pri čitanju dokumentacije.
//
// Radni model je Omni 1.2 Flash (od 2026-11-21): cena ide po **dužini generisanja**, ne po
// tieru — 3 kr/s do 10s, 6 kr/s iznad (`contract.mjs` `genCost`). Račun zato stoji na
// `gen_len`-u svakog klipa, a ne na broju klipova: 27 klipova može da košta 480 ili 700 kredita.

/** Kredita po generisanju od `gen` sekundi. Slika (Nano Banana) je 0 i ne ulazi u račun. */
export { genCost };

export const DAILY = 50;          // svima, ne prenosi se u sutra
export const MONTHLY = 1000;      // Google AI Pro (od ~2. nov 2026), ne prenosi se u naredni mesec
export const CEILING = 30 * DAILY + MONTHLY;

/** Dužine generisanja za primer „koliko staje u jednu smenu" — krajevi lestvice i sredina. */
const SHIFT_LENS = [3, 6, 10, 15];

/**
 * Dužina generisanja jednog klipa. `gen_len` je obavezno polje (T4), ali čeklista se štampa i
 * pre lint prolaza, pa se pri `null` računa najmanja dužina koja pokriva `use_len`.
 * @param {{gen_len?: number|null, use_len: number}} shot clip shot
 * @returns {number}
 */
export const clipGenLen = (shot) =>
  shot.gen_len ?? genLen(shot.use_len) ?? Math.ceil(shot.use_len);

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
 * Cena liste klipova, računata po dužini generisanja svakog od njih.
 *
 * `days` računa **samo dnevne kredite**, jer je 1.000 mesečnih deljeno sa svim epizodama meseca
 * i ne prenosi se: broj dana je zato gornja granica koja ne laže u drugoj polovini meseca — a
 * dnevni plafon je ono što stvarno diktira raspored.
 *
 * `long*` izdvaja klipove duže od 10s: svaka njihova sekunda iznad desete je duplo skuplja, pa
 * su to jedini klipovi čiju cenu vredi pročitati pojedinačno.
 *
 * @param {number[]} lens dužina generisanja svakog klipa, u sekundama
 * @returns {{clips: number, seconds: number, total: number, days: number, overCeiling: boolean,
 *   longClips: number, longTotal: number}}
 */
export function creditPlan(lens) {
  const total = lens.reduce((a, g) => a + genCost(g), 0);
  const long = lens.filter((g) => g > LIMITS.longClip);
  return {
    clips: lens.length,
    seconds: lens.reduce((a, g) => a + g, 0),
    total,
    days: Math.ceil(total / DAILY),
    overCeiling: total > CEILING,
    longClips: long.length,
    longTotal: long.reduce((a, g) => a + genCost(g), 0),
  };
}

/**
 * Blok o kreditima za zaglavlje čekliste.
 *
 * Still kadrovi se broje odvojeno i **ne ulaze u račun** (schemas.md §3.3.2): ceo smisao tog
 * formata je da budžet epizode padne na nulu, a „45 klipova po 0 kredita" i „45 slika" nisu
 * ista rečenica pred Flow-om. Epizoda bez ijednog klipa zato ne dobija ni račun —
 * nema šta da se plati.
 *
 * @param {number[]} lens dužina generisanja svakog klipa koji se generiše
 * @param {number} [stills] broj still kadrova
 * @returns {string[]} redovi
 */
export function creditLines(lens, stills = 0) {
  const clips = lens.length;
  const what = [
    clips ? `${clips} ${plural(clips, 'klip', 'klipa', 'klipova')}` : null,
    stills ? `${stills} ${plural(stills, 'slika', 'slike', 'slika')}` : null,
  ].filter(Boolean).join(' + ') || '0 klipova';

  const out = ['', `FLOW KREDITI — ${what}; slike su besplatne (Nano Banana, 0 kredita)`];

  if (!clips) {
    out.push('  Epizoda je cela od slika — nema šta da se plati.');
    return out;
  }

  const r = creditPlan(lens);
  out.push(
    `  Omni 1.2 Flash  ${r.seconds}s generisanja = ${thousands(r.total)} cr` +
      (r.overCeiling
        ? `   preko mesečnog plafona (${thousands(CEILING)})`
        : `   ${r.days} ${plural(r.days, 'dan', 'dana', 'dana')} po ${DAILY} cr/dan`),
    `  Cena: 3 cr/s do ${LIMITS.longClip}s, 6 cr/s iznad (3s = ${genCost(3)} · 6s = ${genCost(6)} · ` +
      `10s = ${genCost(10)} · 15s = ${genCost(15)}).`);
  if (r.longClips) {
    out.push(`  Preko ${LIMITS.longClip}s: ${r.longClips} ${plural(r.longClips, 'klip', 'klipa', 'klipova')}, ` +
      `${thousands(r.longTotal)} cr — sekunda iznad desete je duplo skuplja.`);
  }
  out.push(`  Stanje: ${DAILY} cr/dan + ${thousands(MONTHLY)} cr/mesec (Google AI Pro); ništa se ne prenosi.`);
  return out;
}

/**
 * Jedan red o tome koliko jedna smena pred Flow-om stvarno nosi.
 *
 * Dnevnih 50 kredita je ono što deli posao na smene (google-ai-plus.md §4), pa se smena meri
 * njima, a ne satima: pola sata je dovoljno za pet klipova od 3s, za dva od 6s i za nijedan od
 * 15s — taj ne staje u dnevnih 50 i troši mesečne. Epizoda bez ijednog klipa nema plafon koji bi
 * je prekinuo i to mora da stoji doslovno — inače se čeka kredit koji se ne troši.
 *
 * @param {number} clips broj klipova
 * @returns {string} red
 */
export function shiftLine(clips) {
  if (!clips) return '  Smena traje koliko traje: nema dnevnog plafona koji bi je prekinuo.';
  const parts = SHIFT_LENS.map((s) => `${Math.floor(DAILY / genCost(s))} × ${s}s`);
  return `  Jedna smena = dnevnih ${DAILY} cr: ${parts.join(' · ')}.`;
}

/**
 * Gde se shot nalazi u odnosu na susede — isti tekst u čeklisti i u tabli.
 * @param {{group: string|null, shots: object[]}} chain
 * @param {number} i mesto shota u lancu
 */
const chainWhere = (chain, i) => (chain.group === null
  ? 'samostalan, tvrd rez'
  : `lanac ${chain.group}, ${chainLetter(i)} od ${chain.shots.length}`);

/**
 * Naznaka lanca: dissolve između kadrova koji ne dele lokaciju i svetlo vidi se kao greška,
 * pa naznaka mora da preživi i `--only` koji iz lanca izvuče jedan shot.
 * @param {{group: string|null, shots: object[]}} chain
 * @param {object[]} shown shotovi lanca koji stvarno izlaze
 * @returns {string[]} dva reda
 */
export function chainNotice(chain, shown) {
  return [
    `LANAC ${chain.group} — ${chain.shots.length} ` +
      `${plural(chain.shots.length, 'shot', 'shota', 'shotova')} ` +
      `(${chain.shots.map((s) => s.shot_id).join(', ')}), spajaju se dissolve-om.`,
    'Generiši ih sa istom lokacijom i istim svetlom — to je nastavak istog kadra.' +
      (shown.length < chain.shots.length
        ? ` (--only prikazuje ${shown.map((s) => s.shot_id).join(', ')})`
        : ''),
  ];
}

/**
 * Telo shota — sve ispod zaglavlja: promptovi doslovno i koraci generisanja.
 *
 * Čeklista i tabla dele ovaj blok namerno. Razlika između terminala i taba u Docs-u je samo
 * u zaglavljima; korak koji bi se razišao („sačuvaj kao…") je isti posao nad istim fajlom,
 * a dva opisa istog posla su dva opisa koja se razilaze.
 *
 * Still kadar (schemas.md §3.3.2) ima jedan prompt i dva koraka — pokret mu daje montaža.
 *
 * @param {object} s shot
 * @returns {string[]} redovi, počev od praznog reda ispod zaglavlja
 */
export function shotBody(s) {
  const n = countWords(s.image_prompt);
  const L = ['', `IMAGE PROMPT (${n} ${plural(n, 'reč', 'reči', 'reči')})`, '', s.image_prompt];

  if (isStill(s)) {
    L.push('',
      `POKRET: ${s.still_motion} — daje ga montaža, ne Flow.`,
      '',
      '  [ ] 1. image prompt -> slika',
      `  [ ] 2. sačuvaj sliku kao ${imageFile(s)}`);
    return L;
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
  return L;
}

/** Broj shotova za zaglavlje, sa naznakom da je lista filtrirana. */
const countLabel = (kept, all, only) =>
  `${kept} ${plural(kept, 'shot', 'shota', 'shotova')}` + (only ? ` od ${all} (--only)` : '');

/**
 * @param {object} storyboard već proveren sa `assertDisplayable`
 * @param {{only?: Set<string>|null}} [opts]
 * @returns {string} ceo izlaz, sa završnim prelomom reda
 */
export function renderShotlist(storyboard, { only = null } = {}) {
  const all = storyboard.beats.flatMap((b) => b.shots);
  const kept = only ? all.filter((s) => only.has(s.shot_id)) : all;

  const lens = kept.filter((s) => !isStill(s)).map(clipGenLen);
  const L = [
    `shotlist — ${storyboard.episode} · ${countLabel(kept.length, all.length, only)}` +
      ' · redosled generisanja',
    'Promptovi se kopiraju doslovno, red po red, bez izmena i bez prelamanja.',
    ...creditLines(lens, kept.length - lens.length),
  ];

  for (const b of storyboard.beats) {
    for (const chain of linkChains(b.shots)) {
      const shots = chain.shots.filter((s) => kept.includes(s));
      if (!shots.length) continue;

      // Lanac ostaje lanac i kad `--only` iz njega izvuče jedan shot: dissolve sa susedom
      // i dalje traži istu lokaciju i svetlo, pa naznaka mora da preživi filtriranje.
      if (chain.group !== null) L.push('', RULE, ...chainNotice(chain, shots), RULE);

      for (const s of shots) {
        const where = chainWhere(chain, chain.shots.indexOf(s));
        L.push('', THIN,
          `shot ${s.shot_id}   beat ${s.beat_id} · ${where} · ${fmt(s.use_len)}s` +
            (isStill(s) ? ` · STILL (${s.still_motion})` : ''),
          THIN,
          ...shotBody(s));
      }
    }
  }

  L.push('');
  return L.join('\n');
}

// ------------------------------------------------------------------ Flow tabla
//
// Ista čeklista, ali za tab u Google Docs-u umesto za terminal: prompt je na poslu, gde
// `storyboard.json` ne postoji. Google ne daje nikakav programski pristup (google-ai-plus.md
// §1), pa se tabla ne sinhronizuje — ona se odštampa, nalepi u tab i ručno precrtava.
//
// Tri razlike u odnosu na čeklistu, sve tri iznuđene mestom na kome se čita:
//
//   1. markdown zaglavlja umesto ASCII linija — Docs ih pri nalepljivanju pretvara u prava
//      zaglavlja, pa tab od 46 shotova dobija outline po kome se skače na sledeći kadar;
//   2. nijedan red ne počinje sa `=` ili `-` — u Sheets-u bi takav red bio formula i izašao
//      kao `#ERROR!`, a tabla treba da preživi i taj lepak;
//   3. oba vremena u zaglavlju — tab nalepljen pre QA prolaza gura u Flow stari prompt, i to
//      se vidi jedino ako `generated_at` storyboarda i datum štampe stoje jedan pored drugog.

/**
 * @param {object} storyboard već proveren sa `assertDisplayable`
 * @param {{only?: Set<string>|null, now?: Date}} [opts]
 * @returns {string} ceo izlaz, sa završnim prelomom reda
 */
export function renderBoard(storyboard, { only = null, now = new Date() } = {}) {
  const all = storyboard.beats.flatMap((b) => b.shots);
  const kept = only ? all.filter((s) => only.has(s.shot_id)) : all;
  const lens = kept.filter((s) => !isStill(s)).map(clipGenLen);

  const L = [
    `# ${storyboard.episode} — Flow tabla`,
    '',
    `storyboard od ${storyboard.generated_at} · tabla štampana ${now.toISOString().slice(0, 10)}` +
      ` · ${countLabel(kept.length, all.length, only)} · redosled generisanja`,
    'Promptovi se kopiraju doslovno, red po red, bez izmena i bez prelamanja.',
    'Na poslu se samo generiše: fajl ostaje u Flow biblioteci, ime dobija kod kuće, pri skidanju.',
    'LAST DONE: ___ — precrtaj shot čim je gotov; sledeći je prvi neprecrtan.',
    ...creditLines(lens, kept.length - lens.length),
    shiftLine(lens.length),
  ];

  for (const b of storyboard.beats) {
    for (const chain of linkChains(b.shots)) {
      const shots = chain.shots.filter((s) => kept.includes(s));
      if (!shots.length) continue;

      if (chain.group !== null) L.push('', ...chainNotice(chain, shots));

      for (const s of shots) {
        const where = chainWhere(chain, chain.shots.indexOf(s));
        L.push('',
          `## shot ${s.shot_id} · beat ${s.beat_id} · ${where} · ${fmt(s.use_len)}s` +
            (isStill(s) ? ` · STILL (${s.still_motion})` : ''),
          ...shotBody(s));
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
  --board           Flow tabla za tab u Google Docs-u umesto čekliste za terminal
  -h, --help        ovaj tekst

  node tools/shotlist.mjs episodes/<slug> --board | Set-Clipboard   (PowerShell)`;

export function parseArgs(argv) {
  const out = { dir: null, only: null, board: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--board') out.board = true;
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

  const render = args.board ? renderBoard : renderShotlist;
  process.stdout.write(render(storyboard, { only }));
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
