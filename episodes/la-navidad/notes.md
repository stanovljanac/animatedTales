# la-navidad — beleške produkcije

## Narracija i alignment

`narration.mp3` **388.441s** (6:28), 72 rečenice, `small.en`, 97.9% tokena poklopljeno (1049/1071). Četiri rečenice ispod
0.85 (S18 „The Niña refused them" 0.75, S20, S40, S58), nijedna nije interpolirana. `outro_start` 375.30s (S70). Skripta je
zamrznuta, nijedna rečenica nije menjana. Početke beatova nisam proveravao `silencedetect`-om (nije rađeno u ovoj sesiji).

Pet beatova se deli unutar rečenice na granici reči iz `timing.json` (**B03, B04, B31, B32, B37**), svi su beatovi od
13–18s. Beat plan je odobren pre upisa.

## Režim: mešovit

**41 beat · 58 shotova · prosek 6.70s · 45 klipova + 13 slika (78% / 22%).** Klipovi po dužini generisanja: 5s ×2, 6s ×9,
7s ×9, 8s ×10, 9s ×5, 10s ×10. Procena Omni 1.2 cene svih klipova: ~1.056 kredita (352 s generisanja); biraj redom i
proveri budžet pre serije (`docs/reference/google-ai-plus.md`).

| Slika | Zašto |
|---|---|
| 15 Guacanagarí gleda olupinu, ruka na grudima (hold) | beat od 4.4s, tihi portret |
| 17 kapetan pokazuje dve kuće (pan-right) | beat od 3.4s |
| 22 radosno lice sa srebrnim prstenom (push) | beat od 3.6s |
| 32 tužno lice poglavice (pull) | beat od 3.3s |
| 36 četiri zanatlije sa četiri alata (pan-right) | beat od 4.3s; generator ne broji, pa je četiri alata bolja slika nego klip |
| 38 flota od sedamnaest brodova u tri reda (pan-right) | beat od 3.4s; tačan broj |
| 40 prazna plaža i krpa na koli (push) | beat od 4.1s, „no sign of houses" |
| 42 poglavica u visećoj postelji i četiri oficira (push) | beat od 4.6s |
| 48 poglavičino lice na pola u senci (push) | beat od 4.7s |
| 53 arheolog na ivici rova u sumrak (pull) | beat od 5.4s |
| 55 sivi stari brod-balvan u travi, makro (push) | beat od 3.3s |
| 57 prazna obala u sumrak sa duhom broda (pull) | zaključna držana tvrdnja; beat od 5.5s |
| 58 end kartica (hold) | uvek slika, `endcard_file: shots/shot58.jpeg` |

Klipovi koji su na ivici i prvo se proveravaju na slici: **07** (mlad mornar preuzima krmilo — maloletnik: slika mora da
ostane mala i bez lica, vidi Plan B), **13** (čamac beži ka Niñi), **20** (pet krunisanih poglavica i kruna na Kolumbovoj
glavi), **30** (top gađa trup olupine, borba na pesku — Plan B), **39** (top puca u noć), **41** (spaljeno utvrđenje, vrane,
dalji tamni oblici u travi — Plan B), **45–46** (svađa oko zlata, hvatanje za okovratnik — Plan B).
Ako slika ne drži broj (pet kruna u 20, četiri alata u 36, sedamnaest brodova u 38, tri čoveka kod kapije u 37),
ne ide u klip.

Nijedan `link_group`.

## Osa ekrana (zaključana pre pisanja promptova)

> **Španci (Kolumbo, mornari, brodovi) drže levu polovinu ekrana i gledaju/kreću se udesno, ka ostrvu. Taíno (Guacanagarí,
> meštani, kanui) drže desnu polovinu i gledaju/kreću se ulevo. Plaža ima more levo, zemlju i brda desno. Brod koji ide
> ka ostrvu plovi ulevo→udesno; brod koji odlazi (Niña, 24 i 37) plovi udesno→ulevo, ka Evropi.**

- **01, 04–07, 12–20, 25–27, 29–31, 33, 35, 42, 49–50:** Španci levo, Taíno desno; kruna ide s desna ulevo (20), pokazivanje
  ka brdima ide udesno (18, 26).
- **Izuzeci bez ose:** mape (02, 03, 43, 44), spoljašnji i noćni kadrovi na moru bez dve strane (08, 11, 14), enterijeri sa
  jednom stranom (23, 28, 45–48), savremeni kadrovi (51–56), 57 i 58 (poster).
- **Kadar 14** ima dva broda: Niña desno (posada odbija čamac), Santa María levo (nagnuta na sprudu).

## Lockovi i kontinuitet

- 5 likova (`columbus`, `guacanagari`, `crew`, `taino`, `archaeologists`), 6 lokacija (`wreck-shore`, `taino-town`,
  `ship-deck`, `taino-house`, `navidad-site`, `excavation-mound`), 4 rekvizita (`santa-maria`, `nina`, `canoe`,
  `journal`). Nijedan `scale_critical`. Lokacije stoje doslovno na početku `SETTING` linije (osim u 27, 40 i 41 gde su
  u `characters[]`), likovi i rekviziti u `SUBJECT` blokovima.
- **Tačnost perioda (1492):** nao Santa María (tri jarbola, visoka krma, crveni krst na glavnom jedru) i mala karavela Niña
  (latinska jedra); mornari u košuljama, vunenim čakširama i pletenim crvenim kapama; Kolumbo u tamnom ogrtaču kapetana;
  Taíno u pamučnim pregačama i plaštu, zlatni nakit, kanui izdubljeni iz jednog debla, okrugle kuće sa slamnatim krovom.
  Bez konkvistadorskih oklopa. Arheolozi (51–55) su savremeni, u kaki košuljama i šeširima.
- **Guacanagarí je dostojanstven**: ni „divljak" ni žrtva; ima beli pamučni plašt preko ramena (nijedan polugo lik u kadru).
- **Bez krvi i bez leševa:** brodolom je miran (mirno more, mesec, sprud); posle požara (41) u kadru su samo vrane i
  nejasni tamni oblici u travi, daleko; Plan B ih izbacuje. Borba pred poglavicom (30) je insceniran okršaj.
- **Bez dece:** „ship's boy" u 07 i 11 je drugi mornar, vitak, u kadru mali; nijedan kadar ne prikazuje dete (Flow filter).
- **Naslov** (`protagonists` u `episode.json`) pominje „Spanish Settlement" ali ne i Kolumba, pa `publish.mjs` mora da
  prođe pre naslova; ako ne prođe, naslov imenuje oba ili nijedan.

## Šta ostaje

1. **Flow:** 45 klipova + slike (15, 17, 22, 32, 36, 38, 40, 42, 48, 53, 55, 57) + end kartica (58). Slike prve, pa
   proveri brojeve: pet kruna (20), četiri alata (36), sedamnaest brodova u tri reda (38), četiri oficira (42).
2. **Pre montaže** otvori `shot58.jpeg` i potraži naslov „THE FIRST SPANISH SETTLEMENT IN THE AMERICAS WAS BUILT FROM A
   SHIPWRECK" i SUBSCRIBE dugme.
3. **Plan B / C** za 07, 30, 41, 45, 46 su u [`alternatives.md`](alternatives.md).
4. **Publish komplet** i sajt (region Caribbean, epoha Modern Era) tek posle montaže.
