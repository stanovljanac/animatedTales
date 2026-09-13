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
| 04 | pisanje skripte | `docs/prompts/04-script.md` |
| 05 | poravnanje narracije sa tekstom (Whisper) | `tools/align.mjs` → `timing.json` |
| 06 | beat mapa i skelet storyboard-a | `tools/beatplan.mjs` → `storyboard.json` |
| 07 | promptovi, QA i čitljiv prikaz | `tools/lint.mjs`, `tools/render.mjs`, `tools/shotlist.mjs` |
| 08 | montaža u `final.mp4` | `tools/assemble.mjs` |

Slike i klipovi se generišu ručno u Google Flow-u — `shotlist.mjs` ispisuje čeklistu kojom se
to radi. Ista čeklista u zaglavlju nosi i **budžet kredita**: slika je u Flow-u besplatna, klip
nije, pa je budžet epizode uvek budžet za video, a dnevnih 50 kredita diktira raspored —
[`docs/reference/google-ai-plus.md`](docs/reference/google-ai-plus.md).
Faze 05–08 vode skilovi u [`.claude/skills/`](.claude/skills).

Epizoda ne mora da bude od klipova. Shot sa `render_mode: "still"` je **jedna slika kojoj
pokret kamere daje montaža** — push, pull, pan ili hold, jedan zatvoren enum. Takva epizoda
košta nula kredita, a pošto joj je rez kraći (2.5–9.0s umesto 3.0–10.0s), četiri minuta nose
40–50 slika umesto 27 klipova. Režim je po shotu, pa se mešanje podrazumeva; ugovor je u
[`schemas.md`](docs/reference/schemas.md) §3.3.2, skelet pravi `beatplan.mjs --still`.

## Pokretanje

Alati su čist Node — nema `package.json`, nema `npm install`. Traži se **Node 20+**
(`node --test` nad folderom) i `ffmpeg`, koji se uzima iz `imageio_ffmpeg` jer `ffprobe`
u ovom okruženju ne postoji. Jedina faza sa spoljašnjom zavisnošću je 05: `align.mjs` zove
`tools/whisper_words.py`, kojem treba Python sa `faster-whisper` i skinut `small.en` model.

```
node tools/align.mjs     episodes/<slug>
node tools/beatplan.mjs  episodes/<slug> --beats episodes/<slug>/beats.json --write
node tools/lint.mjs      episodes/<slug> --no-media
node tools/render.mjs    episodes/<slug>
node tools/shotlist.mjs  episodes/<slug>
node tools/assemble.mjs  episodes/<slug>
```

Svaki alat ima `--help`. Provere:

```
node --test tests/            # 469 testova
node tests/check-fixtures.mjs # izvršni oblik ugovora iz schemas.md
```

## Šta je gde

| Putanja | Sadržaj |
|---|---|
| `docs/reference/` | **ugovori** — `schemas.md` je izvor istine za sva tri JSON fajla epizode |
| `docs/plan/` | plan rada po celinama (C01–C15) i evidencija odstupanja |
| `docs/prompts/` | promptovi za faze koje se rade u chat modelu |
| `docs/reference/google-ai-plus.md` | šta pretplata daje lancu i koliko epizoda staje u mesec |
| `tools/` | ceo lanac, čist Node, bez zavisnosti |
| `tests/` | testovi i fixture epizode koje definišu ugovor |
| `episodes/<slug>/` | `episode.json`, `script.md`, `timing.json`, `storyboard.json`, `notes.md` |

## Ugovor i provere

`tools/lint.mjs` deli nalaze na dva sloja i to je namerno:

- **BLOCKING** (T1–T3, S1–S5, P1/P2, C1, F1) — merljivo je i obara `exit code`. Vremena se
  poklapaju, promptovi imaju obavezne blokove, zaključani opisi likova stoje doslovno u svakom
  kadru u kome lik učestvuje.
- **ADVISORY** (R1–R6, C2) — izlistava se i ne obara ništa. Kvote se **mere, ne nameću**: prag
  se uvodi tek kad postoje podaci iz tri epizode.

`storyboard.json` postoji u dve verzije ugovora. **Shema 2** (nove epizode) uvodi `SUBJECT`,
`SCALE` i `DETAIL` blokove, PRIMARY/SECONDARY lockove i `visual_priority`; **shema 1** ostaje
validna i linter bira pravila po `schema_version`-u. Obrazloženje je u `schemas.md` §3.3.1.

`storyboard.md` i `qa-report.md` su **generisani** — nose DO-NOT-EDIT zaglavlje, ne komituju se
i ne diraju rukom. Izvor istine je uvek `storyboard.json`.
