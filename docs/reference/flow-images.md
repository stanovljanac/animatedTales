# Flow slike — četiri kandidata po shotu, bez ruku

Najduži ručni deo faze 07 bio je mehanički: novi projekat u Flow-u, Image · 16:9 · x4, pa za
svaki shot prompt nalepljen, poslat i dočekan. `tools/flow-images.mjs` radi taj deo sam i staje
tačno tamo gde počinje ljudski posao: **izbor najbolje slike i animacija.**

```
node tools/flow-images.mjs episodes/<slug>
```

Slika u Flow-u je besplatna (0 kredita), pa alat nema budžet koji bi ga kočio. Epizoda od 38
shotova (152 slike) traje ~10 minuta (el-dorado, nov 2026: 10,2 min); dva prompta se generišu
istovremeno.

## Jednom, pri postavljanju

Alat vozi **pravi Chrome sa zasebnim profilom** (`%LOCALAPPDATA%\AnimatedTales\flow-chrome`),
ne tvoj svakodnevni Chrome. Prvi put se u tom prozoru prijaviš u Google:

```
node tools/flow-images.mjs --login
```

Otvori se Chrome sa Flow-om; klikni „Create with Google Flow" i prijavi se nalogom sa AI Pro
pretplatom. Prijava se pamti u profilu — posle toga alat ulazi sam, i posle restarta računara.
Ako prijava jednog dana istekne, alat to sam primeti, ispiše isto uputstvo i čeka.

Ništa se ne instalira: alat je čist Node kao ostatak lanca, a Chrome je spoljni program kao
`ffmpeg`. Traži se Node 22+ (ugrađen `WebSocket`).

## Krug

1. **Pokreni alat** posle QA prolaza (`lint.mjs` exit 0) — ~10 min. Pravi Flow projekat sa imenom epizode
   (`EL DORADO`), podesi Image · 16:9 · x4 i prođe kroz sve shotove redom tajmlajna.
   Chrome prozor **sme da stoji iza drugih prozora, ali ne minimizovan**, a tab alata mora da
   ostane aktivan tab tog prozora — ni minimizovan prozor ni tab u pozadini Chrome ne iscrtava,
   pa ih alat sam vraća. U taj prozor ne klikći dok alat radi.

2. **Otvori pregled** `episodes/<slug>/flow/index.html`. Shot po shot: četiri kandidata, red
   `ACTION` iz prompta (šta treba da se vidi), dužina klipa u Flow-u i ime fajla za isporuku.
   - **klik na sliku** je otvara u Flow-u, na njenoj stranici;
   - **CLIP**: dugme „Kopiraj animation prompt" kopira prompt doslovno; dužina (4/6/8/10s) piše
     pored. Klip se, kao i do sada, snima kao `shotNN.mp4` u koren epizode;
   - **STILL**: izabranu sliku skini iz Flow-a i sačuvaj kao `shotNN.jpeg` — pokret daje montaža.

3. **Isporuka i montaža** su nepromenjene: `shotNN.mp4` / `shotNN.jpeg` u korenu epizode, pa
   skil `at-assemble`.

U Flow projektu je svaka slika preimenovana u `shotNN-k <Flow-ov naslov>` (`shot07-2 Gilded man
on lake raft`). Ime se vidi na slici i postaje ime fajla kad se slika skine iz Flow-a.

**Flow-ova pretraga nije put do slika jednog shota.** Semantička je („Head" vraća i „Woman") i
nove slike indeksira sa zakašnjenjem — zato pregled vodi pravo na svaku sliku.

## Ponovno pokretanje

Alat pamti šta je uradio u `episodes/<slug>/flow/flow.json` (projekat, media ID svake slike,
otisak prompta), pa je svako pokretanje nastavak:

| Stanje shota | Šta alat radi |
|---|---|
| gotov, prompt isti | preskače |
| gotov, prompt prepisan u QA-u | generiše ponovo; novi kandidati dobijaju sledeće brojeve (`shot07-5`…), stari ostaju u pregledu označeni kao „stari prompt" |
| nije uspeo | pokušava ponovo |
| slike gotove, ime ili fajl fali | samo dovršava ime/fajl |

Prekid (Ctrl+C, pao internet, zatvoren Chrome) ne gubi ništa: pokreni istu komandu ponovo.

```
node tools/flow-images.mjs episodes/<slug> --only 07,12     # samo ti shotovi
node tools/flow-images.mjs episodes/<slug> --redo 07        # još četiri kandidata za 07
node tools/flow-images.mjs episodes/<slug> --dry-run        # šta bi uradio, bez pregledača
```

Folder `flow/` se ne komituje (`.gitignore`): to su kandidati i stanje jedne smene, ne
artefakt epizode. Izvor istine ostaje `storyboard.json`.

## Opcije

| Opcija | Šta radi |
|---|---|
| `--only 07,12` | samo ti shotovi (prima i `7` i `07`) |
| `--redo 07` | generiši ponovo i ako je gotov |
| `--count 4` | slika po shotu, 1–4 |
| `--aspect 16:9` | `16:9`, `4:3`, `1:1`, `3:4`, `9:16` |
| `--model "Nano Banana Pro"` | model slike; bez opcije ostaje onaj koji je već izabran u Flow-u |
| `--parallel 2` | koliko promptova se generiše istovremeno, 1–4 |
| `--project "IME"` | ime novog projekta (podrazumevano slug velikim slovima) |
| `--project-url URL` | radi u postojećem projektu (npr. onom koji si ručno započeo) |
| `--new` | nov projekat i kad `flow.json` već ima jedan |
| `--no-rename` / `--no-download` | bez preimenovanja u Flow-u / bez fajlova na disku |
| `--login` | samo prijava |

Podešavanja generisanja (Image · odnos · xN · model) Flow pamti **globalno**: posle alata i tvoj
ručni rad u Flow-u kreće sa x4.

## Kad nešto pukne

Alat na kraju ispiše spisak shotova koji nisu uspeli i razlog; ponovno pokretanje pokušava
samo njih. Shot koji padne pokuša se još jednom posle 30s u istom prolazu.

- **„prompt u Flow polju nije doslovno isti"** — alat odbija da pošalje. Prompt se lepi kao
  Ctrl+V i čita nazad znak po znak; razlika znači da Flow menja tekst pri lepljenju. Ništa se
  ne šalje dok se to ne razreši u alatu — model između storyboarda i Flow-a je jedina stvar
  koju lanac ne sme da ima ([`flow-board.md`](flow-board.md)).
- **„… isteklo Ns čekanja: <element>"** — Flow je promenio interfejs. Poruka kaže koji element
  alat nije našao; popravka je u `tools/flow-images.mjs`, gde se elementi traže po onome što
  korisnik vidi (aria-label, tekst dugmeta), ne po klasama.
- **„alat ne vidi zahtev za generisanje"** — Flow je promenio mrežni format; slike su možda
  ipak napravljene, ali ih alat ne može da veže za shot.
- **Chrome se ne javlja na portu** — Chrome sa istim profilom je već otvoren bez porta za
  debagovanje. Zatvori taj prozor i pokreni alat ponovo.

## Kako radi

Tri odluke, sve tri plaćene probom na živom Flow-u (nov 2026):

1. **Pravi Chrome, ne Playwright-ov Chromium.** Google odbija prijavu u pregledač koji se
   predstavlja kao automatizovan, a Flow svako generisanje potpisuje reCAPTCHA tokenom. Chrome
   se pokreće običnom komandom sa jednim dodatkom (`--remote-debugging-port`), a klik i kucanje
   idu kroz DevTools protokol kao pravi događaji (`tools/cdp.mjs`, bez zavisnosti).
2. **Slika se vezuje za shot preko odgovora na generisanje, ne preko mreže pločica.** Mreža je
   virtuelna (crta se samo deo) i preuređuje se posle svakog preimenovanja, pa nova slika ume da
   bude van prikaza. Flow u odgovoru vraća media ID-jeve zajedno sa poslatim promptom — to je
   jedina veza koja ne zavisi od ekrana.
3. **Ime i fajl se rade na stranici slike** (`/project/<id>/edit/<mediaId>`), do koje se stiže
   navigacijom unutar aplikacije. Generisanje u toku pri tome teče dalje, pa se dok Flow radi
   jedan shot, slike prethodnog imenuju i skidaju.

Slike u `flow/` su 1K original (1376×768). Za still kadar u montaži skini izabranu iz Flow-a.
