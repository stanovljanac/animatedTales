# Kamera-jezik — pet obaveznih blokova

Ovaj fajl rešava „Sardis problem": kad se položaj u kadru opiše dubinskim jezikom („vojnici izlaze iz
Sardisa, grad iza njih"), model sam bira redosled dubine i redovno okrene likove leđima kameri ili
zalepi grad preko njih. Lek je da se **dubina nikad ne koristi kao poziciona instrukcija** — pozicija
se zadaje kao mesto na ekranu plus veličina plus atmosferska perspektiva.

Pet blokova ispod je obavezno u **svakom** `shot.image_prompt`. Nazivi su API prema linteru, ne stil:
provera **S2** radi `image_prompt.includes(NAZIV + ':')`, pa se pišu verzalom, engleski, sa dvotačkom,
tačno ovako.

| Blok | Šta upisuješ |
|---|---|
| `CAMERA:` | gde kamera fizički stoji u odnosu na subjekt \| eye / low / high / overhead \| wide / medium / close |
| `FRAME LAYOUT:` | šta zauzima koje mesto na ekranu: `left third: …` \| `center: …` \| `right third: …` \| `near-camera (large): …` \| `far (small, hazy): …` |
| `FACING:` | koju stranu tela kamera vidi za svaki subjekt i gde svako gleda |
| `SCREEN DIRECTION:` | kretanje preko kadra — `moving right→left`, `walking toward camera, growing larger` |
| `NOT IN FRAME:` | šta je namerno isključeno |

`FRAME LAYOUT` je jedini blok koji sme da govori o dubini, i to samo kroz par **veličina + izmaglica**
(`near-camera (large)` / `far (small, hazy)`), nikad kroz reč „pozadina".

---

## Tri tvrda pravila

### 1. Dubinski jezik nije poziciona instrukcija

Nikad ne govori gde je nešto tako što kažeš da je iza nečega. Reci na kojoj je trećini ekrana, koliko
je veliko i koliko je zamućeno vazduhom.

- **Loše:** `the city walls in the background, soldiers in front of them`
- **Dobro:** `the city walls sit in the upper-right of the frame, small and hazy with distance`

### 2. Uvek reci koju stranu tela vidimo

Model ne zaključuje orijentaciju iz radnje. Ako to ne napišeš, dobićeš leđa tamo gde ti treba lice.

- **Loše:** `the soldiers march out of the gate`
- **Dobro:** `FACING: we see their faces and chests; they look ahead, past the camera` — ili, kad ti
  zaista treba pogled otpozadi, `FACING: we see their backs and the straps of their packs`

### 3. Pravilo ORIGIN / DESTINATION

Kad likovi napuštaju neko mesto ili mu prilaze, imaš tačno dve dozvoljene opcije. Treće nema.

- **(a)** Mesto je **van kadra** — iza kamere ili tik uz ivicu. Opisuješ samo likove i smer kretanja,
  a mesto ide u `NOT IN FRAME`.
- **(b)** Mesto je **na eksplicitnoj poziciji u kadru** i uz njega eksplicitno stoji da su likovi
  okrenuti leđima ka njemu, licem ka kameri.

Nikad ne prepuštaj modelu redosled dubine.

- **Loše:** `soldiers leaving Sardis, the city behind them`
- **Dobro:** `FRAME LAYOUT: right third — the Lydian gate, seen at three-quarter angle; center — the
  soldiers, near-camera and large. FACING: their backs are turned to the gate, their faces toward
  camera.`

---

## Zlatni primer (verbatim)

Ovaj prompt-isečak je referentni uzorak i za ljude i za testove — prolazi S1 i S2 bez izmena:

> *CAMERA: camera stands on the road outside the gate, eye level, wide. FRAME LAYOUT: right third — the arched Lydian gate seen at three-quarter angle, its shadow falling toward camera; center and left third — a column of soldiers; near-camera — two soldiers large in the lower-left, cropped at the knee. FACING: we see the soldiers' faces and the fronts of their bronze scale armor; they look ahead, past the camera. SCREEN DIRECTION: the column moves from the right edge toward the left edge and slightly toward camera. NOT IN FRAME: the city interior, the acropolis.*

Obrati pažnju šta ovde **ne** piše: nijednom „iza", nijednom „u pozadini". Kapija je locirana
trećinom ekrana i uglom, vojnici veličinom i isečkom, a odnos kapije i kolone je rešen `FACING`
linijom, ne dubinom.

---

## Liste koje provera S1 konzumira

### A. Zabranjene fraze

Traže se nad `normalize(image_prompt + ' ' + animation_prompt)` (`schemas.md` §0.7), doslovno ove
četiri i nijedna više:

```
in the background
behind them
in the distance behind
in front of
```

### B. Screen-position tokeni koji ih otključavaju

Bez ove druge liste S1 se ne može implementirati bez lažnih pozitiva: `in front of` je obična
engleska konstrukcija i pojavljuje se u savršeno ispravnim kadrovima. Zabranjena fraza je dozvoljena
**samo ako u istoj rečenici stoji bar jedan token iz ove liste**:

```
upper-right      upper-left       lower-right      lower-left
left third       right third      center           centre
mid-frame        near-camera      far
left edge        right edge       upper edge       lower edge
screen-left      screen-right     cropped at
```

Primer koji **prolazi** uprkos zabranjenoj frazi:
`the herald stands in front of the altar, center, near-camera and large`.
Primer koji **pada**: `the herald stands in front of the altar` — nema nijedan token iz liste B.

### C. Napomena o trenutnom izvršnom obliku

`tests/check-fixtures.mjs` (C01) implementira **samo listu A**, kao bezuslovnu zabranu — lista B tamo
još ne postoji. Fixture zato ne sme da sadrži nijednu od četiri fraze čak ni sa screen-position
klauzulom. Ugovor iz `schemas.md` §4 („zabranjene prostorne fraze **bez** screen-position klauzule")
opisuje strožu meru nego što je kod danas ume; usklađivanje, tj. ugradnja liste B u `lint.mjs`,
pripada **C06**. Do tada važi konzervativno pravilo: piši promptove tako da ti liste B uopšte ne
treba.
