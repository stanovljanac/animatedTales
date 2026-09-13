# antikythera-mechanism — beleške

Prva **still** epizoda: nijedan Veo klip, svaki shot je slika kojoj pokret daje montaža
(`render_mode: "still"`, spec `docs/superpowers/specs/2026-09-09-still-kadrovi.md`).
Istovremeno je i prvi test profila prompta v3
(`docs/superpowers/specs/2026-09-13-forma-image-prompta.md`).

## Izbor teme (faza 02)

Ideja **#16 — The Ancient Machine That Shouldn't Exist** (90.0, drugo mesto posle već
urađene #26). Izabrana zbog still formata, ne samo zbog skora:

- **Subjekti su predmeti i mesta, ne likovi.** Olupina, statue, fragment, zupčanici, brojčanici.
  Predmet na slici bez pokreta izgleda kao namerna ilustracija; lik koji bi trebalo da se
  pomera izgleda kao zamrznut klip. Samo dva lika se ponavljaju (ronilac, Stais).
- **Žanr je misterija/otkriće**, gde je slika sa sporim zumom prirodan jezik (dokumentarci
  tako izgledaju), za razliku od mitske akcije.
- Nema masovnih scena ni nasilja koje bi image model odbio.

Odbačeno za ovaj test: #8 (leš na suđenju — rizik da model odbije), #28 Oziris (više
bogova koje treba držati konzistentnim kroz ~50 slika; dobar kandidat za sledeću still
epizodu), #9 (ples traži pokret i gomile).

## Skripta

- 56 rečenica, 591 reč sa outrom, procena **~4:15** po tempu Tir epizode (139 reči/min).
  Merodavno je tek izmereno trajanje narracije.
- Hook je doslovan iz `ideas.md`.
- Glas: **Explorer / discovery** — detalji isporuke u `research.md`.
- Svesno izostavljeno: koji tačno zupčanik ima 223 zupca (izvori se razilaze), Price po
  imenu, Kusto 1976, rekonstrukcija planeta iz 2021.

### Za ElevenLabs

- Lepi se **samo tekst** iz `script.md`, bez naslova `## OUTRO` i bez HTML komentara na kraju.
- Proveriti izgovor: *Antikythera* (an-tee-KEE-thee-ra), *Valerios Stais* (va-LEH-ree-os STA-ees),
  *Cicero*, *Archimedes*.
- Posle rendera: fajl ide u `episodes/antikythera-mechanism/narration.mp3`.
- `script.md` je od tog trenutka **zamrznut** — ako se tekst promeni u ElevenLabs-u, isto
  mora da se promeni i u `script.md` pre `align.mjs`.

## Beat mapa — nacrt pre narracije

`beats.json`: 23 beata nad 56 rečenica, pokrivenost i redosled provereni. ID-jevi rečenica
dolaze iz `parseScript()` nad `script.md`, ne iz zvuka, pa nacrt ostaje validan. Broj shotova
po beatu se zna tek posle `beatplan.mjs --still` (cilj 5s po slici → očekivano **~45–50 slika**).

Uređaji: `macro-object` ×4, `process-cutaway` ×3, `empty-aftermath` ×2, `silhouette` ×1,
`ledger-accumulation` ×1, `timeline-seasons` ×1; 11 beatova doslovno.

## Osa ekrana

Nema dve strane sukoba, pa osa nosi **smer vremena i smer spuštanja**:

- **Vreme ide nalevo → nadesno.** Antika drži levu stranu, moderno doba desnu (tabla vremena
  u B18: mehanizam levo, srednjovekovni sat desno).
- **Otkriće ide odozgo nadole, a razumevanje odozdo nagore.** Ronjenje (B03–B06) je vertikalno,
  čamac gore; skenovi i rekonstrukcija (B12–B17) „izranjaju".
- Fragment, kad stoji pored rekonstrukcije, uvek je **levo** (prošlost), rekonstrukcija **desno**.

## Redosled posle narracije

1. `node tools/align.mjs episodes/antikythera-mechanism`
2. `node tools/beatplan.mjs episodes/antikythera-mechanism --beats episodes/antikythera-mechanism/beats.json --still`
   → checkpoint (korisnik je unapred tražio da se radi do kraja; plan se ipak ispisuje)
3. `--still --write`, pa promptovi po profilu v3 i `still_motion` po kadru
4. tabela „dominantan subjekt po kadru" ovde, pre promptova
5. `lint.mjs --no-media`, `render.mjs`, `shotlist.mjs` → čeklista za Flow
6. slike u `shots/shotNN.jpeg`, **end card** u folder i u `episode.json` `endcard_file`
7. `node tools/assemble.mjs episodes/antikythera-mechanism` → `final.mp4`, `qc-report.md`

## Otvoreno

- `endcard_file` ne postoji — potreban pre koraka 7.
- `docs/ideas.md` #16 i dalje nosi `status: scored`; prebaciti na `done` kad epizoda bude gotova.
