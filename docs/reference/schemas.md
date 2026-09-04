# Data ugovori — `episode.json`, `timing.json`, `storyboard.json`

**Status:** zaključano u C01. Svaka izmena ovog fajla je izmena ugovora između alata i mora
da prođe kroz sve potrošače.

**Potrošači:** `tools/lint.mjs`, `tools/render.mjs`, `tools/shotlist.mjs`, `tools/assemble.mjs`,
`tools/timeline.mjs`, `tools/align.mjs`, i skilovi `at-storyboard`, `at-qa`, `at-assemble`.

Ovaj fajl je **jedini izvor istine za oblik podataka**. `docs/reference/*.md` (C02) su izvor istine
za *sadržaj* promptova; ovde se opisuje samo kako taj sadržaj stoji u JSON-u i koja polja postoje.

---

## 0. Opšte konvencije

Važe za sva tri fajla.

**Ugovor je izvršan.** `tests/check-fixtures.mjs` implementira svaku invarijantu iz ovog dokumenta
i svaku BLOCKING proveru iz sekcije 4, pa ih pušta nad `tests/fixtures/`:

```bash
node tests/check-fixtures.mjs
```

Kanonski helperi (`countWords`, `normalize`, `q`, `isFrameAligned`) tamo su izvezeni — `lint.mjs`
(C06) ih preuzima, ne piše ponovo. Kad se ovaj dokument promeni, menja se i taj fajl.

### 0.1 Vreme

- Sve vremenske vrednosti su **sekunde**, kao JSON `number`, **nikad string** i nikad `mm:ss`.
- Zapisuju se zaokružene na **3 decimale** (`4.62`, `217.213`). Više decimala nema smisla —
  jedan frejm na 24fps je 0.0417s.
- `dur` / `use_len` su uvek `end - start` odnosno `use_out - use_in`, izračunate a ne nezavisno
  upisane. Kad se razilaze, merodavan je par `start`/`end` i to je greška koju linter prijavljuje.

### 0.2 Frejm-poravnanje

`timing.json` **nije** frejm-poravnan — to su merene vrednosti iz audia i zaokruživanje bi
uništilo tačnost alignmenta.

`storyboard.json` polja `use_in`, `use_out`, `use_len`, `t_in`, `t_out` **jesu** frejm-poravnana,
jer se od njih pravi `ffmpeg -ss/-t` rez. Kanonska kvantizacija na `fps` iz `tools/config.json`:

```js
const q = (t, fps) => Math.round(Math.round(t * fps) / fps * 1000) / 1000;
```

Provera poravnanja (zbog zaokruživanja na 3 decimale ne sme da bude stroga jednakost):

```js
const isFrameAligned = (t, fps) => Math.abs(t * fps - Math.round(t * fps)) <= 0.02;
```

Na 24fps: `q(4.7) === 4.708`, `isFrameAligned(4.708, 24) === true`.

### 0.3 Identifikatori

| Tip | Oblik | Regex | Primer |
|---|---|---|---|
| slug epizode | kebab-case | `^[a-z0-9]+(-[a-z0-9]+)*$` | `night-when-rome-almost-fell` |
| `id` lika / lokacije / rekvizita | kebab-case | `^[a-z0-9]+(-[a-z0-9]+)*$` | `brennus`, `capitoline-hill` |
| `sentence.id` | `S` + 2+ cifre, od `S01` | `^S\d{2,}$` | `S01`, `S147` |
| `beat_id` | `B` + 2+ cifre, od `B01` | `^B\d{2,}$` | `B03` |
| `shot_id` | 2+ cifre sa vodećom nulom, od `01` | `^\d{2,}$` | `07`, `31` |

`shot_id` je **string a ne broj** — vodeća nula je deo imena fajla (`shots/part07.mp4`,
`images/shot07.jpeg`) i mora da preživi round-trip kroz JSON. Numeracija je globalna po epizodi,
kontinuirana, u redosledu tajmlajna.

### 0.4 Putanje

Sve putanje u JSON-u su **relativne u odnosu na folder epizode** (`episodes/<slug>/`), sa
`/` kao separatorom čak i na Windowsu: `shots/part07.mp4`, ne `shots\part07.mp4`.

### 0.5 `null` naspram odsutnog polja

Obavezna polja su **uvek prisutna**. Kad vrednost nije poznata ili ne postoji, upisuje se `null` —
polje se ne izostavlja. Potrošači zato smeju da rade `obj.field === null`, a ne moraju da
razlikuju „nema ključa" od „ključ je prazan". Jedini izuzetak su nizovi: prazan niz je `[]`, nikad `null`.

### 0.6 Kanonsko brojanje reči — **odluka C01**

Tri provere zavise od brojanja reči: **P1** (image prompt 90–160), **P2** (animation prompt 60–100)
i pravilo da `locked_description` ima 25–40 reči. Bez jedne definicije te provere nikad ne bi bile
stabilne, pa je ovde zakucana.

```js
export const countWords = (text) =>
  String(text)
    .split(/\s+/)
    .filter((t) => /[A-Za-z0-9]/.test(t))
    .length;
```

Pravilo u rečima: **reč je svaki niz znakova između belina koji sadrži bar jedno slovo ili cifru.**

Posledice, namerne:

- **Nazivi blokova se broje.** `CAMERA:` je 1 reč, `FRAME LAYOUT:` su 2, `SCREEN DIRECTION:` su 2.
  Razlog: oni se zaista lepe u Flow i troše pažnju modela kao i svaka druga reč, a svako pravilo
  koje ih izuzima traži parser blokova — a parser se raspada čim se format prompta malo pomeri.
- **Vezice se broje kao jedna reč.** `three-quarter` = 1, `right→left` = 1, `eye-level` = 1.
- **Vremenske oznake se broje kao jedna reč.** `0–1s:` = 1, `1–4.2s:` = 1.
- **Novi red je belina.** Prompt u više linija se broji isto kao da je u jednoj.
- **Samostalna interpunkcija se ne broji.** Crtica kao marker liste (`-`), samostalno `|`, `—`
  daju 0 jer nemaju alfanumeričkih znakova.
- Brojanje se radi nad **celim stringom polja**, uključujući `STYLE` blok i `locked_description`.

Kontrolni primer (mora da vrati 12):

```
CAMERA: eye level, wide.
FACING: we see their faces — not their backs.
```

`CAMERA:` `eye` `level,` `wide.` `FACING:` `we` `see` `their` `faces` `not` `their` `backs.` = 12
(`—` otpada).

### 0.7 Kanonsko poređenje teksta — **odluka C01**

Provera **C1** traži da `locked_description` stoji „doslovno" u promptu. Poređenje bajt-po-bajt
bi palo na svakom prelomu reda, pa je „doslovno" definisano ovako:

```js
export const normalize = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
// C1 prolazi kada:
normalize(image_prompt).includes(normalize(locked_description))
```

Dakle: **belina se sažima, veličina slova se ignoriše, sve ostalo mora da se poklopi** — jedna
promenjena reč, dodat zarez ili izbačena crtica ruše proveru. To je i namera: opis se kopira, ne prepričava.

**C1 se proverava nad `image_prompt`, ne nad `animation_prompt`.** Identitet lika se uspostavlja
u slici; animation prompt umesto opisa nosi `PRESERVE` liniju (šablon 2c iz izvornog plana).
Ponavljanje 25–40 reči i tamo bi probilo P2 (60–100 reči) na svakom shotu sa dva lika.

---

## 1. `episode.json`

**Piše:** ručno / `at-storyboard` na početku epizode. **Čita:** svi alati i svi skilovi.
**Putanja:** `episodes/<slug>/episode.json`

Manifest epizode i **registar zaključanih opisa**. Njegov najvažniji posao je da bude jedino mesto
gde je zapisano kako lik izgleda, tako da se taj tekst kopira u svaki prompt i lik prestane da se
redizajnira između shotova.

### 1.1 Polja

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `slug` | string (kebab) | da | Mora da se poklapa sa imenom foldera. |
| `title` | string | da | Ljudski naslov epizode. |
| `status` | enum | da | `draft` \| `in-progress` \| `done` |
| `voice` | string \| null | da | ElevenLabs glas, npr. `"Nathaniel - Engaging, British and Calm"`. `null` kad nije zabeležen. |
| `narration_file` | string \| null | da | Relativna putanja, obično `"narration.mp3"`. |
| `final_file` | string \| null | da | Relativna putanja gotovog videa; `null` dok ne postoji. |
| `endcard_file` | string \| null | da | Slika end carda za montažu. |
| `characters` | array\<Entity\> | da | Može biti prazan. |
| `locations` | array\<Entity\> | da | Može biti prazan. |
| `key_props` | array\<Entity\> | da | Može biti prazan. |
| `notes` | string | da | Slobodan tekst; `""` kad nema šta da se kaže. |

`status` je nezavisan od `status` polja u `docs/ideas.md` (C03) — tamo je vokabular
`idea / scored / done / rejected` i opisuje *ideju*, ovde opisuje *produkciju*.
Jedina veza je: ideja sme da bude `done` samo ako postoji epizoda sa `status: "done"`.

### 1.2 Tip `Entity`

Isti oblik za `characters`, `locations` i `key_props`.

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `id` | string (kebab) | da | **Jedinstven preko sva tri niza zajedno**, ne samo unutar svog. `shot.characters[]` referiše ovaj `id`. |
| `name` | string | da | Ime za ljudski prikaz (`render.mjs`, `shotlist.mjs`). Za lokacije/rekvizite kratak naziv. |
| `locked_description` | string | da | **25–40 reči** po `countWords` (0.6). Kopira se doslovno u `image_prompt` svakog shota gde entitet učestvuje — proverava C1. |

`locked_description` piše se kao **imenička fraza bez tačke na kraju**, tako da se uklapa u
`SUBJECT:` blok prompta bez prepravke:

```json
{
  "id": "brennus",
  "name": "Brennus",
  "locked_description": "a broad-shouldered Gallic chieftain in his forties, long red-blond hair in a thick braid, drooping moustache, a bronze torc at his throat, chainmail over a red woollen tunic"
}
```

(taj primer ima 28 reči po `countWords`)

### 1.3 Pun primer

```json
{
  "slug": "example-episode",
  "title": "The Night Rome Nearly Lost Everything",
  "status": "in-progress",
  "voice": "Nathaniel - Engaging, British and Calm",
  "narration_file": "narration.mp3",
  "final_file": null,
  "endcard_file": "endcard.jpeg",
  "characters": [
    { "id": "brennus", "name": "Brennus", "locked_description": "a broad-shouldered Gallic chieftain in his forties, long red-blond hair in a thick braid, drooping moustache, a bronze torc at his throat, chainmail over a red woollen tunic" }
  ],
  "locations": [
    { "id": "capitoline-hill", "name": "The Capitoline Hill", "locked_description": "a steep rocky outcrop above the Forum, its flank a sheer pale cliff, crowned by a squat temple with a red-tiled roof and a low defensive wall of rough tufa blocks" }
  ],
  "key_props": [
    { "id": "bronze-scales", "name": "The bronze scales", "locked_description": "a set of heavy bronze balance scales with two shallow dished pans hanging on chains from a plain crossbeam, the metal dull and scratched from long use" }
  ],
  "notes": ""
}
```

### 1.4 Legacy manifesti (4 migrirane epizode)

Četiri postojeće epizode nose isti oblik sa `status: "done"`, praznim `characters` / `locations` /
`key_props` i `notes` koji beleži da je epizoda proizvedena pre ovog pipeline-a
(nema `script.md`, `timing.json` ni `storyboard.json`, fajlovi nisu u `shots/` i `images/`).
Prazni nizovi su tačni, ne rupa: za te epizode zaključani opisi nikad nisu ni postojali.

---

## 2. `timing.json`

**Piše:** `tools/align.mjs`. **Čita:** `timeline.mjs`, `at-storyboard`, `lint.mjs` (T1), `assemble.mjs` (end card).
**Putanja:** `episodes/<slug>/timing.json`

Merena činjenica o narraciji. **Nikad se ne piše ni ispravlja ručno** — jedini način da se promeni
je novi `align.mjs` run nad novim `narration.mp3`.

### 2.1 Koren

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `duration` | number | da | Trajanje `narration.mp3` u sekundama, izmereno nad fajlom (ne zbir rečenica). |
| `model` | string | da | Whisper model koji je proizveo vremena: `"small.en"` ili `"medium.en"`. |
| `sentences` | array\<Sentence\> | da | Bar jedan element, u rastućem redosledu. |
| `words` | array\<Word\> | da | Sve reči, u rastućem redosledu. |
| `outro_start` | number \| null | da | Početak `## OUTRO` odeljka. `null` kad skripta nema outro. |

### 2.2 `Sentence`

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `id` | string | da | `S01`, `S02`, … redom, bez rupa. |
| `start` | number | da | Sekunde od početka fajla. |
| `end` | number | da | `end > start`. |
| `dur` | number | da | `end - start`. |
| `text` | string | da | **Tekst iz `script.md`, ne iz ASR-a.** Ground truth; ASR daje samo vremena. |
| `confidence` | number | da | 0–1, prosek po rečima rečenice. `< 0.85` je upozorenje i predlog za `medium.en` rerun. |

### 2.3 `Word`

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `sentence_id` | string | da | Kojoj rečenici reč pripada. |
| `word` | string | da | Tekst reči iz skripte. |
| `start` | number | da | |
| `end` | number | da | |
| `confidence` | number | da | 0–1, direktno iz ASR-a. |

### 2.4 Invarijante (proverava `align.mjs`, pa onda `lint.mjs` T1)

1. `sentences[i].end <= sentences[i+1].start` — monotono, bez preklapanja.
2. Nijedan gap između uzastopnih rečenica veći od **1.5s**.
3. `sentences[0].start >= 0` i `sentences[last].end <= duration`.
4. `abs(sum(sentences[].dur) - duration)` je informativan, **ne** mora da bude nula —
   pauze između rečenica su realne i nisu ničija greška.
5. Kad `outro_start` nije `null`, poklapa se sa `start` neke rečenice.

**Napomena o nuli:** `narration.mp3` epizode *night-when-rome-almost-fell* počinje na
`0.025057s`, ne na nuli. Da li se taj ofset oduzima pri alignmentu i pri lepljenju audia u
montaži je odluka koja pripada **C05** i **C09** — ova shema samo zahteva da `start` bude
merena vrednost, koja god konvencija da se izabere, i da ista konvencija važi u oba alata.

### 2.5 Primer

```json
{
  "duration": 217.213,
  "model": "small.en",
  "sentences": [
    { "id": "S01", "start": 0.0, "end": 4.62, "dur": 4.62,
      "text": "History is full of moments where everything almost changed in a single night.",
      "confidence": 0.98 },
    { "id": "S02", "start": 4.62, "end": 9.1, "dur": 4.48,
      "text": "This is one of them.", "confidence": 0.96 }
  ],
  "words": [
    { "sentence_id": "S01", "word": "History", "start": 0.0, "end": 0.42, "confidence": 0.99 },
    { "sentence_id": "S01", "word": "is", "start": 0.42, "end": 0.55, "confidence": 0.98 }
  ],
  "outro_start": 205.4
}
```

---

## 3. `storyboard.json`

**Piše:** `at-storyboard` (kroz `timeline.mjs`), popravlja `at-qa`.
**Čita:** `lint.mjs`, `render.mjs`, `shotlist.mjs`, `assemble.mjs`, `at-qa`, `at-assemble` — **pet potrošača**.
**Putanja:** `episodes/<slug>/storyboard.json`

Jedini source of truth za sve nizvodno. `storyboard.md` je **izvedeni prikaz** koji pravi
`render.mjs` i koji se nikad ne menja ručno.

Izvorni plan ovaj fajl nigde ne definiše iako ga pet alata čita — zato je ovde definisan u celini.

### 3.1 Koren

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `schema_version` | number | da | Trenutno `1`. Raste kad se ugovor probije nekompatibilno. |
| `episode` | string (kebab) | da | Slug; mora da odgovara `episode.json.slug`. |
| `generated_at` | string | da | ISO 8601 UTC, npr. `"2026-09-04T15:22:31Z"`. |
| `narration_duration` | number | da | Prepisano iz `timing.json.duration`. Referenca za T1. |
| `fps` | number | da | fps na kojem su kvantizovana vremena; iz `tools/config.json`. |
| `beats` | array\<Beat\> | da | Bar jedan, u redosledu tajmlajna. |

`fps` i `schema_version` nisu u izvornom nabrajanju iz C01 — dodati su namerno: bez `fps`
frejm-poravnanje se ne može proveriti bez čitanja globalnog konfiga (koji se u međuvremenu
mogao promeniti), a bez `schema_version` prva izmena ugovora tiho lomi stare fajlove.

### 3.2 `Beat`

Beat je grupa uzastopnih rečenica i **jedinica kreativne odluke** — checkpoint u `at-storyboard`
prikazuje upravo ovaj nivo.

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `beat_id` | string | da | `B01`, `B02`, … redom, bez rupa. |
| `sentences` | array\<string\> | da | `sentence.id` iz `timing.json`, **uzastopne i u rastućem redosledu**. Bar jedna. |
| `start` | number | da | `= timing.sentences[prva].start` |
| `end` | number | da | `= timing.sentences[poslednja].end` |
| `dur` | number | da | `end - start` |
| `device` | string \| null | da | Slug vizuelnog uređaja iz kataloga (3.6), ili `null` za doslovan/konkretan beat. |
| `narration_says` | string | da | Tekst rečenica beata, spojen. Ono što gledalac **čuje**. |
| `viewer_sees` | string | da | Šta se **vidi**. Kod apstraktnih beatova ne sme da bude preslikavanje imenica iz `narration_says`. |
| `shots` | array\<Shot\> | da | Bar jedan. |

### 3.3 `Shot`

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `shot_id` | string | da | `"01"`, `"07"`, … globalno po epizodi, kontinuirano, u redosledu tajmlajna. |
| `beat_id` | string | da | Redundantno u odnosu na ugnežđenost, ali potrošači shotove često obrađuju ravno. Mora da se poklapa sa roditeljem. |
| `link_group` | string \| null | da | `null` za samostalan shot; inače `beat_id` čije shotove treba spojiti dissolve-om. Vidi 3.4. |
| `t_in` | number | da | Pozicija na **tajmlajnu epizode**, sekunde od početka narracije. Frejm-poravnato. |
| `t_out` | number | da | `= t_in + use_len`. Frejm-poravnato. |
| `use_in` | number | da | Pozicija **unutar generisanog klipa** (`source_file`), sekunde. Frejm-poravnato. |
| `use_out` | number | da | `= use_in + use_len`. Frejm-poravnato. |
| `use_len` | number | da | Trajanje reza, 3.0–10.0s (T2). Frejm-poravnato. |
| `motion_budget` | number \| null | da | Sekunde u koje pokret mora da stane; ide u `MOTION BUDGET:` liniju animation prompta. Obavezan (`!== null`) kad `use_len < 9.0` (T3); tada `= use_len`. |
| `source_file` | string | da | `"shots/part07.mp4"` — klip iz Flow-a. F1 traži da postoji i da traje ≥ `use_out`. |
| `ingredient_image` | string \| null | da | `"images/shot07.jpeg"` — slika koja u Flow ide kao *ingredient*. `null` kad se shot generiše bez nje. |
| `characters` | array\<string\> | da | `id`-jevi iz `episode.json` (bilo kog od tri niza) koji se u shotu vide. Ulaz za C1. Prazan niz je legitiman. |
| `image_prompt` | string | da | 90–160 reči po `countWords` (P1). Sadrži blokove iz S2. |
| `animation_prompt` | string | da | 60–100 reči po `countWords` (P2). |
| `tags` | Tags | da | Šest osa, vidi 3.5. |

**Dve vremenske ose se ne smeju mešati.** `t_in`/`t_out` su gde shot stoji u finalnom videu;
`use_in`/`use_out` su koji deo desetosekundnog Flow klipa se seče. `use_in` je najčešće `0.0`, ali
ne mora da bude — kad prva sekunda generisanog klipa ima artefakt, seče se od `use_in: 0.5`.
`t_in`/`t_out` nisu u izvornom nabrajanju iz C01; bez njih T1 (gapovi i preklapanja) ne može da se
proveri, jer bi linter morao da rekonstruiše poziciju sabiranjem — a onda gap po definiciji ne postoji.

**Budžet reči je uzak čim shot referiše više entiteta.** Dva zaključana opisa (28 + 31 reč u
kanonskom primeru) pojedu 59 od 160 reči P1 budžeta pre nego što se napiše ijedan blok. Provereno
na fixture-u: shot sa dva entiteta staje u 152 reči samo uz kratke `FRAME LAYOUT` i `FACING` linije.
Shot sa **tri** zaključana entiteta P1 realno ne može da prođe. To je ograničenje, ne bug — kadar u
kome se tri zaključana entiteta jasno vide je ionako prepakovan, i pravilnije je da se rasformira
na dva shota nego da se zaključani opisi skraćuju (skraćivanje ruši C1 na oba mesta).

### 3.4 `link_group`

`null` znači samostalan shot: rez ka susedu je **hard cut**.

Kad je postavljen, vrednost je `beat_id` sopstvenog beata. Svi shotovi jednog beata sa istim
`link_group` čine A/B/C lanac koji se u montaži spaja cross-dissolve-om (podrazumevano 8 frejmova).
Posledice:

- `link_group`, kad nije `null`, **mora** da bude jednak `beat_id` tog shota. Linkovanje preko
  granice beata nije dozvoljeno — između beatova rez ostaje tvrd.
- Shotovi u istom `link_group` su **izuzeti iz R1** (pravilo razlike): namerno dele lokaciju,
  svetlo i subjekt, jer su nastavak istog kadra.
- Beat sa jednim shotom ima `link_group: null`.

### 3.5 `Tags` — šest osa pravila R1

Tačno šest ključeva, svi obavezni, svi `string`. Ovo su ose po kojima R1 meri razliku između
uzastopnih shotova, pa se **porede na jednakost** — slobodan tekst ubija pravilo.

| Ključ | Dozvoljene vrednosti |
|---|---|
| `subject_type` | `character` · `group` · `environment` · `object` · `map-diagram` · `crowd` · `architecture` |
| `shot_size` | `XLS` · `LS` · `MS` · `CU` · `ECU` · `aerial` |
| `angle` | `eye` · `low` · `high` · `overhead` · `profile` |
| `camera_motion` | `locked` · `push` · `pull` · `pan` · `track` · `parallax` · `reveal` |
| `location` | slobodan, ali **normalizovan slug** — `capitoline-hill`, `via-flaminia` |
| `time_light` | slobodan, ali **normalizovan slug** — `dawn-overcast`, `night-torchlit`, `midday-hard-sun` |

Četiri zatvorene ose su enumeracije i linter ih odbija van liste. `location` i `time_light` su
otvorene, ali moraju da poštuju `^[a-z0-9]+(-[a-z0-9]+)*$`. Bez toga bi „the Capitoline hill at
dawn" i „capitoline hill" bile dve različite vrednosti za istu stvar, pa bi R1 ćutao tamo gde
treba da laje.

**Vrednosti se biraju iz kanona epizode:** `location` treba da bude `id` iz `episode.json.locations`
kad takva lokacija postoji.

### 3.6 Katalog `device`

Slugovi su mašinski parnjak kataloga iz `docs/reference/visual-devices.md` (C02). Kad se katalog
tamo promeni, **menja se i ova lista** — to su dva prikaza iste stvari.

`animated-map` · `ledger-accumulation` · `process-cutaway` · `before-after` ·
`timeline-seasons` · `macro-object` · `silhouette` · `crowd-as-texture` · `empty-aftermath`

`null` je ispravna vrednost i znači „beat je konkretan, ilustruje se doslovno". Uređaj je obavezan
tek kad je narracija apstraktna ili zbirna (prosperitet, decenije, trgovina, rast, opadanje,
sistem, poređenje) — ta procena je kreativna i pripada `at-storyboard`/`at-qa`, ne linteru.
R3 samo **izlistava** koji su uređaji korišćeni.

### 3.7 Invarijante

Struktura:

1. `episode` odgovara imenu foldera i `episode.json.slug`.
2. `beat_id` su `B01…Bnn` bez rupa; `shot_id` su `01…nn` bez rupa, globalno, u redosledu tajmlajna.
3. `shot.beat_id` odgovara beatu u kojem shot stoji.
4. `beat.sentences` pokrivaju **sve** rečenice iz `timing.json`, svaku tačno jednom, u redosledu.

Vreme. Sve jednakosti ispod porede se sa tolerancijom `EPS = 0.0011` — vrednosti su zaokružene
na 3 decimale (0.1), pa stroga jednakost pada na zaokruživanju, ne na grešci.

5. `beat.start` / `beat.end` prepisani iz `timing.json` **neizmenjeni** (nisu frejm-poravnati),
   `dur = end - start`.
6. Beat na tajmlajnu zauzima `[q(beat.start), q(beat.end)]`: prvi shot ima `t_in = q(beat.start)`,
   poslednji `t_out = q(beat.end)`, a unutar beata `shots[i].t_out === shots[i+1].t_in`.
   Zbir `use_len` shotova beata je zato `q(beat.end) - q(beat.start)`, a **poslednji shot upija
   ostatak** kvantizacije — to je isto pravilo koje splitter iz izvornog plana već primenjuje.
7. Preko granice beatova: `poslednji_shot(Bn).t_out === prvi_shot(Bn+1).t_in`. Tajmlajn je
   neprekidan od `0.0` do `q(poslednji beat.end)`, bez rupa i preklapanja.
8. `use_out === use_in + use_len`, `t_out === t_in + use_len`.
9. `3.0 <= use_len <= 10.0`.
10. Sva vremenska polja shota frejm-poravnata na `fps` (0.2).
11. `abs(sum(use_len) - narration_duration) <= 0.2` (T1). Razlika nije greška: `narration_duration`
    je trajanje celog mp3 fajla, a poslednji beat se završava na kraju poslednje rečenice.

Referencijalno:

12. `shot.characters[]` sadrži samo `id`-jeve koji postoje u `episode.json`.
13. `shot.source_file` je `shots/part<shot_id>.mp4`; `ingredient_image`, kad nije `null`,
    `images/shot<shot_id>.jpeg`.
14. `link_group` je `null` ili jednak sopstvenom `beat_id`.

### 3.8 Primer

Kanonski primer živi u `tests/fixtures/` i **on je merodavan** — kad se ovaj dokument i fixture
raziđu, prvo se proverava da nije shema ta koja je ostala nedorečena, pa se tek onda popravlja fixture.

| Fajl | Sadržaj |
|---|---|
| `tests/fixtures/storyboard.sample.json` | 2 beata, 3 shota, jedan `link_group` par (B01 A/B), jedan samostalan shot sa `device: "macro-object"` |
| `tests/fixtures/episode.sample.json` | manifest koji ide uz njega — jedan lik, jedna lokacija, jedan rekvizit, sva tri sa `locked_description` |

`episode.sample.json` nije tražen u C01, ali bez njega `storyboard.sample.json` ne može da zatvori
**C1** ni invarijantu 12 — `locked_description` i spisak dozvoljenih `id`-jeva žive u manifestu.
Fixture par je provereno usklađen sa ovom shemom; izmerene vrednosti:

```
locked_description  brennus 28 · capitoline-hill 31 · bronze-scales 27 reči   (25–40 ✓)
shot 01  P1=152  P2=93  use_len=7.25   t=0.000 → 7.250
shot 02  P1=135  P2=91  use_len=7.375  t=7.250 → 14.625
shot 03  P1=146  P2=86  use_len=8.5    t=14.625 → 23.125
T1: sum(use_len)=23.125  narration_duration=23.18  drift=0.055s  (≤0.2 ✓)
```

---

## 4. Pokrivenost BLOCKING tabele

Obaveza iz C01: svaka provera iz BLOCKING tabele izvornog plana mora da ima polje u kojem živi.
Tabela je prođena red po red.

| # | Provera | Prag | Polja koja je nose | Pokriveno |
|---|---|---|---|---|
| **T1** | pokrivenost tajmlajna: gapovi / preklapanja / `sum(use)` vs trajanje narracije | ±0.2s | `shot.t_in`, `shot.t_out`, `shot.use_len`, `beat.start`, `beat.end`, `storyboard.narration_duration` | da |
| **T2** | `use_len` u granicama | 3.0–10.0s | `shot.use_len` | da |
| **T3** | `motion_budget` prisutan kad `use_len < 9.0` | — | `shot.motion_budget`, `shot.use_len` | da |
| **S1** | zabranjene prostorne fraze bez screen-position klauzule | — | `shot.image_prompt`, `shot.animation_prompt` | da |
| **S2** | obavezni blokovi `CAMERA`, `FRAME LAYOUT`, `FACING`, `SCREEN DIRECTION`, `NOT IN FRAME` | — | `shot.image_prompt` | da |
| **S3** | reči koje impliciraju rez unutar klipa (`then`, `later`, `afterwards`, `cuts to`, `meanwhile`) | — | `shot.animation_prompt` | da |
| **P1** | dužina image prompta | 90–160 reči | `shot.image_prompt` + `countWords` (0.6) | da |
| **P2** | dužina animation prompta | 60–100 reči | `shot.animation_prompt` + `countWords` (0.6) | da |
| **C1** | `locked_description` doslovno u svakom shotu gde lik učestvuje | — | `shot.characters[]` → `episode.json.{characters,locations,key_props}[].locked_description`, traži se u `shot.image_prompt` po `normalize` (0.7) | da |
| **F1** | svaki shot ima svoj `shots/partNN.mp4`, izvor ≥ `use_out` | — | `shot.source_file`, `shot.use_out` (+ `probe()` iz `ffmpeg.mjs`) | da |

Tri stvari koje je ovaj prolaz otkrio i koje su zbog toga u shemi:

- **T1 bez `t_in`/`t_out` ne postoji.** Izvorno nabrajanje shot polja imalo je samo `use_*`, koja su
  koordinate *unutar Flow klipa*. Gap na tajmlajnu se iz njih ne vidi. Otud dve odvojene vremenske ose (3.3).
- **F1 traži `source_file` po shotu, ne izvedeno ime.** Zato je putanja upisana, a invarijanta 13
  samo zahteva da prati konvenciju — kad shot mora da se regeneriše pod drugim imenom, ugovor se ne lomi.
- **C1 mora da zna gde da traži.** `shot.characters[]` nosi `id`-jeve iz **sva tri** niza
  `episode.json`-a, ne samo iz `characters` — lokacije i ključni rekviziti se zaključavaju istim mehanizmom.

### 4.1 ADVISORY sloj — gde polja stoje

Ne blokira montažu, ali čita iste podatke.

| # | Signal | Polja |
|---|---|---|
| R1 | pravilo razlike (šest osa) | `shot.tags.*`, izuzeće preko `shot.link_group` |
| R2 | miks tipova shotova | `shot.tags.subject_type` |
| R3 | korišćeni vizuelni uređaji | `beat.device` |
| R4 | ponavljanje n-grama > 12 reči | `shot.image_prompt`, `shot.animation_prompt`, **minus** svi `locked_description` iz `episode.json` i kanonski style string iz `docs/reference/style-string.md` |
| C2 | broj multi-visual klipova | **nema polje** — vidi 5.2 |

**R4 protiv C1.** C1 *zahteva* da isti blok od 25–40 reči stoji u svakom shotu gde se lik pojavljuje;
R4 kažnjava >12 uzastopnih identičnih reči. Bez izuzeća bi R4 lajao na svaki ispravan storyboard.
Zato R4 pre poređenja izbacuje `locked_description` stringove i kanonski style string iz teksta.
Detaljna implementacija pripada **C07**; shema ovde samo garantuje da su oba izvora izuzeća
dostupna kao podaci.

---

## 5. Odluke i otvorene stavke

### 5.1 Odluke donete u C01 (obavezujuće)

1. **Brojanje reči** (0.6) — belinom razdvojeni tokeni sa bar jednim alfanumeričkim znakom;
   **nazivi blokova se broje**. Važi za P1, P2 i za 25–40 reči `locked_description`-a.
2. **„Doslovno" za C1** (0.7) — sažeta belina, ignorisana veličina slova, poređenje kao podstring
   **`image_prompt`-a**, ne `animation_prompt`-a.
3. **Dve vremenske ose** — `t_in`/`t_out` (tajmlajn) uz `use_in`/`use_out` (klip). Dodato u odnosu
   na izvorno nabrajanje.
4. **`schema_version` i `fps` u korenu** `storyboard.json`-a. Dodato.
5. **`endcard_file` u `episode.json`** — četiri postojeće epizode drže end card pod tri različita
   imena (`endKartica.jpeg`, `endCard.jpeg`, `endKartica.png`); `assemble.mjs` mora da ga nađe iz manifesta.
6. **`shot_id` je string sa vodećom nulom**, ne broj.
7. **`link_group` ne prelazi granicu beata.**
8. **Frejm-poravnanje važi samo za `storyboard.json`**, nikad za `timing.json`.

### 5.2 Otvorene stavke, svesno prosleđene dalje

- **C2 (broj multi-visual klipova) nema polje.** „Multi-visual klip" nigde nije definisan u
  izvornom planu. Dve mogućnosti: eksplicitno `multi_visual: boolean` na shotu (pošteno, ali
  samodeklarisano — autor storyboarda ga jednostavno postavi na `false`), ili heuristika koju
  linter izvodi iz `animation_prompt`-a. Odluka i eventualno novo polje pripadaju **C07**;
  ako se doda polje, raste `schema_version`.
- **Konvencija ofseta nule u narraciji** (`0.025057s`) — **C05** i **C09**. Shema traži samo da
  ista konvencija važi u oba alata.
- ~~**Ivica algoritma sečenja beata**~~ — **zatvoreno u C04**, vidi 5.3.
- **Katalog uređaja (3.6) i lista blokova u S2** dupliraju sadržaj koji je izvor istine u
  `docs/reference/` (C02). Kad se tamo promene, menjaju se i ovde.

### 5.3 Odluke donete u C04 (obavezujuće) — ponašanje splittera

Izvor istine je `tools/timeline.mjs`; ovde stoji ono što ostatak lanca sme da pretpostavi.

**1. Gde tačno pada rez između dve rečenice.** Rez je uvek `start` **sledeće** rečenice, nikad
`end` prethodne. Pauza između dve rečenice time pripada shotu koji se završava, a novi shot
počinje tačno na prvoj reči. Razlog je invarijanta 5 (granice su vrednosti prepisane iz
`timing.json` neizmenjene — `start` sledeće rečenice to jeste, sredina pauze nije) i invarijanta 7
(tajmlajn bez rupa, pa pauza mora nekom da pripadne).

**2. Beatovi popločavaju tajmlajn.** Ista konvencija važi i na granici beatova:
`beat.end` je `start` prve rečenice **sledećeg** beata, a poslednji beat se završava na `end`
svoje poslednje rečenice. Prvi beat počinje na `0.0`, ne na `sentences[0].start` — narracija
epizode *night-when-rome-almost-fell* počinje na `0.025057s`, a tajmlajn mora da krene od nule;
ta tišina se pripaja prvom shotu. (Da li se ofset oduzima pri lepljenju audia i dalje je odluka
C05/C09 — ovde se samo ne pravi rupa.)

**3. Izbor broja shotova.** Umesto petlje `n = ceil(D/9)` pa „smanji n ako je grupa < 3.0s",
splitter rešava jednu optimizaciju nad podelama na granicama rečenica:

```
minimizuj  Σ (use_len_i − targetShot)²    uz   minShot ≤ use_len_i ≤ maxShot
```

Broj shotova nije zadat unapred nego ispada iz rešenja. Ishod je isti kao verbatim algoritam na
svim slučajevima iz izvornog plana (4.6s → 1; 23.4s → 3; 11.5s → 2×5.75; 20s → 3×6.67, ne 2×10),
ali „grupe najbliže jednake" i „najmanje odstupanje od 8s" postaju jedan kriterijum umesto dva
koja mogu da se posvađaju, a `minShot` je tvrdo ograničenje pa se podela sa prekratkom grupom
nikad ne razmatra. **`minShot` je jači od „rez na granici rečenice"**: podela `(2.5)(8)(8)` se
odbija i radije se seče unutar rečenice.

**4. Beat koji se ne može iseći na granicama rečenica** (30.5s / dve rečenice; jedna rečenica od
12s). `sliceBeat` **nikad ne baca** zbog trajanja — spušta se niz četiri nivoa i diže upozorenje:

| Nivo | Kandidati za rez | Upozorenje |
|---|---|---|
| 1 | granice rečenica | — |
| 2 | granice reči iz `timing.json.words` | `intra-sentence-cut` |
| 3 | mreža od 0.25s unutar rečenice (kad za nju nema reči) | `blind-cut` |
| 4 | jednaka podela, bez obzira na granice | `forced-split` |

Niži nivo se koristi samo kad viši nema rešenje — kazna po rezu je za red veličine iznad najgore
kvadratne kazne, pa nivoi ne mogu da se pomešaju.

**5. Upozorenja nisu prekršaji sheme.** Storyboard nastao rezom unutar rečenice i dalje zadovoljava
invarijantu 9 (svi shotovi ostaju u 3.0–10.0s) i prolazi BLOCKING. Upozorenja su podaci
(`{ code, message, beat_id, sentence_id, at }`) koje `at-storyboard` prikazuje korisniku da odluči
hoće li da prepravi beat mapu. Jedini izuzetak je **`beat-too-short`**: beat kraći od `minShot`
dobija jedan shot ispod 3.0s, T2 će ga s pravom prijaviti, a popravka je spajanje beatova u beat
mapi — ne u splitteru.

**6. Dva upozorenja koja diže `planTimeline`, ne `sliceBeat`.** `beat-coverage` — beat mapa ne
pokriva sve rečenice iz `timing.json` tačno jednom i u redosledu (invarijanta 4). `narration-tail` —
`timing.duration` je više od 0.2s duži od kraja poslednjeg beata, pa rep tišine u `narration.mp3`
ostaje bez slike i invarijanta 11 (T1) pada. Splitter tu ne sme sam da odluči: produžavanje
poslednjeg shota preko `maxShot` i skraćivanje audia su obe odluke montaže i pripadaju **C09**.
