# Thumbnail promptovi

Za svaku epizodu postoji `episodes/<slug>/thumbnails.md`: **4–5 koncepata**, svaki sa natpisom, spremnih za Flow (Image · 16:9 · x4).
Vlasnik bira tri za YouTube „Test & compare" i uz svaki stavlja drugi naslov videa.

Referenca koja radi (vlasnik, 26. nov 2026): mansa-musa „MANSA MUSA / THE RICHEST MAN IN HISTORY?" (kralj u zlatu, kruna, žezlo,
suncobran, Kairo i piramide iza, sanduk zlata) i „CAIRO NEVER FORGOT" (kralj na belom konju ulazi kroz kapiju, svi gledaju u njega).
Ova druga je kadar iz samog videa (shot 01) sa natpisom.

## Zašto je prva serija promašila (mansa-musa, 26. nov 2026)

Pet koncepata, 40 slika, nijedna upotrebljiva. Greške, da se ne ponove:

| Greška | Kako je izgledalo | Šta je trebalo |
|---|---|---|
| Sporedna scena umesto glavne slike | vaga i uplašen menjač (Muse nema u kadru), dvor i „poljubi zemlju" (nigde zlata), prazna vreća u sivoj planini | kralj + zlato + Kairo: ono što video obećava |
| Natpis iz sporedne rečenice | HE GAVE IT AWAY, KISS THE GROUND?, THEN IT WAS GONE: ne kaže se ko, ni zašto je važno | ime i/ili najveća udica videa |
| Junak sitan i daleko | ceo lik u srednje-širokom kadru, lice nečitljivo na 168×94 | od grudi ili pojasa naviše, nisko postavljena kamera |
| Junak ne izgleda kao obećanje | „najbogatiji kralj" u običnom belom pamuku, liči na trgovca | kruna, zlatni nakit, žezlo, zlatna tkanina |
| Bez znaka mesta | generičke arkade, ne vidi se da je Egipat | minareti i piramide iza junaka |
| Blede, sive, tamne palete | krem, siva, tamna tirkizna | zasićeno, zlatni sat, zlato najsvetlije u kadru |
| Tanka okrugla „dečja" slova | mala, jedna ravna boja, bez podloge | debela serifna slova, metalik zlato, debeo obrub, senka |
| A varijanta bez teksta | 20 slika viška: sve B slike su imale tačna slova | samo varijanta sa natpisom |

**Zec u šumi.** Video je o tome kako se čovek obogatio, a u jednoj rečenici on o tome razmišlja dok šeta šumom i gleda zeca. Thumbnail sa
zecom prodaje šetnju šumom, i to gledaocu kome trebaju pare. Video je tačan, thumbnail laže o njemu. Svaki koncept prolazi ovaj test:
**ko vidi samo thumbnail mora da pogodi o čemu je video.**

## Šta thumbnail mora da ima

1. **Glavnu sliku videa, ne scenu iz njega.** Pre prvog prompta zapiši dve stvari: ko je junak i koja je najveća tvrdnja videa
   (prva rečenica skripte, hook iz `research.md`, ono po čemu ga ljudi znaju). Svaki koncept pokazuje to dvoje. Preokret iz videa
   (zlato je nestalo) sme da bude koncept samo ako i dalje pokazuje junaka i glavnu stvar.
2. **Junak velik, blizu i obučen kao obećanje.** Od grudi ili pojasa naviše, glava u gornjoj polovini kadra, kamera malo ispod
   njega. Lice ostaje lock iz `episode.json`, a odeća i rekviziti se pojačavaju do onoga što video prodaje (najbogatiji kralj =
   kruna, ogroman zlatni nakit, žezlo, zlatna tkanina). Ikonografija se uzima iz izvora ili iz samog videa (Katalonski atlas:
   kruna, žezlo, grumen zlata), ne izmišlja se.
3. **Svi gledaju u junaka.** Gomila, pratnja i posmatrači okrenuti su ka njemu; pogled gledaoca ide tamo kuda gledaju oni.
4. **Mesto u jednom pogledu.** Najprepoznatljiviji znak mesta iza junaka (piramide i minareti = Kairo), slojevito i mekše od junaka.
   Kontekst nije gužva: junak napred, mesto iza, natpis na nebu.
5. **Zasićene boje i jako svetlo.** Zlatni sat, svetla ivica na junaku, glavni predmet priče (zlato) je najsvetlija stvar u kadru.
   Sivo, bledo i tamno samo kad je to tema videa. Palete u jednom testu se razlikuju (zlatni sat, podne, zora, sumrak, pergament).
6. **Raspored:** junak u levoj polovini, natpis u gornjoj desnoj četvrtini do polovine preko mirnog neba ili trake, kontekst ispod
   natpisa. Lice, ruke i glavni predmet ne idu u donji desni ugao (oznaka trajanja).

## Natpis

- **Ime junaka i/ili najveća udica videa**, 3–7 reči: „MANSA MUSA / THE RICHEST MAN IN HISTORY?", „CAIRO NEVER FORGOT". Ne pouka,
  ne citat iz sporedne scene.
- **Dva nivoa** kad ima imena: prvi red ogroman (ime), drugi manji (udica). Bez imena: jedna fraza na 2–3 reda, ključna reč najveća.
- **Slova:** debela serifna verzalna slova kao naslov epskog filmskog postera, metalik zlato sa reljefom, debeo taman obrub i meka
  crna senka; drugi nivo krem-beo sa crnim obrubom. Na svetloj ili šarenoj pozadini natpis stoji na gruboj crnoj traci četkice.
  Natpis zauzima trećinu do polovinu širine kadra.
- **Poštenje:** natpis ne tvrdi više od skripte; sporno ide kao pitanje („THE RICHEST MAN EVER?" je pitanje koje video razrešava,
  tvrdnja bi bila laž). Naslov videa ne ponavlja frazu natpisa uz koji ide.
- Generator ume da pogreši slova. Ako sve četiri slike jednog prompta pogreše, `--redo` za taj prompt; natpis se ne dodaje u editoru.

## Kadar iz videa kao osnova

Pre pisanja pogledaj kontakt-listu (prvi frejm svakog shota iz `shots/`). Kadar koji već pokazuje glavnu sliku (junak + glavna stvar
+ mesto) je najbolja osnova, jer je njegov prompt već dokazan slikom: uzmi njegove `SUBJECT`/`SETTING`/`LIGHT` blokove, a promeni
samo kameru (bliže, junak veći), svetlo i boje, prazan ugao i dodaj `TEXT`. Uz koncept piše `**Izvor:** shot NN`. Kadar koji
ne prolazi test iz zeca ne postaje thumbnail ni kad je lep.

## Kako se piše prompt

- Redosled blokova: `STYLE` (kanonski, `style-string.md`, doslovno prva linija), `THUMBNAIL` (jedna rečenica: jedan velik junak,
  jedan velik natpis, zasićeno, čitljivo na telefonu), `SHOT` (poenta jednom rečenicom), `SUBJECT` (lock lica + kostim obećanja +
  veličina i poza), `SUBJECT 2/3` (glavni predmet, ljudi koji gledaju), `SETTING`, `CAMERA`, `FRAME LAYOUT`, `TEXT`, `FACING`,
  `LIGHT`, `PALETTE`, `DETAIL`, `NOT IN FRAME`.
- `FRAME LAYOUT` imenuje prazan ugao kao `smooth and EMPTY, for the title`. `TEXT` ponavlja tačan natpis, raspored redova, slova i
  `spelled exactly like this, nothing else written anywhere, never touching the face`.
- `NOT IN FRAME` završava sa `extra words or letters`.
- Dužina 400–550 reči. Preciznost pre plafona, ali bez šablonskih pasusa koji ne menjaju sliku.
- Zabranjeni tokeni iz `style-string.md` važe i ovde (`photorealistic`, `4k`, `masterpiece`…).
- Samo varijanta sa natpisom: naslov je `### 6B — …` (parser traži slovo; `B` = sa tekstom). A varijanta se ne piše.

## Tačnost i filteri

- Scena se slaže sa `notes.md` epizode (zlato sirovo, ne kovanice; bez anahronih zgrada; nikad golo telo).
- Isti Flow filteri kao za shotove: [`flow-filter.md`](flow-filter.md). Pozlaćen ili polugol lik ne ide velik i spreda.

## Naslovi

Test koristi tri naslova iz `publish.md`, svaki uz svoj thumbnail. Svaki mora da prođe pravila iz [`docs/publish.md`](../publish.md):
ceo video, svi glavni likovi ili nijedan, konkretan događaj. Različiti okidači (bogatstvo, cena, spektakl, preokret).

## Slike: alat, kao kraj publish procesa

Kad je `thumbnails.md` napisan, agent u istoj sesiji pokreće:

```
node tools/flow-images.mjs episodes/<slug> --thumbnails
```

- Svaki prompt dobija **4 slike**, u zasebnom Flow projektu `<SLUG> THUMBNAILS`. Projekat epizode ostaje čist, jer vlasnik tamo
  filtrira `shotN`.
- Slike se zovu `thumb6B-1` … (u Flow-u i na disku) i **skidaju** se u `flow/` kao JPEG 1280×720, spremne za YouTube upload.
- Pregled `flow/thumbnails.html` ide koncept po koncept. Uz svaku sliku stoje natpis, ugao i naslov, plus kopija slike na
  **168×94 px** za proveru čitljivosti.
- Vlasnik bira (agent sme da predloži). Izabrani fajl iz `flow/` ide na YouTube „Test & compare".
- Prompt se šalje doslovno. Prazan red u ```text bloku je greška parsera, pa se red uklanja iz `thumbnails.md`.
- Ponovno pokretanje nastavlja posao. Prepisan prompt se generiše opet, a novi kandidati dobijaju sledeće brojeve (`thumb6B-5`…).
  Za samo neke prompte: `--only 6B,7B`, a za još četiri kandidata `--redo 8B`.
- **Nova serija posle odbijene** dobija nove brojeve koncepata (posle 1–5 ide 6–10), da se nove slike ne mešaju sa starim ni u
  Flow-u ni na disku. Stari fajlovi ostaju u `flow/`, a pregled pokazuje samo koncepte iz trenutnog `thumbnails.md`.
