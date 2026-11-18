# Thumbnail promptovi

Za svaku epizodu postoji `episodes/<slug>/thumbnails.md`: **pet koncepata**, svaki u dve varijante — **A bez teksta** i **B sa tekstom** — spremnih za lepljenje u Flow (Image · 16:9 · x4). Korisnik od pet bira tri za YouTube „Test & compare“ i uz svaku stavlja drugi naslov videa.

Razlog postojanja: thumbnailovi pravljeni uz chat model bili su puni (pet likova, piramida, pomračenje) sa naslovom preko sredine slike. Referenca koja radi su thumbnailovi buffalo-jump, emu-war i mansa-musa.

## Šta thumbnail mora da ima

1. **Jednu scenu sa jednom poentom** koja se vidi bez čitanja: stampedo na jednog lovca, ogromna ema naspram vojnika sa mitraljezom, kralj na belom konju. Ne celu priču u jednom kadru.
2. **Kontrast veličina ili očekivanja**: jedan veliki lik ili predmet i jedan veliki „problem“ naspram njega.
3. **Prazan komad neba, magle, kamena ili vode u jednom uglu** (gore levo, gore desno ili preko vrha). Tu ide natpis; ništa sa slike se ne briše. Prazan komad je u `FRAME LAYOUT`-u napisan kao `smooth and EMPTY, nothing in it`.
4. **Malo jakih boja i jedna topla tačka** koja vuče oko. Četiri palete u jednom testu moraju da se razlikuju.
5. **Čitljivost na 168×94 px.** Lice, ruke ili predmet ne idu u donji desni ugao (oznaka trajanja).

## Natpis

- **3–5 reči**, ne naslov videa. Pouka, misao ili doslovan navod lika iz skripte („I WENT BACK WITH NOTHING“, Freyle). Naslov videa kao natpis je dozvoljen samo kad je tema sama po sebi jaka, i tada je to alternativa, ne podrazumevani izbor.
- Naslov videa **ne ponavlja frazu** natpisa uz koji ide.
- Natpis je velika ručno crtana verzalna slova, jedna boja koja se razlikuje od pozadine, debeo rub, uvek u praznom uglu, na dve linije.
- Natpis ne sme da tvrdi više nego što skripta tvrdi (ne „DRAINED THE LAKE“ ako je lokva spuštena; pitanje umesto tvrdnje kad je stvar sporna).
- Generator ume da pogreši slova. Ako B napravi grešku, ne popravlja se prompt: uzme se A i natpis se dodaje u editoru.

## Kako se piše prompt

- Blokovi isti kao u storyboard-u: `STYLE` (kanonski, `style-string.md`, doslovno prva linija), `SHOT`, `SUBJECT`, `ACTION`, `SETTING`, `CAMERA`, `FRAME LAYOUT`, `FACING`, `SCREEN DIRECTION`, `LIGHT`, `PALETTE`, `DETAIL`, `NOT IN FRAME`. Lockovi likova, lokacija i rekvizita se uzimaju **doslovno iz `episode.json`**, da thumbnail liči na epizodu.
- Postoji `SHOT:` jedna rečenica koja imenuje poentu. Likovi su veliki (pola do dve trećine visine kadra), svaki sa pozom i pogledom.
- **B = A + `TEXT:` blok odmah posle `FRAME LAYOUT`** i `NOT IN FRAME` koji završava sa `any words or letters other than the title text` umesto `any text, letters, numbers, logos, watermarks`. Ništa drugo se ne razlikuje, da test poredi samo natpis.
- Dužina: 500–650 reči. Preciznost pre plafona: lockovi, brojevi i položaji se ne skraćuju.
- Zabranjeni tokeni iz `style-string.md` važe i ovde (`photorealistic`, `4k`, `masterpiece`…).

## Tačnost i filteri

- Scena se slaže sa `notes.md` epizode (osa ekrana, „nijedan Španac nije video ceremoniju“, nikad golo telo). Ako je kadar metafora (duh splava u magli), gledalac vidi ono što lik ne vidi.
- Isti Flow filteri kao za shotove: [`flow-filter.md`](flow-filter.md). Pozlaćen ili polugol lik ne ide velik i spreda; sa leđa ili u profilu, tkanina do ispod kolena, pektoral, dim preko tela.

## Naslovi

Test koristi tri naslova iz `publish.md` (opcije 1–3, svaka uz svoj thumbnail). Svaki mora da prođe pravila iz [`docs/publish.md`](../publish.md): ceo video, svi glavni likovi ili nijedan, konkretan događaj. Različite strukture, različiti okidači (preokret, pohlepa, misterija).
