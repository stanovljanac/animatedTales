# Poznati problemi

Lagana lista **stvarno otvorenih** stavki, stanje 2026-11-22. Zatvoreno → obriši red (istorija je u git-u).
Šire odluke i odstupanja: [`plan/00-INDEX.md`](plan/00-INDEX.md) · ugovor: [`reference/schemas.md`](reference/schemas.md) §5.

## Uraditi

| ID | Problem | Sledeći korak |
|---|---|---|
| KI-01 | `main` zaostaje za radnom granom `fix/gen-len-i-qa-greek-gods-1` (broj: `git rev-list --count main..HEAD`; bilo 52 na dan 2026-11-22) | odluka vlasnika: merge ili PR |
| KI-02 | Nekomitovano: `tools/compile.mjs`, `tests/compile.test.mjs`, `episodes/greek-gods-compilation/`, izmene `assemble.mjs` (filter graf u fajl kad je komanda preduga), `greek-gods.md` | commit kad vlasnik potvrdi |
| KI-03 | `tools/config.json` → `ffmpegPath` je apsolutna putanja (`C:\Python311\…`); alati ne rade na drugoj mašini | detekcija: PATH → `imageio_ffmpeg` |
| KI-04 | `plan/00-INDEX.md`: C13–C15 nisu štiklirani, a suvi hod je odrađen (tyr-and-fenrir, pa antikythera-mechanism) | ažurirati statuse |

## Poznata ograničenja (svesno, ne popravlja se bez odluke)

| ID | Ograničenje | Zaobilaženje |
|---|---|---|
| KI-05 | **BLOCKING ne proverava** `beat.dur`, `beat.sentences`, `narration_says`, `viewer_sees` (INDEX #12); `render.mjs` ih traži pri prikazu | `lint` + `render` uvek zajedno |
| KI-06 | **C2** (multi-visual klipovi) je uvek 0: šablon animation prompta nema multi-visual oblik | ignoriši C2 dok se šablon ne proširi |
| KI-07 | **Medium** ide kroz UI editor: krhko prema promenama Medium-a; link je na opisu slike, ne na slici; neuspeo članak se ne ponavlja u nedogled (`status: "failed"`) | `medium.mjs --dump <url>`, ručna objava |
| KI-08 | **Flow** nema API-ja: klipovi i izbor slike su ručni; filter odbija klip pa treba Plan B/C | `flow-risk.mjs`, `alternatives.md`, `flow-filter.md` |
| KI-09 | Nema CI-ja ni `package.json`; testovi se pokreću ručno | `node --test "tests/*.test.mjs"` pre svakog commita |
| KI-10 | Ručno održavani spisci mogu da odlutaju: `config.json` → `disk.published[]`, `data.js` sajta (ledger, Series, shortsOrder), „Top 5" u `ideas.md` | proveri pri svakoj objavi |
| KI-11 | Legacy epizode (`night-when-rome-almost-fell`, `polynesian-navigation`, `croesus`, `marathon`) nemaju skriptu ni `timing.json`; starije epizode drže `shorts.md` u korenu | ne migrirati bez zahteva |

## Nepotvrđeno

- **Krediti**: rok obnove 1.000 kr/mes posle prelaska na Google AI Pro i cena dokupa u Srbiji nisu potvrđeni (`reference/google-ai-plus.md` §1–2).
- **Flow-ov 1080p upscale** za Omni 1.2: cena nije proverena, a ni da li je bolji od lanczos-a u `assemble.mjs` (`google-ai-plus.md` §2).
- Planovi `plan/C01–C15` navode Veo i „max 10 s po shotu" — istorijski; važi `schemas.md` §5.14 (3–15 s, 3/6 kr/s).
