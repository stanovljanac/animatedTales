# Google AI Plus u ovom lancu

Šta pretplata stvarno daje ovom repou, po fazama, i — važnije — šta **ne** daje, da se ne
troši dan na integraciju koja ne postoji.

## 1. Nema programskog pristupa. Nijednog.

Ovo je prvo jer je najskuplja pogrešna pretpostavka:

| Ideja | Status |
|---|---|
| Gemini API ključ uz pretplatu | **Ne.** API se plaća odvojeno. Cloud krediti idu uz Pro ($10/mes) i Ultra ($100/mes), uz Plus ne idu. |
| Gemini CLI sa višim kvotama | **Ne.** AI Plus je izričito nepodržan za CLI kvote. |
| Dokupiti Flow kredite | **Ne.** „AI credits aren't available for purchase to Google AI Plus members". |
| Skriptovati Flow | **Ne.** Nema javnog API-ja; sve je ručno kroz UI. |

Iz toga sledi da `tools/` ostaje ono što jeste — čist Node bez zavisnosti. Pretplata ne
dodaje nijedan alat u lanac; ona menja **ekonomiju faze 07** i otvara dve stvari koje su
do sada bile odložene.

> Gemini CLI ima besplatni nivo od 1.000 zahteva dnevno uz lični Google nalog. To postoji
> nezavisno od pretplate i ne postaje bolje sa njom.

## 2. Krediti — model

| Stavka | Iznos | Prenosi se? |
|---|---|---|
| Dnevno, svima | 50 kredita/dan | ne |
| Mesečno, AI Plus | +200 kredita/mesec | ne |
| **Plafon** | 30 × 50 + 200 = **1.700/mesec** | — |
| **Plafon u jednom danu** | 50 + 200 = **250** | — |

Cena po generisanju:

| Model | Kredita | Napomena |
|---|---|---|
| **Slika (Nano Banana / Pro)** | **0** | neograničeno, i na besplatnom nivou |
| Veo 3.1 Lite | 10 | |
| Veo 3.1 Fast | 20 | |
| Veo 3.1 Quality | 100 | ista cena na svim planovima |
| Gemini Omni Flash 720p | 7–15 | zavisi od dužine |
| Gemini Omni Flash 360p | 4–7 | |

## 3. Jedno pravilo koje iz toga sledi

**Slika je besplatna, klip nije.** Ceo budžet epizode je budžet za video.

To znači da svaka iteracija koja se može odraditi na slici mora da se odradi na slici.
`image_prompt` se sme vrteti dvadeset puta bez ijednog kredita; `animation_prompt` se
plaća svaki put. Kompozicija, identitet lika, svetlo, paleta i `FRAME LAYOUT` se
zaključavaju u besplatnom koraku — u plaćeni korak ulazi se tek kad je frejm gotov.

Otud i **`ingredient_image`**. Ugovor ga nosi od C01 (invarijanta 13), `shotlist.mjs` ga
ispisuje, ali je u obe postojeće epizode `null` u svakom shotu — 27 od 27 i 33 od 33 —
dok `PRESERVE` linija u svakom animation promptu i dalje traži „same characters, clothing,
props, architecture, palette and composition **as the source image**". Prompt se poziva na
sliku koja se u Flow nikad ne prosleđuje. Dok je tako, svaki klip je text-to-video i svaki
promašen identitet lika je plaćena regeneracija koju je besplatan korak mogao da spreči.

## 4. Budžet epizode

Epizoda je 27–33 shota, dakle 27–33 klipa. Slike se ne računaju.

| Tier | 27 shotova | 33 shota | Dana samo od dnevnih kredita (33) |
|---|---|---|---|
| Lite (10) | 270 | 330 | 7 |
| Fast (20) | 540 | 660 | 14 |
| Quality (100) | 2.700 | 3.300 | **preko mesečnog plafona** |

Prva epizoda u mesecu je kraća za četiri dana, jer mesečnih 200 pokrije toliko.

**Dnevni plafon od 50 je pravi raspored, ne mesečni.** Epizoda na Plus-u nije jedna smena
pred Flow-om nego višednevni posao, i tempo diktira kapaljka, ne brzina rada. Zato je izbor
tiera odluka o kalendaru, a ne o kvalitetu: 33 shota na Lite-u su dva-tri dana, isti ti
shotovi na Fast-u su dve nedelje.

**Preporuka:** Lite kao podrazumevani tier, Quality rezervisan za jedan do dva nosiva kadra
(otvaranje, vrhunac). 31 × 10 + 2 × 100 = **510 kredita** — staje u mesec sa rezervom za
regeneracije i epizoda ipak ima vizuelni vrh. Ovo se poklapa sa `visual_priority` iz sheme 2:
kadrovi koji već nose najveću vizuelnu težinu su isti oni koji zaslužuju Quality.

**Veo audio se ionako baca.** `assemble.mjs` seče klipove sa `-an` jer je narracija jedini
audio stream. Nijedan tier se ne bira zbog zvuka.

## 5. Šta pretplata otvara, a bilo je odloženo

**Muzika.** `docs/plan/00-INDEX.md` je muziku i SFX odložio uz napomenu da se „lako dodaje
kasnije jer `assemble.mjs` već ima audio granu". Uz AI Plus ide Flow Music Starter — oko 600
pesama mesečno, iz posebnog budžeta koji **ne dira** 1.700 video kredita, i sa pravom na
komercijalnu upotrebu, dakle i na monetizaciju na YouTube-u. Izlaz nosi SynthID vodeni žig,
što ne ukida ta prava, ali YouTube traži da se sintetički sadržaj prijavi.

Ovo je jedina stavka pretplate koja dodaje **novi sloj** epizodi umesto da pojeftini postojeći.

**Arhiva.** Repo namerno ne prati medije: folder epizode je ~1,7 GB i skoro sav je video.
Posledica je da za tih 1,7 GB po epizodi ne postoji nikakva kopija. Uz plan ide 400 GB
(ili 2 TB na višem Plus nivou) — oko 230 epizoda na 400 GB. Rezervna kopija `episodes/<slug>/`
je jedina upotreba pretplate koja štiti već obavljen posao.

## 6. Faze 01 i 03

`docs/prompts/01-idea-discovery.md` i `03-research.md` se vrte u chat modelu. NotebookLM uz
Plus ide sa do 100 izvora po beležnici i sa Deep Research-om. Za fazu 03 to je bolji alat od
običnog chata iz jednog razloga: tvrdnja ostaje vezana za izvor, pa `script.md` ima šta da
citira. Faza 01 i dalje bolje stoji u chatu — bodovanje po rubrici traži jedan prolaz, ne korpus.

---

## Sažetak u jednoj tabeli

| Faza | Šta pretplata menja |
|---|---|
| 01 ideje | 2× kvota u Gemini aplikaciji; rubrika ostaje ista |
| 03 research | NotebookLM, 100 izvora, Deep Research, citati |
| 04 skripta | 2× kvota, 3.1 Pro |
| 05–06 | ništa — Whisper i Node lokalno |
| **07 promptovi** | **slike besplatne i neograničene; klipovi 10/20/100; 50/dan + 200/mesec** |
| 08 montaža | ništa u alatu; Flow Music otvara muzički sloj |
| arhiva | 400 GB za medije koje git ne prati |
