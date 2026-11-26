# AGENTS — pravila rada za AI agente u ovom repou

> Za Claude Code i svakog drugog agenta. Čita se **pre prve izmene**. Kratko: repo je produkcioni lanac YouTube kanala
> *Animated Tales*; agent je **pisac i recenzent** (research, skripta, promptovi, publish komplet), a **mašina** su alati u
> `tools/`. Agent ne računa vremena, ne ispravlja merene fajlove i ne troši kredite na svoju ruku.
>
> Pravila ispod su destilovana iz skilova (`.claude/skills/`), README-a, ugovora i radnih dogovora sa vlasnikom (Mihailo).
> Kad vlasnik izda novo trajno pravilo, **upiši ga ovde** (odeljak 3 ili 4) u istoj sesiji.
>
> Ostali dokumenti: [PRD.md](PRD.md) · [TECH.md](TECH.md) · [DB.md](DB.md) · [known_issues.md](known_issues.md)

---

## 1. Redosled čitanja

| Kad | Pročitaj |
|---|---|
| Svaka sesija | ovaj fajl, [known_issues.md](known_issues.md), `git status` (radno stablo može biti nekomitovano) |
| Bilo šta oko podataka | [DB.md](DB.md) → [`reference/schemas.md`](reference/schemas.md) |
| Pišeš promptove | `reference/prompt-templates.md`, `style-string.md`, `camera-language.md`, `visual-devices.md`, skil `at-storyboard` |
| QA | skil `at-qa`, `qa-report.md` |
| Montaža | skil `at-assemble`, `qc-report.md` |
| Skripta / research / ideje | `docs/prompts/01·03·04`, `reference/channel-bible.md`, `reference/scoring-rubric.md`, `docs/ideas.md` |
| Publish / Shortovi / Medium | `docs/publish.md`, `docs/shorts.md`, `docs/medium.md`, `reference/thumbnails.md` |
| Greek Gods serija | `docs/series/greek-gods.md` (registar lockova) |
| Flow odbija klip | `reference/flow-filter.md`, `tools/flow-risk.mjs` |
| Krediti / budžet | `reference/google-ai-plus.md` |

## 2. Uloge: ko radi šta

| Faza | Izvršilac | Agent sme | Agent **ne** sme |
|---|---|---|---|
| 01 ideje | agent | bodovati po rubrici, ažurirati `ideas.md` | menjati rubriku usput |
| 02 izbor | **vlasnik** | predložiti; za *still* epizode agent bira temu (ne Greek Gods, ne top-5), faze 01→04 pa **stop** | tiho nastaviti dalje od skripte |
| 03–04 research, skripta | agent | pisati po promptovima; tagovi `[thoughtful]`, `[chuckles]`, `[short pause]` | **`[sighs]`** i srodne oblike; izmišljati činjenice |
| narracija | **vlasnik** (ElevenLabs) | — | — |
| 05 align | alat | pokrenuti, pročitati signale | ručno menjati `timing.json` |
| 06 beat plan | agent + alat | grupisati rečenice, birati uređaje, `beatplan --write` | računati vremena; menjati `script.md` |
| 07 promptovi + QA | agent + alat | pisati promptove, popravljati **pale** shotove | „usput doterati" shotove koji prolaze |
| 07+ slike | alat (agent pokreće posle QA) | `flow-images.mjs` | birati najbolju sliku (to je vlasnik) |
| klipovi | **vlasnik** u Flow-u | pripremiti čeklistu, `--board`, Plan B/C | generisati klipove, trošiti kredite |
| 08 montaža | alat | `assemble.mjs`, čitati `qc-report.md`, imenovati shotove za regeneraciju | renderovati kad nešto fali |
| publish komplet | agent + alat | `publish.md`, `medium.md`, `thumbnails.md`; `publish.mjs`; `flow-images --thumbnails` | objavljivati na YouTube; birati konačni thumbnail (predlaže, bira vlasnik) |
| Medium | **vlasnik** pokreće objavu ručno (posle javnog videa); Task Scheduler ukinut 23. nov 2026 | `--check`, `--status`; `--post` samo na izričit zahtev | `--sweep`, `--install-task` (ne vraćati zadatak bez zahteva) |
| Shortovi | agent + alat | `shorts.md`/`shorts.json`, renderovati **montažu** | renderovati običan rez (radi vlasnik u editoru) |
| sajt kanala | **vlasnik** | pripremiti unos za `data.js` | menjati zaseban repo bez zahteva |

## 3. Tvrda pravila (bez izuzetka dok vlasnik ne kaže drugačije)

### Podaci i tokovi

1. **Skripta je zamrznuta posle renderovanja narracije.** Vizuelni problem se rešava vizuelno (drugi uređaj, grupisanje, kadar). Izmena
   teksta = novi ElevenLabs render + novi `align`; reci vlasniku i stani.
2. **`timing.json` se nikad ne piše ni ispravlja ručno.** Generisani fajlovi (`storyboard.md`, `qa-report.md`, `qc-report.md`,
   `subtitles.srt`, `.cache/`) se ne diraju rukom — nose DO-NOT-EDIT ili su regenerabilni.
3. **JSON i `.md` parnjaci se osvežavaju u istoj sesiji.** `storyboard.json` → `lint.mjs` + `render.mjs` (+ `notes.md` ručno);
   `timing.json` → `publish.mjs` + chapteri. Sesija se ne završava sa JSON-om novijim od parnjaka.
4. **Menjaj samo shotove koje je korisnik naveo ili koji su pali.** Korisnik generiše redom i zna šta prolazi; ne nagađaj
   neprijavljene shotove, ne prepisuj ceo storyboard.
5. **Nema montaže bez svih delova.** Kad ijedan deo fali ili je pogrešan (fajl, sadržaj, oblik, prekratak izvor) — samo obaveštenje
   šta nije urađeno. Nikad slate, placeholder, still umesto klipa, usporavanje ni pozajmljen susedni kadar.
6. **`freeze_tail` / `freeze_split` samo uz izričito odobrenje za taj shot**; pri kratkom manjku ponudi opciju, ne primenjuj je.
7. **Proveri sadržaj fajla, ne samo ime.** Brojevi u imenima klize; poredi kontakt-listu sa SUBJECT shota. Isporuka: fajlovi u korenu kao
   `shotNN`, poslednja slika = subscribe end kartica.
8. **Medij i generisane artefakte ne komituj** (`.gitignore`); ne komituj tajne.
9. **Kad se serijska biblija i antički izvor razlikuju, važi izvor** — ispravi bibliju.

### Sadržaj

10. **Plafon 8 minuta** (~1.160 reči) je tvrd; dužinu bira tema. Meri se izmereno trajanje narracije, nikad broj reči.
11. **Istorijski integritet**: svaka tvrdnja je HISTORICAL RECORD / TRADITION / INTERPRETATION; nesigurnost ostaje u tekstu kao jedna kratka ograda.
12. **Mitski registar**: bog je veći od pejzaža, oružje gori, nebo odgovara. Kadar u kome bog stoji kao čovek u ogrtaču je promašen registar.
    Natprirodno je u razmeri/svetlu/sili, nikad u anahronom dizajnu.
13. **Hard reset**: svaki klip od novog zasebnog startnog frejma; nikad `extend`/`continue` ni zadnji frejm kao startni.
    Kontinuitet = doslovan `locked_description` u svakom image promptu.
14. **Naslovi** prodaju ceo video i imenuju **sve** glavne likove (ili nijednog, grupno); nikad jedan + „deo". `protagonists` u `episode.json`.
15. **Krevet-scene**: pokrivač do ramena, vide se samo glave, nikad golo telo. **Maloletnik ili polugoli lik veliki u kadru** u izvornoj slici
    ruši klip — popravka je nova slika (veo, silueta, širi kadar, odeća van locka), ne samo prompt.
16. **Pomera se plafon, ne proza**: brojevi iz naracije (12 prestola, 5 progutanih) idu u prompt; preciznost pre kratkoće.
17. **Režim shota se bira vizuelno**, ne prema kreditima; kanal je Animated Tales pa je podrazumevano mešovito (klip + still).
    Nezadovoljstvo sličnim slikama nije zabrana montaže — razlikuj tip kadra.

### Promptovi (sažetak; pun šablon u `prompt-templates.md`)

18. **Image prompt = prvi frejm**: `ACTION` je poza *neposredno pre* radnje; ishod ide u animation prompt. Ne diraj shotove sa gotovim klipom.
19. **Animation prompt**: prorezi do `gen_len`, svaki **dve rečenice**, nikad hold/still/settles; pokret traje do kraja klipa. Prompt se piše
    prema dužini generisanja (`gen_len`), ne `use_len`.
20. **Sitni identični predmeti i ruke više osoba ruše klip**: jedan akter, uzročni pokret, različite boje.
21. **Generator ne broji predmete**: tačan broj → sati na satu, pogled odozgo, znak iznad svakog, zabrana sličnog; kopije kao rezerva u editoru.
22. **Ulazak u grad**: kapija = ishodište na ivici kadra, grad/pijaca = odredište ispred lika.
23. **End kartica** = poster-rekapitulacija cele priče iz cele skripte + naslov + SUBSCRIBE u sredini (plafon 1200); poslednji shot.
24. **Rekap prethodnih delova** serije: najviše 2–3 kadra / 15–20 s / 2–4 rečenice, pisan prema starim klipovima koji se kopiraju.
25. **Klip 11–15 s** je izuzetak (sekunda iznad 10 s košta duplo); planer ostaje na 10 s, lint prijavljuje R8.
26. **Video template**: perspective zum 1.06 (nikad `zoompan`), zvuk klipova 10,5%, animiran uvod, end kartica = poslednji shot.

### Ponašanje

27. **Zatvori svaki prozor/tab koji otvoriš** (Playwright, CDP, Chrome) na kraju posla; proveri `Get-Process chrome` i port 9333.
28. **Ne objavljuj ništa spolja** (YouTube, Medium, sajt) i ne troši kredite bez izričitog zahteva; Medium se objavljuje ručno na zahtev vlasnika (`--post`), bez Task Schedulera.
29. **Slike u Flow-u moraju imati ime `shotNN-k`** (k = 1–4): vlasnik filtrira `shotN` i animira redom. `imena 0/4` u logu `flow-images`
    je kvar — prekini, popravi, proveri `flow/flow.json` (sve `renamed`) pre nego što javiš „gotovo". Ne gasi ni jedan prolaz lančano
    (`a; b`): kad prekineš prvi, drugi krene sam.
30. **Izveštaj iskreno**: pad testa, preskočen korak ili nepotvrđena činjenica se navode, ne glade.

## 4. Radni postupak za tipične zadatke

| Zadatak | Koraci |
|---|---|
| **Nova epizoda** (do skripte) | `episodes/<slug>/episode.json` → `research.md` (03) → `script.md` (04) → stani; registruj u `ideas.md` |
| **Storyboard** | `align` → `beatplan` (checkpoint, pokaži vlasniku) → `beatplan --write` → promptovi → `lint --no-media` → `render` |
| **QA** | `lint` → pročitaj BLOCKING/ADVISORY → popravi **samo pale** shotove → `lint` → `render` |
| **Slike** | posle QA: `flow-risk` → `flow-images` (Chrome, jedan profil) → vlasnik bira i animira → zatvori prozor |
| **Montaža** | proveri sve delove (kontakt-lista) → `assemble` → `qc-report.md` → navedi shotove za regeneraciju |
| **Publish** | `publish.md` + `medium.md` + `thumbnails.md` po `docs/` (thumbnail = **glavna slika videa**: junak velik i obučen kao obećanje + ime/najveća udica, nikad sporedna scena; prvo kontakt-lista kadrova) → `publish.mjs` dok ne prođe → **kraj:** `flow-images.mjs --thumbnails` (4 slike po promptu, pregled `flow/thumbnails.html`, provera `imena` i `flow/thumbnails.json`) → vlasnik bira |
| **Short** | `shorts.md` + `shorts.json` u `short/`; `short.mjs --sheet`; renderuje se samo montaža |
| **Compilation** | `compile.json` → `compile --dry-run` → `compile` → `assemble` (nula kredita) |
| **Izmena ugovora** | `schemas.md` + `contract.mjs` + fixture + test u istoj izmeni; sve potrošače proveri |
| **Flow odbio klip** | tačna poruka → `flow-filter.md` → Plan B (`alternatives.md`) → Plan C (still) |

## 5. Provera pre kraja sesije

```
node --test "tests/*.test.mjs"          # sve zeleno (broj testova se ne prepisuje u dokumenta)
node tests/check-fixtures.mjs           # ugovor nad fixture-ima
node tools/lint.mjs episodes/<slug>     # BLOCKING 0 (ako si dirao storyboard)
ls -l --time-style=full-iso episodes/<slug>/storyboard.*   # .md nije stariji od .json
git status                              # šta je zaista promenjeno
```

## 6. Konvencije koda

- **Čist Node 22+**, bez `package.json` i zavisnosti; ffmpeg samo kroz `tools/ffmpeg.mjs`.
- **Čisto jezgro + tanak CLI na dnu**; helperi i rečnici samo u `tools/contract.mjs`.
- **Svaka izmena ima test** (`tests/<alat>.test.mjs`); ugovor menja `contract.mjs` + `schemas.md` + fixture zajedno.
- **Komentari na srpskom**, sa **obrazloženjem odluke** (zašto, ne šta) i datumom kad se prag menja.
- **Determinizam**: bez `new Date()` u prikazima; isti ulaz → isti izlaz.
- **ADVISORY nikad ne obara exit code**; novo pravilo je BLOCKING samo ako je jednoznačno merljivo.
- **Commit poruke**: `feat:` · `fix:` · `docs:` · `chore:` + kratak opis na srpskom, jedan commit po zaokruženoj celini;
  na kraju atribucija koju zadaje okruženje.

## 7. Zamke okruženja

| Zamka | Posledica / rešenje |
|---|---|
| `ffprobe` ne postoji | koristi `probe()` iz `tools/ffmpeg.mjs` |
| `node --test tests` (folder) ne radi u Node 22+ | uvek glob: `node --test "tests/*.test.mjs"` |
| Chrome 136+ ne dozvoljava debug port na podrazumevanom profilu | alati koriste zaseban profil `…\AnimatedTales\flow-chrome`; prijava jednom (`--login`) |
| Google odbija prijavu u automatizovan pregledač | ne koristi Playwright Chromium za Flow/Medium |
| Flow nema API | generisanje klipova ostaje ručno |
| `sacred-texts.com` vraća 403 | radi neonvagabond mirror, Gutenberg cache/epub i `curl`; PDF = `curl` + `pypdf` u venv-u; brojke se razlikuju između prevoda |
| Windows putanje | u JSON-u uvek `/`; u shell-u pazi na PowerShell vs Bash sintaksu |
| `ffmpegPath` je apsolutan u `tools/config.json` | vezan za ovu mašinu (vidi known_issues) |
| Pretplata je Google AI Pro (naziv fajla `google-ai-plus.md` je ostao) | 1.000 kr/mes + 50/dan; rok obnove nepotvrđen |

## 8. Kad nisi siguran

Ne pogađaj ugovor — pročitaj `schemas.md` i `contract.mjs`. Ne pogađaj kreativnu odluku koja menja narraciju, plafon, cenu ili javni
izgled — pitaj vlasnika jednim konkretnim pitanjem sa preporukom. Sve ostalo (konvencija imena, redosled komandi, format izveštaja)
radi se po ovom dokumentu bez pitanja.
