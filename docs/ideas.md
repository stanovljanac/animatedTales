# Ideje — bodovana lista

Bodovano po `docs/reference/scoring-rubric.md`. Svaka ideja ima 10 ocena (0–5), normalizovanih
u skor od 100 po formuli `zbir(težina × ocena) / 95 × 100`. Rubrika je izvor istine za to
**šta koja ocena znači** — ovde stoje samo brojevi i po jedna rečenica obrazloženja za ukupan skor.

**Pojasevi:** `radi odmah` ≥ 80 · `oštriji ugao` 65–79.9 · `parkiraj` < 65.

**Status:** `idea` (nebodovana) · `scored` (bodovana, čeka izbor) · `done` (epizoda postoji u `episodes/`,
ostaje u tabeli ali **ispada iz rangiranja**) · `rejected` (odbačena ili spojena) · `re-aim` (epizoda je potrošila deo materijala, ideja je preusmerena na ostatak — stari skor više ne opisuje priču, mora da se preboduje, i **ne učestvuje u rangiranju** dok se to ne uradi).

---

## Top 5 kandidata

Najviše rangirane ideje koje **nisu** `done`. Ove četiri postojeće epizode su izuzete iz rangiranja:
`marathon` (#2), `croesus` (#3), `night-when-rome-almost-fell` (#4), `polynesian-navigation` (#11).

1. **#26 — The God Who Lost His Hand to a Wolf** — **91.6** · radi odmah
   Jedina ideja bez ocene ispod 4 — ista slika nosi i prvu rečenicu i tambnejl, a produkcija je nekoliko likova na jednoj lokaciji.
2. **#16 — The Ancient Machine That Shouldn't Exist** — **90.0** · radi odmah
   Materijalni dokaz koji se može pokazati u kadru, plus vizuelni uređaji koje nijedna druga ideja nema — ronioci, presek zupčanika, nebo.
3. **#8 — The Corpse Put on Trial** — **89.5** · radi odmah
   Najveći odnos šoka i cene: apsurd koji je doslovno tačan, odigran u jednoj prostoriji sa šačicom likova.
4. **#28 — The Egyptian God Who Was Cut Into Pieces** — **88.9** · radi odmah
   Kompletan filmski luk (ubistvo → potraga → vaskrsenje) sa najširim rasponom kadrova u celoj listi.
5. **#9 — The City That Danced Until People Collapsed** — **88.9** · radi odmah
   Premisa koju svako razume bez ijednog imena i datuma, sa preokretom iz apsurda u horor i nerešenim uzrokom koji drži do kraja.

---

## Pokrivenost regiona i epoha

Cilj od 2026-11-04: **popuniti svaku regiju i svaku epohu sajta bar jednom**, pa tek onda birati ono što
je najtraženije i najgledanije. Stanje sajta (karta ima 10 priča): Grčka 3, Egipat i Bliski istok 3, Italija 1,
Sever 1, Azija 1, Pacifik 1. **Nedostaju regije:** Severna Amerika, Južna Amerika, Afrika, Australija.
Epohe: Mit i legenda 2, Drevni svet 2, Klasična antika 6, **Srednji vek 0, Moderno doba 0.**

Sve četiri nedostajuće regije i obe prazne epohe su popunjene epizodama u radu (faza 01→04, narraciju snima
korisnik; na sajt idu tek kad se objave, ostaju `soon`):

| Regija | Epizoda | Epoha |
|---|---|---|
| Južna Amerika | `#34 el-dorado` (Muisca, Kolumbija) | Moderno doba (c. 1537) |
| Severna Amerika | `#36 hero-twins` (Popol Vuh, K'iche' Maje) | Mit i legenda |
| Afrika | `#35 mansa-musa` (Mali, Kairo 1324) | Srednji vek |
| Australija | `#10 emu-war` (Zapadna Australija 1932) | Moderno doba |

Napomene: Mezoamerika je na svetskoj karti Severna Amerika (korisnik je Maje pomenuo uz Južnu); `#33
three-underworlds` (čerokijska priča) je takođe severnoamerička, ali sajt vodi jednu regiju po epizodi, pa se
odlučuje kad se epizoda objavi. Sajt traži četiri nove regije (`south-america`, `north-america`, `africa`,
`australia`) u `REGIONS` i unose u `EVENTS`. **Dalje** (kad se prvi krug objavi): ono što je
najtraženije i najgledanije, uz neistražene ideje iz Claudeovog znanja — Inke (Atahualpin otkup), Tenočtitlan
(1325), Sundiata, Duga zmija. Ni jedna od njih nije bodovana.

**Dopuna 2026-11-16:** korisnik je tražio još četiri skripte (dve o stvarnoj bici ili važnom događaju, jedna
basna/mit, jedna o svakodnevnom životu nekada) i primetio da kanal nema priču iz 1492. ni iz novog veka. Dodate su
(faza 01→04, `done`, narraciju snima korisnik): `#37 la-navidad` (Karibi, 1492–93, Moderno doba — jedina iz same
1492; `el-dorado` je iz c. 1537), `#38 ashoka-kalinga` (Indija, c. 261. p.n.e., Drevni svet), `#39 rostam-and-sohrab`
(Iran, Mit i legenda) i `#40 buffalo-jump` (Velike ravnice, Alberta; praksa od ~5.800 godina do sredine 1800-ih;
Drevni svet). Sajt za njih traži regije kojih još nema (Južna Azija, Iran/Persija, Karibi) ili se uklapaju u
postojeće (Severna Amerika za ravnice); odlučuje se pri objavi, kao i za `#33`.

---

## Rangirana tabela

Poređano po ukupnom skoru opadajuće. Redovi sa `done` učestvuju u tabeli radi kalibracije,
ali ne učestvuju u rangiranju i ne mogu ući u listu kandidata.

Legenda kolona: **M1** snaga hooka (×3) · **M2** naslov + tambnejl (×3) · **M3** luk u 5 min (×2) ·
**M4** iznenađenje (×2) · **M5** emotivni ulog (×2) · **M6** vizuelna raznovrsnost (×2) ·
**M7** originalnost (×1.5) · **M8** jasnoća (×1.5) · **M9** istorijska čvrstina (×1) ·
**M10** produkciona cena (×1, **invertovano: 5 = jeftino, 0 = skupo**).

| # | Naslov | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | Ukupno /100 | Pojas | Status |
|---:|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---|---|
| 26 | The God Who Lost His Hand to a Wolf | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 5 | **91.6** | radi odmah | `scored` |
| 16 | The Ancient Machine That Shouldn't Exist | 5 | 5 | 5 | 5 | 3 | 5 | 3 | 4 | 5 | 4 | **90.0** | radi odmah | `scored` |
| 8 | The Corpse Put on Trial | 5 | 5 | 5 | 5 | 3 | 4 | 5 | 3 | 4 | 5 | **89.5** | radi odmah | `scored` |
| 28 | The Egyptian God Who Was Cut Into Pieces | 5 | 5 | 4 | 4 | 5 | 5 | 4 | 3 | 4 | 4 | **88.9** | radi odmah | `scored` |
| 9 | The City That Danced Until People Collapsed | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 3 | 2 | **88.9** | radi odmah | `scored` |
| 31 | The Pharaoh Whose Murder the Court Never Mentioned | 5 | 4 | 5 | 4 | 5 | 5 | 3 | 4 | 5 | 3 | **87.9** | radi odmah | `done` |
| 6 | The Emperor Who Was Killed by His Own Guards | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | **86.8** | radi odmah | `scored` |
| 3 | The King Who Accidentally Started a War by Losing His Sandals | 5 | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 3 | 3 | **85.3** | radi odmah | `done` |
| 25 | Medusa Wasn't Always a Monster | 5 | 5 | 4 | 5 | 4 | 4 | 2 | 4 | 3 | 4 | **84.2** | radi odmah | `scored` |
| 21 | ~~Why Zeus Was Terrified of His Own Children~~ → Titanomahija (preusmerena) | 5 | 5 | 5 | 4 | 4 | 4 | 2 | 3 | 4 | 4 | **83.7** | — | `re-aim` |
| 32 | The Man Crowned to Die in the King's Place | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 3 | 4 | 4 | **83.7** | radi odmah | `done` |
| 30 | The Giant Who Tried to Steal the Sun | 5 | 5 | 4 | 4 | 3 | 4 | 5 | 3 | 3 | 4 | **83.2** | radi odmah | `scored` |
| 10 | The War Against Birds | 5 | 5 | 5 | 5 | 2 | 3 | 2 | 5 | 4 | 3 | **81.6** | radi odmah | `done` |
| 39 | The Hero Who Killed His Own Son Without Knowing It | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 3 | 4 | 3 | **81.6** | radi odmah | `done` |
| 11 | How Humans Learned to Cross Entire Oceans Without a Compass | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | **81.1** | radi odmah | `done` |
| 23 | Why Hades Let Persephone Leave | 4 | 4 | 5 | 3 | 5 | 5 | 2 | 4 | 4 | 4 | **81.1** | radi odmah | `scored` |
| 36 | Two Brothers Beat the Maya Lords of Death at Their Own Game | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 3 | 3 | 3 | **80.5** | radi odmah | `done` |
| 22 | The Man Who Stole Fire From the Gods | 4 | 4 | 5 | 3 | 5 | 4 | 1 | 5 | 4 | 5 | **80.0** | radi odmah | `scored` |
| 34 | El Dorado Was Never a City. It Was a Man on a Raft | 4 | 5 | 4 | 4 | 3 | 5 | 3 | 4 | 3 | 3 | **79.5** | oštriji ugao | `done` |
| 40 | How Hunters With No Horse and No Gun Herded Bison Off a Cliff | 4 | 4 | 4 | 4 | 3 | 5 | 4 | 4 | 4 | 3 | **78.9** | oštriji ugao | `done` |
| 1 | The Emperor Who Fought a War Against the Ocean | 5 | 5 | 4 | 3 | 3 | 5 | 3 | 4 | 3 | 1 | **78.4** | oštriji ugao | `scored` |
| 19 | The Disease That Changed Medieval Europe | 4 | 4 | 4 | 4 | 5 | 4 | 2 | 4 | 5 | 2 | **77.9** | oštriji ugao | `scored` |
| 37 | The First Spanish Settlement in the Americas Was Built From a Shipwreck | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | **76.8** | oštriji ugao | `done` |
| 33 | The Rule Nobody Could Keep in the Land of the Dead | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 3 | 4 | 3 | **75.8** | oštriji ugao | `done` |
| 27 | How Odin Traded an Eye for Knowledge | 4 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 4 | 5 | **75.3** | oštriji ugao | `scored` |
| 29 | The God Who Became a Cow to Escape | 4 | 4 | 4 | 3 | 3 | 4 | 5 | 3 | 3 | 4 | **74.7** | oštriji ugao | `scored` |
| 38 | The Emperor Who Won a War and Carved His Regret in Stone | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 3 | 5 | 3 | **74.7** | oštriji ugao | `done` |
| 13 | The Civilization That Built a City Before Farming? | 4 | 5 | 3 | 4 | 2 | 4 | 3 | 4 | 3 | 4 | **74.2** | oštriji ugao | `scored` |
| 4 | The Night Rome Nearly Lost Everything | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 1 | **74.2** | oštriji ugao | `done` |
| 7 | The Battle Where Elephants Changed Sides | 4 | 5 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 0 | **73.7** | oštriji ugao | `scored` |
| 35 | A King Gave Away So Much Gold That Cairo's Price Fell | 4 | 4 | 4 | 4 | 3 | 4 | 2 | 4 | 4 | 3 | **73.7** | oštriji ugao | `done` |
| 2 | The Battle Won by a Dead Man's Army | 4 | 4 | 4 | 3 | 4 | 4 | 2 | 4 | 4 | 1 | **71.6** | oštriji ugao | `done` |
| 12 | The Invention That Made Civilization Count Everything | 4 | 3 | 4 | 4 | 2 | 3 | 4 | 4 | 4 | 5 | **71.6** | oštriji ugao | `scored` |
| 24 | The Punishment of Tantalus: Food He Could Never Eat | 4 | 4 | 4 | 3 | 3 | 2 | 3 | 4 | 3 | 5 | **70.0** | oštriji ugao | `scored` |
| 20 | The Horses That Helped Decide China's History | 4 | 3 | 4 | 4 | 2 | 3 | 5 | 3 | 4 | 3 | **69.5** | oštriji ugao | `done` |
| 5 | The General Who Won by Making His Army Look Bigger | 4 | 4 | 4 | 3 | 3 | 4 | 2 | 4 | 4 | 0 | **68.4** | oštriji ugao | `scored` |
| 18 | The Civilization That Turned Water Into Power | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 4 | 3 | **65.3** | oštriji ugao | `scored` |
| 14 | Why Did the Bronze Age World Collapse? | 4 | 4 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 1 | **64.7** | parkiraj | `scored` |
| 17 | How Salt Helped Build Empires | 3 | 3 | 4 | 3 | 2 | 3 | 3 | 4 | 4 | 4 | **63.7** | parkiraj | `scored` |
| 15 | How a Tiny Invention Changed the World: The Stirrup | 3 | 3 | 4 | 4 | 1 | 3 | 4 | 3 | 3 | 4 | **62.6** | parkiraj | `scored` |

### Provera zbira

Zbir težina = 3 + 3 + 2 + 2 + 2 + 2 + 1.5 + 1.5 + 1 + 1 = **19**. Maksimum sirovo = 19 × 5 = **95**,
formula ga skalira na 100. Primer, red #26: (3×5)+(3×5)+(2×5)+(2×4)+(2×5)+(2×4)+(1.5×4)+(1.5×4)+(1×4)+(1×5)
= 15+15+10+8+10+8+6+6+4+5 = **87** → 87 / 95 × 100 = **91.6**.

---

## Ideje — priče i kuke

Originalna priča i kuka po ideji, sažete ali ne obrisane. **Tekst kuke je jedini deo koji
direktno ulazi u produkciju — prenet je doslovno i ne sme se menjati.** Redosled je po rednom
broju ideje, ne po skoru.

### Kategorija 1 — ljudi, moć, rat i istorijski događaji

#### #1 — The Emperor Who Fought a War Against the Ocean

`status: scored` · **78.4** · oštriji ugao · izvorna oznaka: kat. 1 #1

Ocene M1–M10: 5 / 5 / 4 / 3 / 3 / 5 / 3 / 4 / 3 / 1 — sirovo 74.5 / 95.

Story: In 480 BCE, Xerxes invaded Greece with an enormous army and famously ordered engineers to build a bridge of ships across the Hellespont. When a storm destroyed it, Xerxes reportedly had the sea itself punished before ordering a new bridge constructed.

Hook: “What do you do when the ocean destroys your army’s bridge? If you’re Xerxes, you punish the ocean.”

Zašto ovaj skor: Apsurdna a zabeležena slika cara koji kažnjava more nosi hook i tambnejl sama od sebe, ali priča vuče za sobom celu invaziju 480. p.n.e. — mostovi od brodova i vojska od stotinu hiljada su najskuplje što pipeline može da traži.

#### #2 — The Battle Won by a Dead Man's Army

`status: done` · **71.6** · oštriji ugao · izvorna oznaka: kat. 1 #2 · `episodes/marathon`

Ocene M1–M10: 4 / 4 / 4 / 3 / 4 / 4 / 2 / 4 / 4 / 1 — sirovo 68 / 95.

Story: At the Battle of Marathon, the Athenians defeated a much larger Persian force, and the aftermath became part history, part legend. The story follows how an outnumbered city-state turned a seemingly impossible situation into a victory.

Hook: “How did an army of citizens defeat one of the most powerful empires on Earth?”

Zašto ovaj skor: Klasičan underdog sa jasnim ulogom, ali tema je najzasićenija u niši i jezgro je masovna bitka — proizvedeno kao `episodes/marathon`.

#### #3 — The King Who Accidentally Started a War by Losing His Sandals

`status: done` · **85.3** · radi odmah · izvorna oznaka: kat. 1 #3 · `episodes/croesus`

Ocene M1–M10: 5 / 4 / 5 / 5 / 4 / 4 / 4 / 4 / 3 / 3 — sirovo 81 / 95.

Story: Croesus of Lydia is surrounded by stories about wealth, prophecy and disastrous decisions. The strongest version centers on his attempt to interpret an oracle before attacking Persia—and how a deliberately ambiguous prophecy helped destroy his kingdom.

Hook: “A king asked an oracle what would happen if he attacked Persia. The answer sounded perfect—until he discovered what it actually meant.”

Zašto ovaj skor: Dvosmisleno proročanstvo je savršen kontraintuitivan payoff u pet minuta i najbolji odnos snage i cene u kategoriji — proizvedeno kao `episodes/croesus`.

#### #4 — The Night Rome Nearly Lost Everything

`status: done` · **74.2** · oštriji ugao · izvorna oznaka: kat. 1 #4 · `episodes/night-when-rome-almost-fell`

Ocene M1–M10: 4 / 4 / 4 / 4 / 4 / 4 / 3 / 4 / 3 / 1 — sirovo 70.5 / 95.

Story: In 390 BCE, Gauls under Brennus reached Rome and reportedly captured much of the city, with the Capitoline Hill becoming the final refuge. Later Roman tradition transformed the episode into a story of survival, vigilance and humiliation.

Hook: “Before Rome ruled an empire, another army marched into Rome and nearly destroyed it.”

Zašto ovaj skor: Obrt „superSila je jednom skoro nestala“ radi bez predznanja, ali invazija i opsada znače mase u skoro svakoj sceni — proizvedeno kao `episodes/night-when-rome-almost-fell`.

#### #5 — The General Who Won by Making His Army Look Bigger

`status: scored` · **68.4** · oštriji ugao · izvorna oznaka: kat. 1 #5

Ocene M1–M10: 4 / 4 / 4 / 3 / 3 / 4 / 2 / 4 / 4 / 0 — sirovo 65 / 95.

Story: At the Battle of Gaugamela, Alexander the Great faced a Persian army vastly larger than his own. His tactical maneuvering created an opening in the Persian line and turned an intimidating numerical disadvantage into one of history’s most famous victories.

Hook: “Alexander was massively outnumbered. So how did he make the larger army fight exactly where he wanted?”

Zašto ovaj skor: Taktički obrt je jak i izvori su čvrsti, ali Gaugamela je najskuplja moguća scena (dve ogromne vojske, konjica, kola) i Aleksandar je tema o kojoj svi već imaju video.

#### #6 — The Emperor Who Was Killed by His Own Guards

`status: scored` · **86.8** · radi odmah · izvorna oznaka: kat. 1 #6

Ocene M1–M10: 5 / 5 / 5 / 4 / 4 / 4 / 3 / 4 / 4 / 4 — sirovo 82.5 / 95.

Story: Roman emperors repeatedly faced danger from the very soldiers who were supposed to protect them. The murder of Caligula in 41 CE provides a particularly dramatic story of palace intrigue, conspiracy and the Praetorian Guard.

Hook: “The most dangerous people around a Roman emperor weren't his enemies. They were the men guarding his door.”

Zašto ovaj skor: Protivrečnost „telohranitelji kao dželati“ daje hook, naslov i tambnejl odjednom, a ubistvo se odigrava u hodniku sa šačicom likova — najjača kombinacija udarca i niske cene u kategoriji 1.

#### #7 — The Battle Where Elephants Changed Sides

`status: scored` · **73.7** · oštriji ugao · izvorna oznaka: kat. 1 #7

Ocene M1–M10: 4 / 5 / 4 / 4 / 3 / 4 / 3 / 3 / 4 / 0 — sirovo 70 / 95.

Story: At the Battle of Zama in 202 BCE, Scipio Africanus faced Hannibal, one of antiquity’s greatest commanders. Roman tactics exploited weaknesses in Hannibal’s elephant charge, helping decide the battle and the future of Carthage.

Hook: “Hannibal brought elephants to destroy Rome's army. Instead, the Romans turned the elephants into a weakness.”

Zašto ovaj skor: Slonovi su tambnejl klase 5 i obrt (oružje postaje slabost) je čist, ali priča traži uvod u punske ratove i cela se odigrava na bojnom polju sa masama.

#### #8 — The Corpse Put on Trial

`status: scored` · **89.5** · radi odmah · izvorna oznaka: kat. 1 #8

Ocene M1–M10: 5 / 5 / 5 / 5 / 3 / 4 / 5 / 3 / 4 / 5 — sirovo 85 / 95.

Story: In 897 CE, Pope Formosus was exhumed, dressed in papal robes and subjected to a posthumous trial known as the Cadaver Synod. The bizarre spectacle was part of a brutal political struggle inside medieval Rome.

Hook: “He had already been dead for months when his enemies decided to put him on trial.”

Zašto ovaj skor: Leš u papskoj odori na optuženičkoj klupi je istovremeno hook, naslov i tambnejl, sve staje u jednu prostoriju sa nekoliko likova, a spuštaju je samo hladan emotivni ulog i potreba da se objasni papska politika 9. veka.

#### #9 — The City That Danced Until People Collapsed

`status: scored` · **88.9** · radi odmah · izvorna oznaka: kat. 1 #9

Ocene M1–M10: 5 / 5 / 5 / 5 / 4 / 4 / 4 / 5 / 3 / 2 — sirovo 84.5 / 95.

Story: In Strasbourg in 1518, hundreds of people reportedly became caught in an unexplained episode of compulsive dancing. Contemporary accounts exist, but historians still debate the cause, from psychological mechanisms to environmental factors.

Hook: “One woman started dancing in the street—and then hundreds of people couldn't stop.”

Zašto ovaj skor: Premisa se razume bez ijednog datuma i imena, počinje kao apsurd a završava kao horor sa nerešenim uzrokom; jedino je koče gomile plesača u kadru i to što uzrok ostaje sporan.

#### #10 — The War Against Birds

`status: done` · **81.6** · radi odmah · izvorna oznaka: kat. 1 #10 · `episodes/emu-war`

Ocene M1–M10: 5 / 5 / 5 / 5 / 2 / 3 / 2 / 5 / 4 / 3 — sirovo 77.5 / 95.

Story: In 1932, Australia launched a military operation against emus damaging crops in Western Australia. Soldiers with machine guns struggled to control the highly mobile birds, turning an agricultural problem into one of history’s strangest military episodes.

Hook: “Australia sent soldiers with machine guns to defeat a bird. The birds won.”

Zašto ovaj skor: Premisa i poenta („ptice su pobedile“) rade bez ikakvog konteksta, ali tema je internet-mem sa desetinama postojećih videa i vizuelno je zaključana u isti pejzaž bez emotivnog uloga.

**Proizvedena kao `episodes/emu-war` (2026-11-04)** u okviru cilja da se popuni svaka regija sajta (Australija). Kuka je prenesena doslovno; telo joj odgovara pitanjem „Ko je pobedio?" jer izvori ne daju jedinstven odgovor (novine iz 1953. kažu da su ptice pobedile, one iz 1935. da su mitraljezi ipak upalili, a ono što je stvarno proredilo emue bila je nagrada po glavi). **Izvori su samo sekundarni** — Wikipedia *Emu War* i tri lokalne ili popularne strane; Trove, Hansard i Meredithov izvestaj nisu mogli da se otvore, a brojke (50 do 500 ubijenih do 8. novembra; 986 koje tvrdi Meredith; 20.000 emua bez izvora) se ne slažu i u skripti su dati kao raspon ili kao tvrdnja. Meredithov citat o „diviziji sa nosivošću metaka kao ove ptice" potiče iz novina iz 1953. i u skripti stoji kao „is quoted as saying". Skor nije preračunat.

#### #31 — The Pharaoh Whose Murder the Court Never Mentioned

`status: done` · **87.9** · radi odmah · izvorna oznaka: dodata 2026-10-18, van originalnih 30 · `episodes/harem-conspiracy`

Ocene M1–M10: 5 / 4 / 5 / 4 / 5 / 5 / 3 / 4 / 5 / 3 — sirovo 83.5 / 95.

Story: Around 1155 BCE, Tiye, one of the wives of Ramesses III, organized a plot inside the royal harem to kill the king and crown her son instead of the chosen heir. The surviving court records list the conspirators, their punishments and even two judges mutilated for partying with the accused women — but never say what happened to the king. In 2012 a CT scan found his throat cut under the linen, and DNA tied a nameless, goatskin-wrapped mummy from the same tomb to him as a likely son.

Hook: “Three thousand years ago, an Egyptian court sentenced more than thirty people for a plot against their pharaoh. The record of their trial survives — and it never says what happened to the king.”

Zašto ovaj skor: Zapis suda koji ćuti baš o onome što gledalac hoće da zna nosi hook, a CT snimak i bezimena mumija u kozjoj koži daju dva obrta koja se ne mogu pogoditi; spuštaju ga to što je „mumija koja vrišti“ već poznata na YouTube-u i sudske scene sa više figura.

Dodata van C03 liste, u sesiji u kojoj je izabrana: epizoda od slika (`render_mode: "still"`), tema se birala slobodno, van top 5 i van Greek Gods serije. Bodovano po istoj rubrici; M10 meri animaciju kao i za ostale, iako epizoda od slika ne troši kredite.

#### #37 — The First Spanish Settlement in the Americas Was Built From a Shipwreck

`status: done` · **76.8** · oštriji ugao · izvorna oznaka: dodata 2026-11-16, van originalnih 30 · `episodes/la-navidad`

Ocene M1–M10: 4 / 4 / 4 / 4 / 3 / 4 / 4 / 4 / 4 / 3 — sirovo 73 / 95.

Story: On Christmas Eve 1492 the helmsman of the *Santa María* left the tiller to a ship's boy and the current set the ship on a sandbank off Hispaniola; the master fled in the boat, and the cacique Guacanagarí's people emptied the wreck in a few hours. Columbus called the loss "a piece of good fortune", built a fort from her timbers, named it La Navidad and left 39 men in it; when he returned in November 1493 it had burned to the ground and nobody was alive. Nobody has proved where it stood — a burned structure on a mound at En Bas Saline, Guacanagarí's town, is "the most likely candidate".

Hook: “The first Spanish settlement in the Americas was built from a shipwreck. Within a year, nobody who lived in it was alive.”

Zašto ovaj skor: Jedna slika (brod na boku na grebenu, tvrđava od njegovih dasaka) nosi i hook i naslov, a obrt „katastrofa je bila sreća" Kolumbovim sopstvenim rečima prevrće postavku; spuštaju je to što je Kolumbo jedna od najispričanijih ličnosti, što priča o ljudima u tvrđavi počiva na jednom svedočenju tainske strane preneto preko Španaca i što mesto nije dokazano.

Dodata van C03 liste, u sesiji u kojoj je izabrana (2026-11-16): korisnik je tražio četiri nove skripte — dve o stvarnoj bici ili važnom događaju, jednu basnu/mit i jednu priču o tome kako su ljudi nekada radili ono što je danas normalno — i primetio da kanal nema nijednu priču od 1492. ili novog veka, pa treba bar jedna iz tog perioda; temu je birao Claude. Kategorija 1 jer je jezgro događaj sa lice (Kolumbo, Guacanagarí). **Premisa ispravljena:** „prvo evropsko naselje u Americi" je netačno (Norvežani, L'Anse aux Meadows, oko 1000), tačno je „prvo špansko". Čitan je Kolumbov dnevnik u Markhamovom prevodu (Hakluyt 1893) i Čankino pismo o drugom putovanju, uz Florida Museum i Euronews (12. 10. 2026); Gutenberg nije radio. Broj ljudi se razlikuje (39 po dnevniku, 44 po zvaničnoj listi, 36 u Wikipediji) — skripta kaže „thirty-nine, by his own count". **Popularnost nije izmerena brojkama.**

#### #38 — The Emperor Who Won a War and Carved His Regret in Stone

`status: done` · **74.7** · oštriji ugao · izvorna oznaka: dodata 2026-11-16, van originalnih 30 · `episodes/ashoka-kalinga`

Ocene M1–M10: 4 / 4 / 4 / 4 / 3 / 4 / 3 / 3 / 5 / 3 — sirovo 71 / 95.

Story: In his eighth year as king, around 261 BCE, Ashoka of the Mauryan Empire conquered Kalinga on India's east coast. No account of the fighting survives; what does is his own Rock Edict 13, which counts 150,000 deported and 100,000 killed and says he feels "deep remorse" — while still keeping his army and warning the forest peoples that he can punish them. The edict was cut across the empire, but not in Kalinga itself, where two other edicts speak to his officers and do not mention the war; the script, Brahmi, was forgotten, and James Prinsep deciphered it in 1837.

Hook: “Around 261 BCE, an Indian emperor won a war, and then had his regret carved into rock.”

Zašto ovaj skor: Osvajač koji u kamenu sam broji žrtve nosi hook i naslov, a obrt „izvinjenje nedostaje baš u zemlji koja je platila" menja značenje cele priče; spuštaju je to što su žrtve kolektiv bez lica, što traži tri nova pojma (Maurja, Kalinga, Dhamma) i što o samom ratu ne postoji nijedan opis.

Dodata van C03 liste, u sesiji u kojoj je izabrana (2026-11-16): jedna od dve „istorijska bitka ili bitan događaj" koje je korisnik tražio; prva priča iz Južne Azije na kanalu. Kategorija 1. Čitan je pravi tekst: Dhammikin prevod svih 14 edikata i dva kalinška edikta (accesstoinsight.org), plus Wikipedia (Kalinga War, Ashoka); drugi prevod ni moderna monografija (Thapar) nisu otvoreni. Brojke su Ashokine, ne nezavisne, i skripta to kaže jednom. Legenda o braći i „Ashoka the Fierce" (Mahavamsa) stoji u skripti jednom, označena kao kasna; priče iz Ashokavadane su izostavljene jer ih edikti ne potvrđuju. **Popularnost nije izmerena brojkama.**

### Kategorija 2 — civilizacije i istorijske transformacije

#### #11 — How Humans Learned to Cross Entire Oceans Without a Compass

`status: done` · **81.1** · radi odmah · izvorna oznaka: kat. 2 #1 · `episodes/polynesian-navigation`

Ocene M1–M10: 5 / 4 / 4 / 4 / 3 / 4 / 4 / 4 / 4 / 4 — sirovo 77 / 95.

Story: Polynesian navigators crossed enormous stretches of the Pacific using stars, ocean swells, winds, birds and environmental patterns rather than instruments. The story follows how accumulated knowledge made seemingly impossible voyages possible.

Hook: “How do you cross an ocean when you can't see where you're going—and don't have a compass?”

Zašto ovaj skor: Pitanje koje svako razume, odgovor koji niko ne zna, i okean kao jeftina a promenljiva scenografija — proizvedeno kao `episodes/polynesian-navigation`.

#### #12 — The Invention That Made Civilization Count Everything

`status: scored` · **71.6** · oštriji ugao · izvorna oznaka: kat. 2 #2

Ocene M1–M10: 4 / 3 / 4 / 4 / 2 / 3 / 4 / 4 / 4 / 5 — sirovo 68 / 95.

Story: Early Mesopotamian writing is strongly associated with administration, accounting and record keeping. What began as a way to track goods and obligations eventually became one of humanity’s most transformative technologies.

Hook: “The first writing wasn't a poem. It was people trying to keep track of stuff.”

Zašto ovaj skor: Obrt „prvo pismo je bilo računovodstvo“ je stvaran i priča je najjeftinija za animaciju u kategoriji, ali glinene pločice nisu tambnejl i niko konkretan ništa ne gubi.

#### #13 — The Civilization That Built a City Before Farming?

`status: scored` · **74.2** · oštriji ugao · izvorna oznaka: kat. 2 #3

Ocene M1–M10: 4 / 5 / 3 / 4 / 2 / 4 / 3 / 4 / 3 / 4 — sirovo 70.5 / 95.

Story: Göbekli Tepe in modern Türkiye contains monumental structures dating to roughly 9600 BCE, challenging older assumptions about the relationship between monumental construction, organized society and agriculture.

Hook: “What if humans started building enormous monuments before they had cities?”

Zašto ovaj skor: Megaliti su prvoklasan tambnejl i pitanje je jako, ali priča nema rasplet — završava se otvorenim tumačenjem, bez ijednog lika koji nešto rizikuje.

#### #14 — Why Did the Bronze Age World Collapse?

`status: scored` · **64.7** · parkiraj · izvorna oznaka: kat. 2 #4

Ocene M1–M10: 4 / 4 / 3 / 3 / 3 / 4 / 3 / 2 / 3 / 1 — sirovo 61.5 / 95.

Story: Around the end of the Bronze Age several major eastern Mediterranean and Near Eastern societies experienced dramatic disruption. The causes remain debated and likely involved multiple interacting pressures rather than one catastrophe.

Hook: “Around 1200 BCE, the world of the Bronze Age began falling apart. But what actually caused it?”

Zašto ovaj skor: Pitanje je odlično, ali odgovor ne postoji, a da bi se ono uopšte postavilo treba nabrojati pet kraljevstava — najviše konteksta i najskuplje scene u kategoriji, uz luk koji se ne zatvara.

#### #15 — How a Tiny Invention Changed the World: The Stirrup

`status: scored` · **62.6** · parkiraj · izvorna oznaka: kat. 2 #5

Ocene M1–M10: 3 / 3 / 4 / 4 / 1 / 3 / 4 / 3 / 3 / 4 — sirovo 59.5 / 95.

Story: The spread and adoption of the stirrup transformed how mounted warriors could interact with horses, although its exact role in the development of medieval cavalry is more complicated than the popular “invention changed warfare overnight” narrative suggests.

Hook: “How could one small piece of equipment change the way humans fought from horseback?”

Zašto ovaj skor: Jeftina je i ima pošten obrt (uticaj je manji nego što legenda tvrdi), ali uzengija nema lice, nema uloga i nema slike koju bi neko kliknuo.

#### #16 — The Ancient Machine That Shouldn't Exist

`status: scored` · **90.0** · radi odmah · izvorna oznaka: kat. 2 #6

Ocene M1–M10: 5 / 5 / 5 / 5 / 3 / 5 / 3 / 4 / 5 / 4 — sirovo 85.5 / 95.

Story: The Antikythera mechanism, recovered from a Roman-era shipwreck, contained an extraordinary system of gears capable of modeling astronomical cycles. Its complexity shows ancient Greek technological knowledge included mechanisms far more sophisticated than expected.

Hook: “Divers pulled this machine from a shipwreck. Then scientists realized what it could calculate.”

Zašto ovaj skor: Jedina ideja u celoj listi koja ima materijalni dokaz kao tambnejl i prirodno traži uređaje koje ostale nemaju — ronioce, presek zupčanika, rendgen, nebo — uz obrt koji se ne može pogoditi.

#### #17 — How Salt Helped Build Empires

`status: scored` · **63.7** · parkiraj · izvorna oznaka: kat. 2 #7

Ocene M1–M10: 3 / 3 / 4 / 3 / 2 / 3 / 3 / 4 / 4 / 4 — sirovo 60.5 / 95.

Story: Salt was essential for food preservation, and societies developed major extraction, trade and taxation systems around it. The story follows how an ordinary mineral became an economically and politically valuable resource.

Hook: “Why was salt valuable enough that states fought, taxed and traded it?”

Zašto ovaj skor: Solidna, jeftina i tačna tema bez ijedne izražene jake strane — nema lika, nema obrta, nema slike; klasičan kandidat za parkiranje dok se ne nađe konkretan događaj kao ulaz.

#### #18 — The Civilization That Turned Water Into Power

`status: scored` · **65.3** · oštriji ugao · izvorna oznaka: kat. 2 #8

Ocene M1–M10: 3 / 3 / 4 / 3 / 3 / 4 / 3 / 3 / 4 / 3 — sirovo 62 / 95.

Story: Ancient and medieval societies developed increasingly sophisticated irrigation systems to control water and sustain dense populations. Mesopotamian canal systems show how controlling water could create prosperity—and eventually environmental problems.

Hook: “The first great civilizations had a problem: if they couldn't control the water, they couldn't survive.”

Zašto ovaj skor: Ima pravi obrt (isti kanali koji su stvorili bogatstvo zaslanili su zemlju) i dobru vizuelnu skalu, ali hook je apstraktan i kopanje kanala znači mnogo figura u kadru.

#### #19 — The Disease That Changed Medieval Europe

`status: scored` · **77.9** · oštriji ugao · izvorna oznaka: kat. 2 #9

Ocene M1–M10: 4 / 4 / 4 / 4 / 5 / 4 / 2 / 4 / 5 / 2 — sirovo 74 / 95.

Story: The Black Death devastated Eurasia in the 14th century, transforming labor, economies, communities and religious life. The story focuses on how demographic collapse changed the balance between workers and elites.

Hook: “How did a disease kill so many people that it changed the balance of power between workers and the rich?”

Zašto ovaj skor: Najviši emotivni ulog i najčvršći izvori u kategoriji, uz stvaran kontraintuitivan ishod (preživeli su postali skuplji), ali tema je izuzetno zasićena i traži mase u skoro svakoj sceni.

#### #20 — The Horses That Helped Decide China's History

`status: done` · **69.5** · oštriji ugao · izvorna oznaka: kat. 2 #10 · `episodes/heavenly-horses`

Ocene M1–M10: 4 / 3 / 4 / 4 / 2 / 3 / 5 / 3 / 4 / 3 — sirovo 66 / 95.

Story: Chinese dynasties repeatedly struggled to obtain strong warhorses from steppe regions, creating a strategic dependence on neighboring peoples and enormous economic pressure on state finances.

Hook: “One of China's biggest military problems wasn't weapons. It was finding horses strong enough to use them.”

Zašto ovaj skor: Najoriginalniji ugao u kategoriji i pravi obrt (carstvo zavisi od suseda za konje), ali nema lica, nema uloga i tambnejl je samo konj.

**Izoštrena u produkciji (2026-09-23):** opšta tema („carstvo zavisi od suseda za konje") suzena je
na jedan rat koji ima lice, ulog i kraj — **Rat za nebeske konje, 104–101. p.n.e.** Car Wu nudi zlatnog
konja, Dajuan odbija i ubija poslanika, prva vojska umire u pustinji i car joj zatvara Žadnu kapiju,
druga vojska od 60.000 skreće reku i dobija ~3.000 konja, a kroz kapiju se vraća nešto više od
10.000 ljudi. Na kraju: dva konja godišnje. Izvor je *Shiji* 123, pisan od savremenika. Tri kazne iz
obrazloženja (lice, ulog, tambnejl) ovaj ugao skida; skor 69.5 je zatečen i opisuje staru, opštu
verziju. Hook je prenet doslovno. Epizoda je planirana **samo od slika** (`render_mode: "still"`).

#### #32 — The Man Crowned to Die in the King's Place

`status: done` · **83.7** · radi odmah · izvorna oznaka: dodata 2026-10-27, van originalnih 30 · `episodes/substitute-king`

Ocene M1–M10: 5 / 4 / 4 / 5 / 4 / 4 / 4 / 3 / 4 / 4 — sirovo 79.5 / 95.

Story: When an eclipse foretold the death of the Assyrian king, his scholars enthroned a substitute, dressed him in the royal robes, read the omens over him before the sun god, and after up to a hundred days let him "go to his fate". In 671 BCE the substitute was Damqi, son of a temple official of Akkad — buried and mourned as a king, after a prophetess had told him he would take over the kingship. Two years later Esarhaddon, the king it all protected, died on the road to Egypt; and the oldest story of the ritual, from a Babylonian chronicle, ends the other way round: the king of Isin died sipping hot soup in his palace, and his gardener-substitute kept the throne for twenty-four years.

Hook: “When the moon went dark over ancient Assyria, the king's scholars had a way to save his life. They put another man on his throne — and when the danger had passed, they let that man die in the king's place.”

Zašto ovaj skor: Premisa zvuči nemoguće a zapisana je u pismima samih učenjaka („To the farmer, my lord"), a baštovan koji preživi kralja prevrće ceo ritual u poslednjem minutu; spuštaju je sedam imena iz dva sveta udaljena hiljadu godina i to što je najlepši deo priče kasna hronika, ne zapis.

Dodata van C03 liste, u sesiji u kojoj je izabrana: epizoda od slika (`render_mode: "still"`), tema se birala slobodno, van top 5 i van Greek Gods serije — korisnik je pomenuo Mesopotamiju i „kako su živeli drevni ljudi". Kategorija 2 jer je priča o praksi jedne civilizacije, ne o mitu: sve iz Asirije je savremeni zapis (SAA 10). Bodovano po istoj rubrici; M10 meri animaciju kao i za ostale, iako epizoda od slika ne troši kredite.

#### #40 — How Hunters With No Horse and No Gun Herded Bison Off a Cliff

`status: done` · **78.9** · oštriji ugao · izvorna oznaka: dodata 2026-11-16, van originalnih 30 · `episodes/buffalo-jump`

Ocene M1–M10: 4 / 4 / 4 / 4 / 3 / 5 / 4 / 4 / 4 / 3 — sirovo 75 / 95.

Story: At Head-Smashed-In in Alberta, Blackfoot hunters on foot moved herds of bison over a ten-metre cliff for nearly six thousand years: they burned the basin to draw the herds, built lanes of stone cairns over ten kilometres long, and sent young "buffalo runners" in wolf hides and calf skins to lure the cows with a lost calf's cry, while people hid behind the cairns to close the way back. The herd had to arrive as one tight pack; the horses of the 1700s, not the bison, ended it. The site's name comes from a Piikani tradition about a young man who hid under the cliff to watch.

Hook: “How do you move a herd of animals that weigh ten times what you do, run much faster than you, and have horns, when you have no horse and no rifle?”

Zašto ovaj skor: Lov bez konja i oružja pokazuje se kao veština strpljenja i poznavanja životinje, a dijagram staza, maske od vučjih koža, skrivena litica i presek sloja kostiju daju najširi raspon uređaja među novim idejama; spuštaju je to što su likovi bezimeni, što lov ostaje rekonstrukcija bez očevidaca i što deo o obredima ne sme da se popuni izmišljanjem.

Dodata van C03 liste, u sesiji u kojoj je izabrana (2026-11-16): korisnik je tražio „antičku priču o tome kako su ljudi radili nešto što je danas potpuno normalno — lovili, pecali, gde su gubili vreme, kako su gradili kuće — iz bilo kog dela sveta". Kategorija 2 jer je priča o praksi jedne civilizacije. Prva priča sa Velikih ravnica i prva „kako se živelo" priča kanala. Čitana je Brinkova knjiga *Imagining Head-Smashed-In* (AU Press 2008, otvoreni pristup, poglavlja 1, 4, 5, 6, 9) uz Wikipediju i National Trust of Canada; Blackfoot izvori samo posredno, preko Brinka. Starost lokaliteta se razlikuje po izvorima (5.500 / 5.800 / „skoro 6.000") — skripta kaže „nearly six thousand". Pitanje „rasipanja" lova (Brink ima poglavlje „Overkill?") je u skripti jednim pasusom: pravilo da svaka životinja mora da pogine i razlog lovaca, bez odbrane i bez optužbe. **Popularnost nije izmerena brojkama.**

### Kategorija 3 — mitologija, bogovi, religije i legende

#### #21 — Why Zeus Was Terrified of His Own Children

`status: scored` · **83.7** · radi odmah · izvorna oznaka: kat. 3 #1

Ocene M1–M10: 5 / 5 / 5 / 4 / 4 / 4 / 2 / 3 / 4 / 4 — sirovo 79.5 / 95.

**PREUSMERENA — skor ispod opisuje potrošenu verziju, mora da se preboduje pre produkcije.**

`greek-gods-part-1` je pojeo **prvu polovinu ove ideje**: proročanstvo, gutanje dece, kamen i
izbacivanje. To se ne sme ispričati dva puta. Ono što ideji ostaje je **rat**, koji je u Part 1
stišnjen u jedan pasus od ~70 reči i namerno ostavljen takav.

Nova story: deset godina rata koji nijedna strana ne može da završi, i kralj koji pobeđuje tako
što siđe u jamu i oslobodi zatvorenike koje je neko drugi tamo bacio. Kiklopi kuju tri oružja,
sto-ruki završavaju rat, Titani zauzimaju mesto zatvorenika. Tu idu i Uran i srp, Otris, Atlas,
mera Tartara nakovnjem i Kureti sa Krita — sve što je Part 1 morao da izostavi.

Nova hook kandidatura: “The king of the gods won his war by opening a prison.”

**Van numeracije Greek Gods 1–4** — ne nosi broj parta, ne ulazi u lanac outroa, ne dira
compilation. Izlazi **posle** Part 1. Detalji u `docs/series/greek-gods.md` §2.

Zašto je preusmerenje dobro: dizajn je već plaćen — `cronus`, `the-cyclopes`,
`the-hundred-handers`, `tartarus` i `the-war-plain` su zaključani u Part 1 i kopiraju se doslovno,
pa je ovo najjeftiniji video u celoj listi. I rešava kaznu koja je oborila M8: stari naslov je
obećavao Zevsa a priča je bila o Kronu; rat je **zaista** Zevsova priča.

Stari zapis, radi traga:

> Story: Greek tradition tells of Cronus swallowing his children because of a prophecy that one would overthrow him. Zeus survived through a deception, eventually freed his siblings and led the revolt against the Titans.
>
> Hook: “Why did the king of the gods swallow his own children?”
>
> Zašto ovaj skor: Slika oca koji guta sopstvenu decu je neodoljiva i jeftina za animaciju, ali tema je najzasićenija u mitologiji, a naslov obećava Zevsa dok priča govori o Kronu — nesklad koji obara jasnoću.

#### #22 — The Man Who Stole Fire From the Gods

`status: scored` · **80.0** · radi odmah · izvorna oznaka: kat. 3 #2

Ocene M1–M10: 4 / 4 / 5 / 3 / 5 / 4 / 1 / 5 / 4 / 5 — sirovo 76 / 95.

Story: Prometheus defied Zeus by giving fire to humanity and was punished with eternal torment in one of the best-known Greek myths. Different ancient sources emphasize different aspects of his story.

Hook: “He stole fire from the gods to help humanity. Zeus decided that was unforgivable.”

Zašto ovaj skor: Savršen luk, maksimalan ulog i dva lika na jednoj planini — najjeftinija priča u listi; jedino je obara to što je ispričana toliko puta da nema šta da iznenadi.

#### #23 — Why Hades Let Persephone Leave

`status: scored` · **81.1** · radi odmah · izvorna oznaka: kat. 3 #3

Ocene M1–M10: 4 / 4 / 5 / 3 / 5 / 5 / 2 / 4 / 4 / 4 — sirovo 77 / 95.

Story: Persephone’s descent into the underworld and her division of time between the living and the dead became Greek mythology’s most enduring explanation for seasonal change. Ancient versions differ in important details.

Hook: “A girl entered the land of the dead—and somehow managed to come back.”

Zašto ovaj skor: Jedina mitska ideja kojoj smena godišnjih doba daje ugrađen vizuelni uređaj (isti pejzaž, četiri stanja), uz majku i ćerku kao emotivno jezgro; koči je samo zasićenost teme.

#### #24 — The Punishment of Tantalus: Food He Could Never Eat

`status: scored` · **70.0** · oštriji ugao · izvorna oznaka: kat. 3 #4

Ocene M1–M10: 4 / 4 / 4 / 3 / 3 / 2 / 3 / 4 / 3 / 5 — sirovo 66.5 / 95.

Story: Tantalus was condemned to stand in water beneath fruit that moved away whenever he tried to drink or eat. His punishment became one of Greek mythology’s most famous images of eternal frustration.

Hook: “He was surrounded by food and water—but the gods made sure he could never consume either.”

Zašto ovaj skor: Najjeftinija i najrazumljivija slika u listi, ali je i najstatičnija — kazna se ne razvija, pa bi trideset shotova bilo trideset varijacija istog kadra, tačno onaj problem ponavljanja koji izbegavamo.

#### #25 — Medusa Wasn't Always a Monster

`status: scored` · **84.2** · radi odmah · izvorna oznaka: kat. 3 #5

Ocene M1–M10: 5 / 5 / 4 / 5 / 4 / 4 / 2 / 4 / 3 / 4 — sirovo 80 / 95.

Story: Later and classical traditions about Medusa differ, and the familiar story of her transformation and encounter with Perseus developed through multiple sources. That evolution itself is the story of how a famous monster was made.

Hook: “What if the monster with snakes for hair wasn't always a monster?”

Zašto ovaj skor: Naslov je hook, a payoff prevrće ono što gledalac misli da zna o najprepoznatljivijem čudovištu — pada samo na zasićenosti i na tome što se najzanimljivija verzija oslanja na kasan izvor.

#### #26 — The God Who Lost His Hand to a Wolf

`status: scored` · **91.6** · radi odmah · izvorna oznaka: kat. 3 #6

Ocene M1–M10: 5 / 5 / 5 / 4 / 5 / 4 / 4 / 4 / 4 / 5 — sirovo 87 / 95.

Story: In Norse mythology the gods feared the monstrous wolf Fenrir. They tricked him into accepting a magical binding, and when Fenrir suspected betrayal, Tyr placed his hand in the wolf’s mouth as a pledge. When the trap was revealed, Tyr lost his hand.

Hook: “The gods wanted to chain a monster. One god had to put his hand inside its mouth to make the trap work.”

Zašto ovaj skor: Jedina ideja bez ijedne ocene ispod 4: hook, naslov i tambnejl su ista slika, ulog je ruka u čeljustima, luk se zatvara u jednom potezu, a sve se odigrava sa nekoliko likova na jednoj lokaciji.

#### #27 — How Odin Traded an Eye for Knowledge

`status: scored` · **75.3** · oštriji ugao · izvorna oznaka: kat. 3 #7

Ocene M1–M10: 4 / 4 / 4 / 3 / 4 / 3 / 3 / 4 / 4 / 5 — sirovo 71.5 / 95.

Story: Odin sacrificed one eye in exchange for access to the well of wisdom. The story captures a recurring theme in Norse mythology: knowledge is powerful, but it comes at a price.

Hook: “How much would you sacrifice to know everything? Odin gave up an eye.”

Zašto ovaj skor: Premisa staje u pet reči i jeftina je, ali je vizuelno uska (drvo, izvor, oko) i nema obrta — cena je poznata unapred, pa nema šta da se otkrije u sredini.

#### #28 — The Egyptian God Who Was Cut Into Pieces

`status: scored` · **88.9** · radi odmah · izvorna oznaka: kat. 3 #8

Ocene M1–M10: 5 / 5 / 4 / 4 / 5 / 5 / 4 / 3 / 4 / 4 — sirovo 84.5 / 95.

Story: Osiris was murdered and dismembered in Egyptian mythology, after which Isis searched for his scattered remains. The story became deeply connected with death, resurrection, kingship and the afterlife.

Hook: “A god was murdered, cut apart and scattered across Egypt. Then his wife went looking for him.”

Zašto ovaj skor: Ubistvo, rasparčavanje, potraga i vaskrsenje daju kompletan filmski luk sa najširim rasponom kadrova (Nil, pustinja, sanduk, podzemlje); jedino usporava gomila egipatskih imena na početku.

#### #29 — The God Who Became a Cow to Escape

`status: scored` · **74.7** · oštriji ugao · izvorna oznaka: kat. 3 #9

Ocene M1–M10: 4 / 4 / 4 / 3 / 3 / 4 / 5 / 3 / 3 / 4 — sirovo 71 / 95.

Story: Greek mythology contains several transformations involving gods and mortals, including Zeus transforming himself and others to escape danger. The story of Io, transformed into a cow and pursued across the world, is especially visual and strange.

Hook: “Zeus turned a woman into a cow to hide her—and Hera wasn't fooled.”

Zašto ovaj skor: Redak i bizaran ugao koji skoro niko ne obrađuje, ali potera preko pola sveta traži previše imena i previše skokova da bi se u pet minuta zatvorila čisto.

#### #30 — The Giant Who Tried to Steal the Sun

`status: scored` · **83.2** · radi odmah · izvorna oznaka: kat. 3 #10

Ocene M1–M10: 5 / 5 / 4 / 4 / 3 / 4 / 5 / 3 / 3 / 4 — sirovo 79 / 95.

Story: Across world mythologies, supernatural beings attempt to capture or consume celestial bodies. The strongest version is the Hindu tradition around Rahu, whose attempt to consume the sun and moon became associated with eclipses.

Hook: “Ancient India had a terrifying explanation for an eclipse: something in the sky was trying to swallow the Sun.”

Zašto ovaj skor: Pomračenje kao napad na nebo daje sliku koju niko u niši ne koristi i naslov koji se sam prodaje; spuštaju je potreba da se objasni hinduistički panteon i to što obrt živi u tradiciji, ne u zapisu.

#### #33 — The Rule Nobody Could Keep in the Land of the Dead

`status: done` · **75.8** · oštriji ugao · izvorna oznaka: dodata 2026-11-03, van originalnih 30 · `episodes/three-underworlds`

Ocene M1–M10: 4 / 4 / 4 / 4 / 4 / 4 / 3 / 3 / 4 / 3 — sirovo 72 / 95.

Story: Three peoples tell of a rescue from the land of the dead that fails at the last step. In the Greek tellings of Virgil and Ovid, Orpheus may lead his dead wife Eurydice out on one condition — he must not look back — and turns within sight of daylight. In Japan's *Kojiki* (712 CE), the god Izanagi follows his wife Izanami into the Land of Hades; she tells him "Look not at me!", he lights a torch from his comb and finds her rotting, flees past grapes, bamboo shoots and three peaches, seals the pass with a boulder, and the two part with a threat of a thousand deaths a day against fifteen hundred birth huts. In a Cherokee tale recorded by James Mooney (1900) under the heading "Origin of death", seven men bring the Sun's daughter back from the Ghost country in a box they must not open until home — and lift the lid a little to give her air, and a redbird flies out. The rule changes each time (look, look back, open); the reason it is broken never does, and Mooney's tale says outright what the failure explains: the dead cannot be brought back. Why a story of this shape exists on three continents is open (a very old common source, shamans' journeys, shared experience of loss).

Hook: “A Greek musician, a Japanese god and seven Cherokee men all went into the land of the dead to bring someone back. Each was given a rule — and each of them broke it.”

Zašto ovaj skor: Pravilo koje se menja dok razlog za njegovo kršenje ostaje isti (nije mogao da čeka, nije mogao da ne vidi, plašili su se da umire) prevrće Orfeja iz priče o ljubavi u priču o tome zašto mrtvi ne dolaze nazad, a tri sveta — Had, Jomi sa crvima i breskvama, čerokijska zemlja duhova — nose vizuelni ritam; spuštaju je to što su Orfej i Izanagi pojedinačno među najispričanijim pričama niše i što „zašto ista priča" ostaje bez odgovora.

Dodata van C03 liste, u sesiji u kojoj je izabrana: korisnik je tražio temu koja je već popularna, a ulazi u postojeće ili potencijalne plejliste — nacije i mitove koje kanal još nije radio (Japan, severnoamerički narodi) i **priče koje su slične u različitim kulturama**, uz pitanje kako su ljudi na krajevima sveta došli do istih mitova. Ovo je prva epizoda te potencijalne plejliste („Same Story, Different World"). Kategorija 3 jer je jezgro mit; sve tri verzije čitane su u izvoru (Chamberlain, *Kojiki* 1919 izd.; Mooney, *Myths of the Cherokee*, Gutenberg), a Orfej preko Plata, Vergilija i Ovidija. **Popularnost nije izmerena brojkama** — alat za pretragu ne daje gledanost — pa se oslanja na to što su i Orfej i Izanagi/Izanami među najpoznatijim silascima u zemlju mrtvih, a poređenje paralelnih mitova je ustaljen format niše.

**Izoštrena u produkciji (2026-11-03):** opšta tema („tri mita su slična") suzena je na jednu stvar koja ima lice, ulog i kraj — **pravilo na pragu zemlje mrtvih**. Skor 75.8 opisuje ovu izoštrenu verziju i ispod je 80 jer M7 i M8 ostaju na 3 (dve najpoznatije priče niše i tri nova imena). Orfej je zato pet rečenica koje gledalac već zna i služe kao postavka; težište nose Izanagi i čerokijska kutija. Hook je prenet doslovno u skriptu. Zaključak o poreklu nije izmišljen: skripta navodi tri tumačenja i kaže da se ne zna.

#### #34 — El Dorado Was Never a City. It Was a Man on a Raft

`status: done` · **79.5** · oštriji ugao · izvorna oznaka: dodata 2026-11-04, van originalnih 30 · `episodes/el-dorado`

Ocene M1–M10: 4 / 5 / 4 / 4 / 3 / 5 / 3 / 4 / 3 / 3 — sirovo 75.5 / 95.

Story: "El Dorado" means "the gilded one", and it named a man before it named a place. In *El Carnero* (written 1636) the Bogotá chronicler Juan Rodríguez Freyle, who had it from his friend don Juan, cacique of Guatavita, describes how a Muisca heir fasted six years in a cave, then on Lake Guatavita was stripped, smeared with sticky earth and dusted with gold, and stood on a reed raft with a heap of gold and emeralds at his feet and four chiefs beside him, and threw the gold into the water. A Muisca man told a Spanish captain about it in Quito; three captains reached the Muisca highlands in 1537–39 and found gold and emeralds but no golden city; the name became a place, a city, a lake on European maps for two hundred years, and cost Walter Raleigh his son and his life. Antonio de Sepúlveda drained part of Lake Guatavita (by his own count taking 12,000 pesos from the shore) and Freyle helped bury him; in 1969 a gold raft with a seated chief and ten attendants was found in a cave at Pasca, though scholars argue whether it shows Guatavita. Nobody who wrote the ceremony down saw it, and the script says so once. Freyle confesses that he went hunting gold himself, in another sacred lake, and that the priest who led him there fell face down on the ground at the sight of the water and never spoke to him again.

Hook: “El Dorado was not a city. It was a man — naked, covered in gold dust, standing on a raft in the middle of a mountain lake.”

Zašto ovaj skor: Obrt „nije grad nego čovek" nosi jedna slika koja je i naslov i tambnejl (pozlaćen čovek na splavu usred jezera), a Frejle, koji prvo zapisuje ceremoniju pa lično traži zlato i vraća se praznih ruku, daje priči lice i kraj; spuštaju je to što je El Dorado jedna od najispričanijih legendi uopšte i što se ceremonija oslanja na jednog informanta zapisanog stotinu godina kasnije.

Dodata van C03 liste, u sesiji u kojoj je izabrana: korisnik je postavio cilj da se popune sve regije i epohe sajta bar jednom (nedostaju Severna Amerika, Južna Amerika, Afrika i Australija), a tek posle toga ide ono što je najtraženije; za Južnu Ameriku tražio je priču o drevnim civilizacijama ili autohtonim narodima i prepustio izbor Claude-u. El Dorado je izabran jer je najprepoznatljivija južnoamerička legenda, ima predmet koji nosi tambnejl (splav iz Pasce) i vodi do Muiska, naroda koji kanal nije radio. **Popularnost nije izmerena brojkama** — alat za pretragu ne daje gledanost. Kategorija 3 jer je jezgro legenda, ali je pisana prema izvoru, ne prema prepričavanju: pročitan je ceo španski tekst Frejleovog *El Carnero*, koji ispravlja sažetke na vebu (telo se maže „lepljivom zemljom", ne smolom; ronjenja u jezero kod Frejlea nema; Sepúlvedu je poznavao lično). Ostalo je sekundarno (Bandelier 1893, Wikipedia); stranica Banco de la República i BBC članak nisu mogli da se otvore, Hemming nije čitan. Nijedan podatak o broju mrtvih nije potvrđen i nijedan ne ulazi u skriptu.

#### #35 — A King Gave Away So Much Gold That Cairo's Price Fell

`status: done` · **73.7** · oštriji ugao · izvorna oznaka: dodata 2026-11-04, van originalnih 30 · `episodes/mansa-musa`

Ocene M1–M10: 4 / 4 / 4 / 4 / 3 / 4 / 2 / 4 / 4 / 3 — sirovo 70 / 95.

Story: In July 1324 Mansa Musa, ruler of Mali, reached Cairo on his pilgrimage to Mecca. An Egyptian emir sent to meet him told the historian al-Umari what he saw: Musa spoke only through an interpreter although his Arabic was perfect, sent many loads of raw gold to the sultan's treasury, and refused the audience because he would have to kiss the ground — until a man beside him whispered and he said, "I make obeisance to God who created me," and bowed. He then flooded Cairo with gold, leaving no emir or office-holder without a load, and al-Umari says the price of gold fell and stayed low "for about twelve years". The twelve years rest on al-Umari alone, another chronicler gives a different figure, and a modern historian found the changes within normal swings. The return from Mecca ruined Musa: pilgrims died, supplies were lost, he borrowed from Cairo's merchants who per two chroniclers were never or only partly repaid. About 1375 the Catalan Atlas shows him with gold in his hand and calls him "the richest and noblest of all these lands", a caption modern writers turned into "richest man in history".

Hook: “In 1324 a king from West Africa rode into Cairo and gave away so much gold that, one chronicler says, the price of gold stayed low for twelve years.”

Zašto ovaj skor: Dvor, odbijanje da se poljubi zemlja i šapat nose scenu koja se ne zaboravlja, a poenta (cena zlata se možda i nije pomerila, ali priča jeste) prevrće „najbogatiji čovek ikad"; spuštaju ga to što je Mansa Musa jedna od najispričanijih ličnosti niše i što je lik velikodušan, a ne neko ko mnogo rizikuje.

Dodata van C03 liste, u sesiji u kojoj je izabrana: cilj da se popuni svaka regija i epoha sajta bar jednom (Afrika i Srednji vek su bili prazni); izabrana je jer jedna sačuvana stranica al-Umarija daje i scenu i sumnju u sopstvene brojke. **Popularnost nije izmerena brojkama.** Kategorija 2 jer je priča o događaju iz stvarne istorije, ne o mitu. Primarni tekst je samo isečak al-Umarija u prevodu Levtziona i Hopkinsa (World History Commons); sve ostalo je Wikipedia. Brojevi pratnje (12.000 robova, 80 kamila, „18 tona zlata") nisu korišćeni: Wikipedia ih naziva književnim, iz jednog lanca prenosa. Ime emira ne stoji u isečku.

#### #36 — Two Brothers Beat the Maya Lords of Death at Their Own Game

`status: done` · **80.5** · radi odmah · izvorna oznaka: dodata 2026-11-04, van originalnih 30 · `episodes/hero-twins`

Ocene M1–M10: 4 / 4 / 4 / 5 / 4 / 5 / 4 / 3 / 3 / 3 — sirovo 76.5 / 95.

Story: In the Popol Vuh, the book of the K'iche' Maya of Guatemala, the lords of Xibalba, the underworld, invite the brothers Hun Hunahpu and Vucub Hunahpu to a ball game and kill them with tricks; the father's head in a tree spits into a young woman's hand and she bears twins, Hunahpu and Xbalanque. When the lords send the same invitation, the twins plant two canes in their grandmother's house as a sign of life, cross the rivers on their blowguns, learn the lords' names by sending a mosquito to bite each one, pass the houses of trial, lose and recover a head with the help of a turtle and a rabbit, then arrange their own death — the lords burn them, grind their bones, and the bones rise from the river as fish-men and ragged dancers who burn a house and restore it, sacrifice each other and return. The lords ask for the same trick, and the twins kill the two chief lords and do not revive them. The twins rise as sun and moon. The book was written down after the conquest and nobody knows how old the story is.

Hook: “The lords of the Maya underworld invited two brothers to a ball game. It was a trap, and the brothers knew it. It was how their father had died.”

Zašto ovaj skor: Pogrešan korak oca postaje pravilo igre za sinove — oni pobeđuju time što planiraju sopstvenu smrt, a gospodari smrti padaju jer žele da vide još jedan trik, što prevrće celu premisu; kuće probe, glasnici-životinje, trska kao znak života i loptaški teren daju najširi vizuelni raspon u listi, a spuštaju ga to što priča traži mnogo imena i što je zapisana tek posle osvajanja.

Dodata van C03 liste, u sesiji u kojoj je izabrana: cilj da se popuni svaka regija sajta (Severna Amerika; Mezoamerika je na svetskoj karti Severna Amerika) uz korisnikovu želju za pričama o Majama. Kategorija 3 jer je jezgro mit. Čitan je pravi tekst: španski prevod Raynaudove francuske verzije (Asturias i González de Mendoza, 1927) na Wikisource-u, poglavlja 11–25; Spenceov engleski tekst iz 1908. je prepričavanje i korišćen je samo za poređenje, a prevod Goetza i Morleya nije mogao da se otvori. Broj i imena kuća probe razlikuju se među verzijama, pa skripta uzima samo ono u čemu se tekst i Wikipedia slažu. Ne nosi tvrdnju da su blizanci prikazani na majanskim vazama: kaže „možda".

#### #39 — The Hero Who Killed His Own Son Without Knowing It

`status: done` · **81.6** · radi odmah · izvorna oznaka: dodata 2026-11-16, van originalnih 30 · `episodes/rostam-and-sohrab`

Ocene M1–M10: 4 / 4 / 5 / 4 / 5 / 4 / 4 / 3 / 4 / 3 — sirovo 77.5 / 95.

Story: In the *Shahnameh* (Ferdowsi, c. 1010) the champion Rostam fathers a son, Sohrab, on a night in Samangan and leaves without telling anyone, giving the mother an armband as a token. Sohrab grows up to lead the army of Turan against Iran, hoping to put his father on its throne; the king of Turan sends his warriors along on the secret condition that Rostam must never learn who is coming against him. In two days of single combat Sohrab twice asks the old champion whether he is Rostam, and Rostam, for pride and for his side's sake, denies it; he wins by breaking the boy's back, and only the armband under the mail shows him what he has done. The Iranian king refuses the healing balm, Sohrab dies, Rostam burns his own tent, and Sohrab's mother dies within a year.

Hook: “Rostam, the greatest hero of Persia, fought a young stranger on a battlefield, and twice the stranger asked him his name. Rostam would not tell him.”

Zašto ovaj skor: Pitanje „jesi li ti Rostam?" bez odgovora nosi hook, a lanac prećutkivanja iz razumnih razloga (ponos, zaštita, ambicija, strah, zavist) pretvara tragediju u nešto više od sudbine; spuštaju je šest imena i to što je zapisana kao legenda, a izvor je prepričavanje (Zimmern 1883), ne prevod.

Dodata van C03 liste, u sesiji u kojoj je izabrana (2026-11-16): korisnik je tražio jednu basnu/izmišljenu priču/mit koji je interesantan; prva priča iz Irana na kanalu. Kategorija 3 jer je jezgro legenda; ispričana je kao legenda, u glasu predanja. Čitano je celo poglavlje „Rustem and Sohrab" u Zimmernovom *The Epic of Kings* (1883, archive.org), uz Wikipediju; detalji o Zindehu i trima Hujirovim lažima nisu proveravani u drugom prevodu (Warner, Davis, Clinton). Paralele — Hildebrandova pesma, irski *Aided Óenfhir Aífe*, indijski Babruvahana — nisu u skripti nego su sačuvane kao seme za plejlistu „Same Story, Different World" (otac ubija sina ne znajući). **Popularnost nije izmerena brojkama.**

---

## Napomene uz bodovanje

- **Spajanja:** nijedan par ideja ne pokriva isti događaj iz drugog ugla, pa nijedna ideja nije spojena
  i nijedna nema `status: rejected`. Najbliže preklapanje su #12 (mesopotamsko pismo kao računovodstvo)
  i #18 (mesopotamski kanali) — isti prostor i epoha, ali različita tema i različit obrt, pa ostaju odvojene.
- **Numeracija:** originalni fajl je koristio #1–#10 unutar svake od tri kategorije, pa je isti broj
  označavao tri različite ideje. Uvedena je jedinstvena numeracija 1–30 (kat. 1 → 1–10, kat. 2 → 11–20,
  kat. 3 → 21–30). Izvorna oznaka je zadržana uz svaku ideju.
- **Nesklad naslova i priče kod #21 — rešen preusmerenjem.** Naslov je imenovao Zevsa, a priča je bila
  o Kronu; nesklad je bio kažnjen kroz M8 (jasnoća = 3). `greek-gods-part-1` je u međuvremenu potrošio
  Kronov deo, pa je ideja preusmerena na Titanomahiju — koja **jeste** Zevsova priča. Skor 83.7 je
  zatečen i **nije** preračunat: on opisuje staru priču. Preboduje se kad ideji dođe red.
- **M9 kod mitologije:** mit se ne kažnjava zato što je mit. Kod mitskih ideja M9 meri koliko je izvor
  jasno određen i koliko je verzija stabilna (Hesiod i Eda → 4; kasna ili razuđena tradicija → 3).
- Bodovanje je rađeno isključivo iz proze koja je već bila u ovom fajlu. Nijedna nova ideja nije dodata.
