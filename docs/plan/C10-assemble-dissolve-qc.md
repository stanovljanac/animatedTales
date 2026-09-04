# C10 — `assemble.mjs`: cross-dissolve + `qc-report.md`

**Faza:** 1 (deterministički alati) · **Zavisi od:** C09 · **Procena:** ~90k tokena
**Izvorni plan, sekcije:** „assemble.mjs" (korak 3 dissolve, korak 6 qc-report).

## Cilj

Dve dopune montaže: šav između linked shotova i QC izveštaj koji ti kaže šta da regenerišeš.

```
node tools/assemble.mjs episodes/<slug> [--dissolve 8] [--res 1080p]
```

## 1. Cross-dissolve

Opcioni cross-dissolve od **8 frejmova** između **linked shotova istog beata** — jeftina zakrpa za
hard-reset šavove koje Flow pravi kad se isti beat generiše iz više klipova.

**Između različitih beatova ostaje hard cut.** To je namerno: rez na granici beata prati rez u priči.

Linked shotovi se prepoznaju po `link_group` iz `storyboard.json` (C01).

### ⚠ Dissolve krade trajanje

`xfade` od 8 frejmova skraćuje ukupno trajanje za 8 frejmova (0.33s @ 24fps) **po prelazu**.
Epizoda sa 6 linked parova gubi 2s — a T1 provera dozvoljava ±0.2s.

Mora se rešiti eksplicitno, jedno od dvoje:

- **(a)** produži `use_len` svakog linked shota za pola trajanja prelaza pre nego što se `xfade` primeni
  (traži da izvorni klip ima rezervu — proveri `probe()`-om), ili
- **(b)** prihvati skraćenje, ali ga **prijavi u `qc-report.md`** i uskladi audio pomeranjem.

Preporuka: **(a)**, jer čuva sinhronizaciju sa narracijom. Zapiši izabranu opciju u kod i u izveštaj.

## 2. `qc-report.md`

Piše se uz `final.mp4`, uvek — i kad je sve u redu.

| Sekcija | Sadržaj |
|---|---|
| Nedostajući partovi | shotovi bez `shots/partNN.mp4` |
| Prekratki izvori | izvor kraći od `use_out` |
| Ukupni drift | video ↔ narracija, u sekundama i frejmovima |
| **Kandidati za regeneraciju** | shotovi gde je iskorišćeno **<50%** generisanog klipa — bačeno generisanje + sabijen pokret |
| Primenjeni prelazi | broj dissolve-a i njihov ukupan uticaj na trajanje |

Poslednja stavka je direktan ulaz u `at-assemble` skil (C12): *„ovo regeneriši sa kraćim pokretom pre finalnog reviewa."*

## Isporučuje

- dissolve grana u `tools/assemble.mjs` + `--dissolve` zastava (podrazumevano isključena)
- `qc-report.md` generator
- `tests/assemble-dissolve.test.mjs` — konstrukcija `xfade` filter grafa, računica kompenzacije trajanja

## Verifikacija — definicija gotovog

```bash
node tools/assemble.mjs episodes/marathon --dissolve 8
node -e "import('./tools/ffmpeg.mjs').then(async m => console.log(await m.probe('episodes/marathon/final-new.mp4')))"
cat episodes/marathon/qc-report.md
```

- sa `--dissolve 8`, drift ostaje **< 0.2s** (ovo je pravi test kompenzacije)
- bez `--dissolve`, rezultat je bajt-identičan onome iz C09
- `qc-report.md` lista shotove sa <50% iskorišćenja — proveri ručno na 2 primera
- `qc-report.md` nema ni jedan ERROR na ispravnoj epizodi
- vizuelno: pogledaj jedan dissolve prelaz u plejeru; ako je vidljiv kao „bleštanje", 8 frejmova nije dobra vrednost

## Zamke

- `xfade` traži da oba ulaza imaju identičan fps, rezoluciju i pixel format — posle C09 koraka 2 imaju, ali proveri.
- Audio se **ne dira** dissolve-om. Narracija je jedan neprekidan stream od `t=0`.
- Ne uvoditi dissolve između beatova „jer izgleda glatko". Plan to eksplicitno odbija.

## Tačka preseka ako sesija pređe budžet

`qc-report.md` je nezavisan od dissolve-a i vredniji je od njega (govori ti šta da regenerišeš).
Ako sesija ide kratko — prvo `qc-report.md`, pa dissolve.
