# emu-war — beleške produkcije

## Narracija i alignment

`narration.mp3` **210.913s** (3:31), 42 rečenice, `small.en`, 96.4% tokena poklopljeno (560/581). Četiri rečenice ispod
0.85 (S06, S22, S27, S37), nijedna nije interpolirana. **S37** (0.56): whisper je preskočio „Emu War, and a later
newspaper called", ali trajanje od 7.0s odgovara punoj rečenici, pa je merenje pouzdano. `outro_start` 198.56s (S40,
„A war of birds, bullets and bounties"). Skripta je zamrznuta, nijedna rečenica nije menjana.

Početke beatova sam proverio `silencedetect`-om nad mp3-om (−35 dB, 0.25s). Sva odstupanja su ≤0.13s osim dva, oba
bezopasna: **B03 (S04)** — whisper stavlja „After" na 12.26s, a zvuk počinje ~12.69s, pa se slika menja ~0.4s pre reči,
u pauzi; **B15 (S19)** — zvuk počinje ~93.40s, rez je 0.3s kasno. Smeh `[chuckles]` je stvaran zvuk u narraciji: pred S20 traje
od ~97.36s, pa upada u kraj shota 15, a B16 počinje tek na prvoj reči (98.10s). Isto pred S02 (smeh ~4.3–5.06s) — kraj shota 01.

Jedan beat se deli unutar rečenice, na granici reči iz `timing.json`: **B25** na 163.333s, pred „1943" (shot 25 je prazan
put i farmeri koji čekaju, shot 26 je odbijanje na šalteru).

## Režim: mešovit

**31 beat · 32 shota · prosek 6.59s · 28 klipova + 4 slike (87.5% / 12.5%).** Klipovi po dužini generisanja: 6s ×14,
8s ×6, 10s ×8. Nijedan klip od 4s. Režim je biran iz kadra, ne iz kredita.

| Slika | Zašto |
|---|---|
| 06 tunika, kapa i fotografija na kuhinjskom stolu (push) | beat od 4.0s, držana tvrdnja „znali su šta mitraljez može"; sitni predmeti |
| 14 gomila potrošenih čaura uz top (push) | hiljade sitnih identičnih čaura nemaju šta da pokreću |
| 31 pero, pet čaura i pečatirana priznanica na ogradi (push) | zaključna držana tvrdnja „ptice, meci, nagrade" |
| 32 end kartica (hold) | uvek slika, `endcard_file: shots/shot32.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **01** (emu se okreće i odlazi, dva strelca prate cev), **04**
(četiri sitna emua na ivici šume koja se približavaju), **05** (gust tok emua kroz rupu u ogradi), **12** (top se zaglavi:
Plan B u `alternatives.md`), **13** (kamion juri dva emua), **17** (medalja na traci koja se njiše), **21** (red od deset
čaura i pero ostaju mirni dok pero i pisaljka igraju), **24** (kolona od dvadesetak emua u jednom redu) i **28**
(kaskada priznanica preko ivice pulta). Ako slika ne drži broj (dva topa u 09, deset čaura u 21, pet u 31), ne ide u klip.

Nijedan `link_group`: svaki beat ima jedan shot osim B25, a između njegova dva rez je tvrd.

## Osa ekrana (zaključana pre pisanja promptova)

> **Ljudi (vojnici, farmeri) drže levu polovinu ekrana i gledaju/kreću se udesno, ka emuima. Emui drže desnu polovinu
> i gledaju/kreću se ulevo, ka ljudima. Povlačenje vojske ide ulevo, od emua; bežanje emua ide udesno, od ljudi.**

- **01, 09–13, 15, 19–20:** top i strelci levo, emui desno; kamion juri 13 ulevo→udesno, emui beže udesno.
- **16, 18, 24, 29:** emu desno, ljudi levo; kamion odlazi ulevo (18, 29); kolona emua u 24 ide zdesna ulevo mimo Meredithe.
- **05:** emui kroz rupu u ogradi zdesna, farmer levo. **11:** farmeri guraju zdesna prema topu na levoj ivici (hajka tera
  emue ka zasedi); to je jedini kadar u kome su ljudi desno, jer geografija hajke to traži.
- **Službenici** (Pearce 07–08, činovnik 26–28) drže desnu stranu stola i gledaju ulevo, ka farmerima.
- **Izuzeci bez ose** (nisu deo sukoba): 02–04 (farma, još bez emua), 06 (kuhinja), 17 (parlament), 21 (šator), 22–23
  (pera, arhiv), 25 (put), 30–31 (ograda).

## Lockovi i kontinuitet

- 5 likova (`meredith`, `gunners`, `farmers`, `pearce`, `emus`), 4 lokacije (`wheatbelt`, `campion-dam`,
  `minister-office`, `parliament-chamber`), 3 rekvizita (`lewis-gun`, `army-truck`, `bounty-ledger`). Nijedan
  `scale_critical`. Lokacije se ne navode u `characters[]` (ne traži se S5), nego stoje doslovno na početku `SETTING`
  linije; likovi i rekviziti su u `SUBJECT` blokovima.
- **Emui su realni, ne crtani:** visoki skoro kao čovek, čupavo sivo-smeđe perje, gola plavosiva vrata. Humor izlazi iz
  kompozicije i mirnoće (01, 16, 18, 24, 29), nikad iz karikature. Vojnici i farmeri se tretiraju ozbiljno.
- **Nema krvi ni leševa.** Ubijeni emui nikad nisu u kadru; posledica je prazan pašnjak i pero (22).
- **Brojevi iz naracije stoje u promptu i u slici:** dva vojnika i dva Lewis topa i deset sanduka municije (09),
  linija od oko pedeset emua (10), zid od preko hiljadu (12), deset čaura i jedno pero (21), pet čaura i jedna
  priznanica (31, simbolično, ne broji pet). „Dvadeset hiljada" je gust tok (05), ne broj. 986/9.860/2.500/57.034 se ne crtaju.
- **Meredith i Pearce su opisani, ne portreti.** Beyer nije u kadru (23 je samo ruke i dokument bez čitljivog teksta).
- **Tačnost:** 1932, kaki uniforme sa podignutim obodom šešira, Lewis top sa okruglim šaržerom, kamion sa otvorenim
  sandukom, farmeri u radnim košuljama, pojas pšenice Zapadne Australije (crvena zemlja, mallee, sivi žičani plotovi).
  Parlament je House of Representatives iz 1932 (zelene kožne klupe).
- **Plan B:** top u 12 puca u kadru; alternativa bez pucnjave je u `alternatives.md`. `flow-risk.mjs` ne javlja signal.

## Šta ostaje

1. **Flow:** slike su napravljene alatom (4 po shotu); izaberi najbolju, pa 28 klipova (06, 14, 31, 32 se snimaju kao
   `shotNN.jpeg`). Slike prve, pa proveri brojeve pre klipova (09, 21, 31).
2. **Pre montaže** otvori `shot32.jpeg` i potraži naslov „THE WAR AGAINST BIRDS", liniju „A WAR OF BIRDS, BULLETS AND
   BOUNTIES" i SUBSCRIBE dugme.
3. **`protagonists`** u `episode.json` pre naslova: naslov ne imenuje nikog (Australia, vojnici i emui grupno) ili
   imenuje sve glavne (Meredith, Pearce), nikad jednog + deo.
4. **Publish komplet** posle montaže; chapteri idu iz `timing.json`.
5. **Sajt:** tek pri objavi (nova regija Australia; epoha Modern Era).
