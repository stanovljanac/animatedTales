# Still kadrovi — epizoda od slika, bez Veo klipova

**Status:** odobren za izvođenje · 2026-09-09
**Zahvata:** `tools/contract.mjs`, `tools/lint.mjs`, `tools/assemble.mjs`, `tools/shotlist.mjs`,
`tools/render.mjs`, `tools/beatplan.mjs`, `docs/reference/schemas.md`, fixture i testovi.

---

## 0. Zašto, i šta ovaj dokument ne pokriva

Slika je u Flow-u besplatna, klip nije. Epizoda od 27 klipova košta 270–2700 kredita pri
budžetu od 50 kredita dnevno (`docs/reference/google-ai-plus.md`), pa video budžet — ne
pisanje, ne montaža — određuje koliko epizoda mesečno može da postoji. Format sastavljen
isključivo od statičnih slika sa pokretom kamere u montaži tu cenu obara na nulu i menja
ritam epizode: umesto 27 klipova od 8s, 40–50 slika od ~5s.

**U obimu:**

1. Ugovor: `render_mode` i `still_motion` po shotu (§1).
2. Linter: grananje pravila po shotu, ne po shemi; novi ADVISORY signal R7 (§2).
3. Montaža: Ken Burns renderer za still kadrove **i popravka opsega boje** (§3).
4. `beatplan.mjs --still`: skelet sa drugim granicama reza (§4).
5. `shotlist.mjs`, `render.mjs`: prikaz i budžet kredita bez klipova (§5, §6).
6. Fixture `tests/fixtures/still-episode/` i testovi (§7, §8).
7. Dokumentacija i skilovi (§9).

**Van obima, svesno:**

- **Ulazni helperi** (paste-through fajl promptova, filovanje iz Downloads-a). Slike se od sada
  ubacuju direktno u `episodes/<slug>/shots/`, pa nema šta da se premešta.
- **Muzika, SFX, titlovi, upscale** — kao i do sada (`docs/plan/00-INDEX.md`, „Van scope-a").
- **Izbor teme za prvu still epizodu** (faza 02) — ljudski korak, nije softver.
- **Per-shot količina zuma.** Iznos je konstanta u rendereru, ne polje. Obrazloženje u §3.3.

**Odstupanje koje se ne prećutkuje.** `docs/plan/00-INDEX.md` nosi tvrdo pravilo: „nijedan novi
feature dok jedna epizoda ne prođe ceo lanac od `narration.mp3` do `final.mp4`" — a C13–C15 su
otvoreni. Ovaj posao to pravilo probija. Razlog zbog kojeg ipak ide sada: pravilo postoji da
spreči gomilanje nedovršenih puteva kroz lanac, a still kadrovi ne dodaju novi put nego skraćuju
postojeći — suvi hod C15 se sa slikama može završiti bez ijednog kredita. Odstupanje se upisuje
u `00-INDEX.md` kao tačka 27, isto kao svako drugo.

---

## 1. Ugovor

`schema_version` **ostaje 2**. Oba nova polja su opciona sa podrazumevanom vrednošću koja
opisuje zatečeno stanje, pa svaki postojeći `storyboard.json` ostaje validan bez ijedne izmene.

### 1.1 Dva nova polja u `Shot`

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `render_mode` | `"clip" \| "still"` | ne | Odsutno ili `null` znači `"clip"`. `"still"` znači: shot nije Veo klip nego jedna slika kojoj montaža daje pokret. |
| `still_motion` | `"push" \| "pull" \| "pan-left" \| "pan-right" \| "hold"` | na still shotu | Šta kamera radi nad slikom. Na clip shotu mora biti odsutno ili `null`. |

### 1.2 Zašto zatvoren enum a ne izvođenje iz `tags.camera_motion`

Razmatrana su tri oblika i dva su odbijena:

- **Izvođenje iz `tags.camera_motion`** (bez novog polja) puca na `pan` i `track`: tag kaže da
  se kamera pomera bočno, ali ne i na koju stranu. Ta informacija danas postoji jedino kao
  proza u bloku `SCREEN DIRECTION:`. Parsiranje engleskog unutar mašinskog ugovora radi na 25
  shotova i tiho pogrešno renderuje 26.
- **Objekat `{kind, amount, direction}`** daje punu kontrolu, ali uvodi treće mesto na kome
  živi namera kamere (tagovi, proza prompta, i sada objekat) i traži da `at-storyboard` po
  svakom shotu bira brojku koju niko ne može dobro da proceni — 27 malo različitih brzina zuma
  umesto jednog izgleda epizode.
- **Zatvoren enum od pet vrednosti** (izabrano): jedan string koji skil bira u istom dahu u
  kome bira `tags.camera_motion`, a neslaganje između to dvoje prijavljuje ADVISORY signal
  (R7, §2.3) umesto da se jedno izvodi iz drugog.

### 1.3 Ostala polja na still shotu

| Polje | Vrednost na still shotu | Zašto |
|---|---|---|
| `source_file` | `shots/shot<shot_id>.jpeg` | Izvor shota je slika. Svaki potrošač već čita `source_file` kao „medij iz kog ovaj shot nastaje"; drugo polje bi značilo granu u pet alata. |
| `ingredient_image` | `null` | Ingredient postoji da bi ušao u Flow klip. Klipa nema. |
| `animation_prompt` | `null` | Nema šta da se animira. `null`, ne prazan string — §0.5 sheme: obavezno polje je uvek prisutno, makar kao `null`. |
| `motion_budget` | `null` | Budžet pokreta je instrukcija Veo modelu koliko sekundi ima za pokret. Nema modela. |
| `use_in` | `0.0` | Slika nema unutrašnji tajmlajn u koji bi se ušlo od 0.5s. |
| `use_out` | `= use_len` | Posledica prethodnog. |
| `tags` | svih šest osa, kao i do sada | R1, R2 i režijska tabla mere iste ose bez obzira na režim. |
| `link_group` | dozvoljen | Dissolve između dve slike radi isto kao između dva klipa — `xfade` radi nad segmentima, ne nad izvorima. |

`visual_priority`, `characters`, `image_prompt` i S2 blokovi rade **potpuno isto**. Still kadar
je i dalje kadar: subjekt, veličina, ugao, svetlo i zaključani opisi važe nepromenjeno.

### 1.4 Granice trajanja

| | min | max | cilj (`beatplan`) |
|---|---|---|---|
| clip | 3.0s | 10.0s | 8.0s |
| still | **2.5s** | **9.0s** | **5.0s** |

3.0–10.0 je Veo raspon i za sliku ne znači ništa. 2.5–9.0 je izabrano da drži tempo reza dovoljno
visoko da epizoda čita kao film a ne kao slajdšou: epizoda od 4 minuta pada na ~40–50 slika
umesto 27. To je najveća poluga na to da li format uopšte radi, pa je jedini broj u ovom
dokumentu koji se očekuje da se menja posle prve merene epizode.

Donja granica je 2.5, a ne niže, zbog T1 i splittera: rez kraći od ~2.5s ne može da padne na
granicu rečenice u prosečnoj naraciji, pa bi splitter počeo da seče na proizvoljnim mestima
(`timeline.mjs`, `forcedSplit`).

### 1.5 Invarijante (dopuna `schemas.md` §3.7)

15. `render_mode` je odsutno, `null`, `"clip"` ili `"still"`. Nepoznata vrednost je razlog da
    alat stane, ne nalaz — prikaz bi tiho lagao o tome šta shot jeste.
16. Na still shotu: `still_motion` je jedna od pet vrednosti; `animation_prompt`, `motion_budget`
    i `ingredient_image` su `null`; `use_in === 0`; `source_file` je `shots/shot<shot_id>.jpeg`.
17. Na clip shotu: `still_motion` je odsutno ili `null`; sve ostalo kao do sada
    (invarijanta 13 — `shots/part<shot_id>.mp4`).
18. Mešanje režima unutar epizode je dozvoljeno. Beat sme da nosi i still i clip shotove.

---

## 2. Linter — grananje po shotu, ne po shemi

Ključna odluka: **`schema_version` se ne diže i pravila se ne biraju po njemu.** Shema 2 opisuje
oblik prompta; režim opisuje kako shot postaje slika u pokretu. To su dve nezavisne ose i
biraju se odvojeno — inače bi svaka buduća kombinacija tražila novu verziju sheme.

### 2.1 Tabela primenljivosti (BLOCKING)

| Provera | clip | still |
|---|---|---|
| **T1** pokrivenost tajmlajna | ✓ | ✓ *(nepromenjeno — meri `use_len`, ne izvor)* |
| **T2** granice trajanja | 3.0–10.0s | **2.5–9.0s**, plus `use_in === 0` |
| **T3** motion budget | ✓ | **obrnuto**: `motion_budget` mora biti `null`; nalaz ako nije |
| **S1** prostorne fraze | image + animation | **samo image** |
| **S2** obavezni blokovi | ✓ | ✓ |
| **S3** reči koje impliciraju rez | ✓ | **preskače se** (nema animation prompta) |
| **S4/S5** vizuelna težina | ✓ | ✓ |
| **P1** dužina image prompta | ✓ | ✓ |
| **P2** dužina animation prompta | ✓ | **obrnuto**: `animation_prompt` mora biti `null`; nalaz ako nije |
| **C1** zaključani opisi | ✓ | ✓ |
| **F1** medij na disku | klip postoji i traje ≥ `use_out` | **slika postoji i čita se** |

Sedam od dvanaest provera — među njima sve koje nose najviše vrednosti (T1, S1, S2, S4, S5, P1,
C1) — ostaje netaknuto. `CHECKS` lista se ne menja: „na still shotu `animation_prompt` mora biti
`null`" je i dalje P2, jer je to i dalje pravilo o animation promptu.

### 2.2 F1 na still shotu

Slika mora da postoji i `probe()` mora da vrati dimenzije. Trajanje se ne meri — nema ga.
Rezolucija se **ne** proverava ovde: linter ne zna sa kojim `--res` će se montirati, pa bi prag
bio izmišljen. Adekvatnost rezolucije meri montaža, koja to zna (§3.5).

### 2.3 R7 — neslaganje `still_motion` i `tags.camera_motion` (ADVISORY)

Meri se samo na still shotovima. Slaganje:

| `still_motion` | očekivan `tags.camera_motion` |
|---|---|
| `push` | `push` |
| `pull` | `pull` |
| `pan-left`, `pan-right` | `pan` |
| `hold` | `locked` |

`track`, `parallax` i `reveal` na still shotu su uvek signal: nijedan pokret nad jednom slikom
ih ne izražava. Signal, ne nalaz — kadar u kome `SCREEN DIRECTION` opisuje otkrivanje kroz zum
je legitiman, a linter ne može da presudi.

`ADVISORY` lista postaje `['R1'…'R7', 'C2']`.

---

## 3. Montaža — Ken Burns i opseg boje

### 3.1 Popravka opsega boje (postoji nezavisno od still kadrova)

**Izmereno, ne pretpostavljeno.** Trenutni lanac nad JPEG-om daje segment koji ffmpeg prijavljuje
kao `yuvj420p(pc, bt470bg/unknown/unknown)` — puni opseg — dok segmenti iz Veo klipova izlaze kao
`yuv420p` (ograničen opseg, netagovan). Siva RGB 20 se u still segmentu čuva kao **Y=20**, a u
ispravnom ograničenom opsegu bi bila **Y≈31**. Posle `concat -c copy` zaglavlje toka nosi tag
prvog segmenta (`yuv420p`), pa svaki plejer koji veruje tom tagu prikazuje end card sa
ugašenim crnim i spaljenim belim. Danas to pogađa jedan kadar po epizodi; sa still kadrovima
bi pogađalo celu epizodu.

Popravka je u dva poteza i **ne menja nijedan sempl na klip putanji** (provereno `framemd5`
poređenjem — identično):

1. `videoFilter()` dobija `format=yuv420p` na kraju lanca. Nad JPEG-om to je konverzija punog u
   ograničen opseg; nad Veo klipom je no-op.
2. `encodeArgs()` dobija `-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709`.
   Izlaz se time i **tagira** onim što jeste, umesto da ostane netagovan.

`recipe()` diže `v: 1` na `v: 2`, pa se keširani segmenti zatečenih epizoda regenerišu. Bez toga
bi popravka preskočila baš one epizode zbog kojih postoji.

### 3.2 Still kadar se popunjava, ne uokviruje

Klip putanja i dalje radi `scale=…:force_original_aspect_ratio=decrease` + `pad` — Veo klipovi
su 16:9, pa je `pad` no-op i menjanje bi diralo zatečene izlaze bez razloga.

Still putanja radi **`increase` + `crop`**. Flow 2K slika je 2752×1536, odnosno 43:24, što na
1920×1080 daje 1071.6 px visine i **4 px crne trake gore i dole na svakoj slici**. Slika se seče
da popuni okvir; to nije po-shot odluka i nema zastavu.

### 3.3 Filter lanac po pokretu

Konstante (u `assemble.mjs`, izvezene):

```
STILL_ZOOM = 1.15          // koliko se najviše zumira; jedan izgled po epizodi
STILL_SUPERSAMPLE = 2      // međukanvas 2× izlaza, zbog sub-pikselske glatkoće
```

Iznos zuma je konstanta a ne polje iz istog razloga iz kojeg je `still_motion` enum a ne objekat:
27 pojedinačno biranih brzina zuma daje 27 malo različitih epizoda, a jedna konstanta daje jedan
prepoznatljiv izgled. 1.15 je izabrano jer je dovoljno da se pokret vidi na 5s, a nedovoljno da
se na 2752 px izvoru vidi mekoća.

Lanac (`SW = width × 2`, `SH = height × 2`, `N = seg.frames`):

```
scale=SW:SH:force_original_aspect_ratio=increase:flags=lanczos,
crop=SW:SH,
zoompan=<izraz>:d=1:s=<width>x<height>:fps=<fps>,
format=yuv420p,
setsar=1
```

`d=1` znači „jedan izlazni frejm po ulaznom" — ulaz je `-loop 1` sekvenca od N frejmova, pa
`zoompan` ide po brojaču `on` od 0 do N−1. To je jedini oblik koji daje ravnomeran pokret;
varijanta sa jednim ulaznim frejmom i `d=N` radi, ali `on` tada ne postoji kao poluga.

Izrazi (`Z = STILL_ZOOM`, `K = N − 1`, a za `N = 1` ceo `zoompan` otpada — jedan frejm nema šta da
se pomera):

| `still_motion` | `z` | `x` | `y` |
|---|---|---|---|
| `push` | `1+(Z-1)*on/K` | `iw/2-(iw/zoom/2)` | `ih/2-(ih/zoom/2)` |
| `pull` | `Z-(Z-1)*on/K` | `iw/2-(iw/zoom/2)` | `ih/2-(ih/zoom/2)` |
| `pan-right` | `Z` | `(iw-iw/zoom)*on/K` | `ih/2-(ih/zoom/2)` |
| `pan-left` | `Z` | `(iw-iw/zoom)*(1-on/K)` | `ih/2-(ih/zoom/2)` |
| `hold` | — bez `zoompan`-a — | | |

Provereno na ffmpeg 7.1: sva četiri pokreta daju 24 od 24 različita frejma na sekundu, a
`pan-left` prvi frejm je bajt-identičan `pan-right` poslednjem — dokaz da su ista putanja u dva
smera, ne dva približna izraza.

`pan-*` panuje po margini koju otvara sam zum: na `Z = 1.15` to je 15% širine. Bez zuma se
nema kuda panovati — izvor je 43:24, svega 1.4% širi od 16:9.

`hold` je namerno potpuno statičan frejm, a ne spor zum: postoji da bi rez imao gde da stane.

### 3.4 `stillArgs()`

```
-hide_banner -nostdin -loglevel error -y
-loop 1 -framerate <fps> -t <len + 2/fps>
-i <dir>/<seg.source>
-an
-vf <lanac iz 3.3>
-frames:v <seg.frames>
<encodeArgs()>
```

Bez `-tune stillimage`: pokret postoji, a tune cilja raspodelu bitova za nepomičnu sliku. End
card ga zadržava — on jeste nepomičan.

Broj frejmova je zakucan `-frames:v`, isto kao na klip putanji i iz istog razloga: `-t` ume da
isporuči frejm više ili manje, a 45 takvih grešaka je drift koji T1 vidi.

### 3.5 Plan, validacija i QC

- `planCuts()` upisuje `mode: 'clip' | 'still'` i, na still segmentima, `motion`. `kind` ostaje
  `shot` / `chain` / `endcard` — grananje renderera ide po `mode`, pa lanac sme da meša režime.
- `validate()` na still segmentu traži da fajl postoji i da se čita; ne traži trajanje.
- `recipe()` nosi `mode`, `motion` i `zoom`, pa promena pokreta regeneriše segment.
- `qcReport()`:
  - „Prekratki izvori" i „Kandidati za regeneraciju" **isključuju** still segmente — slika nema
    trajanje, pa ni udeo iskorišćenja; danas bi izašla kao 0% i tražila regeneraciju koja nema smisla.
  - „Nedostajući partovi" ih uključuje — slike koje fale su i dalje razlog da montaža padne.
  - Nova sekcija **„Still kadrovi"**: shot, fajl, pokret, dimenzije slike i da li je slika bar
    `STILL_ZOOM × width` široka. Uža slika se na kraju zuma dovlači naviše i to se vidi; nije
    ERROR nego WARN, jer je odluka o `--res` naknadna.

---

## 4. `beatplan.mjs --still`

Bez ovoga format nije dostižan: pisac bi dobio 27 rezova od 8s i ručno ih proglasio slikama.

`--still` menja tri stvari:

1. Granice reza koje idu u `planTimeline`: `minShot 2.5`, `maxShot 9.0`, `targetShot 5.0`,
   `motionBelow 0` (pa `motion_budget` nikad ne ispadne različit od `null`).
2. Skelet shota: `render_mode: "still"`, `still_motion: "hold"`, `animation_prompt: null`,
   `source_file: "shots/shot<id>.jpeg"`, `ingredient_image: null`.
3. Checkpoint blok imenuje režim i broj slika, jer je to broj koji se gleda pre odobrenja.

`still_motion: "hold"` u skeletu je namerno najdosadnija vrednost, ne nasumična: skelet koji
sam sebe proglasi režiranim je gori od skeleta koji vidno traži da ga neko prođe.

---

## 5. `shotlist.mjs`

- **Budžet kredita broji samo clip shotove.** Zaglavlje kaže i koliko je slika:
  `FLOW KREDITI — 3 klipa + 42 slike; slike su besplatne (Nano Banana, 0 kredita)`.
  Epizoda bez ijednog klipa dobija jedan red umesto tabele tierova: nema šta da se bira.
- Still shot ispisuje **jedan** prompt i **dva** koraka umesto tri:

```
shot 07   beat B03 · samostalan, tvrd rez · 5.25s · STILL (push)

IMAGE PROMPT (214 reči)
…
  [ ] 1. image prompt -> slika
  [ ] 2. sačuvaj sliku kao shots/shot07.jpeg
```

- `imageFile()` na still shotu vraća `source_file` (`shots/shot07.jpeg`), ne
  `images/shot07.jpeg` — slika **jeste** izvor, ne ulaz u nešto drugo.

---

## 6. `render.mjs`

- Režijska tabla dobija kolonu **`režim`** posle `lanac`: `—` za clip, `still push` za still.
  Ne krši pravilo iz C08 — kolona ne nosi nijedan podatak kojeg nema u `storyboard.json`. Bez
  nje se najvažnija režijska činjenica novog formata (koliko slika stoji u nizu i sa kojim
  pokretima) ne vidi ni na jednom ekranu.
- Kolona `P1/P2` na still shotu piše `214/—`.
- Odeljak shota: umesto reda o klipu i `use` rasponu ide
  `- slika: \`shots/shot07.jpeg\` · pokret: push`, a blok **ANIMATION PROMPT** se izostavlja.
- `countWords(null)` bi vratio 1 („null" je token sa alfanumerikom). Svako mesto koje meri
  animation prompt mora prvo da proveri režim.

---

## 7. Fixture — `tests/fixtures/still-episode/`

Prati zatečenu konvenciju (`good-episode`, `bad-episode`, `linked-episode`, `repetitive-episode`):
pun folder epizode sa `episode.json`, `storyboard.json` i sitnim medijima u `shots/`.

Sadržaj: **6 shotova u 2 beata**, schema 2, BLOCKING 0.

| shot | režim | pokret | uloga u fixture-u |
|---|---|---|---|
| 01 | still | `push` | osnovni slučaj |
| 02 | still | `pull` | lanac B01 sa 01 (dissolve između dve slike) |
| 03 | still | `hold` | grana bez `zoompan`-a |
| 04 | still | `pan-left` | |
| 05 | still | `pan-right` | |
| 06 | **clip** | — | dokaz da se režimi mešaju u istoj epizodi |

Mediji: pet `shots/shot0N.jpeg` (32×18, ~1 KB) i jedan `shots/part06.mp4` (postojeća konvencija
16×16 testsrc, ~2 KB). `.gitignore` dobija izuzetak
`!tests/fixtures/*-episode/shots/*.jpeg` uz onaj koji već postoji za `*.mp4`.

`storyboard.sample.json` i `tests/check-fixtures.mjs` se **ne diraju**. Sample je kanonski clip
primer sa izmerenim brojevima citiranim u `schemas.md` §3.8; still ugovor se izvršno proverava
nad ovim fixture-om kroz lint testove, tačno kao što `linked-episode` nosi ugovor lanaca.

---

## 8. Testovi

Nijedan test ne pokreće ffmpeg — postojeći testovi ubrizgavaju `run`/`probe` i to ostaje.
Stvarni render se proverava ručno, po §10.

| Fajl | Šta se dodaje |
|---|---|
| `tests/lint-blocking.test.mjs` | T2 granice i `use_in`, T3 obrnut, S1 samo image, S3 preskočen, P2 obrnut, F1 na slici, i **kontra-test**: clip shot sa `still_motion` je nalaz |
| `tests/lint-advisory.test.mjs` | R7 slaganje i neslaganje; `track` na still shotu; R7 ćuti na clip shotovima |
| `tests/assemble.test.mjs` | `videoFilter` ima `format=yuv420p`; `encodeArgs` nosi color tagove; `stillFilter` po svih pet pokreta; `stillArgs` ima `-loop 1` pre `-i` i nema `-tune`; `planCuts` upisuje `mode`/`motion`; `validate` ne traži trajanje slike; `recipe` menja segment kad se promeni pokret; qc sekcija „Still kadrovi"; still ne ulazi u kandidate za regeneraciju |
| `tests/shotlist.test.mjs` | krediti broje samo klipove; still blok ima dva koraka i nema animation prompt; `imageFile` na still shotu |
| `tests/render.test.mjs` | kolona `režim`; still odeljak bez ANIMATION PROMPT bloka; `P1/—` |
| `tests/beatplan.test.mjs` | `--still` granice i polja skeleta |

---

## 9. Dokumentacija i skilovi

- `docs/reference/schemas.md`: §3.3 (dva polja), **novi §3.3.2 „Still kadrovi"**, §3.7
  (invarijante 15–18), §4 (tabela pokrivenosti), §4.1 (R7), **novi §5.13** sa odlukama iz ovog
  dokumenta.
- `docs/plan/00-INDEX.md`: odstupanje 27 (probijeno pravilo „nijedan novi feature", §0).
- `.claude/skills/at-storyboard/SKILL.md`: kako se bira režim i `still_motion`; postojeća sekcija
  STILL IMAGE MONTAGE dobija mašinski parnjak.
- `.claude/skills/at-qa/SKILL.md`: šta se na still epizodi gleda umesto animation promptova.
- `.claude/skills/at-assemble/SKILL.md`: sekcija „Still kadrovi" u `qc-report.md`.
- `README.md`: jedan pasus o formatu i o tome zašto budžet kredita više nije budžet epizode.

---

## 10. Verifikacija

Redom, i svaka tačka mora da prođe pre commit-a celine kojoj pripada:

1. `node --test tests/` — svih 392 postojeća testa i dalje prolaze, plus novi.
2. `node tests/check-fixtures.mjs` — nepromenjen izlaz (sample se ne dira).
3. `node tools/lint.mjs tests/fixtures/still-episode` — BLOCKING 0, R7 bez signala.
4. `node tools/lint.mjs tests/fixtures/good-episode` — nepromenjen izlaz (regresija po režimu).
5. `node tools/shotlist.mjs tests/fixtures/still-episode` — 1 klip u budžetu, 5 slika van njega.
6. `node tools/render.mjs tests/fixtures/still-episode` — `storyboard.md` bez `undefined` i bez `null`.
7. **Stvarni render:** `node tools/assemble.mjs tests/fixtures/still-episode` uz sintetičku
   naraciju; izlaz se probe-uje i mora da bude `yuv420p(tv, bt709…)`, a ne `yuvj420p(pc…)`.
8. **Dokaz popravke boje:** siva RGB 20 kroz still putanju čuva se kao Y≈31, ne Y=20.
9. **Dokaz da klip putanja nije dirnuta:** `framemd5` jednog Veo klipa kroz stari i novi
   `videoFilter` mora biti identičan.

---

## 10a. Odstupanja od ovog dokumenta, nađena u izvođenju

1. **BLOCKING dobija nov kod `M1` — režim rendera.** Tabela u §2.1 nema red za ispravnost samog
   `still_motion` polja, a nijedno postojeće pravilo mu nije prirodan dom: T2 je o vremenu, S2 o
   blokovima prompta. Bez M1 bi pogrešna vrednost pala tek u montaži, a `still_motion` na clip
   shotu ne bi pao nikad — slika bi mirno stajala i niko ne bi znao zašto. M1 pokriva: pokret van
   enuma ili odsutan na still shotu, pokret prisutan na clip shotu, `ingredient_image` koji nije
   `null` na still shotu. Stoji **prvi** u `CHECKS`, jer režim odlučuje po kojim su se pravilima
   merila ostala. `T3` i `P2` ostaju kako §2.1 kaže — obrnuta pravila pod istim kodom.

2. **`render.mjs` i `beatplan.mjs` su ušli u obim** (§0 ih navodi, ali ih pasus iz prepiske nije
   imao). `render.mjs` je morao: `countWords(null)` vraća 1, pa bi `storyboard.md` tvrdio da
   still kadar ima animation prompt od jedne reči. `beatplan.mjs` je morao jer bez `--still`
   format nije dostižan — pisac bi dobio 27 rezova od 8s i ručno ih proglasio slikama.

3. **`inspectSources` vraća i `width`/`height`.** §3.5 traži proveru rezolucije u QC izveštaju, a
   red iz `inspectSources` je do sada nosio samo trajanja.

## 11. Redosled izvođenja

Svaka celina je jedan commit, TDD, i ostavlja repo zelenim:

1. **Boja** — `videoFilter`, `encodeArgs`, `recipe v:2` + testovi. Nezavisno od svega ostalog i
   popravlja postojeći bug.
2. **Ugovor** — `contract.mjs` (helperi, enumi, granice) + `assertDisplayable` + `schemas.md`.
3. **Fixture** — folder, mediji, `.gitignore`.
4. **Linter** — grananje + R7 + testovi.
5. **Montaža** — `stillFilter`, `stillArgs`, `planCuts`, `validate`, `qcReport` + testovi.
6. **Formateri** — `shotlist.mjs`, `render.mjs` + testovi.
7. **Skelet** — `beatplan.mjs --still` + testovi.
8. **Dokumentacija i skilovi** + verifikacija §10 u celini.
