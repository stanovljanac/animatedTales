# C03 — Rubrika bodovanja + prepisan `ideas.md`

**Faza:** 0 (temelji) · **Zavisi od:** C01 (folder `docs/reference/`) · **Procena:** ~85k tokena
**Izvorni plan, sekcija:** „Faza 3 — Ideje i bodovanje".

Potpuno nezavisno od pipeline-a. Nulti rizik, a odmah otključava izbor sledeće epizode.

## Čita

`docs/ideas.md` — 302 linije, **30 ideja**, 3 kategorije, proza sa poljima
`Story` / `Why it's interesting` / `Historical period` / `Story type` / `Evidence type` /
`Visual potential` / `5-minute potential` / `Hook`.

## Isporučuje

### 1. `docs/reference/scoring-rubric.md`

| Metrika | Težina |
|---|---|
| Snaga hooka / curiosity gap | ×3 |
| Potencijal naslova + tambnejla | ×3 |
| Kompletnost luka u 5 min | ×2 |
| Iznenađenje / kontraintuitivni payoff | ×2 |
| Emotivni ulog | ×2 |
| Raznovrsnost vizuelnih uređaja | ×2 |
| Originalnost naspram zasićenja | ×1.5 |
| Jasnoća (koliko konteksta traži) | ×1.5 |
| Istorijska čvrstina | ×1 |
| Produkciona cena (mase, bitke, mnogo likova) | ×1, **invertovano** |

**Ključni zahtev:** svaka metrika dobija **deskriptore po nivou** — šta konkretno znači 0, šta 3, šta 5.
Bez toga ocene nisu ponovljive i tabela je proizvoljna. Ovo je najveći deo posla u ovoj celini.

Normalizacija: `zbir(težina × ocena) / (zbir(težina) × 5) × 100`. `zbir(težina) = 19`, maksimum 95 poena,
skalira se na 100. Zapiši formulu eksplicitno i pokaži je na jednom izračunatom primeru.

Pojasevi: **80+ radi odmah** · **65–79 radi uz oštriji ugao** · **<65 parkiraj**.

Invertovana metrika: 5 = jeftino za produkciju, 0 = skupo (mase, bitke, mnogo likova).

### 2. Prepisan `docs/ideas.md`

- Rangirana tabela: `#`, naslov, 10 ocena, ukupno /100, pojas, `status`
- `status`: `idea` / `scored` / `done` / `rejected`
- **Ispod tabele zadržati** originalni `Story` + `Hook` po ideji — kompresovano, ali ne obrisano.
  Hook je jedini deo koji direktno ulazi u produkciju.
- Na vrhu: **top 5 kandidata** koji nisu `done`, sa jednom rečenicom zašto

### 3. Usklađivanje statusa

U `ideas.md` samo **2** stavke nose oznaku `DONE` (#2 Marathon, #4 Rome), a gotove su **4** epizode.
Upari svaku od 4 epizode iz `episodes/` sa idejom (#3 je Croesus; polynesian-navigation naći) i
označi `status: done`. `done` ideje ostaju u tabeli ali **ispadaju iz rangiranja**.

## Zamke

- 30 ideja × 10 metrika = 300 ocena. Ne piši obrazloženje za svaku ocenu — samo za ukupan skor, jednom rečenicom.
- Ako se dve ideje preklapaju (isti događaj iz drugog ugla), spoji ih i označi.
- Ne izmišljaj nove ideje. Ova celina boduje postojeće.

## Verifikacija — definicija gotovog

- Tabela ima 30 redova; svaki red 10 popunjenih ocena
- Ručno preračunaj **3 nasumična reda** i potvrdi ukupan skor
- 4 epizode iz `episodes/` imaju `status: done` i nisu u top-5 listi
- Nijedan `Hook` nije izgubljen: `grep -c "Hook" docs/ideas.md` → 30
- Rubrika ima deskriptor za svaki nivo 0–5 za svaku od 10 metrika

## Tačka preseka ako sesija pređe budžet

Rubrika (1) je samostalan isporučeni artefakt i vredi sama za sebe. Bodovanje (2+3) ide u nastavak.
