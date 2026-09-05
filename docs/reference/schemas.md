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

Kanonski helperi (`countWords`, `normalize`, `q`, `isFrameAligned`) i rečnici (enumeracije tagova,
katalog uređaja, nazivi S2 blokova, S3 reči, pragovi) žive u **`tools/contract.mjs`** — jedna
definicija za ceo lanac. Uvoze ih `check-fixtures.mjs`, `lint.mjs` i `timeline.mjs`; nijedan
potrošač ih ne piše ponovo (vidi 5.5, tačka 1). Kad se ovaj dokument promeni, menja se taj modul.

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
| `duration` | number | da | Trajanje narracije u sekundama, izmereno nad fajlom (ne zbir rečenica), na osi tajmlajna — vidi 5.4 tačku 1. |
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
`0.025057s`, ne na nuli. **Zatvoreno u C05, vidi 5.4 tačku 1:** ofset se ne oduzima ni ne
dodaje — nula tajmlajna je prvi dekodirani sempl, a `duration` je trajanje na toj istoj osi.
C09 je vezan istom konvencijom (nikad `-copyts` nad narracijom).

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
| R4 | ponavljanje n-grama > 12 reči | `shot.image_prompt`, `shot.animation_prompt`, **minus** svi `locked_description` iz `episode.json`, kanonski style string iz `docs/reference/style-string.md` i fiksne `PRESERVE`/`FORBID` linije iz `docs/reference/prompt-templates.md` |
| C2 | broj multi-visual klipova | **nema polje**; meri se iz `shot.animation_prompt` — vidi 5.6 tačka 11 |

**R4 protiv C1.** C1 *zahteva* da isti blok od 25–40 reči stoji u svakom shotu gde se lik pojavljuje;
R4 kažnjava >12 uzastopnih identičnih reči. Bez izuzeća bi R4 lajao na svaki ispravan storyboard.
Zato R4 pre poređenja izbacuje `locked_description` stringove i kanonski style string iz teksta.
C07 je našao i **treći** izvor iste vrste: fiksne `PRESERVE`/`FORBID` linije animation šablona, od
kojih `PRESERVE` sama nosi tačno 13 reči. Sva tri izvora su izuzeta; vidi 5.6 tačke 2–4.

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

- ~~**C2 (broj multi-visual klipova) nema polje**~~ — **zatvoreno u C07**, vidi 5.6 tačka 11.
  Izabrana je druga mogućnost: linter ga izvodi iz `animation_prompt`-a, po deklaraciji iz
  `visualPromptEngine.md`. Novo polje se ne dodaje, `schema_version` ostaje 1.
- ~~**Konvencija ofseta nule u narraciji**~~ (`0.025057s`) — **zatvoreno u C05**, vidi 5.4.
  C09 nasleđuje odluku, ne bira je ponovo.
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

### 5.4 Odluke donete u C05 (obavezujuće) — alignment i nula na tajmlajnu

Izvor istine je `tools/align.mjs`; ovde stoji ono što ostatak lanca sme da pretpostavi.

**1. Nula na tajmlajnu je prvi dekodirani sempl. Ofset se ne oduzima.** `narration.mp3`
epizode *night-when-rome-almost-fell* ima `start: 0.025057` u kontejneru (mp3 encoder delay).
ffmpeg pri dekodovanju u wav (align.mjs) i pri lepljenju audia u montaži (C09) oba počinju od
prvog sempla i oba odbacuju taj ofset, pa je konvencija ista na oba kraja lanca i drifta nema.
Iz toga slede dve obaveze:

- **C09 nikad ne koristi `-copyts`** nad narracijom, niti sam dodaje/skida ofset.
- `timing.duration` je trajanje **na toj istoj osi**: `probe().duration − probe().start`, a kad
  je ASR run izmerio dekodirano trajanje, uzima se ono (tačnije je od dve decimale koje ffmpeg
  ispisuje) — uz proveru da se dve vrednosti slažu u granici od 0.5s. Za Rome: kontejner kaže
  217.21s uz start 0.025057, dekodirano je 217.182s, i u `timing.json` ide 217.182.

Tišina pre prve reči ostaje deo tajmlajna i pripada prvom shotu (5.3, tačka 2).

**2. Tekst je iz skripte, vreme iz ASR-a.** Poravnanje ide Needleman–Wunsch-om nad
normalizovanim tokenima, skorovi `match +1 / mismatch −1 / gap −1`. Bitan je odnos: zamena
košta −1, a par brisanje+umetanje −2, pa se pogrešno čuta reč poravna sa reči iz skripte i time
ipak dobije vreme, umesto da se raspadne na dve rupe. `sentence.text` i `word.word` uvek dolaze
iz skripte; ASR ne prepisuje ništa.

**3. Normalizacija tokena.** Mala slova; sve što nije slovo ili cifra otpada (`Rome,` → `rome`,
`B.C.` → `bc`, apostrof otpada bez deljenja reči: `don't` → `dont`); crtica, en/em crta, kosa
crta i donja crta **dele** reč (`eye-level` → `eye`, `level`); `&` → `and`, `%` → `percent`;
ceo broj se **širi u reči** (`390` → `three hundred ninety`, `3.5` → `three point five`,
`1st` → `first`). Širenje se primenjuje na obe strane, pa se `390` i „three hundred ninety"
poklapaju bez obzira ko je koji oblik napisao. Poznato ograničenje: godine izgovorene u
parovima („fourteen fifty three") poklapaju se samo delimično sa kardinalom.

**4. Segmentacija skripte.** Naslovi (`#`…`######`) nisu narracija i izbacuju se, ali **jesu
granica pasusa**; sve ostalo je izgovoreni tekst. Rečenica se prekida na `.` `!` `?` `…` (uz
opciono zatvaranje navodnika) kad iza sledi belina pa veliko slovo ili cifra — zato decimale
(`3.5`), skraćenice pred malim slovom (`390 B.C. the Gauls`) i `...` pred malim slovom ne dele.
Za skraćenicu pred velikim slovom postoji lista (`Mr.`, `Dr.`, `B.C.`, `U.S.`, …) plus pravilo
da je jedno slovo uvek inicijal (`J. R. Smith`). Prazan red deli rečenice i bez interpunkcije.

**5. `confidence`.** Reč dobija ASR verovatnoću kad se njen normalizovani token poklopi sa
skriptom, inače **0** — i kad je whisper čuo drugu reč i kad je nije čuo uopšte. Rečenica je
prosek po svojim rečima (2.2). Prag 0.85 time znači „bar 85% reči je prepoznato tačno onako
kako piše u skripti", što je i mera koliko se sme verovati njenim granicama.

**6. Reč bez ijednog ASR parnjaka** dobija vreme **linearnom interpolacijom** kroz rupu između
susednih poznatih vremena. Kad je rupa nulte dužine (whisper je preskočio celu rečenicu bez
pauze), reči dobijaju po 1ms i tajmlajn se pomera unapred — 1ms je ispod frejma (41ms na 24fps),
a rečenica je ionako prijavljena upozorenjem.

**7. `outro_start`** je `start` prve rečenice ispod naslova `## OUTRO`; bez tog naslova je
`null`. Legacy epizoda bez `script.md` se poravnava na sopstveni transkript
(`align.mjs --asr-script`) i tada je `outro_start` uvek `null`.

**8. Upozorenja `align.mjs`-a nisu prekršaji sheme**, isto kao kod splittera (5.3, tačka 5):
`gap` (pauza između rečenica preko 1.5s), `low-confidence` (rečenica ispod 0.85, uz predlog
`--model medium.en`) i `unheard` (rečenica koju whisper nije čuo, pa joj je vreme interpolirano).

**9. Keš ASR-a je obavezan.** `episodes/<slug>/.cache/asr-words.json` (gitignorisan) drži reči,
model i izmereno trajanje. Keš snimljen drugim modelom se ne koristi; `--force` ga preskače uvek.
Whisper izlaz se nikad ne štampa u konzolu — samo agregati.

**Mereno na epizodi Rome (217.182s, small.en, CPU int8, beam 5):** whisper run **48.4s**
(~4.5× brže od realnog vremena), 479 reči, 43 rečenice, poklapanje sa sopstvenim transkriptom
100%, nijedan gap preko 1.5s, nijedna rečenica ispod 0.85. Zbir trajanja rečenica je 179.3s —
razlika do 217.2s su stvarne pauze između rečenica (invarijanta 4), ne greška alignmenta.

### 5.5 Odluke donete u C06 (obavezujuće) — BLOCKING linter

Izvor istine je `tools/lint.mjs` (provere) i `tools/contract.mjs` (helperi i rečnici); ovde stoji
ono što ostatak lanca sme da pretpostavi. Linter je autoritet za tehničku ispravnost i **ništa
više** — ADVISORY sloj je C07 i u izveštaju stoji kao prazna sekcija.

**1. Kanonski helperi žive u `tools/contract.mjs`, ne u `tests/check-fixtures.mjs`.** §0 je tražio
da ih `lint.mjs` preuzme odatle; doslovno to nije izvodljivo, jer `check-fixtures.mjs` radi ceo
posao na uvozu (čita fixture, štampa, zove `process.exit`) pa bi `import` iz njega oborio linter —
a `tools/` bi zavisio od `tests/`. Namera (jedna definicija, ne dve) ispunjena je novim modulom:
`countWords`, `normalize`, `q`, `isFrameAligned`, `round3`, `EPS`, `TAGS`, `DEVICES`, `SLUG`,
`S2_BLOCKS`, `S3_WORDS` i `LIMITS` su tamo, a `check-fixtures.mjs`, `lint.mjs` i `timeline.mjs`
ih uvoze. Vrednosti su nepromenjene — konsolidacija, ne redefinicija.

**2. S1 liste se čitaju iz `camera-language.md` u vreme izvršavanja.** `loadCameraLanguage()`
parsira blokove koda iz odeljka „Liste koje provera S1 konzumira". Pravilo se time menja na jednom
mestu — u dokumentu. Format tog odeljka je zato API, a ne stil (`camera-language.md` §C).
Prazna ili nepročitana lista **baca**, nikad ne prolazi tiho: nečujno ugašen S1 je gori ishod od
pada alata.

**3. „Ista rečenica" za S1 je izvršno definisana.** Segment je tekst između preloma reda **ili**
rečenične interpunkcije (`.` `!` `?` `…`) iza koje sledi belina. Prelom reda je granica sam za
sebe, jer se blokovi prompta ne pišu uvek sa tačkom na kraju; tačka bez beline (`6.5s`) ne deli.
`image_prompt` i `animation_prompt` se segmentiraju **odvojeno** — klauzula na početku animation
prompta ne otključava frazu sa kraja image prompta. Poređenje ide po granici reči, pa `far` u
„farmers" ne otključava ništa.

**4. T3 proverava i broj u promptu.** `prompt-templates.md` traži da `MOTION BUDGET:` linija nosi
isti broj kao `shot.motion_budget`, i to pripisuje proveri T3. Linter to sprovodi: kad
`motion_budget !== null`, animation prompt mora da ima tu liniju i broj mora da se poklopi.
Kad je `motion_budget` `null` (`use_len >= 9.0`), linija se ne proverava.

**5. F1 meri na osi prvog dekodiranog sempla.** Dostupno trajanje klipa je
`probe().duration − probe().start`, ista konvencija kao za narraciju u 5.4 tačka 1 — `ffmpeg -ss`
nad izvorom računa odatle, pa kontejnerski ofset ne sme da se broji kao materijal. Tolerancija je
**jedan frejm** na `storyboard.fps`. Nedostajući fajl, nečitljiv fajl i fajl bez prijavljenog
trajanja su nalazi, ne padovi alata.

**6. `--no-media` preskače F1.** Linter se pušta i pre nego što ijedan klip postoji (posle
`at-storyboard`, pre Flow-a); tada bi F1 dao po jedan nalaz na svaki shot i zatrpao stvarne
nalaze. Zastava to isključuje i **piše u izveštaj** da je F1 preskočen. Ostalih devet provera su
čista funkcija dva JSON-a i uvek rade.

**7. Pokvaren oblik ulaza nije nalaz nego pad.** `assertShape` prvo proverava da su obavezna polja
prisutna i baca sa spiskom svih problema odjednom. Bez toga bi linter pao na `undefined` usred T1
i prijavio nešto što nema veze sa stvarnim problemom. Nalaz je uvek izjava o **sadržaju**, ne o
obliku.

**8. Nalaz nosi izmerenu i očekivanu vrednost** kao zasebna polja
(`{ code, where, message, measured, expected }`), ne samo u tekstu poruke. Izveštaj bez izmerene
vrednosti ne može da se iskoristi za popravku. Nalazi se sortiraju redosledom BLOCKING tabele
(T1 → F1), pa unutar koda po `where`.

**9. `qa-report.md` je generisan artefakt** — gitignorisan i za epizode i za fixture-e. Prepisuje
se pri svakom pokretanju; nikad se ne menja ručno, isto pravilo kao za `storyboard.md`.

**10. Fixture-i su folderi epizoda, ne pojedinačni JSON-ovi.** `tests/fixtures/good-episode/` i
`bad-episode/` nose `episode.json`, `storyboard.json` i `shots/partNN.mp4`, jer je definicija
gotovog u C06 komanda nad folderom (`node tools/lint.mjs tests/fixtures/bad-episode`). Klipovi su
16×16 crni `testsrc`, ~2 KB po fajlu (~14 KB ukupno) i **jesu u gitu**, uz izuzetak u
`.gitignore` — bez njih se F1 ne može pustiti iz komandne linije, a fixture koji traži korak
generisanja pre upotrebe nije fixture. Prava medija ostaje van gita.

**11. Loš fixture obara tačno četiri provere** — S1, S2, T2, C1 — po jednu na svakom od četiri
shota, i nijednu drugu; dobar fixture prolazi svih deset sa nula nalaza i u shotu 01 nosi
izbrojane primere promptova iz `prompt-templates.md` **doslovno** (151 / 90 reči). Ako ti primeri
ikad obore P1 ili S1, greška je u linteru ili u template-u, ne u fixture-u — test to i tvrdi.
Shot 02 dobrog fixture-a namerno nosi zabranjenu frazu **otključanu** listom B, da se lista B vidi
i na primeru koji prolazi, ne samo na onom koji pada.

**12. `use_len` od 1.2s nije predstavljiv na 24fps.** Plan traži shot od 1.2s kao okidač za T2;
`1.2 × 24 = 28.8`, pa bi takav shot razbio frejm-poravnanje (invarijanta 10) i povukao lažne T1
nalaze na granicama beata. Fixture zato koristi najbližu frejm-poravnatu vrednost, **1.208s**
(29 frejmova). Provera koja se time demonstrira je ista.

### 5.6 Odluke donete u C07 (obavezujuće) — ADVISORY linter

Izvor istine je `tools/lint.mjs` (signali) i `tools/contract.mjs` (rečnici i izuzeća). Ovaj sloj
meri i prikazuje; **ne menja exit code ni u jednom slučaju**. Vodeće načelo izvornog plana:
šumni linter koji stalno laje naučiš da ignorišeš.

**1. ADVISORY ne ulazi u `findings`.** `lintEpisode` vraća `{ findings, signals }` kao dva
odvojena niza, a `main()` računa exit code isključivo iz `findings`. Signal nema polje `expected`:
R2/R3/C2 su mere bez praga, a „očekivana vrednost" za R1 i R4 bila bi režiserska odluka, ne
činjenica. Nosi `{ code, where, message, measured }`.

**2. R4 izuzima tri izvora, ne dva.** Plan imenuje `locked_description` (C1) i kanonski style
string. Treći je nađen na kanonskom primeru iz `prompt-templates.md`: fiksne `PRESERVE` i `FORBID`
linije. Šablon ih zove „fiksne linije, ne šablon za popunjavanje", a `PRESERVE` sama nosi **tačno
13 reči** — dakle sama obara prag „>12" — i stoji doslovno u svakom animation promptu. Bez tog
izuzeća R4 laje na svaki ispravan storyboard, iz istog razloga kao kod `locked_description`-a.
Provereno na `good-episode` fixture-u: bez njega par shot 01 ↔ shot 02 daje nalaz od 25 reči.

**3. Izuzeća se čitaju iz `docs/reference/` u vreme izvršavanja**, isto kao S1 liste (5.5 tačka 2).
Style string dolazi iz `style-string.md` (prvi blok koda koji počinje sa `STYLE:`), fiksne linije
iz `prompt-templates.md` (odeljak „Animation template"). Promena stringa u dokumentu automatski
menja ono što R4 briše. Nepročitan izvor ili izvor promenjenog oblika **baca**, nikad ne prolazi
tiho — tiho izgubljeno izuzeće ne gasi proveru nego je pretvara u lajanje.

**4. Rez izuzeća deli tekst, ne spaja ga.** Kad se fraza izbaci, ostatak se ne slepljuje: na mesto
reza ide barijera, pa n-gram ne može da nastane od reči pre i posle izuzete fraze. Bez toga bi
brisanje 28-rečnog opisa samo po sebi proizvodilo lažne nalaze.

**5. R4 poredi promptove različitih shotova.** Image i animation prompt istog shota idu dvama
različitim generatorima i nikad se ne vide zajedno, pa njihovo preklapanje ništa ne košta; kroz
shotove je ono od čega epizoda izgleda isto od početka do kraja. Po paru se prijavljuje **najduži**
niz, jedan signal; prikaz se skraćuje na 20 reči, izmerena vrednost ostaje puna.

**6. R4 meri tok tokena celog prompta — prelome reda i nazive blokova uključivo.** Segmenti se
prave isključivo na mestima izuzetih fraza. Posledica: identična linija od 14 reči koju u oba
prompta prati obavezni blok `CAMERA:` broji se kao 15, jer je naziv bloka stvarno ponovljena reč.
Barijera na svakom prelomu reda bi tu jedinicu skinula, ali bi sakrila stvaran slučaj — dve
uzastopne identične linije od po osam reči jesu šesnaest ponovljenih reči, a razdvojene bi obe
pale ispod praga.

**7. `r4Tokens` skida interpunkciju sa ivica tokena.** `image.` i `image` su ista reč. Bez toga bi
izuzeće promašilo svaku liniju koju prompt završava tačkom, a šablon ne — `prompt-templates.md`
piše `PRESERVE` bez tačke, `good-episode` sa njom.

**8. R1 izuzima linkovane shotove i iz para i iz lanca.** Isti `link_group` (3.4) prekida lanac
eskalacije, inače bi A/B/C lanac sam sebe eskalirao. `link_group: null` na oba shota **nije** isti
link_group — `null === null` bi izuzeo ceo storyboard.

**9. R1 eskalacija ide preko granice beata.** „Uzastopni shotovi" znači redosled tajmlajna, ne
ugnežđenost u beat. Dva praga su nezavisna: par se flag-uje na ≤1 različitu osu **od šest**,
eskalacija na 3+ uzastopna shota koji dele **tri** ose (`subject_type` + `location` + `time_light`).
Eskalacije se u izveštaju štampaju pre parova.

**10. R2 prikazuje i vrednosti sa nulom**, i to slugovima iz 3.5, ne prevodom — slug je ono što
stoji u JSON-u i što autor menja. Nepoznata vrednost se prikazuje na kraju liste umesto da nestane
u zbiru; time se tipfeler u tagu vidi bez nove BLOCKING provere.

**11. C2 nema polje u shemi; meri se iz `animation_prompt`-a.** Zatvara otvorenu stavku iz 5.2.
Klip je multi-visual kad prompt to **deklariše** rečnikom iz `visualPromptEngine.md` §16/§30/§37 —
`OPENING VISUAL`, `MIDDLE VISUAL`, `FINAL VISUAL`, `VISUAL TRANSITION`, `VISUAL SEQUENCE`,
`TRANSITION 1`, `TRANSITION 2`, `CINEMATIC TRANSITION` — verzalom, istim mehanizmom kao S2 blokovi.
Samodeklarisani `multi_visual: boolean` bi merio samo to šta je autor upisao (5.2 to i kaže), a uz
to bi dizao `schema_version` zbog signala koji prikazuje broj. **`schema_version` ostaje 1.**
Napomena koja ide uz brojku: aktuelni animation template u `prompt-templates.md` **nema**
multi-visual oblik, pa je danas tačan odgovor uvek 0. Kad ga C11 doda, brojač počinje da radi bez
ijedne izmene u linteru.

**12. `assertShape` sada traži i `shot.link_group`, `shot.tags` (svih šest osa kao stringove) i
`beat.device`.** ADVISORY ih čita. Kad `tags` nedostaje, `undefined === undefined` znači „shotovi
dele osu" — R1 bi merio ništa i ćutao. Tiho ugašen signal je gori ishod od pada alata, isto pravilo
kao za S1 liste. Polja su ionako obavezna po 3.2 i 3.3; C06 ih nije tražio samo zato što ih nijedna
BLOCKING provera nije čitala.

**13. Izveštaj se grupiše po kodu, ne po shotu.** Svih pet pododeljaka je uvek prisutno; prazan
kaže „Nema signala." R4 i C2 nose red legende — bez njega se broj ne može ispravno pročitati
(šta je izuzeto, odnosno šta se uopšte meri).

**14. Fixture-i za C07 prolaze BLOCKING sloj sa nula nalaza.** `repetitive-episode` (4 shota, dva
beata: eskalacija 01–04, par 01→02 i jedan namerni R4 od 15 reči) i `linked-episode` (3 linked
shota istog beata koji dele sve tri ose eskalacije, R1 mora da ćuti). Da fixture pada na BLOCKING,
ne bi se videlo ono što se njime dokazuje — da ADVISORY ne menja exit code. Kontra-test ide korak
dalje: isti fixture sa obrisanim `link_group`-om **mora** da eskalira, inače tišina dokazuje samo
da podataka nema.
