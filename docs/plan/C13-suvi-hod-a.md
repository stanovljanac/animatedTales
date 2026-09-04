# C13 — Suvi hod A: alignment + beat plan

**Faza:** 3 (validacija na stvarnoj epizodi) · **Zavisi od:** C05, C12 · **Procena:** ~90k tokena
**Izvorni plan, sekcija:** „Verifikacija 6 — Suvi hod na novoj epizodi".

Prva od tri sesije koje jednu **novu** epizodu vode kroz ceo lanac od `narration.mp3` do `final.mp4`.
Ovo je jedini test koji stvarno meri da li sistem radi.

## Preduslov — ti isporučuješ ove fajlove pre sesije

| Fajl | Odakle |
|---|---|
| `episodes/<slug>/script.md` | ChatGPT, stage 04 (`docs/prompts/04-script.md`) — **mora imati `## OUTRO` sekciju** |
| `episodes/<slug>/research.md` | ChatGPT, stage 03 |
| `episodes/<slug>/narration.mp3` | ElevenLabs, renderovan iz **finalne** skripte |
| `episodes/<slug>/episode.json` | zaključani opisi likova / lokacija / rekvizita (25–40 reči svaki) |

Izbor epizode: **najviše rangirana ideja iz `docs/ideas.md`** koja nije `done` (C03).

## Zadatak sesije

1. Popuni `episode.json` — `characters[]`, `locations[]`, `key_props[]` sa `locked_description`.
   Ovo je kreativni posao i radi se pre alignmenta, jer beat plan referiše na njih.
2. `node tools/align.mjs episodes/<slug>` → `timing.json`
3. Provera kvaliteta alignmenta: gapovi, `confidence < 0.85`, poklapanje `duration` sa narracijom.
   Ako previše rečenica pada ispod praga → rerun sa `medium.en`.
4. Beat plan iz stvarnih tajminga — grupisanje rečenica u beatove, uređaj po beatu iz
   `docs/reference/visual-devices.md`, `NARRATION SAYS` / `VIEWER SEES` po beatu.
5. **⏸ CHECKPOINT** — prikaži beat plan i sačekaj odobrenje.
6. `timeline.mjs` sečenje → shot slotovi sa `use_in/use_out/use_len/motion_budget`, **bez promptova**.
7. Upiši `storyboard.json` sa praznim promptovima i commituj.

## Zašto se staje ovde

Pisanje 30 parova promptova je zaseban, veliki posao (C14). Beat plan i sečenje moraju biti
odobreni **pre** njega — to je najjeftinije mesto da se uhvati loša kreativna odluka.

## Verifikacija — definicija gotovog

- `timing.json` postoji; zbir trajanja rečenica = trajanje narracije ±0.3s
- nijedan gap > 1.5s; broj rečenica ispod `confidence 0.85` zabeležen
- beat plan **odobren od korisnika** (ne od tebe)
- `sum(use_len)` = trajanje narracije **±0.2s** (to je T1 prag)
- svaki `use_len` u [3.0, 10.0]; **udeo shotova u ciljnom opsegu 7–9s zabeležen** — ovo je prvi
  stvarni podatak o tome koliko splitter valja
- `outro_start` postavljen iz `## OUTRO` sekcije
- broj `warning`-a iz `timeline.mjs` (sečenja unutar rečenice) zabeležen

## Podaci koje treba zabeležiti za kalibraciju

Izvorni plan kaže: **kvote se mere, ne nameću** dok nema podataka iz 3 epizode. Ova sesija je epizoda 1.

Zapiši u `episodes/<slug>/notes.md`:

- broj beatova, broj shotova, prosečan `use_len`
- distribucija `use_len` (koliko u 3–7s, koliko u 7–9s, koliko u 9–10s)
- upotrebljeni uređaji i njihova učestalost
- trajanje whisper run-a
- koliko si beatova ručno prepravio na checkpointu

## Zamke

- **Ne menjati `script.md` posle rendera narracije.** Ako beat izgleda nevizualizabilno, to se rešava
  izborom uređaja, ne prepravkom rečenice.
- `episode.json` `locked_description` mora biti 25–40 reči. Kraći ne drži konzistentnost, duži pojede budžet prompta.
- Ne pisati nijedan prompt u ovoj sesiji — to je C14.
