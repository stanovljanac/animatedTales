# PRD — Animated Tales

> **Reverse-engineered specifikacija (SDD), 2026-11-22.** Nastala čitanjem repoa (`tools/`, `tests/`,
> `docs/`, `.claude/skills/`), istorije commitova (od 2026-09-04) i planova C01–C15. Ništa ovde nije
> izmišljeno: svaki zahtev ima dokaz — alat, test ili dokument — u koloni „Dokaz". Kad se dokument i
> kod razlaze, kod i `docs/reference/schemas.md` imaju prednost, a ovaj fajl se ispravlja.
>
> Komplet: **PRD.md** (šta i zašto) · [TECH.md](TECH.md) (kako) · [DB.md](DB.md) (podaci) ·
> [AGENTS.md](AGENTS.md) (pravila za AI agente) · [known_issues.md](known_issues.md) (otvoreno).

---

## 1. Problem i vizija

*Animated Tales* je YouTube kanal koji istorijske, mitološke i kulturno važne teme pretvara u kratke
animirane priče (2D ilustracije oživljene image-to-video modelom, uz ElevenLabs narraciju). Kanal je
**story-first, ne udžbenik**: bira se najjača priča unutar teme, a činjenica koja ne služi priči ne ulazi.

Radi ga **jedan čovek, uglavnom besplatnim alatima**. To je projektno ograničenje, ne izgovor: svaki
predlog koji traži tim ili plaćeni studio se odbija (`docs/reference/channel-bible.md` §1).

Ovaj repo je **produkcioni lanac** koji od ideje stiže do gotovog `final.mp4` i prateće isporuke
(naslovi, titlovi, Shortovi, Medium članak). Repo drži **ugovore, alate i tekstove**; medija se nikad ne
komituje (folder epizoda je ~1.7 GB).

**Vizija proizvoda:** epizoda koju jedan čovek može da proizvede u predvidivom roku i budžetu kredita,
bez ručnog računanja vremena, sa proverljivim kvalitetom promptova i bez izmišljenih činjenica.

## 2. Ciljevi i ne-ciljevi

### Ciljevi

| # | Cilj | Kako se meri |
|---|---|---|
| G1 | **Timeline-first**: narracija se izmeri prvo, slika se reže po njoj | `T1`: zbir `use_len` = trajanje narracije ±0.2s |
| G2 | **Ponovljiv kvalitet promptova** bez ljudskog pregleda svakog kadra | BLOCKING sloj lintera = 0 nalaza |
| G3 | **Kontinuitet likova** bez ulančavanja klipova | `C1`: `locked_description` doslovno u svakom promptu |
| G4 | **Budžet kredita je poznat unapred** | čeklista `shotlist.mjs` + `R8` |
| G5 | **Svaka epizoda dolazi sa kompletom za objavu** | `publish.mjs` prolazi; `subtitles.srt`, `publish.md`, `medium.md` |
| G6 | **Pokrivenost sveta**: svaka regija i epoha sajta bar jednom | `docs/ideas.md` → „Pokrivenost regiona i epoha" |
| G7 | **Serija i compilation** kao drugi nivo proizvoda | `docs/series/greek-gods.md`, `tools/compile.mjs` |

### Ne-ciljevi (svesno van scope-a)

- **Muzika, SFX** — izabran je čist `final.mp4`; audio grana u montaži postoji pa se lako dodaje kasnije.
- **Automatsko generisanje u Flow-u** — Flow nema javni API. Klipovi su ručni; slike radi `flow-images.mjs`
  kroz pravi Chrome (kao ruka), a izbor kandidata ostaje ljudski posao.
- **Upscale na 1440p** — ručno; `--res` zastava postoji u `assemble.mjs`.
- **Automatski tambnejl i naslov** — pišu se po promptovima (`thumbnails.md`, `publish.md`), ne generišu se.
- **Tim, studio, plaćeni alati** — odbija se po definiciji (§1).
- **Filer radi minutaže** — zabranjen; kraća jaka epizoda je bolja od slabe duže (`channel-bible.md` §2).

## 3. Akteri

| Akter | Uloga | Šta radi |
|---|---|---|
| **Vlasnik (Mihailo)** | jedini ljudski korisnik | bira ideju (faza 02), snima narraciju u ElevenLabs-u, bira slike i generiše klipove u Flow-u, otprema na YouTube, odobrava izuzetke |
| **Claude agent** | pisac i recenzent | piše research, skriptu, promptove, publish komplet i Medium članak; vodi skilove `at-storyboard`, `at-qa`, `at-assemble`; popravlja samo ono što je palo |
| **Alati (`tools/`)** | deterministička mašina | mere, seku, proveravaju, renderuju, objavljuju — čist Node, bez zavisnosti |
| **Spoljne platforme** | ElevenLabs, Google Flow (Omni 1.2 Flash), YouTube Studio, Medium, sajt kanala (zaseban repo) | nisu pod kontrolom repoa; dva od njih nemaju API (Flow, Medium) |

## 4. Proizvodi (izlazi)

| Izlaz | Fajl(ovi) | Nastaje u |
|---|---|---|
| **Epizoda** (16:9, 24 fps) | `episodes/<slug>/final.mp4` + `qc-report.md` | faza 08 — `assemble.mjs` |
| **Publish komplet** | `publish.md` (5 naslova, description sa chapterima, hashtagovi, pin komentar), `subtitles.srt` | `publish.mjs` + tekst po `docs/publish.md` |
| **Thumbnailovi** | `thumbnails.md` — 5 koncepata (A bez teksta, B sa tekstom) | `docs/reference/thumbnails.md` |
| **Shortovi** (9:16, 1080×1920) | `short/shorts.md`, `shorts.json`, `shortN.mp4`, `shortN.srt` | faza 09 — `short.mjs`, `short-edit.mjs` |
| **Medium članak** | `medium.md`, `medium.json` (stanje) | faza 10 — `medium.mjs` |
| **Compilation** | `episodes/<slug>/compile.json` → `final.mp4` | `compile.mjs` + `assemble.mjs` |
| **Unos na sajt kanala** | `public/data.js` u repou `Animated Tales Website` | ručno, uz objavu |

## 5. Funkcionalni zahtevi

Faze su brojane kao u `README.md`. „Ko" je glavni izvršilac: **L** ljudski korak, **A** Claude agent,
**T** alat.

| ID | Zahtev | Ko | Izlaz / ugovor | Dokaz |
|---|---|---|---|---|
| FR-01 | Pronaći i bodovati ideje po fiksnoj rubrici (10 metrika, 0–5, težine, skor /100, pojasevi) | A | `docs/ideas.md` | `scoring-rubric.md`, `prompts/01-idea-discovery.md` |
| FR-02 | Izbor pobednika iz tabele (agent bira temu za still epizode; faze 01→04 pa stop) | L/A | status u `ideas.md` | README faza 02 |
| FR-03 | Research i plan priče; svaka tvrdnja je HISTORICAL RECORD / TRADITION / INTERPRETATION | A | `research.md` | `prompts/03-research.md`, `channel-bible.md` §3 |
| FR-04 | Skripta sa ElevenLabs audio tagovima; obavezan `## OUTRO` (30–42 reči); `[sighs]` zabranjen | A | `script.md` | `prompts/04-script.md`, `audio-tags.mjs` |
| FR-05 | Narracija se snima i **skripta se zamrzava** | L | `narration.mp3` | `at-storyboard` SKILL |
| FR-06 | Forced alignment: rečenice sa izmerenim granicama, `outro_start` | T | `timing.json` | `align.mjs`, C05, `tests/align.test.mjs` |
| FR-07 | Beat mapa → skelet storyboard-a; checkpoint pre pisanja promptova | A+T | `beats.json`, `storyboard.json` | `beatplan.mjs`, `timeline.mjs` |
| FR-08 | Par prompta (image + animation) po shotu sa obaveznim blokovima i zaključanim opisima | A | `storyboard.json` | `prompt-templates.md`, shema 2 |
| FR-09 | QA: BLOCKING (obara) i ADVISORY (meri) sloj; popravlja se samo pali shot | T+A | `qa-report.md` | `lint.mjs`, `at-qa` |
| FR-10 | Čitljiv prikaz, produkciona čeklista i Flow tabla | T | `storyboard.md`, stdout, `--board` | `render.mjs`, `shotlist.mjs` |
| FR-11 | Slike u Flow-u: 4 kandidata po shotu, pregled za izbor | T → L bira | `flow/index.html`, `flow/flow.json` | `flow-images.mjs`, `cdp.mjs` |
| FR-12 | Klipovi (3–15 s) generiše vlasnik; rizični shotovi imaju Plan A/B/C | L (+T) | `shots/partNN.mp4` | `flow-risk.mjs`, `flow-filter.md` |
| FR-13 | Montaža: rezovi po `use_in`/`use_len`, dissolve u `link_group`, narracija od t=0, ambijent ispod, end kartica | T | `final.mp4`, `qc-report.md` | `assemble.mjs`, `tests/assemble.test.mjs` |
| FR-14 | Still kadar: jedna slika, pokret daje montaža (push/pull/pan/hold) | T | `render_mode: "still"` | schemas §3.3.2, §5.13 |
| FR-15 | Publish komplet: titlovi iz `timing.json`, provera chaptera i naslova prema `protagonists` | A+T | `publish.md`, `subtitles.srt` | `publish.mjs` |
| FR-16 | Shortovi: rez ili montaža, izrez 9:16 prati likove, ugrađeni titlovi | A+T | `short/` | `short.mjs`, `short-edit.mjs`, `docs/shorts.md` |
| FR-17 | Medium članak uz video; objavljuje se sam kad video postane javan (feed kanala, nedeljni prolaz) | A+T | `medium.md`, `medium.json` | `medium.mjs`, `docs/medium.md` |
| FR-18 | Compilation sklapa delove serije bez generisanja ičega novog | T | `compile.json` → `final.mp4` | `compile.mjs`, `tests/compile.test.mjs` |
| FR-19 | Higijena diska: izveštaj i čišćenje regenerabilnog keša javnih epizoda | T | `.cache/` | `disk.mjs` |
| FR-20 | Budžet kredita u čeklisti; izuzeci (klip 11–15 s) prijavljeni kao R8 | T | zaglavlje `shotlist.mjs` | `contract.mjs` `GEN_COST` |
| FR-21 | Sajt kanala se ažurira uz svaku objavu (epizoda, plejliste, mapa) | L | `data.js` | zaseban repo |

## 6. Nefunkcionalni zahtevi

| ID | Zahtev | Obrazloženje / dokaz |
|---|---|---|
| NFR-01 | **Determinizam**: isti ulaz → bajt-identičan izlaz (`render.mjs`) | nigde `new Date()` u prikazu; `generated_at` se čita |
| NFR-02 | **Bez zavisnosti**: čist Node 22+, nema `package.json` | README „Pokretanje" |
| NFR-03 | **Jedan izvor istine**: `storyboard.json`; `.md` parnjaci su izvedeni | README „JSON i njegovi .md parnjaci" |
| NFR-04 | **Medij se ne komituje**; generisani izveštaji se ne komituju | `.gitignore` |
| NFR-05 | **Linter ne laje**: ADVISORY nikad ne menja exit code; kvote se mere, ne nameću dok nema podataka iz 3 epizode | C07, README |
| NFR-06 | **Ugovor je izvršan**: svaka invarijanta iz `schemas.md` ima proveru | `tests/check-fixtures.mjs` |
| NFR-07 | **Tačnost vremena**: frejm-poravnanje na 24 fps; zbir ±0.2s | schemas §0.2, T1 |
| NFR-08 | **Pokrivenost testovima**: svaka izmena alata ima test, komplet prolazi bez pada (broj se ne navodi — stari) | `node --test "tests/*.test.mjs"` |
| NFR-09 | **Prijava jednom**: zaseban Chrome profil (`%LOCALAPPDATA%\AnimatedTales\flow-chrome`) za Flow i Medium | `cdp.mjs` |
| NFR-10 | **Ništa destruktivno bez potvrde**: `disk.mjs --clean` je suvo pokretanje bez `--yes` | `disk.mjs` |

## 7. Pravila sadržaja (trajna)

1. **Dužina**: tvrdi plafon **8 minuta** (~1.160 reči); menja ga samo vlasnik. Tema bira dužinu.
   Istorija plafona: 5 → 10 min (16. nov) → 8 min (21. nov, zbog cene Omni 1.2).
2. **Istorijski integritet**: tri kategorije tvrdnji; izmišljanje pa predstavljanje kao činjenice je zabranjeno.
3. **Mitski registar**: kadar bez natprirodne razmere/sile/ugla na MYTH beatu je *promašen registar*,
   čak i kad su rekviziti tačni.
4. **Hard reset**: svaki klip kreće od novog zasebnog startnog frejma; `extend`/`continue` i ulančavanje zabranjeni.
5. **Naslovi prodaju ceo video** i imenuju sve glavne likove (ili nijednog grupno) — `protagonists` u
   `episode.json`, `publish.mjs` proverava.
6. **Krevet-scene**: pokrivač do ramena, vide se samo glave. **Maloletnici i golotinja** u izvornoj slici
   ruše Flow klip — popravka je nova slika, ne samo prompt.
7. **Kad se serijska biblija i antički izvor razlikuju, važi izvor.**
8. **Nema montaže bez svih delova**: kad ijedan shot fali — samo obaveštenje, nikad render sa slate-om.

## 8. Ograničenja

| Oblast | Ograničenje |
|---|---|
| Flow | nema API-ja; Omni 1.2 Flash: celi sekundi 3–15, **3 kr/s do 10 s, 6 kr/s iznad**; slike 0 kredita |
| Krediti | 50/dan + 1.000/mes (Google AI Pro) → plafon ~2.500/mes; 8 min animacije ≈ 1.300 kr |
| ffprobe | ne postoji; `probe()` parsira stderr `ffmpeg -i` |
| Medium | nema API tokena (ukinuti 2023); objava ide kroz pravi editor |
| YouTube | `final.mp4` se otprema ručno; javnost videa se čita iz RSS feeda kanala (poslednjih 15) |
| Okruženje | Windows, Node 24, Python sa `faster-whisper`, Chrome sa zasebnim profilom |

## 9. Stanje portfolija (2026-11-22)

Izvedeno iz prisustva artefakata u `episodes/`; to je snimak na dan iznad, a živo stanje je u samom folderu
i u `docs/ideas.md`. **Ideja `done` u `ideas.md` znači „epizoda
postoji u repou" (bar skripta), ne „javno objavljena".**

| Stadijum | Epizode |
|---|---|
| **Legacy** (pre lanca; manifest, a `marathon` i `croesus` i storyboard/Shortove) | `night-when-rome-almost-fell`, `polynesian-navigation`, `croesus`, `marathon` |
| **Završeno + publish komplet** | `antikythera-mechanism`, `greek-gods-part-1…4`, `heavenly-horses`, `harem-conspiracy`, `substitute-king`, `el-dorado`, `hero-twins` |
| **Završeno, bez publish kompleta** | `tyr-and-fenrir` (pilot „suvi hod"), `greek-gods-compilation` |
| **Storyboard gotov, čeka klipove/slike** | `three-underworlds` (+ publish), `buffalo-jump`, `emu-war`, `mansa-musa` |
| **Samo skripta + research** | `ashoka-kalinga`, `la-navidad`, `rostam-and-sohrab` |

Status ideja (`done` / `scored` / `re-aim`) vodi `docs/ideas.md`. Plejliste kanala žive na sajtu (`PLAYLISTS` u
`data.js`). Medium članci objavljeni: `hero-twins` i `substitute-king` (`medium.json` → `status: "published"`).

## 10. Istorija taskova (rekonstruisano iz git-a)

| Mileston | Datumi | Šta je isporučeno | Ključni commiti |
|---|---|---|---|
| **M0 Temelji** | 09-04 | skelet repoa, data ugovori, kreativni ugovori (`reference/`), rubrika i bodovane ideje | `6396291`, `3ae8d21` (C01–C03) |
| **M1 Alati** | 09-04 → 09-05 | `ffmpeg.mjs`, `timeline.mjs`, `align.mjs`, `lint.mjs` (BLOCKING + ADVISORY), `render.mjs`, `shotlist.mjs`, `assemble.mjs` (jezgro + dissolve + QC) | `0b20fce`…`69f1463` (C04–C10) |
| **M2 AI sloj** | 09-05 → 09-06 | prepisani promptovi 01/03/04, `beatplan.mjs`, skilovi `at-*`; obrisani `masterPrompt.md` i `visualPromptEngine.md` | `2fb099c`, `b2165cd`, `ddf9395`, `96980c9` (C11–C12) |
| **M3 Suvi hod** | 09-06 → 09-07 | prva epizoda kroz lanac (`tyr-and-fenrir`); otkriće da plafon P1 briše sadržaj → **shema 2**; README | `f595987`, `b12d093`, `9d177c4` (C13–C14) |
| **M4 Still + prva puna epizoda** | 09-09 → 09-15 | `render_mode: "still"`; budžet Flow kredita; forma image prompta; `antikythera-mechanism`; publish komplet (5 naslova, chapteri, SRT) | `5ef8fa2`, `461ecb8`, `2bade29`, `7282cc6` |
| **M5 Klip kadenca** | 09-20 → 09-28 | `gen_len` + T4; P1 280→360; `greek-gods-part-1/2`, `heavenly-horses`; end kartica = rekapitulacija cele priče | `903fd87`, `207e8f7`, `ef7d688`, `29eb5fc` |
| **M6 Opisniji promptovi** | 10-10 → 10-20 | plafoni ×2 (P1 720, P2 220), animacija bez zamrznutog kraja, `freeze_tail`, `harem-conspiracy`, konkretni naslovi | `eb7639b`, `2bde19a`, `8c6ed3a`, `1f033f3` |
| **M7 Serija i Shortovi** | 10-27 → 11-05 | `substitute-king`, `greek-gods-part-3/4`, `three-underworlds`; `short.mjs` + `short-edit.mjs`; provera `protagonists`; rekap prethodnih delova; pokrivenost regiona | `7a13835`, `e9cad47`, `6cb2929`, `411ad28` |
| **M8 Flow alati** | 11-14 → 11-18 | `flow-images.mjs`; `flow-risk.mjs` + Plan A/B/C; audio tagovi; thumbnailovi; `el-dorado`, `hero-twins`, `emu-war`, `buffalo-jump` | `a9ea3a2`, `2039f04`, `f3bcd06`, `0713150` |
| **M9 Medium i Omni 1.2** | 11-19 → 11-21 | `medium.mjs` + nedeljni sweep; `disk.mjs`; **Omni 1.2 Flash** (3–15 s, novi cenovnik, plafon 8 min); zvuk klipova 15% → 10,5% | `d2fe7ca`, `710ab41`, `969e984`, `8afd6e7`, `3858dca` |
| **M10 Compilation** | 11-22 (nekomitovano) | `compile.mjs`, `greek-gods-compilation` (4 dela, ~15 min, nula kredita) | radno stablo |

Odstupanja od izvornog plana (28 stavki, od `ffprobe` koji ne postoji do shema 2) su u
`docs/plan/00-INDEX.md` i ne ponavljaju se ovde.

## 11. Definicija gotovog

**Epizoda je gotova** kad:

1. `node tools/lint.mjs episodes/<slug>` → BLOCKING 0 (sa medijem, bez `--no-media`);
2. `node tools/assemble.mjs episodes/<slug>` je napravio `final.mp4`, a `qc-report.md` ne navodi shot za regeneraciju;
3. `node tools/publish.mjs episodes/<slug>` prolazi (naslovi, chapteri, `medium.md`);
4. `storyboard.md` nije stariji od `storyboard.json`;
5. vlasnik je odobrio i otpremio video; tek tada ide Medium (sam) i unos na sajt.

**Compilation je gotova** kad `compile.mjs` + `assemble.mjs` daju `final.mp4` bez ijednog novog klipa.

## 12. Mapa dokumenata

| Pitanje | Dokument |
|---|---|
| Kako je sistem sagrađen, alati, tokovi | [TECH.md](TECH.md) |
| Koji fajlovi i polja čine „bazu" | [DB.md](DB.md) → izvor istine [`reference/schemas.md`](reference/schemas.md) |
| Kako agent sme da radi u repou | [AGENTS.md](AGENTS.md) |
| Šta je trenutno slomljeno ili otvoreno | [known_issues.md](known_issues.md) |
| Identitet i pravila kanala | [`reference/channel-bible.md`](reference/channel-bible.md) |
| Plan izgradnje i odstupanja | [`plan/00-INDEX.md`](plan/00-INDEX.md) |
| Serija Greek Gods | [`series/greek-gods.md`](series/greek-gods.md) |
