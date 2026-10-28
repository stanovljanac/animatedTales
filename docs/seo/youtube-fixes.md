# YouTube izmene — Animated Tales (@AnimatedTales-r4r)

Stanje kanala na dan **2026-10-28**: 19 pretplatnika, 10 dugih videa, 10 Shorts, 8 playlisti.
Cilj nije više SEO polja, nego **više pravih gledanja dugih videa**.

Svaka stavka nosi oznaku:

- **[Obavezno]** — ispravlja nešto netačno ili pogrešno povezano.
- **[Preporučeno]** — bolji opis ili struktura, mali rizik, ne meri se pojedinačno.
- **[Eksperiment]** — test čiji se efekat meri i koji može da se vrati.

Tekst za copy-paste je na engleskom. Uputstva su na srpskom.

**Redosled:** 1 → 2 → 3 odmah. 4 i 5 iste nedelje. 6 kad Test & Compare ponudi naslove.
7 (članak) tek posle ovoga, i samo ako važi „Distribucija članka" iz odeljka 7.

---

## 1. [Obavezno] Opis kanala

**Sadašnji opis** kaže *„cinematic hand-drawn animation"*, a AI Disclosure pominje samo
„visual elements and animation".

**Problem 1 — „hand-drawn":** Reč opisuje izgled. Kanonski style string je *„detailed
hand-drawn 2D historical animation illustration"* (`docs/reference/style-string.md`). Ali
čitalac je razume kao način izrade, a slike i klipovi se generišu u Google Flow-u.

**Problem 2 — nepotpun disclosure:** Disclosure ne pominje naratora (ElevenLabs) ni pomoć
chat modela u istraživanju i skripti (`docs/prompts/03-research.md`, `04-script.md`).
Disclosure koji postoji treba da bude potpun.

**Novi opis** (Studio → Customization → Basic info → Description; ~800 od 1.000 znakova):

```
One story from history or mythology at a time, told in about four minutes of hand-drawn-style 2D animation.

Ancient battles like Marathon and the Gallic sack of Rome. Greek and Norse myths, from Zeus, Poseidon and Hades drawing lots for the world to Týr and the wolf Fenrir. Mysteries like the Antikythera mechanism. Forgotten stories from ancient Egypt, Han China and the kingdom of Lydia.

Every episode keeps historical record, myth and open debate apart, so you always know which is which. Each video focuses on one compelling story — not a textbook full of facts.

Animated Tales (@AnimatedTales-r4r) is made by one person.

AI disclosure: AI tools are part of our production — research and script assistance, the narrator's voice, and the illustrations and animation. Every story is chosen and reviewed by a person before it is published.
```

Rečenica *„is made by one person"* je iz `channel-bible.md` §1. Ako ne želiš da to bude javno,
obriši je; ostatak teksta ne zavisi od nje.

---

## 2. [Obavezno] AI disclosure na nivou videa

YouTube traži oznaku **„Altered or synthetic content"** samo za realističan sadržaj koji može da
prođe kao stvaran. Jasno nerealističan sadržaj, kao animacija, izuzet je
([YouTube Help](https://support.google.com/youtube/answer/14328491)). Stil kanala je stilizovani
2D, a „photorealistic" i „photo" su zabranjeni tokeni (`style-string.md`). Zato je **„No"
verovatno tačan odgovor** za sve videe, ali to treba potvrditi po videu.

Gde: Studio → Content → video → Details → **Altered content**.

Za svaki video odgovori na tri pitanja. Ako je bilo koji odgovor „da", oznaka ide na **Yes**.

- **A:** da li postoji fotorealističan kadar (intro, end card, mapa, fotografija)?
- **B:** da li narator imitira glas stvarne osobe?
- **C:** da li je stvarna osoba prikazana realistično kako radi ili govori nešto što nije?

| Video | A | B | C | Oznaka |
|---|:-:|:-:|:-:|---|
| `DBGWroAot-4` The Harem Conspiracy That Killed Ramesses III | | | | |
| `asH-WNx94kA` The Goddess Who Starved the World… (Greek Gods, Part 2) | | | | |
| `NHMGOOVNNk0` A Kingdom Refused to Sell Its Horses. So China Sent an Army | | | | |
| `aE1EFPZLo3E` Zeus, Poseidon and Hades Drew Lots… (Greek Gods, Part 1) | | | | |
| `_eKElXW9Hk4` Divers Found a 2,000-Year-Old Greek Computer in a Shipwreck | | | | |
| `MZ5I5s2hapA` The God Who Sacrificed His Hand to Save the World | | | | |
| `_1h_EAjb_wk` The Gallic Sack of Rome after the Battle of the Allia in 390 BC | | | | |
| `hsGI3xlJ-SY` The Last Lydian King — The Prophecy That Destroyed His Kingdom | | | | |
| `nUQkW9Umv8M` The Battle of Marathon - The Battle Won by a Dead Man's Army | | | | |
| `Mrai30wItZI` How Humans Learned to Cross Entire Oceans Without a Compass | | | | |

Isto važi za Shorts. Ako je Short isečak dugog videa, ima isti odgovor kao taj video.

---

## 3. [Obavezno] Provera postojećih „Related video" veza

Svi Shorts su već povezani. Proveri da li svaki vodi na pravi dugi video. Sadržaj Shorts-a ne
vidim (YouTube iz ovog okruženja traži prijavu), pa je par izveden iz naslova i playlisti.

| Short | Očekivani dugi video | Tip veze | Povezan u Studiju sa |
|---|---|---|---|
| `2vnd3hiaP2U` The Plot against Ramesses III | `DBGWroAot-4` Ramesses III | direktan | |
| `cU085EwoFs8` Zeus Promised Their Daughter to Hades… | `asH-WNx94kA` Greek Gods, Part 2 | direktan | |
| `VIWp3jvBtwo` The Greek Gods Divided Universe Except One Thing | `aE1EFPZLo3E` Greek Gods, Part 1 | direktan | |
| `Ci5iIipPjEk` Divers Thought the Seabed Was Covered in Bodies | `_eKElXW9Hk4` Antikythera | direktan | |
| `qAfoX8bUg_k` When Rome Was Almost Erased from History | `_1h_EAjb_wk` Allia / sack of Rome | direktan | |
| `BSsP9n2tbSc` Why were the Gods afraid of this Wolf | `MZ5I5s2hapA` Týr i Fenrir | direktan | |
| `u9WZwX3Iktw` One of China's Biggest Military Problems… Horses | `NHMGOOVNNk0` China / horses | direktan | |
| `hAbpc4Q_14Q` He Sent an Army to War. Then Refused to Let Them Home | `NHMGOOVNNk0` China / horses | verovatno direktan (ista playlista) | |
| `ya6UUlhU648` Poseidon and Apollo Both Proposed. Hestia Refused | Greek Gods 1 ili 2 | **samo tematski** | |
| `IGr4Zwxyetk` Hera the Widow, Wife of a God Who Could Never Die | Greek Gods 1 ili 2 | **samo tematski** | |

**Hestija i Hera:** poveži ih sa onim Greek Gods delom u kome se lik zaista pojavljuje. Ako se ne
pojavljuje ni u jednom, ostavi vezu ka delu 1 (uvodi olimpijsku porodicu), a lik zabeleži u
`docs/ideas.md` kao kandidata za buduću epizodu, da bi Short jednog dana imao pravi par.

---

## 4. [Preporučeno] Playliste

### 4a. Struktura

Tri stvari su trenutno pogrešno ili nepotpuno složene:

1. **„History Battles" je kopija „China History".** Obe sadrže tačno ista 3 videa o kineskom
   ratu za konje. U „History Battles" dodaj **Marathon** (`nUQkW9Umv8M`) i **Allia / sack of
   Rome** (`_1h_EAjb_wk`).
2. **Croesus (`hsGI3xlJ-SY`) nije ni u jednoj playlisti.** Dodaj ga u **„Greek History"**: priča
   se vrti oko proročišta u Delfima.
3. **„Greek History" ima samo Marathon.** Dodaj i **Antikythera** (`_eKElXW9Hk4`).

U svakoj playlisti **dugi video stavi prvi**. „Play all" tada kreće od cele priče, a playlista
dobija thumbnail dugog videa umesto Shorts-a.

### 4b. Opisi

Svih 8 playlisti nema opis, osim „Greek History" sa jednom rečenicom. Opisi ispod pretpostavljaju
izmene iz 4a.

**Greek Mythology**
```
The Greek gods as one continuing story. Start with Part 1, where Zeus, Poseidon and Hades draw lots for the universe, then Part 2, where Demeter starves the world until Zeus gives in. The Shorts follow single moments around them — Hestia, Hera, and the promise Zeus made to Hades.
```

**Norse Mythology**
```
Myths from the Norse world, one story at a time. Start with Týr and Fenrir: why the gods feared a wolf, the bindings he broke, and the price Týr paid to finally hold him.
```

**History Battles**
```
Battles and wars decided by a single choice. The Battle of Marathon, the Gallic sack of Rome after the Allia, and the war Han China fought over a kingdom's horses — each told as one story in a few minutes.
```

**Rome History**
```
Stories from Rome's early centuries. Start with the Gallic sack of Rome after the Battle of the Allia in 390 BC, when the city came close to disappearing from history.
```

**Egypt Stories**
```
Stories from ancient Egypt. Start with the harem conspiracy that killed Ramesses III — a plot against the pharaoh from inside his own palace.
```

**China History**
```
Stories from ancient China. Start with the war Han China fought because a distant kingdom refused to sell its horses, then the Shorts about the horse problem and the army that was not allowed to come home.
```

**Ancient Mysteries & Discoveries**
```
Discoveries that changed what we thought ancient people could do: the Antikythera mechanism, a 2,000-year-old geared machine found by sponge divers, and the Polynesian navigators who crossed open ocean without a compass.
```

**Greek History**
```
Ancient Greece, one story at a time: the Battle of Marathon, Croesus and the oracle of Delphi, and the Antikythera mechanism pulled from a shipwreck.
```

---

## 5. [Preporučeno] Pravila za buduće Shorts

Svaki Short već ima vezu, a dugi videi su i dalje na nekoliko desetina pregleda. Usko grlo zato
nije link, nego to što **Short ne daje razlog da se klikne.** Pravila za sledeće Shorts:

1. **Jedan Short = jedan dugi video.** Short je isečak ili teaser tačno jedne epizode, a naslov mu
   najavljuje istu priču.
2. **Kraj je pitanje, ne poenta.** Short staje na mestu gde dugi video tek daje odgovor: šta je
   bilo dalje, zašto, ili koja je cena.
3. **Poslednjih 1–2 sekunde upućuje na celu priču**, tekstom na ekranu i/ili rečenicom naratora,
   npr. *„The full story is linked below."*
4. **Bez hashtagova u naslovu.** Hashtagovi idu u opis, naslov ostaje za priču.

Predlog: ova četiri pravila dodati kao kratak odeljak „SHORTS" u `docs/publish.md`. To je tvoja
odluka, zato nije urađeno u ovom commitu.

---

## 6. [Eksperiment] Test naslova (Test & Compare)

Studio → Content → video → Details → **Test & Compare**, ako nudi testiranje naslova. Testira se
**jedan video u isto vreme**, a YouTube sam bira pobednika po vremenu gledanja. Zbog malog
saobraćaja test može da završi bez jasnog pobednika. To je takođe odgovor: onda ostaje stari
naslov.

Pravilo iz `docs/publish.md` važi i ovde: hook ostaje, dodaje se ime teme koje ljudi pretražuju.

**`hsGI3xlJ-SY`**, prvi na redu. Naslov ne pominje ni „Croesus" ni „Delphi", a hashtag #delfi je
pogrešno napisan.

- Sada: `The Last Lydian King — The Prophecy That Destroyed His Kingdom #history #oracle #prophecy #delfi`
- Varijanta A: `Croesus and the Oracle of Delphi: The Prophecy That Destroyed His Kingdom`
- Varijanta B: `King Croesus Asked the Oracle of Delphi One Question. It Cost Him Everything`
- Pretpostavka: video pominje Delfi (hashtag kaže da pominje). Ako ne pominje, ne koristi
  „Delphi".

**`Mrai30wItZI`**, drugi, posle prvog testa. Naslov ne pominje „Polynesian".

- Sada: `How Humans Learned to Cross Entire Oceans Without a Compass #history #animation #story #geography`
- Varijanta A: `How Did Polynesians Cross the Pacific Without a Compass?` (primer iz `docs/publish.md`)
- Varijanta B: `Stars, Swells and Birds: How Polynesians Found Islands Without a Compass`

---

## 7. [Eksperiment] Članak — uslov za objavu

Članak ima smisla samo ako dođe do ljudi koji već traže ovakve priče. Prototip je u
`docs/seo/drafts/animated-tales-guide.html` i objavljen je kao privatni claude.ai Artifact:
https://claude.ai/artifact/LVzUMeZakKPLHX2GDDSMkg. Drugi ljudi ga vide tek kad ga podeliš (Share
na stranici). claude.ai javne stranice nisu indeksirane, pa Artifact služi za deljenje, ne za
Google.

**Distribucija članka.** Javno se objavljuje samo ako važi bar jedno od sledećeg:

1. **Medium** kao glavna javna verzija (indeksira se). Kopiraj članak iz browsera; naslovi i
   linkovi se prenose.
2. **Community post na kanalu** + link u odeljku Links na kanalu, za postojeće gledaoce.
3. **Jedna relevantna diskusija** (subreddit ili Quora pitanje o konkretnoj priči), samo ako
   pravila zajednice dozvoljavaju sopstveni sadržaj i samo kao odgovor na pitanje, ne kao oglas.

Ako nijedno ne odgovara, članak ostaje prototip.

Gotovi tekstovi: **`docs/seo/medium.md`** (Medium post, sa uputstvom za objavu u komentaru na
vrhu) i **`docs/seo/social-posts.md`** (2 Facebook, 2 Instagram i 3 X objave, raspored i
dnevnik merenja).

**Članci po epizodi** (Krez, Ramzes III, Antikythera) kreću tek kad YouTube Analytics → Research
i Google Trends pokažu da ljudi traže temu. Mala konkurencija u pretrazi nije dokaz potražnje.

---

## 8. [Eksperiment] Naziv kanala

Ostaje „Animated Tales". U pretrazi ga zaklanja @AnimatedTales-v1d (53.8K), pa u svakoj
spoljnoj objavi uvek ide i handle **@AnimatedTales-r4r**. Promena imena je posebna odluka o
brendu i nije deo ovog plana.

---

## 9. Početno stanje i merenje

Javni broj pregleda na dan **2026-10-28**. Shorts i dugi videi se ne mogu direktno porediti:
Short se broji čim krene i svaki put kad se ponovi.

| Dugi video | Pregledi | Short(s) koji vode na njega | Pregledi |
|---|--:|---|--:|
| `DBGWroAot-4` Ramesses III | 41 | `2vnd3hiaP2U` | 476 |
| `asH-WNx94kA` Greek Gods, Part 2 | 32 | `cU085EwoFs8` | 173 |
| `NHMGOOVNNk0` China / horses | 48 | `u9WZwX3Iktw`, `hAbpc4Q_14Q` | 850, 105 |
| `aE1EFPZLo3E` Greek Gods, Part 1 | 190 | `VIWp3jvBtwo`, `ya6UUlhU648`?, `IGr4Zwxyetk`? | ~1.000, 200, 384 |
| `_eKElXW9Hk4` Antikythera | 54 | `Ci5iIipPjEk` | 536 |
| `MZ5I5s2hapA` Týr i Fenrir | 107 | `BSsP9n2tbSc` | 169 |
| `_1h_EAjb_wk` Allia / Rome | 22 | `qAfoX8bUg_k` | 485 |
| `hsGI3xlJ-SY` Croesus | 139 | — | — |
| `nUQkW9Umv8M` Marathon | 57 | — | — |
| `Mrai30wItZI` Polynesia | 29 | — | — |

`?` = par iz odeljka 3 koji treba potvrditi. „~1.000" je zaokruženo na javnoj stranici („1K").

**Kako se meri:**

- **Provera 1 — 2026-11-25 (4 nedelje).** Za svaki dugi video: Studio → Analytics →
  Content → Traffic source. Zapiši udeo **Shorts feed**, **Other YouTube features**,
  **Suggested videos** i **External**. Za Shorts zapiši **engaged views**. Ne postoji metrika
  samo za klikove na „Related video", pa se prati promena tih izvora između provera.
- **Ne meri se pojedinačno:** opis kanala i opisi playlisti (sve se menja odjednom).
- **Meri se kroz Test & Compare:** naslovi (odeljak 6).
- **Uspeh** je rast gledanja dugih videa, ne broj promenjenih polja ili objavljenih tekstova.

---

## Izbačeno iz plana

- **Ključne reči kanala** — mali efekat; naslov, thumbnail, opis i sam video su važniji.
- **Uklanjanje hashtagova kao zasebna izmena** — ide u novi naslov samo kroz test iz odeljka 6.
- **Promena naziva kanala** — posebna odluka o brendu (odeljak 8).
