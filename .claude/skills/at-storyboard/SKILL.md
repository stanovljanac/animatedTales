---
name: at-storyboard
description: Use when turning a finished script.md + narration.mp3 into storyboard.json for an Animated Tales episode - stage 05-06. Covers forced alignment, the beat plan checkpoint, shot slicing, and writing the image/animation prompt pairs. Do NOT use for QA of an existing storyboard (that is at-qa) or for assembly (at-assemble).
---

# at-storyboard — stage 05–06

Od `script.md` + `narration.mp3` do `storyboard.json`. Ti donosiš kreativne odluke;
vremena dolaze iz alata i ne diraju se rukom.

## Pravilo koje je iznad svih ostalih

> **Skripta je zamrznuta posle renderovanja narracije.**

Kad naiđeš na beat koji se teško vizualizuje, prirodni poriv je da prepraviš rečenicu.
Nemoj. `narration.mp3` je već renderovan iz te rečenice, a `timing.json` je izmeren nad tim
fajlom. Izmena teksta poništava oba i ruši ceo tajmlajn nizvodno — svaki `t_in`, svaki
`use_len`, svaki rez u montaži.

**Vizuelni problemi se rešavaju vizuelno**: drugim uređajem iz
`docs/reference/visual-devices.md`, drugim grupisanjem rečenica u beatove, drugim kadrom.
Izmena `script.md`-a je svesno vraćanje na početak lanca (novi ElevenLabs render, novi
`align.mjs`), a ne sitna popravka. Ako zaista treba — reci to korisniku i stani, ne uradi
sam.

Iz istog razloga alat ne dozvoljava da beat mapa nosi svoj tekst narracije:
`beatplan.mjs` uvek izvodi `narration_says` iz `timing.json`-a.

## Tok

Šest koraka. Checkpoint na trećem je jedino mesto gde se staje.

### 1. Alignment

```
node tools/align.mjs episodes/<slug>
```

Piše `episodes/<slug>/timing.json`. Izlaz javlja trajanje, broj rečenica, broj gapova >1.5s,
broj rečenica ispod `confidence 0.85`, procenat poklapanja tokena i `outro_start`.

Pročitaj taj red pre nego što nastaviš:

| Signal | Šta znači | Šta radiš |
|---|---|---|
| gapovi >1.5s | tišina u narraciji | proveri da nije greška u renderu narracije |
| mnogo rečenica ispod 0.85 | ASR nesiguran | rerun sa `--model medium.en` |
| `⚠ … rečenica koje whisper nije čuo` | vreme je **interpolirano**, ne izmereno | pogledaj te rečenice pojedinačno |
| `outro_start null` | skripta nema `## OUTRO` | end card u montaži nema odakle da krene — javi korisniku |

Opcije: `--model <small.en|medium.en>` · `--force` (ignoriši keš) · `--asr-only` ·
`--asr-script` (legacy epizode bez `script.md`).

### 2. Beat plan

Grupiši rečenice iz `timing.json`-a u beatove. Beat je **jedinica kreativne odluke**: jedna
misao, jedna lokacija, jedan vizuelni potez. Trajanje beata je zbir njegovih rečenica i
ispada tačno iz izmerenih vremena — ne procenjuje se.

Zapiši mapu u `episodes/<slug>/beats.json`:

```json
[
  { "beat_id": "B01",
    "sentences": ["S01", "S02"],
    "device": "animated-map",
    "viewer_sees": "ANIMATED MAP — granice se šire, trgovačke rute se iscrtavaju",
    "tags": { "location": "via-flaminia", "time_light": "dawn-overcast" } }
]
```

- `sentences` mora da pokrije **sve** rečenice iz `timing.json`, svaku tačno jednom, u
  redosledu (invarijanta 4). Alat javlja `beat-coverage` kad ne pokriva.
- `beat_id` sme da izostane i tada se izvodi iz redosleda; kad stoji, mora da bude `B01…Bnn`
  bez rupa.
- `device` je slug iz kataloga u `docs/reference/visual-devices.md`, ili `null` kad je beat
  konkretan i ilustruje se doslovno. Uređaj je **obavezan** kad je narracija apstraktna ili
  zbirna — prosperitet, decenije, trgovina, rast, opadanje, sistem, poređenje.
- `viewer_sees` je ono što se **vidi**. Kod apstraktnih beatova ne sme da bude preslikavanje
  imenica iz narracije.
- `tags` je opcion i gazi samo navedene ose. `location` i `time_light` su po pravilu
  osobine beata, ne pojedinačnog shota, pa ih je najjeftinije postaviti ovde.

`narration_says` **ne pišeš** — izvodi se iz `timing.json`-a.

### 3. ⏸ CHECKPOINT — podrazumevano uključen

```
node tools/beatplan.mjs episodes/<slug> --beats episodes/<slug>/beats.json
```

Bez `--write` alat ne dodiruje disk. Ispiši izlaz korisniku **doslovno** i sačekaj odobrenje.

```
B03  [00:41.2–01:04.6]  23.4s  → 3 shota
     NARRATION SAYS: "Under Caesar, Rome prospered as never before…"
     VIEWER SEES:    ANIMATED MAP — granice se šire, trgovačke rute se iscrtavaju,
                     luke se množe duž obale
```

Ispod plana dolaze zbirni redovi (broj beatova i shotova, prosečan `use_len`, udeo u
ciljnom opsegu 7–9s, upotrebljeni uređaji) i upozorenja splittera.

**Zašto se staje baš ovde.** Beat plan je pravo usko grlo sistema, ne linter. Sve nizvodno
se izvodi iz grupisanja rečenica. Ako je grupisanje pogrešno, matematika je savršena a video
je i dalje loš — i to se otkriva tek posle 30 napisanih promptova. Korisnik odobrava ili
prepravlja za ~2 minuta, **i tek onda se piše ijedan prompt.**

Kad je skil pozvan sa `--no-review` (argument **skila**, ne alata), preskoči pauzu i idi
pravo na korak 4. Nijedan drugi razlog ne preskače checkpoint.

Upozorenja splittera su **podaci, ne prekršaji sheme** — storyboard sa rezom unutar rečenice
i dalje prolazi BLOCKING:

| Kod | Šta znači |
|---|---|
| `intra-sentence-cut` | rez pada na granicu reči jer nijedna podela po rečenicama ne staje u 3–10s |
| `blind-cut` | za tu rečenicu nema vremena po rečima; tačka reza je pogođena, ne izmerena — proveri je |
| `forced-split` | jednaka podela bez obzira na granice |
| `beat-coverage` | mapa ne pokriva sve rečenice tačno jednom i u redosledu |
| `tail-absorbed` | rep tišine posle poslednje rečenice pripojen je poslednjem shotu — normalan ishod, samo pogledaj koliko ga ima |
| `narration-tail` | rep tišine ostaje bez slike i T1 (±0.2s) će pasti — posle C13 samo ako je `timelineEnd: null` prosleđen svesno |

`tail-absorbed` ne traži nikakvu akciju. Popravka za ostala je ista: **prepravi beat mapu**, ne
splitter. Beat kraći od 3.0s spaja se sa
susedom; beat koji stalno traži `blind-cut` je prevelik i deli se.

### 4. Upis skeleta

Posle odobrenja:

```
node tools/beatplan.mjs episodes/<slug> --beats episodes/<slug>/beats.json --write
```

**Epizoda od slika** (`--still`) je odluka koja se donosi **ovde, pre upisa** — ne kasnije,
jer menja granice reza i time ceo tempo epizode:

```
node tools/beatplan.mjs episodes/<slug> --beats episodes/<slug>/beats.json --still --write
```

Sa `--still` rez je 2.5–9.0s (cilj 5s) umesto 3.0–10.0s (cilj 8s), pa epizoda od četiri minuta
dobija ~40–50 kadrova umesto 27. Svaki shot izlazi kao `render_mode: "still"`,
`still_motion: "hold"`, `animation_prompt: null`, `source_file: shots/shotNN.jpeg`. Razlog je
budžet: slika je u Flow-u besplatna, klip nije, pa cela epizoda može da stane u nula kredita
(`docs/reference/google-ai-plus.md`). Mešanje je dozvoljeno — pojedinačni shot se posle ručno
prebaci u clip kad kadar stvarno traži animaciju.

Piše `storyboard.json` na **shemi 2** (`schema_version: 2`), sa popunjenim vremenima i **praznim
promptovima**: `image_prompt` i `animation_prompt` su `""`, `characters` i `visual_priority` su
`[]`, `ingredient_image` i `link_group` su `null`, a tagovi su placeholder
(`location`/`time_light` = `tbd`) osim onih iz beat mape.

To je namerno vidljivo nedovršeno stanje — `lint.mjs` nad ovakvim skeletom prijavljuje P1/P2/S2
na svakom shotu. Skelet ne sme da izgleda gotovo.

Ponovni upis traži `--force`, jer gazi promptove.

### 5. Promptovi

Po paru na shot, po šablonima iz `docs/reference/prompt-templates.md`, **odeljak „Shema 2"**.
**Ne prepisuj taj fajl ovde** — otvori ga i radi po njemu. Ukratko: P1 = 90–280 reči (meki cilj
180–260, R5), P2 = 60–100 reči, kanonskim brojačem iz `schemas.md` §0.6, koji broji i nazive
blokova.

**Pre prvog prompta odluči osu ekrana** (`camera-language.md`, „Osa ekrana — jedna po epizodi") i
upiši je u `notes.md`. Osa ulazi u `FRAME LAYOUT`, `FACING`, `SCREEN DIRECTION`, `CAMERA` i
`NOT IN FRAME` svakog kadra; posle 27 napisanih promptova njena promena znači 27 prepravki.

Uz njega idu, i svaki nosi svoj deo:

| Fajl | Šta uzimaš odatle |
|---|---|
| `docs/reference/style-string.md` | kanonski `STYLE:` string, doslovno u svaki image prompt |
| `docs/reference/camera-language.md` | pravila za pet kamera-blokova i lista zabranjenih prostornih fraza (S1) |
| `docs/reference/visual-devices.md` | katalog uređaja i kada se koji koristi |
| `episodes/<slug>/episode.json` | `locked_description` svakog lika/lokacije/rekvizita, doslovno (C1) |

Popuni i `characters[]` (`id`-jevi iz `episode.json`), `visual_priority` (3–5 stavki, `[0]`
imenuje PRIMARY lock), `tags` (šest osa, `schemas.md` §3.5) i `link_group` tamo gde shotovi
jednog beata čine A/B/C lanac istog kadra.

**`characters[0]` je PRIMARY lock i njegov opis mora da stoji u `SUBJECT` bloku** — ne bilo gde u
promptu (to bi prošlo C1, ali pada na S5). PRIMARY je entitet koji je vizuelni subjekt kadra na
veličini na kojoj mu se opis vidi; ostali idu u `SUBJECT 2` i dalje.

Budžet: 16 reči na `STYLE` + 25–40 po `locked_description`-u + 30–40 na `SCALE` kad je entitet
`scale_critical`. Izmereno na prvoj epizodi: **dva locka su stvarna granica**, ne tri koliko
dozvoljava `LIMITS.maxLocks` — kadar sa tri probija 280. Kadar kome trebaju tri se rasformira na
dva shota; opis se ne skraćuje (skraćivanje ruši C1).

**Promptove ne kucaj lock po lock.** `locked_description`-e i `STYLE` čitaj iz `episode.json` i
`style-string.md` programski i ubacuj doslovno — ručno prepisivanje istog opisa u 9 kadrova je
tačno ono što C1 i S5 hvataju, i najskuplje je da se otkrije na kraju.

### 6. Render i provera

```
node tools/lint.mjs episodes/<slug> --no-media
node tools/render.mjs episodes/<slug>
```

`--no-media` preskače F1 (klipovi još ne postoje — ovo je storyboard faza).

> **`storyboard.md` se nikad ne piše ni menja ručno.** Nastaje isključivo kroz `render.mjs` i
> nosi `DO-NOT-EDIT` zaglavlje. Jedini source of truth je `storyboard.json`.

Kad BLOCKING padne na nulu, produkciona čeklista za Flow:

```
node tools/shotlist.mjs episodes/<slug>
```

## Vizuelni modovi

Alat za izbor, ne obavezne kategorije. Uzmi najjednostavnije rešenje koje radi.

| Mod | Kada |
|---|---|
| **narrative visualization** | doslovno pokazuje šta se dešava |
| **narrative extension** | širi ideja, posledica, kontekst ili proces umesto ponavljanja narracije |
| **environmental storytelling** | sama sredina nosi informaciju — arhitektura, teren, naselja, brodovi, putevi, alati |
| **visual journey / montage** | jedan klip postupno prolazi kroz nekoliko povezanih vizuelnih stanja |
| **still image montage** | niz nezavisnih statičnih slika kad animacija ne dodaje mnogo |

**Still montage** je legitiman kad narracija postane refleksivna, kad treba sažeti više
lokacija, kad prelaz dobija na statičnoj slici ili kad zaključak dobija na vizuelnim pauzama.
Nije podrazumevana zamena za animaciju.

### Still kadar — mašinski oblik

Still montage ima parnjak u ugovoru (`schemas.md` §3.3.2): shot sa `render_mode: "still"` je
jedna slika kojoj pokret kamere daje **montaža**, ne Flow. Po takvom shotu:

| Polje | Vrednost |
|---|---|
| `still_motion` | `push` · `pull` · `pan-left` · `pan-right` · `hold` |
| `animation_prompt`, `motion_budget`, `ingredient_image` | `null` |
| `source_file` | `shots/shotNN.jpeg` |
| `use_in` | `0.0`, a `use_len` u 2.5–9.0s |

`image_prompt`, S2 blokovi, lockovi i `visual_priority` rade **potpuno isto** — still kadar je i
dalje kadar.

**`still_motion` se bira u istom dahu sa `tags.camera_motion`**, i to dvoje mora da se slaže:
`push`↔`push`, `pull`↔`pull`, `pan-left`/`pan-right`↔`pan`, `hold`↔`locked`. R7 prijavljuje
neslaganje. `track`, `parallax` i `reveal` nad jednom slikom nemaju parnjaka — ako kadar zaista
traži jedan od njih, on traži klip, ne sliku.

Smer panovanja **mora da prati `SCREEN DIRECTION`**: to je jedino mesto u promptu na kome piše
šta se kreće preko kadra, i pokret kamere koji ide protiv njega vidi se kao greška. Iznos zuma
se ne bira — konstanta je u rendereru, da bi cela epizoda imala jedan izgled.

`hold` je pun izbor, ne izostanak izbora: postoji da bi rez imao gde da stane. Niz od pet
identičnih zumova je isto tako umoran kao slajdšou.

## Early motion

**Važi za clip shotove.** Still kadar nema animation prompt — njegov pokret je `still_motion`.

Osim kad je kadar **namerno miran ili refleksivan**, smislen pokret počinje u prve 2–3 sekunde.

Izbegavaj klipove kojima je prvih nekoliko sekundi u suštini statična slika sa sitnim
ambijentalnim pomeranjem. Pokret sme da dođe od lika, objekta, sredine, kamere, otkrivanja
(reveal) ili kretanja kroz prostor — bilo šta od toga, ali nešto.

Praktično: prvi vremenski prorez animation prompta (`0–1s:`) mora da nosi stvarnu radnju, ne
atmosferu. `at-qa` ovo meri.

## Šta ovaj skil ne radi

- **Ne menja `script.md`.** Nikad, ni pod kojim uslovom. Vidi pravilo na vrhu.
- **Ne piše `storyboard.md`.** To radi `render.mjs`.
- **Ne dira `timing.json`.** Merena činjenica; jedini način izmene je novi `align.mjs` run
  nad novim `narration.mp3`.
- **Ne računa vremena.** `t_in`, `use_len`, `motion_budget` i granice beatova dolaze iz
  `beatplan.mjs`/`timeline.mjs`. Ručno upisano vreme u `storyboard.json` je bug.
- **Ne popravlja pale shotove posle QA.** To je `at-qa`.
