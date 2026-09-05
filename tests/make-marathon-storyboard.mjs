// tests/make-marathon-storyboard.mjs
//
//   node tests/make-marathon-storyboard.mjs [--stdout]
//
// Pravi `episodes/marathon/storyboard.json` za verifikaciju 5 iz izvornog plana
// (`assemble.mjs` end-to-end na 33 postojeća klipa). Fajl je **sintetički** i to nije
// sitnica koju treba prećutati:
//
//   - Marathon je legacy epizoda: nema `script.md`, `timing.json` ni pravi storyboard.
//     Kreativna polja (`narration_says`, `viewer_sees`, oba prompta, `device`, `tags`) su
//     popuna, ne sadržaj. Ovaj fajl služi montaži, ne kao primer storyboard-a — kanonski
//     primer je i dalje `tests/fixtures/good-episode` (schemas.md §3.8).
//   - `source_file` je `part7.mp4`, ne `shots/part07.mp4`: klipovi legacy epizode stoje u
//     korenu foldera i bez vodeće nule (vidi `episode.json.notes`). Odstupanje od invarijante
//     13 je zabeleženo, a `assemble.mjs` ionako uzima putanju iz polja, ne iz konvencije.
//   - `outro_start` u korenu je jedini način da se end card grana uopšte pusti nad epizodom
//     bez `timing.json`-a (docs/plan/C09, zamke).
//
// Determinizam: nigde `new Date()`, nigde slučajnih vrednosti — dva pokretanja daju
// bajt-identičan fajl, isto pravilo kao za `render.mjs` (schemas.md §5.7 tačka 3).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { probe } from '../tools/ffmpeg.mjs';
import { round3 } from '../tools/contract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, '..', 'episodes', 'marathon');

const SHOTS = 33;
const PER_BEAT = 3;
const FPS = 24;
const GENERATED_AT = '2026-09-05T00:00:00Z';

/**
 * Outro počinje na 288.0s (frejm-poravnato: 6912 frejmova). Vrednost je izmišljena — epizoda
 * nema skriptu pa nema ni pravi `## OUTRO` — ali je izabrana tako da end card drži ~7.2s i da
 * poslednji shot bude **skraćen, ne izbačen**: verifikacija traži da svih 33 klipa uđe u
 * montažu, a grana izbacivanja ima svoj unit test.
 */
const OUTRO_START = 288.0;

/** Dva shota seku od 0.5s umesto od nule — `use_in` koji nije 0 mora da se dokaže na pravom renderu. */
const LATE_START = new Set([7, 20]);

const DEVICES = [null, 'animated-map', null, 'crowd-as-texture', null, 'before-after',
  null, 'silhouette', null, 'macro-object', 'empty-aftermath'];

const pad = (n) => String(n).padStart(2, '0');

/**
 * Granice u frejmovima: 33 reza koji zajedno daju trajanje narracije, bez akumulacije greške.
 *
 * Sve granice su **deljive sa 3**, i to nije estetika. Vreme se u ugovoru zaokružuje na 3
 * decimale (§0.1), a `n/24` je tačno na tri decimale samo kad je `n` deljiv sa 3 (1000/24 =
 * 125/3). Bez toga `use_len` (8.917) i `t_out − t_in` (8.916) izađu kao dva različita broja i
 * invarijanta 8 padne na zaokruživanju umesto na grešci.
 */
function frameBounds(totalFrames, parts, unit = 3) {
  const units = Math.round(totalFrames / unit);
  return Array.from({ length: parts + 1 }, (_, i) => unit * Math.round((i * units) / parts));
}

const tags = (i) => ({
  subject_type: ['group', 'character', 'environment', 'architecture', 'crowd'][i % 5],
  shot_size: ['LS', 'MS', 'CU', 'XLS', 'aerial'][i % 5],
  angle: ['eye', 'low', 'high', 'overhead', 'profile'][i % 5],
  camera_motion: ['locked', 'push', 'pull', 'pan', 'track'][i % 5],
  location: ['marathon-plain', 'athenian-camp', 'persian-fleet', 'athens-agora'][i % 4],
  time_light: ['dawn-overcast', 'midday-hard-sun', 'dusk-golden', 'night-torchlit'][i % 4],
});

export async function build() {
  const narration = path.join(DIR, 'narration.mp3');
  const p = await probe(narration);
  // Ista osa kao u C05: trajanje se meri od prvog dekodiranog sempla (schemas.md §5.4 tačka 1).
  const duration = round3(p.duration - (p.start ?? 0));

  const bounds = frameBounds(Math.round(duration * FPS), SHOTS);
  const beats = [];

  for (let s = 0; s < SHOTS; s += 1) {
    const n = s + 1;
    const tIn = round3(bounds[s] / FPS);
    const tOut = round3(bounds[s + 1] / FPS);
    const useLen = round3((bounds[s + 1] - bounds[s]) / FPS);
    const useIn = LATE_START.has(n) ? 0.5 : 0;
    const beatIndex = Math.floor(s / PER_BEAT);

    if (s % PER_BEAT === 0) {
      beats.push({
        beat_id: `B${pad(beatIndex + 1)}`,
        sentences: [],
        start: tIn,
        end: 0,
        dur: 0,
        device: DEVICES[beatIndex] ?? null,
        narration_says: `[sintetički beat ${beatIndex + 1} — legacy epizoda nema script.md]`,
        viewer_sees: `[sintetički opis — storyboard postoji zbog verifikacije montaže, ne zbog sadržaja]`,
        shots: [],
      });
    }

    const beat = beats.at(-1);
    beat.sentences.push(`S${pad(s + 1)}`);
    beat.end = tOut;
    beat.dur = round3(beat.end - beat.start);

    beat.shots.push({
      shot_id: pad(n),
      beat_id: beat.beat_id,
      // Jedan lanac postoji da bi C10 imao šta da spoji; C09 svuda seče tvrdo.
      link_group: beat.beat_id === 'B05' ? 'B05' : null,
      t_in: tIn,
      t_out: tOut,
      use_in: useIn,
      use_out: round3(useIn + useLen),
      use_len: useLen,
      motion_budget: useLen < 9.0 ? useLen : null,
      source_file: `part${n}.mp4`,
      ingredient_image: null,
      characters: [],
      image_prompt: `[sintetički image prompt za shot ${pad(n)} — Marathon je legacy epizoda, `
        + 'klipovi su generisani ručno pre pipeline-a i prompt nije sačuvan]',
      animation_prompt: `[sintetički animation prompt za shot ${pad(n)} — vidi napomenu uz image prompt]`,
      tags: tags(s),
    });
  }

  return {
    schema_version: 1,
    episode: 'marathon',
    generated_at: GENERATED_AT,
    narration_duration: duration,
    fps: FPS,
    outro_start: OUTRO_START,
    beats,
  };
}

const storyboard = await build();
const json = JSON.stringify(storyboard, null, 2) + '\n';

if (process.argv.includes('--stdout')) {
  process.stdout.write(json);
} else {
  const out = path.join(DIR, 'storyboard.json');
  fs.writeFileSync(out, json, 'utf8');
  const shots = storyboard.beats.flatMap((b) => b.shots);
  const sum = round3(shots.reduce((a, s) => a + s.use_len, 0));
  console.log(`-> ${out.replace(/\\/g, '/')}`);
  console.log(`${storyboard.beats.length} beatova · ${shots.length} shotova · `
    + `zbir use_len ${sum}s · narracija ${storyboard.narration_duration}s · `
    + `razlika ${round3(Math.abs(sum - storyboard.narration_duration))}s`);
}
