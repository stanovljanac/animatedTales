// tools/timeline.mjs
//
// Sečenje beata na shotove. Čist modul: nijedan poziv fajl-sistemu, sve ulazi kao argument.
//
//   sliceBeat(sentences, opts)      -> { shots, warnings }
//   planTimeline(timing, beats, opts) -> { fps, beats, shots, warnings }
//
// ---------------------------------------------------------------------------
// Algoritam
// ---------------------------------------------------------------------------
// Izvorni plan propisuje:
//
//   D = trajanje beata
//   ako D <= 10.0  -> 1 shot, use = D
//   inače:
//     n = ceil(D / 9.0)
//     podeli rečenice u n grupa čije su sume najbliže jednake
//     ako je bilo koja grupa < 3.0s -> smanji n i ponovi
//     zaokruži na 1 frejm, poslednji shot upija ostatak
//
// uz sekundarni cilj „bira n koje daje najmanje odstupanje od 8s" i tvrde granice 3.0–10.0s.
//
// Ovde je to implementirano kao jedna optimizacija umesto kao petlja koja smanjuje n:
//
//   minimizuj  Σ (use_len_i − targetShot)²   pod uslovom  minShot ≤ use_len_i ≤ maxShot
//
// nad svim podelama na granicama rečenica. Broj shotova nije zadat unapred — ispada iz
// rešenja. To je ista stvar, izražena direktno:
//   · „grupe najbliže jednake" i „najmanje odstupanje od 8s" su isti kriterijum (kvadratna
//     kazna); ranije su bila dva koraka koja mogu da se posvađaju.
//   · „grupa < 3.0s -> smanji n i ponovi" je ovde tvrdo ograničenje, pa se n koje bi
//     proizvelo prekratku grupu nikad ni ne razmatra.
//   · verbatim petlja nema izlaz kad nijedno n ne prolazi (vidi „ivicu" niže) — ova formulacija
//     jednostavno ne nađe rešenje i pređe na sledeći nivo kandidata.
// Provereno na svim slučajevima iz C04 tabele: 4.6s -> 1 shot; 23.4s -> 3; 11.5s -> 2×5.75
// (nikad 10+1.5); 20s -> 3×6.67 umesto 2×10, tačno kao ceil(D/9).
//
// ---------------------------------------------------------------------------
// Ivica koju izvorni plan nema: beat koji se ne može iseći na granicama rečenica
// ---------------------------------------------------------------------------
// Beat od 30.5s sa dve rečenice (14s + 16.5s), ili jedna rečenica od 12s, ne mogu istovremeno
// da poštuju „max 10s po shotu" i „rez pada na granicu rečenice". Ponašanje (odluka C04):
//
//   1. nivo — rezovi samo na granicama rečenica. Kad postoji rešenje, uzima se i nema upozorenja.
//   2. nivo — dodaju se rezovi na granicama reči iz `timing.json.words`, svaki sa velikom
//      kaznom, pa ih rešenje koristi samo kad prvi nivo nema rešenje. Upozorenje
//      `intra-sentence-cut` po svakom takvom rezu.
//   3. nivo — kad za rečenicu nema vremena po rečima, kandidati su tačke na mreži od 0.25s
//      unutar rečenice. Upozorenje `blind-cut`.
//   4. nivo — ako ni to nema rešenje: jednaka podela na n = round(D/target) delova, bez obzira
//      na granice. Upozorenje `forced-split`. sliceBeat nikad ne baca zbog trajanja.
//
// Upozorenja su podaci, ne izuzeci: `at-storyboard` ih prikazuje korisniku i on odlučuje da li
// da prepravi beat mapu. Isto je zapisano u docs/reference/schemas.md §5.3.
//
// ---------------------------------------------------------------------------
// Gde tačno pada rez između dve rečenice
// ---------------------------------------------------------------------------
// Rez je uvek `start` sledeće rečenice, ne `end` prethodne. Pauza između rečenica time pripada
// shotu koji se završava, a novi shot počinje tačno na prvoj reči. Dva razloga:
//   · schemas.md invarijanta 5 traži da `beat.start`/`beat.end` budu vrednosti prepisane iz
//     `timing.json` neizmenjene — `start` sledeće rečenice to jeste, sredina pauze nije;
//   · invarijanta 7 traži tajmlajn bez rupa, pa pauza mora da pripadne nekom shotu.
// Ista konvencija važi i unutar beata i na granici između beatova (`planTimeline`).

import { EPS, LIMITS, isFrameAligned, q, round3 } from './contract.mjs';

// ---------------------------------------------------------------- konstante

/** Podrazumevane vrednosti; ista imena kao ključevi u tools/config.json. */
export const DEFAULTS = {
  fps: 24,
  minShot: 3.0,
  maxShot: 10.0,
  targetShot: 8.0,
  /** Ispod ovoga se popunjava motion_budget (schemas.md T3). */
  motionBelow: 9.0,
  /** Korak mreže za 3. nivo kandidata, u sekundama. */
  gridStep: 0.25,
};

/** Kazne po rezu; red veličine iznad najgore kvadratne kazne (64), pa nivoi ne mogu da se pomešaju. */
const PENALTY = { sentence: 0, word: 1e4, grid: 1e5 };

// ---------------------------------------------------------------- helperi
//
// Kanonski helperi i tolerancija žive u tools/contract.mjs — jedna definicija za ceo lanac
// (schemas.md §0). Ovde se re-eksportuju da javni API modula ostane isti.

export { q, round3, isFrameAligned };

const warn = (code, message, extra = {}) => ({ code, message, beat_id: null, sentence_id: null, at: null, ...extra });

// ---------------------------------------------------------------- kandidati za rez

function sentenceCuts(sentences, lo, hi, fps) {
  const out = [];
  for (let i = 1; i < sentences.length; i++) {
    const t = q(sentences[i].start, fps);
    if (t > lo + EPS && t < hi - EPS) {
      out.push({ t, kind: 'sentence', sentence_id: sentences[i].id });
    }
  }
  return out;
}

function intraCuts(sentences, words, lo, hi, fps, gridStep) {
  const byId = new Map();
  for (const w of words ?? []) {
    if (!byId.has(w.sentence_id)) byId.set(w.sentence_id, []);
    byId.get(w.sentence_id).push(w);
  }

  const out = [];
  for (const s of sentences) {
    const own = (byId.get(s.id) ?? []).slice().sort((a, b) => a.start - b.start);
    if (own.length >= 2) {
      // rez pada na početak reči — ista konvencija kao rez na početku rečenice
      for (let i = 1; i < own.length; i++) {
        const t = q(own[i].start, fps);
        if (t > lo + EPS && t < hi - EPS && t > q(s.start, fps) + EPS && t < q(s.end, fps) - EPS) {
          out.push({ t, kind: 'word', sentence_id: s.id });
        }
      }
    } else {
      for (let t = s.start + gridStep; t < s.end - gridStep / 2; t += gridStep) {
        const qt = q(t, fps);
        if (qt > lo + EPS && qt < hi - EPS) out.push({ t: qt, kind: 'grid', sentence_id: s.id });
      }
    }
  }
  return out;
}

/** Spaja kandidate u rastući niz jedinstvenih tačaka; kod duplikata pobeđuje jeftinija vrsta. */
function pointSet(lo, hi, groups) {
  const best = new Map();
  for (const c of groups.flat()) {
    const key = c.t.toFixed(3);
    const prev = best.get(key);
    if (!prev || PENALTY[c.kind] < PENALTY[prev.kind]) best.set(key, c);
  }
  const interior = [...best.values()].sort((a, b) => a.t - b.t);
  return [
    { t: lo, kind: 'sentence', sentence_id: null },
    ...interior,
    { t: hi, kind: 'sentence', sentence_id: null },
  ];
}

// ---------------------------------------------------------------- optimizacija

/**
 * Najjeftinija podela niza tačaka na segmente unutar [minShot, maxShot].
 * @returns {number[]|null} indeksi izabranih tačaka (uvek počinje sa 0 i završava poslednjom), ili null.
 */
function solve(points, { minShot, maxShot, targetShot }) {
  const n = points.length;
  const dp = new Array(n).fill(Infinity);
  const from = new Array(n).fill(-1);
  dp[0] = 0;

  for (let j = 1; j < n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      const len = points[j].t - points[i].t;
      if (len > maxShot + EPS) break; // dalje ulevo je samo duže
      if (len < minShot - EPS) continue;
      if (dp[i] === Infinity) continue;
      const cost = dp[i] + (i === 0 ? 0 : PENALTY[points[i].kind]) + (len - targetShot) ** 2;
      if (cost < dp[j]) {
        dp[j] = cost;
        from[j] = i;
      }
    }
  }

  if (dp[n - 1] === Infinity) return null;
  const path = [];
  for (let j = n - 1; j !== -1; j = from[j]) path.push(j);
  return path.reverse();
}

/** Poslednji nivo: jednaka podela bez obzira na granice. */
function forcedSplit(lo, hi, fps, { minShot, maxShot, targetShot }) {
  const D = hi - lo;
  let n = Math.max(1, Math.round(D / targetShot));
  while (D / n > maxShot) n++;
  while (n > 1 && D / n < minShot) n--;
  const pts = [{ t: lo, kind: 'grid', sentence_id: null }];
  for (let i = 1; i < n; i++) pts.push({ t: q(lo + (D * i) / n, fps), kind: 'grid', sentence_id: null });
  pts.push({ t: hi, kind: 'grid', sentence_id: null });
  return pts;
}

// ---------------------------------------------------------------- sliceBeat

/**
 * Seče jedan beat na shotove.
 *
 * @param {Array<{id: string, start: number, end: number, text?: string}>} sentences
 *        Rečenice beata iz `timing.json`, u redosledu. Merene vrednosti, nisu frejm-poravnate.
 * @param {object} [opts]
 * @param {number} [opts.fps=24]
 * @param {number} [opts.minShot=3.0]
 * @param {number} [opts.maxShot=10.0]
 * @param {number} [opts.targetShot=8.0]
 * @param {number} [opts.motionBelow=9.0]
 * @param {string} [opts.beatId=null]   upisuje se u shotove i u upozorenja
 * @param {number} [opts.beatStart]     podrazumevano `sentences[0].start`
 * @param {number} [opts.beatEnd]       podrazumevano poslednji `sentences.end`
 * @param {Array<{sentence_id: string, word: string, start: number, end: number}>} [opts.words]
 *        Reči iz `timing.json`; koriste se samo kad rez na granici rečenice nije moguć.
 * @param {number} [opts.useIn=0]       odakle se seče generisani klip
 * @returns {{shots: Array<object>, warnings: Array<object>}}
 */
export function sliceBeat(sentences, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const { fps, minShot, maxShot, motionBelow } = o;
  const beatId = opts.beatId ?? null;
  const useIn = opts.useIn ?? 0;

  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new TypeError('sliceBeat: sentences mora biti neprazan niz');
  }
  sentences.forEach((s, i) => {
    if (typeof s?.start !== 'number' || typeof s?.end !== 'number' || !(s.end > s.start)) {
      throw new TypeError(`sliceBeat: rečenica ${s?.id ?? i} nema ispravan par start/end`);
    }
    if (i > 0 && s.start < sentences[i - 1].end - EPS) {
      throw new TypeError(`sliceBeat: rečenica ${s.id} se preklapa sa prethodnom`);
    }
  });

  const beatStart = opts.beatStart ?? sentences[0].start;
  const beatEnd = opts.beatEnd ?? sentences[sentences.length - 1].end;
  if (beatStart > sentences[0].start + EPS || beatEnd < sentences[sentences.length - 1].end - EPS) {
    throw new TypeError('sliceBeat: beatStart/beatEnd ne obuhvataju sve rečenice beata');
  }

  const lo = q(beatStart, fps);
  const hi = q(beatEnd, fps);
  const total = round3(hi - lo);
  const warnings = [];

  const emit = (points, extraWarnings = []) => {
    warnings.push(...extraWarnings);
    const shots = [];
    let acc = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const last = i === points.length - 2;
      const tIn = round3(points[i].t);
      // poslednji shot upija ostatak kvantizacije (schemas.md invarijanta 6)
      const useLen = last ? round3(total - acc) : round3(points[i + 1].t - points[i].t);
      acc = round3(acc + useLen);
      const tOut = round3(tIn + useLen);
      shots.push({
        beat_id: beatId,
        t_in: tIn,
        t_out: tOut,
        use_in: round3(useIn),
        use_out: round3(useIn + useLen),
        use_len: useLen,
        motion_budget: useLen < motionBelow - EPS ? useLen : null,
        sentences: sentences
          .filter((s) => s.end > tIn + EPS && s.start < tOut - EPS)
          .map((s) => s.id),
      });
    }
    return { shots, warnings };
  };

  // D <= maxShot -> jedan shot, verbatim iz izvornog plana
  const D = beatEnd - beatStart;
  if (D <= maxShot + EPS) {
    if (total < minShot - EPS) {
      warnings.push(
        warn(
          'beat-too-short',
          `beat traje ${total}s, ispod minimuma od ${minShot}s — T2 će ga prijaviti; ` +
            'spoji ga sa susednim beatom u beat mapi',
          { beat_id: beatId, at: lo },
        ),
      );
    }
    return emit([
      { t: lo, kind: 'sentence', sentence_id: null },
      { t: hi, kind: 'sentence', sentence_id: null },
    ]);
  }

  // 1. nivo — samo granice rečenica
  const sCuts = sentenceCuts(sentences, lo, hi, fps);
  let points = pointSet(lo, hi, [sCuts]);
  let path = solve(points, o);

  // 2. i 3. nivo — granice reči, pa mreža unutar rečenice
  if (!path) {
    const iCuts = intraCuts(sentences, opts.words, lo, hi, fps, o.gridStep);
    points = pointSet(lo, hi, [sCuts, iCuts]);
    path = solve(points, o);
  }

  // 4. nivo — jednaka podela, bez obzira na granice
  if (!path) {
    const forced = forcedSplit(lo, hi, fps, o);
    return emit(forced, [
      warn(
        'forced-split',
        `beat od ${total}s se ne može iseći ni na granici reči uz ograničenja ` +
          `${minShot}–${maxShot}s; podeljen je na ${forced.length - 1} jednaka dela na proizvoljnim ` +
          'tačkama. Rez pada usred govora — proveri beat ručno.',
        { beat_id: beatId, at: lo },
      ),
    ]);
  }

  const chosen = path.map((i) => points[i]);
  const extra = [];
  for (const p of chosen.slice(1, -1)) {
    if (p.kind === 'word') {
      extra.push(
        warn(
          'intra-sentence-cut',
          `rez na ${p.t}s pada unutar rečenice ${p.sentence_id} (na granici reči) — nijedna podela ` +
            `po granicama rečenica ne staje u ${minShot}–${maxShot}s`,
          { beat_id: beatId, sentence_id: p.sentence_id, at: p.t },
        ),
      );
    } else if (p.kind === 'grid') {
      extra.push(
        warn(
          'blind-cut',
          `rez na ${p.t}s pada unutar rečenice ${p.sentence_id}, a za nju nema vremena po rečima — ` +
            'tačka reza je pogođena, ne izmerena. Proveri je pre generisanja.',
          { beat_id: beatId, sentence_id: p.sentence_id, at: p.t },
        ),
      );
    }
  }
  return emit(chosen, extra);
}

// ---------------------------------------------------------------- planTimeline

/**
 * Seče celu epizodu: `timing.json` + beat mapa -> shotovi sa globalnim `shot_id` i pozicijom
 * na tajmlajnu. I dalje bez fajl I/O — `timing` je već isparsiran objekat.
 *
 * Granice beatova prate istu konvenciju kao rezovi unutar beata: beat se završava tamo gde
 * počinje prva rečenica sledećeg beata, pa je tajmlajn neprekidan (schemas.md invarijanta 7).
 *
 * Oba kraja tajmlajna su tišina i tretiraju se isto. Prvi beat počinje na `timelineStart`
 * (podrazumevano 0.0), ne na `sentences[0].start` — narracija epizode
 * *night-when-rome-almost-fell* počinje na 0.025057s, a tajmlajn mora da krene od nule.
 * Poslednji beat se simetrično završava na `timelineEnd` (podrazumevano `timing.duration`),
 * ne na `end` svoje poslednje rečenice — rep tišine posle poslednje reči inače ne bi pripao
 * nijednom shotu i invarijanta 11 (T1, ±0.2s) bi pala na svakoj epizodi koja ima rep duži od
 * toga. Tišina se u oba slučaja samo pripaja krajnjem shotu; konvencija oduzimanja ofseta pri
 * lepljenju audia pripada C05/C09 (vidi schemas.md §5.5).
 *
 * Produženi kraj ulazi u `sliceBeat` kao `beatEnd`, ne dodaje se gotovom shotu — zato rep ne
 * može da probije `maxShot`: optimizacija ga vidi i po potrebi seče beat na jedan shot više.
 *
 * @param {{sentences: Array<object>, words?: Array<object>, duration?: number}} timing
 * @param {Array<{beat_id: string, sentences: string[]}>} beats
 * @param {object} [opts] isto kao sliceBeat, plus `timelineStart` i `timelineEnd`
 *        (`timelineEnd: null` isključuje produžetak i vraća staro ponašanje — poslednji beat
 *        se završava na poslednjoj rečenici, a rep se prijavljuje kao `narration-tail`)
 * @returns {{fps: number, beats: Array<object>, shots: Array<object>, warnings: Array<object>}}
 */
export function planTimeline(timing, beats, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const timelineStart = opts.timelineStart ?? 0;
  const timelineEnd = opts.timelineEnd !== undefined
    ? opts.timelineEnd
    : (typeof timing.duration === 'number' ? timing.duration : null);

  if (!timing || !Array.isArray(timing.sentences) || timing.sentences.length === 0) {
    throw new TypeError('planTimeline: timing.sentences mora biti neprazan niz');
  }
  if (!Array.isArray(beats) || beats.length === 0) {
    throw new TypeError('planTimeline: beat mapa mora biti neprazan niz');
  }

  const byId = new Map(timing.sentences.map((s) => [s.id, s]));
  const groups = beats.map((b) => {
    const ss = b.sentences.map((id) => {
      const s = byId.get(id);
      if (!s) throw new TypeError(`planTimeline: beat ${b.beat_id} referiše nepoznatu rečenicu ${id}`);
      return s;
    });
    if (ss.length === 0) throw new TypeError(`planTimeline: beat ${b.beat_id} nema nijednu rečenicu`);
    return { beat_id: b.beat_id, sentences: ss };
  });

  const warnings = [];

  // invarijanta 4: beatovi pokrivaju sve rečenice, svaku tačno jednom, u redosledu
  const flat = groups.flatMap((g) => g.sentences.map((s) => s.id));
  const expected = timing.sentences.map((s) => s.id);
  if (flat.join(',') !== expected.join(',')) {
    warnings.push(
      warn(
        'beat-coverage',
        'beat mapa ne pokriva sve rečenice iz timing.json tačno jednom i u redosledu ' +
          `(mapa ima ${flat.length}, timing ${expected.length})`,
      ),
    );
  }

  const outBeats = [];
  const outShots = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const next = groups[i + 1];
    const lastSentenceEnd = g.sentences[g.sentences.length - 1].end;
    const start = i === 0 ? Math.min(timelineStart, g.sentences[0].start) : g.sentences[0].start;
    const end = next
      ? next.sentences[0].start
      : (timelineEnd === null ? lastSentenceEnd : Math.max(timelineEnd, lastSentenceEnd));

    const { shots, warnings: w } = sliceBeat(g.sentences, {
      ...o,
      words: opts.words ?? timing.words,
      beatId: g.beat_id,
      beatStart: start,
      beatEnd: end,
    });
    warnings.push(...w);

    for (const s of shots) {
      s.shot_id = String(outShots.length + 1).padStart(2, '0');
      s.link_group = null;
      s.source_file = `shots/part${s.shot_id}.mp4`;
      outShots.push(s);
    }
    outBeats.push({
      beat_id: g.beat_id,
      start: round3(start),
      end: round3(end),
      dur: round3(end - start),
      sentences: g.sentences.map((s) => s.id),
      shots,
    });
  }

  // invarijanta 11 / T1: zbir use_len naspram trajanja mp3 fajla.
  //
  // Rep tišine posle poslednje rečenice je od C13 pripojen poslednjem shotu (vidi gore), pa je
  // `tail-absorbed` normalan ishod i samo se prijavljuje — čovek na checkpointu treba da vidi
  // koliko slike pokriva tišinu, jer rep od par sekundi nije isto što i rep od 0.4s.
  // `narration-tail` ostaje sa nepromenjenim značenjem: rep koji **niko nije pokrio** i zbog
  // kojeg T1 pada. Posle produžetka to može samo kad je `timelineEnd: null` prosleđen svesno.
  //
  // Oba praga su `LIMITS.t1Drift`, i to nije slučajno: ispod njega rep uopšte nije problem —
  // T1 bi prošao i da niko ništa nije pripojio — pa nema šta ni da se prijavi.
  const lastEnd = outBeats[outBeats.length - 1].end;
  const lastSaid = groups[groups.length - 1].sentences.at(-1).end;
  if (typeof timing.duration === 'number' && timing.duration - lastEnd > LIMITS.t1Drift) {
    warnings.push(
      warn(
        'narration-tail',
        `narracija traje ${round3(timing.duration)}s, a tajmlajn se završava na ${lastEnd}s — ` +
          `${round3(timing.duration - lastEnd)}s repa ostaje bez slike i T1 (±${LIMITS.t1Drift}s) će pasti`,
        { at: lastEnd },
      ),
    );
  } else if (lastEnd - lastSaid > LIMITS.t1Drift) {
    warnings.push(
      warn(
        'tail-absorbed',
        `${round3(lastEnd - lastSaid)}s tišine posle poslednje rečenice pripojeno je poslednjem ` +
          `shotu, da bi tajmlajn pokrio celu narraciju (${round3(lastEnd)}s)`,
        { beat_id: outBeats[outBeats.length - 1].beat_id, at: round3(lastSaid) },
      ),
    );
  }

  return { fps: o.fps, beats: outBeats, shots: outShots, warnings };
}
