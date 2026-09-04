# Biblija kanala — Animated Tales

Jedini deo `docs/masterPrompt.md` koji preživljava Fazu 2. Ovde stoji ono što važi za **svaku**
epizodu bez obzira na temu: ko je kanal, koliko video sme da traje, kako se postupa sa izvorima i
kako se generišu klipovi. Sve što se tiče pojedinačnog kadra živi u ostala četiri fajla ovog foldera.

---

## 1. Identitet

Animated Tales pretvara istorijske, mitološke i kulturno značajne teme u kratke ispričane epizode.
Lanac produkcije je: istraživanje → scenario → ElevenLabs narracija → ilustrovani startni frejmovi →
image-to-video animacija (Google Flow / Veo) → montaža. Radi ga **jedan čovek, uglavnom besplatnim
alatima**, i to je projektno ograničenje, ne izgovor — svaki predlog koji traži tim ili plaćeni
studio se odbija.

Redosled prioriteta, kad su u sukobu: **kvalitet priče → kvalitet slike → izvodljivost produkcije.**

Kanal je **story-first, a ne udžbenik.** Cilj nije objasniti sve o temi, nego naći najjaču priču
unutar nje i ispričati je jasno. Kad tema nosi više mogućih priča, bira se ugao sa najboljim zbirom:
radoznalost, sukob, iznenađenje, emocija, značaj, vizuelni potencijal. Činjenica koja ne služi priči
ne ulazi u scenario samo zato što je zanimljiva.

Vizuelni identitet nije opisan ovde nego kao jedan string za kopiranje — vidi `style-string.md`.

---

## 2. Ciljni runtime

**Tvrd plafon je 5 minuta finalnog videa.** Menja ga isključivo eksplicitna korisnikova odluka.

- Kraća jaka epizoda je bolja od slabe petominutne. Filer radi popunjavanja minutaže je zabranjen.
- Merodavno trajanje je **stvarno izmereno trajanje ElevenLabs narracije**, nikad procena iz broja
  reči. Sve vremenske invarijante montaže vise o toj jednoj izmerenoj vrednosti
  (`storyboard.narration_duration`, `docs/reference/schemas.md` §3.1).
- Epizoda se završava obaveznim OUTRO odeljkom; on ulazi u tih 5 minuta i dobija svoj end-card shot.

---

## 3. Istorijski integritet

Svaka tvrdnja pripada tačno jednoj od tri kategorije i tako se i tretira u scenariju:

| Kategorija | Šta je to |
|---|---|
| **HISTORICAL RECORD** | potkrepljeno istorijskim, arheološkim ili savremenim dokazima |
| **TRADITION / MYTH / LEGEND** | mitologija, religija, usmeno predanje, ep, kasnija književna tradicija |
| **INTERPRETATION / DEBATE** | nesigurno, sporno ili različito tumačeno |

Mit i legenda su potpuno legitimne teme kanala. Ono što je zabranjeno je **izmišljanje pa
predstavljanje kao utvrđene činjenice** — događaja, citata, datuma, likova, brojki, motiva i
istorijskih detalja. Kad je dokaz nesiguran, ta nesigurnost se zadržava u tekstu, ali bez pretvaranja
epizode u akademsko predavanje: jedna kratka ograda, ne fusnota.

Isto važi i za sliku: rekviziti, odeća, arhitektura i oružje prate stvarni period i kulturu priče.
Ne pozajmljuju se dizajni iz nepovezanih epoha zato što „bolje izgledaju".

---

## 4. Hard reset — trajno pravilo

**Svaki generisani klip kreće od novog, zasebno generisanog startnog frejma.**

Zabranjeno je, bez izuzetka:

- automatska kontinuacija (`extend`, `continue`)
- korišćenje poslednjeg frejma prethodnog klipa kao startnog frejma sledećeg
- bilo kakvo ulančavanje frejm-na-frejm

Za povezane shotove (`shot.link_group`) prethodna **generisana slika** sme da se ručno priloži kao
vizuelna referenca — to je referentna slika, ne frejm nastavka. Kontinuitet lika se ne održava
nastavljanjem klipa, nego doslovnim kopiranjem `locked_description` polja u svaki prompt
(provera C1, `docs/reference/schemas.md` §0.7).

Posledica koju treba prihvatiti: šav između dva povezana klipa je vidljiv. Rešava se u montaži
kratkim cross-dissolveom, ne promenom načina generisanja.
