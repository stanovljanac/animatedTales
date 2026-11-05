# mansa-musa — beleške produkcije

## Narracija i alignment

`narration.mp3` **218.671s** (3:38), 46 rečenica, `small.en`, 94.9% tokena poklopljeno. Četiri rečenice ispod
0.85 (S24, S29, S45, S46). **S45 je interpolirana** (whisper je nije čuo, `confidence` 0.00): to je outro
rečenica „If you like forgotten stories…". Silencedetect je pokazao da S44 završava ~210.4s i da S45 počinje
~211.0s, a `timing.json` je stavlja na 210.14s, pa end kartica (B33) kreće ~0.25s pre kraja „stayed" i ~0.9s
pre „If you like". Rez je bezopasan. `outro_start` 205.34s (S44). Skripta je zamrznuta.

Početke beatova sam proverio `silencedetect`-om; sva odstupanja su ≤0.23s, osim interpolirane S45.

Dva reza unutar rečenice, oba na granici reči iz `timing.json`: **S01** na 5.708s, pred „gold" (shot 01 je
kralj koji ulazi u Kairo, shot 02 zlato u rukama trgovaca), i **S43** na 199.917s, pred „Musa" (shot 32 al-Umari
stiže u Kairo, shot 33 Kairci mu pričaju).

## Režim: mešovit

**33 beata · 35 shotova · prosek 6.25s · 30 klipova + 5 slika (86% / 14%).** Klipovi po dužini generisanja: 6s
×16, 8s ×7, 10s ×7. Nijedan klip od 4s.

| Slika | Zašto |
|---|---|
| 06 emir izjahuje u susret karavanu (push) | beat od 3.6s, uvod u likove |
| 09 kamile sa džakovima zlata kroz kapiju (push) | beat od 3.6s, držana tvrdnja o zlatu |
| 20 vaga posle: zlatni mitkal naspram 22 dirhama (push) | brojevi se moraju prebrojati (četiri puta pet i dva); sitni identični novčići ne smeju da nose pokret |
| 24 Musa sam, umoran, u sumrak (push) | beat od 3.3s, tiha tvrdnja „zlato je koštalo samog Musu" |
| 35 end kartica (hold) | uvek slika, `endcard_file: shots/shot35.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **19** (vaga sa 25 dirhama u pet gomila po pet, kamera
samo klizi, novčići se ne pomeraju), **02** (zlato u rukama trgovaca, prašina), **15** (Musa sipa zlato u
ruke gomile), **18** (menjač sipa zlato u vagu), **04** (mapa, linije se crtaju), **30** (zlatni sjaj
preplavljuje kartu i povlači se) i **28** (mapar boji kralja na pergamentu). Ako slika ne drži broj (25, 22, 6),
ne ide u klip.

Nijedan `link_group`.

## Osa ekrana (zaključana pre pisanja promptova)

> **Musa i Mali drže levu polovinu ekrana i gledaju/kreću se udesno, ka Kairu i Meki. Kairo (sultan, emir,
> trgovci) drži desnu polovinu i gleda ulevo. Zapad je levo na svakoj karti. Put kući ide s desna ulevo.**

- **01–03:** karavan ulazi s leva udesno; mapa 04 vuče zlatne rute iz zapadne Afrike (levo) ka lukama (gore
  desno).
- **05–10:** logor kod piramida levo, citadela desno na brdu; emir dolazi zdesna, Musa odbija levo; u šatoru
  Musa levo, emir desno, tumač između.
- **11–14:** dvorana: sultan na prestolu desno, Musa ulazi s leva; u 14 sultan se pola diže desno, Musa kleči
  levo.
- **15–17:** Musa sipa levo, gomila prima desno; emiri primaju džakove desno.
- **25, 27, 34:** povratak ide s desna ulevo (karavan kroz klanac, karavan koji odlazi iz Kaira, Musa sa
  rasutim zlatom).
- **Izuzeci bez ose** (nisu deo sukoba): 07 (emir i al-Umari, oba sa kairske strane), 18–23 (al-Umari,
  al-Maqrizi, moderni istoričar, vage), 28–31 (Katalonski atlas, karte), 32–33 (al-Umari u Kairu).

## Lockovi i kontinuitet

- 6 likova (`mansa-musa`, `al-nasir`, `mamluk-emir`, `interpreter`, `al-umari`, `mali-pilgrims`), 2 lokacije
  (`cairo-bazaar`, `sultan-hall`), 3 rekvizita (`balance-scale`, `gold-sacks`, `catalan-atlas`). Nijedan
  `scale_critical`.
- **Musa je dostojanstven kralj, bez karikature i bez „egzotičnog" kiča:** višeslojni beli i indigo pamuk,
  turban sa zlatnom trakom, zlatne minđuše. U 24 i 26 odeća je tanja i prašnjava; lock ostaje isti.
- **Brojevi iz naracije stoje u promptu i u slici:** 25 dirhama u pet gomila po pet (19), 22 dirhama u četiri
  gomile po pet i jednoj od dva (20), šest dirhama u redu (22), jedan zlatni mitkal (19, 20). „Dvanaest
  godina" i „najbogatiji čovek" se ne crtaju kao činjenice, nego kao tvrdnje al-Umarija.
- **Zlato je sirovo, ne kovanice:** nugeti i prašina u džakovima (02, 09, 15, 16, 34).
- **Moderni istoričar (23) je generički lik**, ne portret Warrena Schultza.
- **Tačnost:** Kairo je mamelučki grad (citadela, minareti, bazari, piramide u Gizi u daljini), nikakav
  kasniji osmanski izgled. Sahelska odeća, karavani na kamilama i konjima. Brojke pratilaca iz hronika (12.000
  robova, 80 kamila) se ne crtaju kao broj.

## Šta ostaje

1. **Flow:** 30 klipova + slike (06, 09, 20, 24) + end kartica (35). Slike prve, pa proveri brojeve pre
   klipova (25 i 22 dirhama).
2. **Pre montaže** otvori `shot35.jpeg` i potraži naslov „A KING GAVE AWAY SO MUCH GOLD THAT CAIRO'S PRICE
   FELL" i SUBSCRIBE dugme.
3. **`protagonists`** u `episode.json` pre naslova: naslov ne imenuje nikog (kralj) ili imenuje sve glavne
   (Mansa Musa, al-Nasir), nikad jednog + deo.
4. **Publish komplet** posle montaže; **S45 je interpolirana**, pa chapter za outro treba proveriti po
   `silencedetect`-u (~211.0s).
5. **Sajt:** tek pri objavi (nova regija Africa; epoha Middle Ages).
