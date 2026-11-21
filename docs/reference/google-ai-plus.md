# Google AI Plus u ovom lancu

Šta pretplata stvarno daje ovom repou, po fazama, i — važnije — šta **ne** daje, da se ne
troši dan na integraciju koja ne postoji.

## 1. Nema programskog pristupa. Nijednog.

Ovo je prvo jer je najskuplja pogrešna pretpostavka:

| Ideja | Status |
|---|---|
| Gemini API ključ uz pretplatu | **Ne.** API se plaća odvojeno. Cloud krediti idu uz Pro ($10/mes) i Ultra ($100/mes), uz Plus ne idu. |
| Gemini CLI sa višim kvotama | **Ne.** AI Plus je izričito nepodržan za CLI kvote. |
| Dokupiti Flow kredite | **Ponuđeno u Flow-u, cena nepoznata.** Za Plus je pisalo „AI credits aren't available for purchase"; Flow help page kaže da Plus, Pro i Ultra mogu da dokupe AI kredite u podržanim regionima, a kad krediti ponestanu Flow ispiše „You can wait until they refresh or top up" (viđeno 2026-11-21). Cena i dostupnost u Srbiji nisu proverene. |
| Skriptovati Flow | **Ne.** Nema javnog API-ja; sve je ručno kroz UI. |

Iz toga sledi da `tools/` ostaje ono što jeste — čist Node bez zavisnosti. Pretplata ne
dodaje nijedan alat u lanac; ona menja **ekonomiju faze 07** i otvara dve stvari koje su
do sada bile odložene.

> Gemini CLI ima besplatni nivo od 1.000 zahteva dnevno uz lični Google nalog. To postoji
> nezavisno od pretplate i ne postaje bolje sa njom.

## 2. Krediti — model

> **Pretplata je od ~2. novembra 2026. Google AI Pro, ne Plus** (naziv fajla je ostao). Pro nosi
> 1.000 mesečnih kredita umesto 200. Rok obnove posle upgrade-a nije potvrđen.

| Stavka | Iznos | Prenosi se? |
|---|---|---|
| Dnevno, svima | 50 kredita/dan | ne |
| Mesečno, Google AI Pro | +1.000 kredita/mesec | ne |
| **Plafon** | 30 × 50 + 1.000 = **2.500/mesec** | — |
| **Plafon u jednom danu** | 50 + 1.000 = **1.050** | — |

(Plus je imao +200/mesec i plafon od 1.700; to više ne važi.)

Cena po generisanju. **Radni model je Omni 1.2 Flash (od 2026-11-21) i cena mu ide po dužini
klipa, ne po tieru.** Generiše se **svaka cela sekunda od 3 do 15** (`GEN_TIERS` u
`tools/contract.mjs`), a cena je jednostavna: **3 kredita po sekundi do 10s, a 6 po sekundi
iznad toga.** Tabelu čita `shotlist.mjs` i R8 iz `genCost()` u `contract.mjs` — ovde je samo
prepis.

| Generisanje | Kredita | Kr/s |
|---|---|---|
| **Slika** | **0** | — |
| Omni 1.2 Flash · 3s | 9 | 3,00 |
| Omni 1.2 Flash · 4s | 12 | 3,00 |
| Omni 1.2 Flash · 5s | 15 | 3,00 |
| Omni 1.2 Flash · 6s | 18 | 3,00 |
| Omni 1.2 Flash · 7s | 21 | 3,00 |
| Omni 1.2 Flash · 8s | 24 | 3,00 |
| Omni 1.2 Flash · 9s | 27 | 3,00 |
| Omni 1.2 Flash · 10s | 30 | 3,00 |
| **Omni 1.2 Flash · 11s** | **36** | 3,27 |
| **Omni 1.2 Flash · 12s** | **42** | 3,50 |
| **Omni 1.2 Flash · 13s** | **48** | 3,69 |
| **Omni 1.2 Flash · 14s** | **54** | 3,86 |
| **Omni 1.2 Flash · 15s** | **60** | 4,00 |

Istorija radi poređenja — **Omni 1.1 Flash** (do 2026-11-21, lestvica samo 4/6/8/10s): 4s = 7,
6s = 10, 8s = 12, 10s = 15 kredita; 360p varijanta oko pola cene. Za 1.2 nije snimljena cena
editovanja postojećeg klipa (bilo 40 kredita).
~~Veo 3.1 Lite / Fast / Quality~~ se ne koristi.

**360p varijanta (Omni 1.2): ~3× jeftinija, i ne koristi se za finalne klipove.** Cena je po
korisniku oko trećine (tačna tabela po sekundi nije snimljena). Razlog što se ne koristi: Flow
„originalna veličina" je **720p**, `assemble.mjs` ga već razvlači na 1920×1080 (×1,5), a 360p bi
išao ×3 — kod ilustracije sa tankim tamnim konturama to je mutno, i klip bi bio vidljivo mekši od
still kadrova i end kartice u istoj epizodi. Pregled radi, 360p ne prenosi rezultat: regeneracija
u 720p je novo, drugačije generisanje, pa se ne može „odobriti" jeftino i onda platiti isto.
Jedina opravdana upotreba je probni klip za prompt tipa koji se često lomi (vidi
`animacija-sitni-predmeti` u memoriji) — učiš šta model radi, ne biraš kadar.

**Preuzimanje iz Flow-a** (meni klipa → Download, viđeno 2026-11-21): 270p animirani GIF,
**720p Original size**, **1080p Upscaled**, 4K Upscaled (traži Upgrade). Montaža radi sa bilo
kojim: `assemble.mjs` svaki klip skalira na 1920×1080 (lanczos). Flow-ov 1080p upscale je u 1.1
bio 0 kredita za Plus/Pro/Ultra; za 1.2 nije proveren, a ni to koliko je bolji od lanczos-a. Ako
se proverava: skini jedan isti klip kao 720p i 1080p, stavi oba u 1080p tajmlajn i uporedi
konture na 100%; ako nema razlike, upscale se preskače.

Šta ta tabela govori:

- **Od 3 do 10 sekundi cena je ravna: 3 kr/s.** Kratak klip više nije skuplja sekunda (u 1.1 je
  4s bio najskuplja sekunda, pa se „ne koristi skoro nikad"; to pravilo je ukinuto). Cena epizode
  zavisi od **ukupnog broja generisanih sekundi**, ne od broja klipova ni od toga kako su
  podeljeni. Ritam reza se zato bira prema priči, ne prema ceni.
- **Svaka sekunda preko 10 je duplo skuplja (6 kr).** Jedan klip od 15s košta 60 — koliko dva
  klipa od 10s, dakle 20 sekundi materijala. Klip od 11–15s je dozvoljen samo kad ga scena
  stvarno traži kao **jedan neprekinut pokret** (dug hod, spor panorama kroz grad, jedna
  radnja koja ne trpi rez), i svodi se na minimum. Uz cenu ima i drugu stranu: što je klip duži,
  to ga je teže animirati do kraja bez zamrzavanja (vidi `prompt-templates.md`, „Pravila
  proreza" — 13–15s traži 6–7 proreza). Planer reza zato i dalje ne pravi shot duži od 10s;
  duži se uvodi ručno (`maxShot` u `tools/config.json`) i R8 ga svaki put prijavi sa cenom.
- **Sekunda viška je 3 kredita.** `gen_len` je najmanja cela sekunda koja pokriva `use_len`
  (4,62s → 5s, ne 6s kao u 1.1); sve preko toga je bačeno i R8 to javlja.
- **Klip od 14s ili 15s (54 i 60) ne staje u jedan dan dnevnih 50.** Troši mesečne kredite;
  klip od 12s (42) staje, ali ostavlja 8.
- **Cena epizode ≈ 3 × sekunde pokrivene klipovima.** Epizoda od ~30 klipova i ~200s generisanja
  je oko 600 kredita — otprilike 1,8× više nego pod Omni 1.1 (~340). Izmereno nad postojećim
  storyboardima: 492–720 kredita po epizodi uz `gen_len` prilagođen novoj lestvici, naspram
  279–402 po starom cenovniku.

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

Za orijentaciju u kalendaru, ne u dizajnu (Omni 1.2, cena ≈ 3 kr × generisane sekunde):

| Epizoda | Klipova | Sekundi | Kredita | Dana od dnevnih 50 |
|---|---|---|---|---|
| ~4 min, ~30 klipova (mansa-musa, emu-war) | 28–30 | ~200 | ~600 | ~12 |
| ~4 min, ~35 klipova (three-underworlds) | 36 | ~240 | ~720 | ~14 |
| ~6 min, ~49 klipova (buffalo-jump) | 49 | ~350 | ~1.050 | ~21 |
| 8 min (plafon od 2026-11-21), ~88% klipova, ~420s | ~55 | ~420 | ~1.270 | ~25 |
| 10 min (stari plafon), ~88% klipova, ~530s | ~70 | ~530 | ~1.600 | ~32 |

Izmereno nad storyboardima svih postojećih epizoda: **120–190 kredita po minutu naracije**
(novije epizode ~170, jer su skoro sve klipovi). Stari cenovnik (Omni 1.1) je bio ~75–95.
Mesečnih 2.500 (50 × 30 + 1.000) zato nosi oko **15 minuta potpuno animirane naracije** —
tri epizode od 4–5 minuta, ili skoro dve od 8 — i to bez ijednog odbačenog klipa. Odbačen
klip se plaća (filter vraća kredit samo kad klip odbije pre generisanja, vidi
`flow-filter.md`), pa je realno manje. Ovo je kalendar, ne pravilo o dizajnu: režim shota i dalje
bira slika, ne cena.

**Veo audio se ionako baca.** `assemble.mjs` seče klipove sa `-an` jer je narracija jedini
audio stream. Nijedan tier se ne bira zbog zvuka.

## 5. Šta pretplata otvara, a bilo je odloženo

**Muzika.** `docs/plan/00-INDEX.md` je muziku i SFX odložio uz napomenu da se „lako dodaje
kasnije jer `assemble.mjs` već ima audio granu". Uz AI Plus ide Flow Music Starter — oko 600
pesama mesečno, iz posebnog budžeta koji **ne dira** video kredite (2.500 mesečno), i sa pravom na
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
| **07 promptovi** | **slike besplatne i neograničene; klipovi 3 kr/s do 10s, 6 kr/s iznad (Omni 1.2); 50/dan + 1.000/mesec (Pro)** |
| 08 montaža | ništa u alatu; Flow Music otvara muzički sloj |
| arhiva | 400 GB za medije koje git ne prati |
