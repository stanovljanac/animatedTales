# Animated Tales — razbijen plan izvođenja

Izvorni plan: `C:\Users\Mihailo\.claude\plans\dakle-goal-je-da-keen-pillow.md` (402 linije).
Ovaj folder ga deli na **15 celina**, svaka projektovana da stane u jednu sesiju od 150k–200k tokena.

## Kako se pokreće jedna celina

Svaka sesija počinje sa:

```
Implementiraj celinu CNN iz docs/plan/CNN-<ime>.md.
Izvorni plan je C:\Users\Mihailo\.claude\plans\dakle-goal-je-da-keen-pillow.md — pročitaj sekcije koje celina navodi.
```

Fajl celine je ugovor: šta ulazi, šta izlazi, kako se verifikuje. Ako sesija pređe ~150k tokena
pre nego što stigne do verifikacije, staje na najbližoj tački preseka koju fajl navodi
i predaje ostatak sledećoj sesiji.

## Redosled i zavisnosti

| # | Celina | Faza | Zavisi od | Procena |
|---|---|---|---|---|
| C01 | [Skelet, migracija, data ugovori](C01-skelet-migracija-sheme.md) | 0 — temelji | — | ~80k |
| C02 | [Kreativni ugovori (reference/)](C02-kreativni-ugovori.md) | 0 — temelji | C01 | ~100k |
| C03 | [Rubrika + bodovanje ideja](C03-rubrika-i-ideje.md) | 0 — temelji | C01 | ~85k |
| C04 | [ffmpeg.mjs + timeline.mjs](C04-ffmpeg-i-timeline.md) | 1 — alati | C01 | ~140k |
| C05 | [align.mjs (forced alignment)](C05-align.md) | 1 — alati | C04 | ~160k |
| C06 | [lint.mjs — BLOCKING sloj](C06-lint-blocking.md) | 1 — alati | C01, C02, C04 | ~130k |
| C07 | [lint.mjs — ADVISORY sloj](C07-lint-advisory.md) | 1 — alati | C06 | ~100k |
| C08 | [render.mjs + shotlist.mjs](C08-render-i-shotlist.md) | 1 — alati | C01, C06 | ~100k |
| C09 | [assemble.mjs — jezgro](C09-assemble-jezgro.md) | 1 — alati | C04, C06 | ~150k |
| C10 | [assemble.mjs — dissolve + qc-report](C10-assemble-dissolve-qc.md) | 1 — alati | C09 | ~90k |
| C11 | [Prepisivanje promptova 01/03/04](C11-promptovi.md) | 2 — AI sloj | C02 | ~140k |
| C12 | [Skills at-storyboard / at-qa / at-assemble](C12-skills.md) | 2 — AI sloj | C02, C04–C10 | ~110k |
| C13 | [Suvi hod A — alignment + beat plan](C13-suvi-hod-a.md) | 3 — validacija | C05, C12 | ~90k |
| C14 | [Suvi hod B — storyboard + QA](C14-suvi-hod-b.md) | 3 — validacija | C13 | ~180k |
| C15 | [Suvi hod C — montaža + review](C15-suvi-hod-c.md) | 3 — validacija | C14, C10 | ~80k |

**Kritični put:** C01 → C04 → C05 → C06 → C09 → C12 → C13 → C14 → C15.
**Nezavisno, može bilo kad:** C02, C03, C11 (C11 traži C02).
**Tvrdo pravilo iz izvornog plana:** faza 2 (C11–C12) se ne dira dok cela faza 1 (C04–C10) ne radi 100% pouzdano.

## Odstupanja od izvornog plana (provereno u okruženju, 2026-09-04)

Ovo su činjenice zatečene na disku koje izvorni plan nije imao. Svaka je upisana u celinu koje se tiče.

1. **`ffprobe` ne postoji.** `imageio_ffmpeg` isporučuje isključivo
   `C:\Python311\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`.
   Na PATH-u nema ni `ffmpeg` ni `ffprobe`. `probe()` mora da parsira stderr od `ffmpeg -i`. → **C04**
   — *zatvoreno: `tools/ffmpeg.mjs`, verifikacija V1 prolazi.*
2. **`storyboard.json` shema nije nigde specificirana**, a konzumiraju je `lint`, `render`, `shotlist`,
   `assemble` i oba skila. Postaje eksplicitan artefakt (`docs/reference/schemas.md`). → **C01**
3. **Nema git repozitorijuma**, a folder je 1.7 GB (uglavnom mp4). `git init` + `.gitignore` koji
   izbacuje medije, inače je svaki commit neupotrebljiv. → **C01**
4. **`narration.mp3` ima `start: 0.025057`** (Rome). Nije nula — mora se svesno odlučiti da li se
   oduzima pri alignmentu i pri lepljenju audia. → **C05**, **C09**
5. **`ideas.md` ima 30 ideja u 3 kategorije, ali samo 2 nose oznaku `DONE`** — a gotove su 4 epizode.
   Status se mora uskladiti sa `episodes/`. → **C03**
6. **Algoritam sečenja beata ima nepokrivenu ivicu:** beat od npr. 30.5s sa svega 2 rečenice
   (14s + 16.5s) ne može da poštuje i „max 10s po shotu" i „rez pada na granicu rečenice".
   Ponašanje mora biti definisano. → **C04**
   — *zatvoreno: četiri nivoa kandidata za rez + upozorenja, `docs/reference/schemas.md` §5.3.*
7. **R4 (n-gram ponavljanje) sudara se sa C1 (doslovno kopiranje `locked_description`).**
   C1 *zahteva* identičan blok od 25–40 reči u svakom shotu; R4 kažnjava >12 identičnih reči.
   R4 mora da izuzme `locked_description` i kanonski style string. → **C07**
   — *zatvoreno: `docs/reference/schemas.md` §5.6 tačke 2–4; izuzeća su tri, ne dva.*
8. **`use_len` od 1.2s, koji C06 traži kao okidač za T2, nije predstavljiv na 24fps** (28.8 frejma).
   Loš fixture koristi najbližu frejm-poravnatu vrednost, 1.208s. → **C06**
   — *zatvoreno: `docs/reference/schemas.md` §5.5 tačka 12.*
9. **Fixture za C06 mora da bude folder epizode, ne pojedinačni JSON**, jer je definicija gotovog
   komanda nad folderom. Uz njega idu i klipovi za F1 (~14 KB, izuzetak u `.gitignore`). → **C06**
   — *zatvoreno: `docs/reference/schemas.md` §5.5 tačka 10.*

10. **Sudar R4 protiv C1 ima i treći izvor koji plan ne pominje: fiksne `PRESERVE`/`FORBID`
    linije animation šablona.** `prompt-templates.md` ih propisuje kao fiksne, a `PRESERVE` sama
    nosi tačno 13 reči — dakle sama obara prag „>12" na svakom paru shotova. Bez trećeg izuzeća
    R4 laje na svaki ispravan storyboard, baš kao i bez prva dva. → **C07**
    — *zatvoreno: `docs/reference/schemas.md` §5.6 tačka 2; provereno na `good-episode` fixture-u.*

11. **C2 („broj multi-visual klipova") nije definisan ni u izvornom planu ni u shemi**, a
    `visualPromptEngine.md` §15–17 ga definiše kao klip sa više povezanih vizuelnih momenata.
    Merenje je izvedeno iz deklaracije u `animation_prompt`-u, bez novog polja i bez rasta
    `schema_version`-a. Posledica koju treba znati: **aktuelni animation šablon nema
    multi-visual oblik**, pa je danas tačan broj uvek 0 dok ga C11 ne doda. → **C07**
    — *zatvoreno: `docs/reference/schemas.md` §5.6 tačka 11, §5.2.*

12. **`lint.mjs` ne traži polja koja nijedna BLOCKING provera ne čita.** `beat.dur`,
    `beat.sentences`, `beat.narration_says`, `beat.viewer_sees` i `shot.ingredient_image` obavezni su
    po shemi (3.2/3.3), ali ih `assertShape` ne proverava jer ih nijedno pravilo ne meri — storyboard
    bez njih prolazi BLOCKING. Od C08 ih traži bar prikaz, i to padom umesto `undefined`-a u sredini
    dokumenta. → **C08**
    — *zatvoreno za prikaz: `assertDisplayable` + `DISPLAY_FIELDS` u `tools/contract.mjs`,
    `docs/reference/schemas.md` §5.7 tačka 5. Za BLOCKING ostaje otvoreno, svesno.*

13. **Verifikacija iz samog plana ne bi ništa ispisala bez normalizacije `--only`.** Plan traži
    `node tools/shotlist.mjs … --only 1,3`, a `shot_id` je string sa vodećom nulom (`"01"`, odluka
    C01 tačka 6). `--only` zato prima oba oblika. → **C08**
    — *zatvoreno: `resolveOnly` u `tools/shotlist.mjs`, `docs/reference/schemas.md` §5.7 tačka 6.*

14. **End card i splitter traže istu sekundu.** Korak 5 daje end card-u outro deo narracije, a
    splitter po invarijanti 4 pokriva **sve** rečenice — uključujući outro. Dve odluke se sudaraju
    nad istim vremenom i neko mora da popusti: popušta slika, jer se rep od 11s tišine preko
    poslednjih shotova ne može odbraniti. Shotovi iza `outro_start` u montaži otpadaju, onaj koji
    granicu prelazi se krati, i oba se ispisuju. → **C09**
    — *zatvoreno: `planCuts` u `tools/assemble.mjs`, `docs/reference/schemas.md` §5.8 tačka 1.*

15. **Prihvatanje „293.7s ±0.2s" ne meri ukupno trajanje.** Isti izvorni plan traži i zbir
    `use_len` = 293.7s i end card koji se drži duže od kraja narracije; oboje odjednom ne mogu da
    stanu u ±0.2s. Meri se **pokrivenost** (trajanje do kraja narracije), a rep od 1.5s je poznat
    dodatak, ne drift. Marathon: pokrivenost 293.75s, ukupno 295.25s, izmereno = očekivano u
    frejm. → **C09**
    — *zatvoreno: `coverage` u `planCuts`, `docs/reference/schemas.md` §5.8 tačka 2.*

16. **Legacy raspored fajlova probija dve konvencije odjednom.** Marathon klipovi stoje u korenu
    foldera, bez vodeće nule (`part7.mp4`, ne `shots/part07.mp4` iz invarijante 13), a end card se
    zove `endKartica.jpeg`. Zato montaža uzima putanju iz `source_file` polja, a imena medija iz
    `episode.json` — za razliku od formatera, kojima je manifest zabranjen (§5.7 tačka 1). → **C09**
    — *zatvoreno: `mediaNames` i `shotArgs`, `docs/reference/schemas.md` §5.8 tačke 9 i 11.*

17. **Formula za kompenzaciju dissolve-a iz plana važi samo za lanac od dva.** Plan traži
    produženje `use_len` „za pola trajanja prelaza" **po shotu**; lanac od tri tako dobije 3·N/2
    frejmova viška, a `xfade` mu uzme 2·N. Računa se po granici, ne po shotu. → **C10**
    — *zatvoreno: `applyDissolve` u `tools/assemble.mjs`, `docs/reference/schemas.md` §5.9 tačka 1.*

18. **Simetričan prelaz oko reza nije izvodljiv na zatečenom materijalu.** Centriranje traži
    `use_in ≥ N/2` u desnom delu, a `use_in` je u praksi nula — sva tri shota jedinog Marathon
    lanca (B05) stoje na `use_in: 0`, pa bi sa simetrijom epizoda dobila nula prelaza. Višak se
    uzima sa repa levog dela. → **C10**
    — *zatvoreno: `docs/reference/schemas.md` §5.9 tačka 2; početak desnog dela se ne pomera.*

19. **Marathon nema nijedan shot ispod 50% iskorišćenja koji nije posledica outro reza.** Svi
    klipovi traju 10.01s, a rezovi su 8.875s ili 9.0s — 89%. Jedini kandidat je shot 33, i to
    zato što ga je `outro_start` skratio na 3.125s. Zato izveštaj razdvaja „odsečen outrom" od
    „kratko sečen od početka", a drugi primer za ručnu proveru iz plana je konstruisan
    (`--outro-start 280` daje shot 32 na 4s = 40%). → **C10**
    — *zatvoreno: `docs/reference/schemas.md` §5.9 tačka 9.*

20. **Formula outro-a i propisan raspon reči se sudaraju.** Plan traži 18–28 reči, a referentni
    uzorak koji ista celina navodi kao obavezan da se reprodukuje ima **37** (kanonsko brojanje,
    §0.6): most 13 + poziv 13 + like/subscribe 8 + odjava 3. Raspon je procena koja nikad nije
    proverena nad uzorkom, a uzorak je stvarna, isporučena epizoda — pa popušta raspon.
    Novi raspon je **30–42 reči (~11–16s)**. → **C11**
    — *zatvoreno: `docs/prompts/04-script.md`, odeljak „The OUTRO"; formula reprodukuje uzorak
    doslovno (`normalize()` jednakost, §0.7).*

21. **`masterPrompt.md` se ne može obrisati u ovoj celini a da se ne izgubi sadržaj bez kopije.**
    Sekcije 12 (VISUAL MODES), 22 (EARLY MOTION — „pokret počinje u prve 2–3 sekunde") i 25
    (STILL IMAGE MONTAGE) ne postoje ni u `reference/` ni u `visualPromptEngine.md`. To je
    vizuelni sloj, dakle ulaz za C12 — a plan sam zabranjuje brisanje dok jedinstven sadržaj nije
    potvrđen u skilovima. Zamka celine tako obara njenu tabelu: fajl dobija `DEPRECATED` u prvoj
    liniji i briše se **zajedno sa `visualPromptEngine.md`, posle C12**. Time pada i jedna
    stavka definicije gotovog (`ls docs/masterPrompt.md` → ne postoji). → **C11**, zatvara se u **C12**
    — *zatvoreno u C12: sve tri sekcije su u `.claude/skills/at-storyboard/SKILL.md` (VISUAL MODES,
    EARLY MOTION, STILL IMAGE MONTAGE — poslednja i kao merljiv signal u `at-qa`); oba fajla su
    obrisana, citati na njih po repou označeni kao provenijencija (`schemas.md` §5.10 tačka 5).*

22. **Mera „zbir `prompts/` + `reference/` ≈ 1000 linija" više ne meri ništa.** `schemas.md` je u
    međuvremenu narastao na 1018 linija sam za sebe, jer je mašinski ugovor koji je rastao sa
    svakom celinom C01–C10, a ne prompt-proza. Merodavno je: **svaki fajl u `prompts/` < 200**
    (133 / 152 / 191) i **`prompts/` = 476 linija** naspram 2134 iz tri originala. → **C11**


23. **`timeline.mjs` nema CLI, pa lanac od `timing.json` do `storyboard.json` nije postojao.**
    `schemas.md` §3 je tvrdio da `storyboard.json` piše „at-storyboard (kroz `timeline.mjs`)", a C12
    i C13 su oba zvali `node tools/timeline.mjs`. Modul je čist — bez fajl I/O, po sopstvenom
    zaglavlju — i jedini potrošač `planTimeline`-a u repou bio je njegov test. Skil je tu prazninu
    mogao da popuni samo ad-hoc skriptom po epizodi, što je tačno zamka koju C12 navodi prvu
    („skil koji opisuje CLI koji ne postoji"). Dodat je `tools/beatplan.mjs` — tanak alat iznad
    modula, koji ispisuje checkpoint i piše skelet; `timeline.mjs` ostaje čist. → **C12**
    — *zatvoreno: `tools/beatplan.mjs` + `tests/beatplan.test.mjs` (29 testova), ugovor u
    `schemas.md` §5.11. C13 korak 6–7 time dobija oslonac.*

24. **Plafon P1 od 160 reči nije bio ograničenje modela nego generatora, i počeo je da izbacuje
    sadržaj.** Prva merena epizoda: 17 od 27 shotova na ≤5 reči od plafona, a iz tog pritiska je
    izvedeno „pravilo" jednog zaključanog entiteta po shotu — pa je u tri kadra u kojima je vuk bio
    `center, near-camera and large` lock otišao na lanac. Uvedena je **shema 2**
    (`schema_version: 2`): plafon 280 uz meki cilj 180–260 (R5), blokovi `SUBJECT`/`SCALE`/`DETAIL`,
    PRIMARY/SECONDARY lock kroz redosled `characters[]`, i `visual_priority` kao mašinski uporediv
    prioritet (S5). Shema 1 ostaje validna — linter bira pravila po broju. → **C14**
    — *zatvoreno: `schemas.md` §3.3.1 + S4/S5/R5/R6 u `lint.mjs`, tyr-and-fenrir prepisan na shemu 2
    sa BLOCKING 0; merenja u `episodes/tyr-and-fenrir/notes.md`. `beatplan.mjs` od sada piše skelet
    na shemi 2, a `check-fixtures.mjs` bira pravila po istom broju — inače bi odluka važila za jednu
    epizodu, a sledeća bi tiho krenula na starom ugovoru.*

25. **Pet kamera-blokova drže jedan kadar, ali ništa ne drži rez između dva.** Prva epizoda je imala
    dve ose ekrana koje se sudaraju na dva reza, jedan od njih na vrhuncu; nijedna provera to nije
    mogla da vidi, jer bi merenje tražilo da alat razume ko je ko u sceni. Pravilo je zapisano u
    `camera-language.md` („Osa ekrana — jedna po epizodi"), a izabrana vrednost ide u `notes.md`
    epizode. Ostaje **kontrolna lista za pisca prompta, ne provera** — iz istog razloga iz kog
    `visual-devices.md` ostavlja izbor uređaja skilu. → **C14**
    — *zatvoreno: odeljak u `camera-language.md`; tyr-and-fenrir ima jednu osu u svih 27 kadrova.*

26. **`storyboard.md` je tačan i nerežijski.** 27 shotova daje 1347 redova, pa se ritam epizode —
    smenjivanje veličina kadra, ponavljanje lokacije i svetla, gde su lanci — ne vidi ni na jednom
    ekranu. Dodata je **režijska tabla**: jedan red po shotu na vrhu dokumenta, sa navodnikom u
    kolonama koje se ponavljaju — a to su upravo ose po kojima R1 meri razliku. Pravilo iz C08
    ostaje netaknuto: tabla ne nosi nijedan podatak kojeg nema u `storyboard.json`. → **C08**
    — *zatvoreno: `boardRows()` u `tools/render.mjs` + 5 testova u `tests/render.test.mjs`.*

27. **Still kadrovi probijaju pravilo „nijedan novi feature dok jedna epizoda ne prođe ceo
    lanac".** C13–C15 su otvoreni, a uveden je nov režim rendera (`render_mode: "still"`,
    `docs/superpowers/specs/2026-09-09-still-kadrovi.md`). Pravilo postoji da spreči gomilanje
    nedovršenih puteva kroz lanac — a still kadrovi ne dodaju novi put nego skraćuju postojeći:
    suvi hod C15 se sa slikama može završiti bez ijednog kredita, dok je sa klipovima vezan za
    50 kredita dnevno. Odstupanje je svesno i upisano ovde, a ne prećutano. → **van C-celina**
    — *zatvoreno: `schemas.md` §3.3.2 i §5.13; fixture `tests/fixtures/still-episode/`;
    BLOCKING dobija M1, ADVISORY dobija R7.*

28. **End card je od početka izlazio u pogrešnom opsegu boje.** JPEG se dekodira kao `yuvj420p`
    (pun opseg) i bez `format=yuv420p` izlazi takav iz filter lanca, pa ga libx264 tagira punim
    opsegom — dok Veo klipovi izlaze `yuv420p`. Posle `concat -c copy` zaglavlje nosi tag prvog
    segmenta, pa end card dobija ugašeno crno i spaljeno belo (siva RGB 20 čuvana kao Y=20
    umesto Y≈31). Bug je zatečen pri uvođenju still kadrova, ali stoji sam za sebe: pogađa svaku
    dosad montiranu epizodu. → **van C-celina**
    — *zatvoreno: `videoFilter` + `encodeArgs` + `recipe.v: 2` u `tools/assemble.mjs`,
    `schemas.md` §5.13 tačka 6. Nad klip putanjom ne menja nijedan sempl.*

## Verifikacije iz izvornog plana → gde su

| Izvorna verifikacija | Celina |
|---|---|
| 1. ffmpeg wrapper / `probe()` na `part1.mp4` | C04 |
| 2. `align.mjs` na Rome narraciji | C05 |
| 3. `timeline.mjs` unit testovi | C04 |
| 4. `lint.mjs` na lošem fixture-u — BLOCKING | C06 |
| 4. `lint.mjs` — ADVISORY + kontra-test | C07 |
| 5. `assemble.mjs` end-to-end na Marathonu | C09 (+ drift sa dissolve u C10 — 0 frejmova) |
| 6. Suvi hod na novoj epizodi | C13–C15 |

## Van scope-a — ni u jednoj celini, svesno

Ako se pojavi poriv da se ovo doda usput, odgovor je ne. Iz izvornog plana:

- **Muzika, SFX, titlovi** — izabran je čist `final.mp4`. Lako se dodaje kasnije jer `assemble.mjs` već ima audio granu.
- **Automatsko generisanje u Google Flow** — Flow nema javni API; generisanje ostaje ručno.
- **Upscale na 1440p** — ostaje ručno; `--res` zastava je pripremljena u C09.
- **Automatski tambnejl i naslov** — zaseban problem; rubrika iz C03 već meri taj potencijal na nivou ideje.

„Kasnije nadogradnje" iz izvornog plana (biblioteka likova, retention-marker pass, auto-thumbnail,
A/B outro tracking) otključavaju se **tek posle C15** — tvrdo pravilo: nijedan novi feature dok
jedna epizoda ne prođe ceo lanac od `narration.mp3` do `final.mp4`.

## Status

Svaka celina ima kućicu ovde. Ažurira se na kraju sesije.

- [x] C01  - [x] C02  - [x] C03  - [x] C04  - [x] C05
- [x] C06  - [x] C07  - [x] C08  - [x] C09  - [x] C10
- [x] C11  - [x] C12  - [ ] C13  - [ ] C14  - [ ] C15
