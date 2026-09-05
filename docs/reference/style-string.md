# Kanonski style string

Jedan string, bez varijanti. Kopira se **doslovno** kao prva linija svakog image prompta
(`shot.image_prompt`), pre `SUBJECT` bloka. Ne parafrazira se, ne skraćuje se po shotu i ne dopunjuje
se pridevima „da bude bogatije".

```
STYLE: detailed hand-drawn 2D historical animation illustration, clean dark outlines, expressive stylized characters, layered environments, 16:9.
```

**16 reči** po kanonskom brojanju (`schemas.md` §0.6), od budžeta 90–160 za ceo image prompt.

## Zašto baš taj

`visualPromptEngine.md` i `masterPrompt.md` (oba obrisana u C12) nosili su četiri različita opisa
stila, nijedan kao gotov string za lepljenje. Izabran je onaj izveden iz `visualPromptEngine.md`
§21, iz tri razloga:

1. To je jedini opis koji dolazi sa **rangiranom** listom („Prioritize", pa „Avoid"), pa se iz njega
   može izvesti redosled reči; ostali su ravne nabrajalice bez težine.
2. To je dokument koji stvarno hrani generisanje slike — `masterPrompt.md` §7 opisuje isti stil, ali
   jednom rečju manje (bez `detailed`), a upravo ta reč blokira glavni režim otkaza kanala: prazne,
   minimalističke, stock-art kompozicije.
3. Nosi `16:9`, koje nijedan drugi opis nema, a montaža je zaključana na 1920×1080.

**Zašto je tako kratak.** Petnaestak stavki iz §21 svelo se na šest zato što se ovaj string lepi u
**svaki** shot, pa svaka njegova reč košta P1 budžet svaki put. Zadržano je samo ono što nijedan
drugi blok ne ume da kaže: medij, kvalitet linije, tretman likova, gustina okruženja, format kadra.
Sve što se ionako zadaje po kadru — kompozicija, svetlo, boja, istorijska tačnost — izbačeno je,
jer to nose `FRAME LAYOUT`, `LIGHT`, `PALETTE` i `SETTING`. Kraća konstanta znači više prostora za
ono što razlikuje jedan kadar od drugog.

## Sudar koji ovaj fajl razrešava

`tests/fixtures/storyboard.sample.json` (C01) koristi `STYLE: painterly 2D historical illustration,
warm muted palette, soft volumetric light.` — placeholder napisan pre nego što je kanon postojao.
`painterly` je u direktnoj suprotnosti sa `clean dark outlines` iz oba izvorna dokumenta. Nijedna
BLOCKING provera ne poredi style string sa kanonom, pa fixture i dalje prolazi; usklađivanje fixtura
sa ovim fajlom pripada **C06**.

## Zabranjeni stilski dodaci

Nijedan od ovih tokena ne sme da se pojavi u `STYLE` bloku ni bilo gde u image promptu:

`painterly` · `oil painting` · `watercolor` · `photorealistic` · `photo` · `3D render` · `octane` ·
`unreal engine` · `anime` · `manga` · `pixel art` · `flat vector` · `minimalist` · `stock
illustration` · `stickman` · `4k` · `8k` · `trending on artstation` · `masterpiece` · `award-winning`

Dva razloga: prva grupa menja likovni jezik kanala iz kadra u kadar, druga (`4k`, `masterpiece`, …)
su prazni booster tokeni koji troše P1 budžet ne menjajući sliku.

## Odnos prema R4

R4 (ponavljanje n-grama > 12 reči, ADVISORY) **izuzima** ovaj string pre poređenja — po definiciji
stoji identičan u svakom shotu. Izuzeće je zapisano u `schemas.md` §4.1; ovaj fajl je njegov izvor
istine, pa promena stringa ovde automatski menja i ono što R4 briše.
