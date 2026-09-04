# Katalog vizuelnih uređaja

Devet načina da se apstraktan ili zbirni beat pretvori u jedan konkretan kadar. Katalog postoji zbog
dva režima otkaza: **doslovnost** (narracija kaže „trgovina je cvetala", storyboard nacrta trgovca) i
**ponavljanje** (isti široki kadar grada tri puta u epizodi zato što narracija tri puta pominje grad).

## Kada je biranje obavezno

Kad je beat **apstraktan ili zbirni** — prosperitet, decenije, trgovina, rast, opadanje, sistem,
poređenje, „godinama posle", „širom carstva" — izbor uređaja iz ovog kataloga je **obaveza, ne
opcija**. Kad je beat konkretan (jedan čovek, jedno mesto, jedan trenutak), uređaj se ne koristi i
`beat.device` ostaje `null`.

Slug uz svaki naslov je mašinski parnjak: to je tačna vrednost koja ide u `beat.device`
(`docs/reference/schemas.md` §3.6). Ako se ovde doda ili preimenuje uređaj, menja se i tamošnja lista
i enum u linteru — to su dva prikaza iste stvari, a izvor istine je ovaj fajl.

---

## 1. ANIMATED MAP — `animated-map`

**Kad:** geografsko širenje, pohodi, rute, podela teritorije, bilo šta što traži „gde".
**Primer:** Cezarov marš na Rim — ilustrovana mapa na pergamentu, granica se boji ka jugu, ruta se
sama iscrtava, vojske su markeri koji klize.
**FRAME LAYOUT:** `center — the parchment map filling the frame; lower-right — the marching column
icon, large; upper-left — the compass rose, small and faded.`

## 2. LEDGER / ACCUMULATION — `ledger-accumulation`

**Kad:** količina, bogatstvo, danak, gubitak, dug, sve što raste ili se troši u brojevima.
**Primer:** godine harača — zrna žita se sipaju u meru dok se ne prelije preko ivice.
**FRAME LAYOUT:** `center — the measure, near-camera and large; lower edge — the growing spill;
right third — an unmarked tally board, far.`

## 3. PROCESS / CUTAWAY — `process-cutaway`

**Kad:** kako nešto radi ili nastaje — tehnologija, opsadna mašina, akvadukt, brod, obred.
**Primer:** presek rimske peći za kreč: slojevi kamena, vatra u dnu, dim kroz otvor na vrhu.
**FRAME LAYOUT:** `center — the kiln in cross-section, its near wall cut away; left third — the
stoker's arms only, cropped at the elbow; upper edge — the smoke vent.`

## 4. BEFORE / AFTER — `before-after`

**Kad:** promena stanja istog mesta — pre i posle opsade, pre i posle kuge, pre i posle reforme.
**Primer:** ista tržnica u podne i ista tržnica prazna, kamera prolazi kroz prelaz jednim potezom.
**FRAME LAYOUT:** `center — the same colonnade, identical angle in both states; left third — the
stalls, full; right third — the same stalls, bare boards.`

## 5. TIMELINE / SEASONS — `timeline-seasons`

**Kad:** protok vremena bez promene mesta — decenije, generacije, „vekovima posle".
**Primer:** jedan fiksni vidik na dolinu, svetlo prelazi iz zime u leto, njive menjaju boju.
**FRAME LAYOUT:** `center — the valley, locked framing; near-camera — one bare branch that leafs
out; far — the same ridge line, unchanged.`

## 6. MACRO OBJECT — `macro-object`

**Kad:** jedan predmet nosi celu ideju beata — pečat, ključ, ugovor, novčić, oštrica.
**Primer:** vosak koji se topi preko prekinutog pečata na ugovoru.
**FRAME LAYOUT:** `center — the seal, extreme close and near-camera; upper edge — the document
edge, cropped; right third — the wick flame, far and out of focus.`

## 7. SILHOUETTE — `silhouette`

**Kad:** strepnja, misterija, nasilje bez krvi, anonimna pretnja.
**Primer:** kolona kopalja kao crne siluete preko narandžastog neba nad gorućim selom.
**FRAME LAYOUT:** `lower third — the ridge line, black; center — the spear silhouettes, evenly
spaced; upper two thirds — flat orange sky.`

## 8. CROWD-AS-TEXTURE — `crowd-as-texture`

**Kad:** hiljade ljudi kao pojava, ne kao likovi — vojska, izbeglice, gomila na trgu.
**Primer:** legija odozgo, štitovi kao pravilna šara koja se pomera kao jedno telo.
**FRAME LAYOUT:** `full frame — the shield pattern, overhead; lower-right — one broken rank, the
only irregularity; no individual faces.`

## 9. EMPTY AFTERMATH — `empty-aftermath`

**Kad:** posledica kroz odsustvo — posle bitke, posle egzodusa, posle propasti.
**Primer:** prazna trpeza sa prevrnutim peharom i hlebom koji je počeo da se suši.
**FRAME LAYOUT:** `center — the table, near-camera; left third — an overturned cup and its stain;
NOT IN FRAME: people, bodies, weapons.`

---

## Linija `NARRATION SAYS / VIEWER SEES`

Svaki beat nosi ovu unutrašnju liniju pre nego što se napiše ijedan prompt. Ona živi u
`beat.narration_says` i `beat.viewer_sees`:

```
NARRATION SAYS: for two generations the tribute never stopped.
VIEWER SEES:    LEDGER/ACCUMULATION — grain poured into one measure until it spills.
```

Pravilo: kod apstraktnih beatova `VIEWER SEES` **ne sme** da bude preslikavanje imenica iz
`NARRATION SAYS`. Ako se u narraciji pominje danak, a u kadru se vidi vreća sa natpisom „danak", uređaj
nije upotrebljen — samo je imenica prevedena u sliku.

- **Loše:** `NARRATION SAYS: trade flourished` → `VIEWER SEES: a merchant selling goods`
- **Dobro:** `NARRATION SAYS: trade flourished` → `VIEWER SEES: ANIMATED MAP — sea routes drawing
  themselves outward from one port, harbour icons multiplying along each line.`

Kontrola pre predaje storyboarda: uzmi kolonu `VIEWER SEES` i pročitaj je bez narracije. Ako se iz nje
sama od sebe ne vidi priča, uređaji nisu odradili posao. Koji su uređaji korišćeni izlistava ADVISORY
signal R3; on ne blokira, ali epizoda u kojoj se isti slug ponavlja više od dvaput je crvena zastava.
