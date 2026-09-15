# antikythera-mechanism — beleške

Prva **still** epizoda: nijedan Veo klip, svaki shot je slika kojoj pokret daje montaža
(`render_mode: "still"`, spec `docs/superpowers/specs/2026-09-09-still-kadrovi.md`).
Istovremeno je i prvi test profila prompta v3
(`docs/superpowers/specs/2026-09-13-forma-image-prompta.md`).

## Izbor teme (faza 02)

Ideja **#16 — The Ancient Machine That Shouldn't Exist** (90.0, drugo mesto posle već
urađene #26). Izabrana zbog still formata, ne samo zbog skora:

- **Subjekti su predmeti i mesta, ne likovi.** Olupina, statue, fragment, zupčanici, brojčanici.
  Predmet na slici bez pokreta izgleda kao namerna ilustracija; lik koji bi trebalo da se
  pomera izgleda kao zamrznut klip. Samo dva lika se ponavljaju (ronilac, Stais).
- **Žanr je misterija/otkriće**, gde je slika sa sporim zumom prirodan jezik (dokumentarci
  tako izgledaju), za razliku od mitske akcije.
- Nema masovnih scena ni nasilja koje bi image model odbio.

Odbačeno za ovaj test: #8 (leš na suđenju — rizik da model odbije), #28 Oziris (više
bogova koje treba držati konzistentnim kroz ~50 slika; dobar kandidat za sledeću still
epizodu), #9 (ples traži pokret i gomile).

## Skripta

- 56 rečenica, 591 reč sa outrom, procena **~4:15** po tempu Tir epizode (139 reči/min).
  Merodavno je tek izmereno trajanje narracije.
- Hook je doslovan iz `ideas.md`.
- Glas: **Explorer / discovery** — detalji isporuke u `research.md`.
- Svesno izostavljeno: koji tačno zupčanik ima 223 zupca (izvori se razilaze), Price po
  imenu, Kusto 1976, rekonstrukcija planeta iz 2021.

### Za ElevenLabs

- Lepi se **samo tekst** iz `script.md`, bez naslova `## OUTRO` i bez HTML komentara na kraju.
- Proveriti izgovor: *Antikythera* (an-tee-KEE-thee-ra), *Valerios Stais* (va-LEH-ree-os STA-ees),
  *Cicero*, *Archimedes*.
- Posle rendera: fajl ide u `episodes/antikythera-mechanism/narration.mp3`.
- `script.md` je od tog trenutka **zamrznut** — ako se tekst promeni u ElevenLabs-u, isto
  mora da se promeni i u `script.md` pre `align.mjs`.

## Narracija i alignment

`narration.mp3` 244.27s (procena je bila ~4:15). `align.mjs` (small.en): poklapanje 99.3% tokena,
3 pauze >1.5s (sve su prelazi pasusa: S23, S29, S46), 2 rečenice ispod 0.85 — S20 (0.849, ime
*Stais*) i S33 (0.847, „half dark"); vremena su izmerena, ne interpolirana. `outro_start` 229.64 (S54).

## Beat mapa

Nacrt od 23 beata dao je 42 kadra, a pet slika je stajalo 8–9s. Za still epizodu je to sporo, jer
jedna slika nema pokret koji bi nosio dugo trajanje. Zato su četiri beata podeljena na granici
rečenice, bez reza unutar rečenice:

- B01 → S01 | S02 (fragment u vodi / zlatni duh brojčanika)
- B11 → S24 | S25 (svađa / fragment pored proste igle)
- B13 → S29–S30 | S31 (ručica / zupčanici pokreću nebo)
- B16 → S37 | S38 (pun Mesec / astronom)

Rezultat: **27 beatova, 46 kadrova, prosek 5.31s**, 25/46 u opsegu 4–6s. Tri `intra-sentence-cut`
(S17, S20, S55) su neizbežna: rečenica je duža od 9s ili je njen sused kraći od 2.5s.

**Kadrovi 44–46 su outro.** End card preuzima sliku na `outro_start` (229.64), pa ih montaža ceo
izbacuje (schemas.md §5.8 tačka 1). Postoje zato što splitter pokriva svaku rečenicu. F1 ipak traži
fajl, pa slika mora da postoji. Slike su besplatne, a 44 i 46 mogu da posluže kao podloga za end card.

## Osa ekrana

Nema dve strane sukoba, pa osa nosi **smer vremena i smer spuštanja**:

- **Vreme ide nalevo → nadesno.** Antika drži levu stranu, moderno doba desnu (tabla vremena
  u B22 / shot 34: mehanizam levo, srednjovekovni sat desno).
- **Otkriće ide odozgo nadole, a razumevanje odozdo nagore.** Ronjenje (B04–B07) je vertikalno,
  čamac gore; skenovi i rekonstrukcija (B14–B21) „izranjaju".
- Brojevi beatova su posle podele iz odeljka „Beat mapa" (27 beatova).
- Fragment, kad stoji pored rekonstrukcije, uvek je **levo** (prošlost), rekonstrukcija **desno**.

## Dominantan subjekt po kadru

ANTI-REPETITION CHECK iz spec-a (§3 tačka 7). Dva uzastopna kadra nemaju isti dominantan subjekt.
Fragment se vraća kao motiv (01, 02, 17, 18, 20, 36, 39, 43), ali svaki put u drugom stanju: u vodi,
kao zlatni duh, kao makro, kao presek, pored igle, u vitrini, pored rekonstrukcije i u pesku.

| shot | beat | s | veličina | pokret | dominantan subjekt |
|---|---|---|---|---|---|
| 01 | B01 | 3.9 | CU | push | fragment u vodi — odsjaj na jednom zupcu |
| 02 | B02 | 3.3 | MS | pull | zlatni duh celog brojčanika preko fragmenta |
| 03 | B03 | 5.7 | LS | pan-right | čamac u oluji — mali čamac, ogromni talasi |
| 04 | B03 | 6.4 | XLS | pull | ostrvo — gole litice i čamac u zavetrini |
| 05 | B04 | 3.6 | MS | push | ronilac tone odozgo — vertikala crevo–čamac |
| 06 | B05 | 4.1 | MS | hold | posada oko prestravljenog ronioca na palubi |
| 07 | B05 | 6.2 | LS | push | silueta — ljudi i konji u mraku, kroz okno kacige |
| 08 | B06 | 5.0 | CU | pan-right | otkrivanje — bronzana ruka i mermerna glava konja |
| 09 | B06 | 7.6 | LS | pull | celo polje olupine — rebra broda, amfore, statue |
| 10 | B07 | 4.8 | LS | hold | presek mora — brodovi gore, ronioci i statua dole |
| 11 | B07 | 7.1 | CU | push | ronilac vuče uže — napor i dubina |
| 12 | B08 | 3.5 | MS | hold | prazna kaciga na kolutu užeta — sumrak |
| 13 | B09 | 4.9 | LS | pan-right | stolovi puni nalaza — redovi |
| 14 | B09 | 4.6 | MS | push | bezoblična gruda na ivici stola — ignorisana |
| 15 | B10 | 4.1 | CU | hold | gruda raspuknuta na komade — odozgo |
| 16 | B10 | 5.3 | MS | push | Stais sa lupom — lice otkrića |
| 17 | B10 | 5.3 | ECU | push | makro — zupčanik izranja iz kore |
| 18 | B11 | 7.3 | CU | pull | presek — slojevi zupčanika u kutiji veličine cipele |
| 19 | B12 | 5.2 | LS | pan-left | naučnici se svađaju — prst uperen u fragment |
| 20 | B13 | 3.0 | CU | hold | fragment pored proste bronzane igle — poređenje |
| 21 | B14 | 8.0 | LS | push | fragment u ogromnom rendgen skeneru 2005. |
| 22 | B14 | 8.6 | ECU | pan-right | rendgen snimak — zupčanici i sićušna slova |
| 23 | B15 | 4.1 | MS | push | ruka na ručici — mehanizam kao nov |
| 24 | B16 | 4.5 | CU | pull | zupčanici pokreću nebo — Sunce i Mesec iznad kutije |
| 25 | B17 | 9.0 | CU | push | prednji brojčanik — zodijak, kazaljke Sunca i Meseca |
| 26 | B17 | 5.3 | ECU | hold | makro — kuglica faze Meseca, pola crna pola srebrna |
| 27 | B18 | 4.5 | CU | pull | zadnja ploča — dve velike spiralne skale |
| 28 | B18 | 3.3 | LS | hold | pomračenje nad grčkim gradom |
| 29 | B18 | 5.5 | LS | pan-right | trkači na stadionu u Olimpiji |
| 30 | B19 | 3.0 | LS | push | pun Mesec nad krovovima — jedini subjekt neba |
| 31 | B20 | 5.1 | MS | hold | astronom beleži nejednak hod Meseca |
| 32 | B21 | 7.3 | CU | push | tehnički crtež — dva zupčanika na pomerenim osama, klin u žlebu |
| 33 | B21 | 4.3 | CU | pan-right | kazaljka Meseca — brzi i spori položaji na brojčaniku |
| 34 | B22 | 7.2 | XLS | pan-right | vremenska linija — mehanizam levo, hiljadu godina tame, sat desno |
| 35 | B22 | 5.2 | LS | pull | srednjovekovni astronomski sat — hiljadu godina kasnije |
| 36 | B23 | 4.5 | MS | push | fragment sam u vitrini — refleksija posetioca |
| 37 | B24 | 7.4 | MS | hold | Ciceron piše uz lampu |
| 38 | B24 | 3.3 | MS | push | Arhimed kraj bronzane sfere prstenova |
| 39 | B24 | 6.0 | MS | pull | fragment levo, rekonstrukcija desno — dokaz |
| 40 | B25 | 7.3 | MS | pan-left | polica sa prašnjavim obrisima mehanizama kojih više nema |
| 41 | B25 | 5.9 | CU | push | livnica — bronza se topi, zupčanik u tiglu |
| 42 | B26 | 4.2 | LS | hold | antički brod tone u oluji kraj litica |
| 43 | B26 | 5.7 | MS | pull | fragment u pesku na dnu — vekovima bezbedan |
| 44 | B27 | 5.1 | LS | push | zlatna sazvežđa izranjaju iz fragmenta (outro — otpada u montaži) |
| 45 | B27 | 4.7 | XLS | pull | čamac na zalasku kraj ostrva (outro — otpada u montaži) |
| 46 | B27 | 4.8 | MS | hold | rekonstruisan mehanizam na dubokoj plavoj (outro — otpada u montaži) |

**R1 eskalacija 25–27 je svesna.** Tri uzastopna kadra su predmet u radionici pod lampom: prednji
brojčanik, kuglica faze Meseca i zadnja ploča. Narracija u B17–B18 nabraja delove mehanizma, pa tri
detalja istog predmeta ovde jesu sadržaj. Razlikuju se po veličini (CU, ECU, CU) i pokretu (push,
hold, pull), a posle njih dolazi rez na pomračenje nad gradom.

## Profil v3 i A/B test

Svih 46 promptova je pisano po profilu v3: `SHOT` odmah posle `STYLE`, dubinski slojevi u `FRAME
LAYOUT`, `NOT IN FRAME` opisan pozitivno i `RENDER` kao poslednji red. Dužina je 185–272 reči, a
prosek je oko 225. Prvi nacrt je imao prosek 267 i 21 kadar preko 280; skraćeni su
`SCREEN DIRECTION`, `FACING` i `NOT IN FRAME`, ne lockovi.

`RENDER` linija nije izuzeta iz R4, pa se završetak `NOT IN FRAME` sabira sa njenih 11 reči. Dva
prompta koji se završavaju istim sa dve reči („the upper edge") već prelaze prag od 12. Završeci su
zato namerno različiti. Ako se v3 usvoji, izuzeće iz R4 rešava ovo trajno.

A/B verzije za kadrove 06, 07, 09, 10, 16 i 17 su u `ab-test.md`, zajedno sa tabelom za rezultat.

## Redosled posle narracije

1. ~~`align.mjs`~~ ✓
2. ~~`beatplan.mjs --still`~~ ✓ — checkpoint ispisan; korisnik je unapred tražio rad do kraja
3. ~~`--still --write`, promptovi po v3, `still_motion`~~ ✓
4. ~~tabela „dominantan subjekt po kadru"~~ ✓
5. ~~`lint.mjs --no-media` (BLOCKING 0), `render.mjs`~~ ✓ · `shotlist.mjs` → čeklista za Flow
6. slike u `shots/shotNN.jpeg`, **end card** u folder i u `episode.json` `endcard_file`
7. `node tools/assemble.mjs episodes/antikythera-mechanism` → `final.mp4`, `qc-report.md`

## Otvoreno

- `endcard_file` ne postoji — potreban pre koraka 7.
- `docs/ideas.md` #16 i dalje nosi `status: scored`; prebaciti na `done` kad epizoda bude gotova.
