# Forma image prompta — zašto stari `visuals.md` promptovi daju bolje slike

**Status:** predlog · 2026-09-13 · prvi test na `episodes/antikythera-mechanism`
**Zahvata (ako se usvoji):** `docs/reference/prompt-templates.md`, `style-string.md`,
`camera-language.md`, `.claude/skills/at-storyboard/SKILL.md`. Linter se ne menja.

---

## 0. Polazna činjenica

Na `tyr-and-fenrir` otprilike polovina slika generisanih iz `storyboard.json` promptova
(shema 2) bila je lošija od slika iz starog `visuals.md`, pa je taj shot ponovljen sa
starim promptom. Ovo nije merenje po shotu (koji je shot pobedio nije zapisano), nego
korisnikov utisak iz produkcije. Ispod je poređenje oba seta nad istom epizodom.

## 1. Izmereno

| | stari `visuals.md` (21) | shema 2 `storyboard.json` (27) |
|---|---|---|
| prosečna dužina | **97 reči** | **231 reč** |
| tokeni medija i gustine (`detailed`, `richly`, `layered`, `cinematic`, `atmospheric`, `hand-drawn`, `illustration`, `outlines`) | **~10 po promptu** | **~5 po promptu** |
| reči pre nego što se kaže gde je kamera | ~10–15 | **~110** |
| promptova sa `foreground`/`midground` | 11 | 0 |
| promptova sa negacijom | 4 | **27** (`NOT IN FRAME` je obavezan) |
| promptova sa `left/right third` | 0 | 22 |

## 2. Razlike koje verovatno prave razliku, po težini

### 2.1 Ideja kadra je na početku starog prompta, a u sredini novog

Stari shot 01 počinje sa *„…gigantic supernatural Fenrir viewed from an extremely low
ground-level perspective, enormous dark wolf dominating the foreground…"*. U prvih 20 reči
model zna medij, subjekt, ugao i šta dominira. Novi shot 01 počinje style stringom (16 reči)
pa **lock lokacije** (34 reči) pa `SCALE` pa lock vuka — ugao i raspored stižu posle 110
reči. `prompt-templates.md` tvrdi da se front-loaduje identitet; u praksi se front-loaduje
**opis iz manifesta**, a ono po čemu se ovaj kadar razlikuje od svih ostalih stoji na kraju.

### 2.2 Stari prompt imenuje *nameru* kompozicije, novi imenuje *mehaniku*

Stari: *„strong extreme scale contrast"*, *„composition focused primarily on the growing
shadow rather than the wolf itself"*, *„Fenrir's body forming the central organic contrast
against the rigid restraint"*. Novi: *„left third — the gods, small; center — the wolf,
near-camera and large"*. Grid je tačan, ali ne kaže modelu **zašto** je kadar takav, pa
model popuni kompoziciju podrazumevanim, ravnim rasporedom. Stari prompt daje cilj, novi
daje koordinate.

### 2.3 Gustina se tvrdi jednom umesto na početku i na kraju

`style-string.md` je svesno sveo sedam tvrdnji gustine na dva tokena da bi uštedeo P1
budžet — i sam to beleži. `DETAIL` blok je trebalo da to nadoknadi, ali je jedna linija
na 200. reči. Stari prompt otvara **i zatvara** medijem: *„…richly detailed hand-drawn 2D
historical animation illustration, cinematic film frame, 16:9."* To je najjeftiniji deo
razlike: 12 reči.

### 2.4 Negacije prizivaju ono što isključuju

`NOT IN FRAME: the far mountains, the ribbon.` Za image model to su dve pozitivne reči više
o planinama i traci. Googleov vodič za Gemini image model (Nano Banana, koji Flow koristi)
eksplicitno preporučuje **semantičke negacije** — opisati željeno stanje pozitivno („an
empty, deserted street") umesto „no cars". Stari promptovi to rade instinktivno („no gods
present" samo tamo gde bi ih model inače dodao).

### 2.5 Formular umesto opisa slike

Isti vodič: *„Describe the scene, don't just list keywords… a narrative, descriptive
paragraph will almost always produce a better, more coherent image."* Novi prompt je
formular od 14 polja, od kojih neka opisuju meta-podatke a ne sliku (`FACING`, `SCREEN
DIRECTION`). Stari prompt nije pasus, ali čita se kao **jedan kontinuiran opis jedne slike**.

### 2.6 Dubinski slojevi su izbačeni sa pogrešnim razlogom

„Sardis problem" (`camera-language.md`) je stvaran: *„vojnici izlaze iz Sardisa, grad iza
njih"* okrene likove leđima. Ali lek je zabranio dubinu kao **poziciju**, a u praksi je
nestala i dubina kao **bogatstvo** — *„richly layered foreground, midground and
background"* se u 27 novih promptova ne pojavljuje nijednom. Lista A zabranjuje samo četiri
fraze; `foreground`, `midground`, `far background` nisu na njoj. Pisac prompta je pravilo
čitao šire nego što piše.

### 2.7 Zaključani opis traži detalje koje veličina kadra ne može da pokaže

U LS/XLS kadru lock vuka i dalje nosi „amber eyes, one torn ear". To je 15 reči koje se
takmiče sa „figures readable by outline". Pravilo „lock samo na veličini na kojoj se opis
vidi" postoji u skilu, ali shot 01 ga krši.

### 2.8 Način razmišljanja o sceni, ne samo forma

`visuals.md` za svaki kadar prvo napiše **VISUAL PURPOSE** i **WHAT THE VIEWER SEES**, a na
kraju ima **ANTI-REPETITION CHECK** — spisak dominantnog subjekta svakog kadra (telo, senka,
razmera, lanac, karika, nadzor odozgo…). Svaki kadar ima jednu ideju koja ga razlikuje.
Novi lanac ima `viewer_sees` po beatu, ali promptovi se pišu popunjavanjem blokova, pa
kadrovi ispadnu korektni a bez ideje (npr. shot 15 „vuk kruži po steni, pan udesno").
Bez one jedne rečenice „zašto ovaj kadar postoji" forma ne pomaže.

**Šta shema 2 radi bolje i ne sme da se izgubi:** zaključani identitet (C1/S5), jedna osa
ekrana, `FACING` protiv leđa-ka-kameri, `SCALE` kao ponovljena tvrdnja. To su stvarne
popravke stvarnih grešaka; stari promptovi nemaju ništa od toga i zato ponekad promaše lik.

## 3. Predlog — profil v3, bez promene lintera

Ugovor (blokovi, lockovi, S1/S2/S5, P1 90–280) ostaje. Menja se **šta se u blokove piše i
redosled**:

1. **`SHOT:` odmah posle `STYLE`** — jedna rečenica, ≤35 reči, na engleskom, u stilu starog
   prompta: subjekt + ugao + šta dominira + namera kompozicije, dozvoljeno „X rather than Y".
   Primer: `SHOT: an extreme low ground-level view of a gigantic wolf dominating the
   foreground, one paw planted close to the viewer, the gods reduced to tiny silhouettes on a
   distant ridge — overwhelming scale contrast.`
2. **`FRAME LAYOUT` nosi slojeve dubine** uz pozicije: `foreground (near-camera, large) — …;
   midground — …; far background (small, hazy) — …`. Sardis pravilo ostaje u `FACING`:
   orijentacija lika prema mestu se i dalje eksplicitno kaže.
3. **`NOT IN FRAME` samo za ono što bi model inače dodao**, pozitivno gde može
   (`NOT IN FRAME: open empty sky above the ridge, bare rock without figures`). Nikad ne
   nabrajati elemente koje ostatak prompta ne priziva.
4. **`RENDER:` kao poslednja linija**, fiksna, 12 reči:
   `RENDER: richly detailed hand-drawn 2D historical animation illustration, cinematic film frame.`
   Izuzima se iz R4 kao i `STYLE` (ako se usvoji; do tada R4 signal je ADVISORY i ne smeta).
5. **Still kadrovi:** `SCREEN DIRECTION` opisuje **zamrznut** pokret i držanje („spray frozen
   in a diagonal across the lower-left", „mid-stride toward screen-right"), i mora da se slaže
   sa smerom `pan-left`/`pan-right`.
6. **Lock samo na veličini na kojoj se vidi.** U LS/XLS se lik opisuje siluetom u `SHOT`
   liniji, a u `characters[]` ide samo ako mu je opis stvarno čitljiv.
7. **Pre pisanja promptova, u `notes.md`: tabela „dominantan subjekt po kadru"**, kao
   ANTI-REPETITION CHECK iz `visuals.md`. Dva uzastopna kadra sa istim dominantnim subjektom
   traže obrazloženje.

Cena u rečima: `SHOT` ~30 + `RENDER` 12 = ~42 reči. Pokriva se time što `FACING` i
`SCREEN DIRECTION` na still kadrovima postaju kraći (nema animacije koju treba pripremiti),
a `WEARING/PROPS` otpada.

## 4. Kako se proverava

Na `antikythera-mechanism` promptovi se pišu po profilu v3. Za **6 kadrova** (po jedan
macro, lik, grupa, okruženje, presek, silueta) shotlist daje i verziju u stilu `visuals.md`
(ista scena, neprekinut opis, bez blokova). Korisnik generiše obe i u `notes.md` beleži
pobednika po kadru. Ako v3 dobije ≥4/6, profil ulazi u `prompt-templates.md`; ako ne,
sledeći korak je `shotlist.mjs` koji iz blokova sklapa neprekinut opis za Flow, a blokovi
ostaju samo kao ugovor za linter.
