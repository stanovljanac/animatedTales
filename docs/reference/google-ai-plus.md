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

Cena po generisanju. **Radni model je Omni 1.1 Flash i cena mu ide po dužini klipa, ne po
tieru** — Veo tierovi ispod stoje samo da bi se znalo šta se ne koristi.

| Generisanje | Kredita | Kr/s |
|---|---|---|
| **Slika** | **0** | — |
| Omni 1.1 Flash · 10s | 15 | 1,50 |
| Omni 1.1 Flash · 8s | 12 | 1,50 |
| Omni 1.1 Flash · 6s | 10 | 1,67 |
| Omni 1.1 Flash · 4s | 7 | 1,75 |
| ~~Veo 3.1 Lite / Fast / Quality~~ | ~~10 / 20 / 100~~ | ne koristi se |

Dve stvari koje ta kolona `Kr/s` govori:

- **Kratak klip nije ušteda.** Cena po sekundi raste kako klip biva kraći, pa je 4s najskuplja
  sekunda u cenovniku. Klip od 4s se zato izbegava i kad kadar to trpi.
- Ciljni opseg od 7–9s iz `schemas.md` se poklapa sa najjeftinijom sekundom. Ne treba birati
  između tempa i budžeta.

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

> **Budžet je ograničenje kalendara, ne dizajna.** Ovo je jedino pravilo u ovom odeljku i ono
> gazi svaku računicu ispod.

Radni tok je: generiše se dok ima dnevnih kredita, pa se stane. Kad kredita nema, prelazi se
na **paralelnu epizodu sastavljenu samo od slika** — one su 0 kredita, pa taj tok nikad ne
čeka. Iz toga slede dve posledice za `at-storyboard` i `at-qa`:

- **Režim shota se bira vizuelno, nikad po ceni.** Pokret nosi informaciju → `clip`. Kadar je
  držana tvrdnja (makro predmet, prazna posledica, punch rez) → `still`. Nijedan kadar ne
  postaje still zato što je jeftiniji.
- **Ne praviti tabele troška po epizodi.** Broj klipova se saopšti jednom, u jednoj liniji.
  Optimizacija po kreditima krade kvalitet a ne štedi ništa što se inače ne bi potrošilo:
  dnevnih 50 se ionako potroši do kraja.

**Podrazumevani režim epizode je mešovit, pretežno animacija.** Kanal se zove Animated Tales i
ime obećava animaciju. Epizoda u kojoj je svaki shot `still` prolazi sve provere ugovora, ali
pripada paralelnom toku za manje nosive teme — ne glavnoj seriji.

Za orijentaciju u kalendaru, ne u dizajnu: epizoda od ~38 shotova sa ~25 klipova na ~6s je oko
250 kredita, dakle pet radnih dana od samih dnevnih 50.

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
