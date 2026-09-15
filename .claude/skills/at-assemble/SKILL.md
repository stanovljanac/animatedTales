---
name: at-assemble
description: Use when cutting a finished Animated Tales episode into final.mp4 - runs tools/assemble.mjs, reads qc-report.md, and names the shots that must be regenerated before final review. Do NOT use for building a storyboard (that is at-storyboard) or for prompt QA (that is at-qa).
---

# at-assemble — montaža

`storyboard.json` + klipovi + narracija + end card → `final.mp4` + `qc-report.md`.

## Tok

### 1. Montaža

```
node tools/assemble.mjs episodes/<slug> --dissolve 8
```

Hard cut svuda osim, uz `--dissolve`, između linked shotova istog beata.

| Opcija | Značenje |
|---|---|
| `--dissolve 8` | cross-dissolve od N frejmova unutar `link_group`-a; `0` isključuje |
| `--res 1080p` | `720p` · `1080p` · `1440p` · `2160p` (podrazumevano `1080p`) |
| `--out final.mp4` | ime izlaznog fajla u folderu epizode |
| `--outro-start 281.7` | odakle end card preuzima sliku (inače iz `timing.json`) |
| `--force` | dozvoli prepisivanje izlaza koji ovaj alat nije napravio |
| `--dry-run` | samo validacija, plan rezova i `qc-report.md`, bez rendera |

**Pusti prvo `--dry-run`.** Daje `qc-report.md` i plan rezova bez čekanja na render, pa se
nedostajući ili prekratki klipovi vide odmah.

### 2. Čitanje `qc-report.md`

Alat piše `episodes/<slug>/qc-report.md`. Tabela na vrhu je rezime; ispod nje je po sekcija na
proveru.

| Provera | Šta znači kad nije OK |
|---|---|
| **Nedostajući partovi** | shot iz storyboard-a nema klip na disku — montaža ga ne može ubaciti |
| **Prekratki izvori** | klip ne traje do kraja svog reza; sa `--dissolve` treba i višak za prelaz |
| **Ukupni drift** | pokrivenost naspram narracije, prihvatanje ±0.2s. Rep end carda **nije** drift — poredi se pokrivenost, ne ukupno trajanje. |
| **Kandidati za regeneraciju** | vidi dole — ovo je glavni posao ovog skila. **Still kadrovi se ovde ne pojavljuju** — slika nema trajanje, pa ni udeo iskorišćenja. |
| **Still kadrovi** | sekcija postoji samo kad epizoda ima slika. WARN znači da je slika uža od `1.15 × širina izlaza`, pa je zum dovlači naviše i to se vidi. Popravka je regenerisati sliku u većoj rezoluciji ili montirati na nižem `--res`, ne menjati pokret. |
| **Primenjeni prelazi** | koliko dissolve-ova je stvarno primenjeno i koliko preskočeno |
| **Izostavljeni i skraćeni shotovi** | shot koji prelazi `outro_start` end card skraćuje ili izbacuje. Nije greška, ali se ne prećutkuje. |

### 3. Javi šta treba ponovo generisati — pre finalnog reviewa

Ovo je razlog zbog kog skil postoji.

Sekcija **Kandidati za regeneraciju** izlistava shotove kod kojih je iskorišćeno **manje od
50%** generisanog klipa. To je bačeno generisanje i, po pravilu, pokret sabijen u premalo
vremena — klip od 10s čiji se koristi 3s skoro uvek izgleda kao da je presečen na pola poteza.

```
| Shot | Klip | Generisano | Iskorišćeno | Udeo |
|---|---|---|---|---|
| 33 (skraćen outrom) | `part33.mp4` | 10.01s | 3.125s | 31.2% |
```

Imenuj te shotove korisniku **pre finalnog reviewa**, ne posle. Uz svaki reci i udeo — 31%
i 48% nisu isti slučaj.

Za regeneraciju uputi na:

```
node tools/shotlist.mjs episodes/<slug> --only 33
```

`--only` prima i `7` i `07`, više brojeva razdvojenih zarezom (`--only 07,12,18`). Ispisuje
promptove doslovno i korake generisanja za baš te shotove.

**Popravka je kraći pokret, ne duži klip.** Prompt se prepravlja tako da `MOTION BUDGET` i tri
vremenska proreza stanu u `use_len` koji shot zaista koristi. Menjanje `use_len`-a da bi se
poklopio sa klipom je pomeranje tajmlajna i pripada `at-storyboard`-u.

Shot označen `(skraćen outrom)` je poseban slučaj: njega je skratio end card, ne loš rez.
Regeneracija ima smisla samo ako se i dalje jasno vidi da je pokret presečen.

**Still kadar se ne regeneriše zbog iskorišćenja.** Slika nema trajanje koje bi se bacilo, pa
jedini razlog da se pravi ponovo jeste WARN o rezoluciji ili sam sadržaj kadra. `--only` radi
isto — ispisuje image prompt i dva koraka umesto tri.

### 4. Finalni render

Kad su kandidati regenerisani (ili svesno prihvaćeni), pusti montažu bez `--dry-run`.

### Template (antikythera-mechanism, prihvaćen 2026-09-15)

Ovako izgleda svaki video, a ne slideshow:

- **Still pokret je gladak.** `stillFilter` koristi `perspective` (float prozor, `eval=frame`) na
  2× kanvasu, zum `STILL_ZOOM = 1.06`, ease-in-out. **Nikad `zoompan`** — iseca u celim
  pikselima i slika trza/treperi (to je bila greška prve verzije, zum 1.15 linearno).
- **Uvod je animiran.** `episode.json` → `intro_file` (npr. `shots/video1.mp4`) zamenjuje prvi
  shot; zvuk klipa ide ispod narracije na `intro_volume` (0.2) sa fade-om 0.3s pred rez.
- **End kartica je poslednji shot.** `endcard_file` (npr. `shots/endKartica.jpeg`) preuzima
  sliku na `t_in` poslednjeg shota i drži do kraja narracije + 1.5s. `--outro-start` nadjačava.

### 5. Publish komplet

Kad je video spreman za objavu:

1. `node tools/publish.mjs episodes/<slug>` — piše `subtitles.srt` (YouTube ne prima JSON) i
   štampa rečenice sa m:ss vremenima.
2. Napravi `episodes/<slug>/publish.md` po `docs/publish.md`: 5 različitih TITLE OPTIONS
   (rangirano, 1 = preporuka), DESCRIPTION sa Chapters blokom (prvi 0:00, najmanje 3, svaki
   ≥10s, vremena samo iz liste rečenica), HASHTAGS i PINNED COMMENT. Naslov dopunjuje
   thumbnail, ne ponavlja njegov tekst.
3. Ponovo `node tools/publish.mjs episodes/<slug>` — mora da javi da chapteri prolaze.

## Šta ovaj skil ne radi

- **Ne menja `storyboard.json`.** Ni promptove, ni vremena. Prompt pale provere popravlja
  `at-qa`; vremena i beat mapu `at-storyboard`.
- **Ne piše `storyboard.md`** — to radi isključivo `render.mjs`, i taj fajl se nikad ne menja
  ručno.
- **Ne generiše klipove.** Izlistava ih i upućuje na `shotlist.mjs`.
- **Ne prećutkuje skraćene shotove**, ni kad je skraćenje ispravno.
