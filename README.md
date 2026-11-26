# Animated Tales

Produkcioni lanac za epizode YouTube kanala *Animated Tales* — od ideje do `final.mp4`.

Repo drži **ugovore, alate i tekstove**. Medija (`.mp4`, `.mp3`, slike) se nikad ne komituje:
folder epizoda je ~1.7 GB i skoro sav je video, pa bi ga git učinio neupotrebljivim. Šta se
tačno izuzima piše u [`.gitignore`](.gitignore).

## Kako epizoda nastaje

Lanac je **timeline-first**: narracija se prvo izmeri, pa se slika reže po njoj — nikad obrnuto.
Zato nijedan kadar ne može da „pojede" tuđe vreme, a zbir se poklapa sa narracijom do na 0.2s.

| Faza | Šta se radi | Čime |
|---|---|---|
| 01 | pronalaženje i bodovanje ideja | `docs/prompts/01-idea-discovery.md` |
| 02 | izbor pobednika iz tabele | **ljudski korak** — nema prompta |
| 03 | research i plan priče | `docs/prompts/03-research.md` |
| 04 | pisanje skripte — sa ElevenLabs audio tagovima u zagradama (`[thoughtful]`, `[chuckles]`, `[short pause]`; nikad `[sighs]`) | `docs/prompts/04-script.md` |
| 05 | poravnanje narracije sa tekstom (Whisper) | `tools/align.mjs` → `timing.json` |
| 06 | beat mapa i skelet storyboard-a | `tools/beatplan.mjs` → `storyboard.json` |
| 07 | promptovi, QA i čitljiv prikaz | `tools/lint.mjs`, `tools/render.mjs`, `tools/shotlist.mjs` |
| 07+ | slike u Google Flow-u — 4 kandidata po shotu, bez ruku, i pregled za izbor | `tools/flow-images.mjs`, [`docs/reference/flow-images.md`](docs/reference/flow-images.md) |
| 08 | montaža u `final.mp4` | `tools/assemble.mjs` |
| 09 | Shortovi (9:16) iz gotovog videa, u `episodes/<slug>/short/` | `tools/short.mjs`, [`docs/shorts.md`](docs/shorts.md) |
| 10 | Medium članak uz video: piše se uz publish komplet (`medium.md`), a objavljuje se sam čim video postane javan na YouTube-u | `tools/medium.mjs`, [`docs/medium.md`](docs/medium.md) |

Slike pravi `flow-images.mjs`: kroz pravi Chrome otvori Flow projekat, podesi Image · 16:9 · x4
i za svaki shot pošalje image prompt doslovno, pa ostavi četiri kandidata po shotu i pregled
`episodes/<slug>/flow/index.html` za izbor ([`docs/reference/flow-images.md`](docs/reference/flow-images.md)).
Slike ostaju u Flow-u i ne skidaju se na računar; skidaju se samo konačni videi.
Izbor najbolje slike i klip od nje ostaju ručni posao u Flow-u — pregled uz svaki shot nosi
animation prompt i dužinu, a `shotlist.mjs` istu čeklistu za terminal. Čeklista u zaglavlju
nosi i **budžet kredita**: slika je u Flow-u besplatna, klip nije, pa je budžet epizode uvek
budžet za video, a dnevnih 50 kredita diktira raspored —
[`docs/reference/google-ai-plus.md`](docs/reference/google-ai-plus.md). Model je Omni 1.2 Flash:
klip se generiše u celim sekundama od 3 do 15, a cena je **3 kredita po sekundi do 10s i 6 iznad**
(klip od 15s košta koliko dva od 10s), pa je 11–15s izuzetak koji lint prijavljuje kao R8.
Kad Flow odbije klip (maloletnici, golotinja, nasilje, samopovređivanje), alternative po kategoriji
su u [`docs/reference/flow-filter.md`](docs/reference/flow-filter.md): Plan A original, Plan B alternativna
slika + animacija (`episodes/<slug>/alternatives.md`), Plan C still. `node tools/flow-risk.mjs episodes/<slug>` nalazi
rizične shotove sa zamenom reči i slike koje prikazuju sredinu scene umesto prvog frejma.

Ista čeklista sa `--board` izlazi kao **Flow tabla** za tab u Google Docs-u: promptovi tamo gde
`storyboard.json` ne postoji, za generisanje van kuće. Ništa se ne sinhronizuje — tabla se
nalepi i ručno precrta ([`docs/reference/flow-board.md`](docs/reference/flow-board.md)).
Faze 05–08 vode skilovi u [`.claude/skills/`](.claude/skills).

Epizoda ne mora da bude od klipova. Shot sa `render_mode: "still"` je **jedna slika kojoj
pokret kamere daje montaža** — push, pull, pan ili hold, jedan zatvoren enum. Takva epizoda
košta nula kredita, a pošto joj je rez kraći (2.5–9.0s umesto 3.0–10.0s), četiri minuta nose
40–50 slika umesto 27 klipova. Režim je po shotu, pa se mešanje podrazumeva; ugovor je u
[`schemas.md`](docs/reference/schemas.md) §3.3.2, skelet pravi `beatplan.mjs --still`.

## Pokretanje

Alati su čist Node — nema `package.json`, nema `npm install`. Traži se **Node 22+**
(ugrađen `WebSocket` za `flow-images.mjs`) i `ffmpeg`, koji se uzima iz `imageio_ffmpeg` jer
`ffprobe` u ovom okruženju ne postoji. Faza 05 zove `tools/whisper_words.py`, kojem treba
Python sa `faster-whisper` i skinut `small.en` model; `flow-images.mjs` traži instaliran
Google Chrome (zaseban profil, prijava jednom — `--login`). `medium.mjs` vozi isti Chrome profil:
prijava na Medium jednom (`node tools/medium.mjs --login`), pa `--profile` upisuje short bio i
About stranicu. Medium više ne izdaje API tokene, pa se članak piše u pravi editor; šta je
probano uživo i gde su granice (link ide na opis slike, ne na samu sliku) piše u
[`docs/medium.md`](docs/medium.md).

```
node tools/align.mjs     episodes/<slug>
node tools/beatplan.mjs  episodes/<slug> --beats episodes/<slug>/beats.json --write
node tools/lint.mjs      episodes/<slug> --no-media
node tools/render.mjs    episodes/<slug>
node tools/shotlist.mjs  episodes/<slug>
node tools/shotlist.mjs  episodes/<slug> --board | Set-Clipboard
node tools/flow-images.mjs episodes/<slug>
node tools/assemble.mjs  episodes/<slug>
node tools/compile.mjs   episodes/<slug>                # compilation: sklapa delove serije u jednu epizodu (compile.json), pa assemble
node tools/short.mjs     episodes/<slug> short1 --sheet
node tools/medium.mjs    episodes/<slug> --check        # medium.md prolazi pravila (isto proverava publish.mjs)
node tools/medium.mjs    episodes/<slug> --watch        # čeka video u feedu kanala, pa objavi članak na Medium
node tools/medium.mjs    --sweep                        # jedan prolaz kroz sve epizode (Task Scheduler: --install-task)
node tools/disk.mjs      --report                       # veličina po epizodi, šta se sme očistiti (samo čita)
node tools/disk.mjs      --clean [slug] [--yes]         # briše regenerabilni .cache javnih epizoda; bez --yes je suvo pokretanje
```

Svaki alat ima `--help`. Provere:

```
node --test "tests/*.test.mjs"   # svi testovi (Node 22+ ne prima sam folder)
node tests/check-fixtures.mjs # izvršni oblik ugovora iz schemas.md
```

## Šta je gde

| Putanja | Sadržaj |
|---|---|
| `docs/PRD.md` · `TECH.md` · `DB.md` · `AGENTS.md` · `known_issues.md` | **SDD komplet**: šta i zašto, arhitektura i alati, model podataka, pravila za AI agente, otvoreni problemi |
| `docs/reference/` | **ugovori** — `schemas.md` je izvor istine za sva tri JSON fajla epizode |
| `docs/plan/` | plan rada po celinama (C01–C15) i evidencija odstupanja |
| `docs/prompts/` | promptovi za faze koje se rade u chat modelu |
| `docs/reference/google-ai-plus.md` | šta pretplata daje lancu i koliko epizoda staje u mesec |
| `docs/reference/flow-board.md` | `--board` tabla: generisanje van kuće, iz taba u Google Docs-u |
| `docs/reference/flow-images.md` | slike u Flow-u bez ruku: prijava, krug, opcije, kad pukne |
| `docs/reference/thumbnails.md` | thumbnailovi: 4–5 koncepata po epizodi, glavna slika videa (junak velik + ime/udica), samo sa natpisom, tabela grešaka; slike pravi `flow-images.mjs --thumbnails` |
| `episodes/<slug>/flow/` | `index.html` za izbor kandidata i `flow.json` stanje (slike samo uz `--download`) — ne komituje se |
| `tools/` | ceo lanac, čist Node, bez zavisnosti |
| `tests/` | testovi i fixture epizode koje definišu ugovor |
| `docs/medium.md` | Medium članak uz video: format `medium.md`, pravila (drugačiji od skripte, 1–2 linka ka videu), bio profila, šta se dešava posle objave videa |
| `episodes/<slug>/` | `episode.json`, `script.md`, `timing.json`, `storyboard.json`, `notes.md`, `publish.md`, `medium.md`, `medium.json` (stanje objave), `thumbnails.md` |

## Ugovor i provere

`tools/lint.mjs` deli nalaze na dva sloja i to je namerno:

- **BLOCKING** (T1–T4, S1–S5, P1/P2, C1, F1) — merljivo je i obara `exit code`. Vremena se
  poklapaju, promptovi imaju obavezne blokove, zaključani opisi likova stoje doslovno u svakom
  kadru u kome lik učestvuje.
- **ADVISORY** (R1–R8, C2) — izlistava se i ne obara ništa. R8 je cena generisanja: klip duži od
  10s (6 kr/s umesto 3) i sekunde `gen_len`-a viška. Kvote se **mere, ne nameću**: prag
  se uvodi tek kad postoje podaci iz tri epizode.

`storyboard.json` postoji u dve verzije ugovora. **Shema 2** (nove epizode) uvodi `SUBJECT`,
`SCALE` i `DETAIL` blokove, PRIMARY/SECONDARY lockove i `visual_priority`; **shema 1** ostaje
validna i linter bira pravila po `schema_version`-u. Obrazloženje je u `schemas.md` §3.3.1.

`storyboard.md` i `qa-report.md` su **generisani** — nose DO-NOT-EDIT zaglavlje, ne komituju se
i ne diraju rukom. Izvor istine je uvek `storyboard.json`.

## JSON i njegovi `.md` parnjaci

Svaki `.md` koji ponavlja podatke iz JSON-a osvežava se **u istoj sesiji** u kojoj je JSON
promenjen. Pravilo važi za svaku izmenu, i za ručnu ispravku jednog prompta van skila. Sesija
se ne završava sa JSON-om novijim od njegovog parnjaka.

| Kad se menja | Osveži | Kako |
|---|---|---|
| `storyboard.json`, bilo koje polje | `storyboard.md`, `qa-report.md` | `node tools/lint.mjs episodes/<slug>` pa `node tools/render.mjs episodes/<slug>` |
| `storyboard.json`: broj beatova ili shotova, `render_mode`, `gen_len` | `notes.md` | ručno: brojevi i spisak still kadrova moraju da se slažu sa zaglavljem `storyboard.md`-a |
| `timing.json` (novi `align.mjs` run) | `subtitles.srt`, chapteri u `publish.md` | `node tools/publish.mjs episodes/<slug>`, chapteri ručno po novoj listi rečenica, pa ponovo `publish.mjs` dok ne javi da prolaze |

Provera pre kraja sesije: `storyboard.md` ne sme biti stariji od `storyboard.json`-a
(`ls -l --time-style=full-iso episodes/<slug>/storyboard.*`).
