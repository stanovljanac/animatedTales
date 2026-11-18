# Shorts — hero-twins

Sve vezano za Shortove živi u ovom folderu (`episodes/hero-twins/short/`): `shorts.md` (tekst za YouTube),
`shorts.json` (ulaz za `tools/short.mjs`), `shortN.mp4` (samo montaže) i `shortN.srt`.

| Short | Šta | Fajlovi |
|---|---|---|
| 1 Zamka | **montaža**, 50,9s: otac u Xibalbi, od poziva do glave na drvetu | `short1.mp4`, `short1.srt` |
| 2 Glasnik i trske | **montaža**, 30,3s: vaš–žaba–zmija–jastreb, dve trske, komarac | `short2.mp4`, `short2.srt` |
| 3 Tri noći | **rez** za YouTube editor, 1:56.9 – 2:34.9 (38,0s): kuće, slepi miš, glava, zec | `short3.srt` |
| 4 Rerna | **rez** za YouTube editor, 2:35.0 – 3:21.3 (46,3s): ognjište, ples, „Do the same to us" | `short4.srt` |

Četiri Shorta, nijedna rečenica nije u dva (S01–S03, S06–S16 · S20 od „come", S21–S28 · S29–S36 · S37–S48).
Preskočeno za long video: izvor knjige (S04–S05), majka i rođenje blizanaca (S17–S19), svi poslednji redovi od
S49 (nebo, vaze, poenta „could not resist a good show"). **Nijedan Short ne otkriva kraj long videa**: Sunce i
Mesec, vaze i završna rečenica ostaju samo u dugom.

Izvor: `final.mp4` i `narration.mp3`. Vremena su iz `timing.json`, ali je svaki rez proveren prema stvarnom govoru
(silencedetect): whisper kasni 0.1–0.17s za stvarnim početkom reči. Short 3 počinje na 1:56.9 (govor kreće 1:57.0),
Short 4 na 2:35.0 (govor kreće 2:35.2); između njih je 0.5s tišine, pa se ne dodiruju.
Svaki Short: **Related video → Hunahpu and Xbalanque long video** (YouTube Studio → Short → Details → Related video).
Linkovi u opisu i komentarima Shortsa nisu klikabilni, pa opis i pin komentar kažu „linked on this Short" /
„linked video", bez URL-a. Chaptera nema: YouTube ih na Shortsima ne prikazuje.
Naslov Shorta ne ponavlja izabrani naslov long videa (`publish.md`).

Redosled objave: **2 → 3 → 1 → 4.** Short 2 (glasnik i trske) i Short 3 (glava) se završavaju na zaokruženoj slici
i najbolje vuku na ceo video; Short 1 staje na drvetu koje rađa plod, pitanje na koje odgovara tek long video;
Short 4 je zaokružena priča sa poentom, pa ide poslednji. Short 3 i 4 su susedni u priči (3 staje na „he swapped the
heads back", 4 počinje „But the twins knew their end"), pa ih ne objavljuj jedan za drugim istog dana.

## Ruta do Shorta

**Gotov 9:16 fajl (1 i 2)** — `short1.mp4`, `short2.mp4` (1080×1920, titlovi ugrađeni, prozor prati likove).
Studio → Create → Upload videos; YouTube ga sam prepozna kao Short. Titlove ne treba slati: već su u slici;
`.srt` je samo za CC (Studio → Short → Subtitles → Add language (English) → Upload file → With timing).

**Rez u editoru (3 i 4)** — Studio → Content → `final.mp4` → Editor/Shorts → iseci komad iz „U EDITORU".
Ne renderujem ih jer editor to radi sam; ako hoćeš ugrađene titlove i izrez koji prati likove, kaži pa ih renderujem
(`node tools/short.mjs episodes/hero-twins short3`). `short3.srt` i `short4.srt` važe samo ako kreneš tačno od
navedenog početka.

---

## 2. Glasnik i trske (montaža — objaviti prvi)

`short2.mp4` · 1080×1920 · 30.3s · **montaža, ne rez**: počinje usred rečenice S20 („come, and bring your ball."),
što editor ne ume, a „The same lords sent the same message" bez prethodnog dela videa ne znači ništa.
Cold open je naredba, pa lanac glasnika (vaš, žaba, zmija, jastreb), trske kod bake, komarac i imena gospodara.
Zaokruženo: od poziva do „refused the burning bench".
Kadrovi: 12 → 13 → 14 → 15 (suva trska, pa zelena) → 16 → 17 → 18. Cover frame: shot15 (dve trske, levo suva i desno
zelena), u Shortu 0:13–0:17.
Izmena ili ponovni render: `node tools/short.mjs episodes/hero-twins short2 --sheet`; sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Come, and bring your ball. It reached them through a louse, swallowed by a toad, swallowed by a snake, swallowed by a hawk. Before they left, the twins planted two canes in the middle of their grandmother's house. If the canes dried, they were dead. If they sprouted, they lived. They crossed the rivers on their blowguns. A mosquito went ahead and bit each lord in turn. Each cried out, and the next named him. So the twins greeted every lord by name, and refused the burning bench.

TITLE OPTIONS:
1. A Louse, a Toad, a Snake and a Hawk Carried a Message From the Lords of Death — the chain
2. Two Canes in a Grandmother's House: If They Dried, the Twins Were Dead — the test
3. Why a Mosquito Bit Every Lord of the Maya Underworld — the mosquito
4. How the Maya Twins Greeted Every Lord of Death by Name — the names
5. "Come, and Bring Your Ball": The Message the Underworld Sent Two Brothers — the summons

DESCRIPTION:
"Come, and bring your ball." The message from the lords of the Maya underworld reached the twins through a louse, swallowed by a toad, swallowed by a snake, swallowed by a hawk.

Before they left, Hunahpu and Xbalanque planted two canes in the middle of their grandmother's house: if the canes dried, they were dead, and if they sprouted, they lived. Then a mosquito went ahead of them and bit each lord in turn, so that the twins could greet every lord by name.

What waits for them in the House of Darkness, the House of Cold and the House of Bats is in the full video, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#MayaMythology #PopolVuh #Mythology #AnimatedTales

PINNED COMMENT:
A louse, a toad, a snake and a hawk carried the message, and a mosquito learned the name of every lord. Which messenger was the real hero of this story? Full story in the linked video ▶️

SUBTITLES:
short2.srt — 11 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short2.mp4`; fajl je samo za CC.

---

## 3. Tri noći (rez — objaviti drugi)

REZ: 1:56.85 – 2:34.95 (38.1s) · frejm 2804 – 3719
U EDITORU: početak 1:56.9, kraj 2:34.9 (ne kasnije od 2:35.1: tada počinje „But" iz sledeće rečenice; ne ranije od
1:56.4, to je kraj S28).
Od „Then came the nights." do „While the lords chased it, he swapped the heads back." Poslednja reč se završava 2:34.65,
pa je ~0.3s tišine pre kraja. Short staje na zamenjenim glavama: ostaje pitanje šta se desi sa tim trikom, i petlja se
nazad na „Then came the nights."
Cover frame: shot22 (roj životinja i kornjača), u Shortu 0:23–0:28.

TRANSCRIPT (ispravljen):
Then came the nights. In the House of Darkness, they lit the lords' torch with a macaw's red feathers and their cigars with fireflies, and returned them unburned. In the House of Cold they did not freeze, and the jaguars were thrown bones. In the House of Bats, Hunahpu looked out to see if dawn had come, and a bat cut off his head. His brother called every animal in the world. The turtle took the place of the head. In the next ball game, the lords used the real head as their ball, and Xbalanque set a rabbit loose. While the lords chased it, he swapped the heads back.

TITLE OPTIONS:
1. A Bat Cut Off His Head, So His Brother Called Every Animal in the World — the bat
2. The Turtle That Took the Place of a Hero's Head — the turtle
3. The Lords of Death Played Ball With a Stolen Head. Then a Rabbit Ran Past — the rabbit
4. Three Nights in the Maya Underworld: Darkness, Cold and Bats — the houses
5. They Lit the Lords' Torch With Macaw Feathers and Their Cigars With Fireflies — the cheat

DESCRIPTION:
In the House of Bats, Hunahpu looked out to see if dawn had come, and a bat cut off his head. His brother called every animal in the world, and a turtle took the place of the head.

In the next ball game, the lords of the Maya underworld used the real head as their ball, and Xbalanque set a rabbit loose. While the lords chased it, he swapped the heads back. Before that, the twins had lit the lords' torch with a macaw's red feathers and their cigars with fireflies, and thrown bones to the jaguars in the House of Cold.

How the twins end the game is in the full video, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#MayaMythology #PopolVuh #Xibalba #AnimatedTales

PINNED COMMENT:
A turtle in place of a head, a rabbit to pull the lords away, bones for the jaguars, fireflies for the cigars. Which trick would you have thought of first? Full story in the linked video ▶️

SUBTITLES:
short3.srt — 11 titlova iz `timing.json` (rečenice S29–S36), od 0:00. Važi samo ako Short kreće tačno od 1:56.85.

---

## 1. Zamka (montaža — objaviti treći)

`short1.mp4` · 1080×1920 · 50.9s · **montaža, ne rez**: preskače izvor knjige (S04–S05, „The story is told in the
Popol Vuh…"), koja u Shortu samo zaustavlja zamku. Zato je hook S01–S03 iz početka dugog videa, a odmah za njim
S06, otac i njegov brat u igralištu.
Zaokruženo: od poziva do glave na drvetu, i petlja se nazad na „The lords of the Maya underworld invited two brothers…".
Kadrovi: 01 → 04 → 05 → 06 → 07 → 08 → 09 → 10. Cover frame: shot10 (glava u krošnji), u Shortu 0:46–0:50.
Izmena ili ponovni render: `node tools/short.mjs episodes/hero-twins short1 --sheet`.

TRANSCRIPT (kako se čuje u Shortu):
The lords of the Maya underworld invited two brothers to a ball game. It was a trap, and the brothers knew it. It was how their father had died. The father, Hun Hunahpu, and his brother played ball so loudly that the lords of Xibalba, the underworld, heard it overhead. They sent owls with an invitation. The brothers crossed the rivers of blood and went down. The lords had set wooden figures in the seats of honor, and the brothers greeted them. Then the lords laughed. They offered the brothers a bench to sit on. It was a burning stone. They locked them in the House of Darkness with a torch and a cigar each, and demanded them back unburned. By morning, both had burned down. The brothers were sacrificed, and buried in the ballcourt. Hun Hunahpu's head was hung in a tree, and the tree began to bear fruit.

TITLE OPTIONS:
1. The Lords of Death Invited Two Brothers to a Ball Game. Their Father Had Died the Same Way — the trap
2. A Burning Bench, a Dark House and a Head in a Tree: How Hun Hunahpu Died — the three traps
3. Hun Hunahpu's Head Was Hung in a Tree, and the Tree Began to Bear Fruit — the tree
4. The Maya Lords of Death Offered Their Guests a Bench. It Was a Burning Stone — the bench
5. What Happened to the Father of the Maya Hero Twins in the Underworld? — the question

DESCRIPTION:
The lords of the Maya underworld invited two brothers to a ball game. It was a trap, and the brothers knew it, because it was how their father had died.

Hun Hunahpu and his brother played ball so loudly that the lords of Xibalba heard it overhead. They sent owls with an invitation. The lords had set wooden figures in the seats of honor, offered the brothers a bench that was a burning stone, and locked them in the House of Darkness with a torch and a cigar each. By morning, both had burned down. Hun Hunahpu's head was hung in a tree, and the tree began to bear fruit.

What happened next, and what his sons did about it, is in the full video, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#MayaMythology #PopolVuh #Xibalba #AnimatedTales

PINNED COMMENT:
The lords had three traps ready: wooden figures in the seats of honor, a bench that was a burning stone, and the House of Darkness. Which one would you have fallen for? Full story in the linked video ▶️

SUBTITLES:
short1.srt — 17 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short1.mp4`; fajl je samo za CC.

---

## 4. Rerna (rez — objaviti poslednji)

REZ: 2:35.05 – 3:21.35 (46.3s) · frejm 3721 – 4832
U EDITORU: početak 2:35.0, kraj 3:21.3 (ne kasnije od 3:21.5: tada počinje „Then the twins honored their father").
Od „But the twins knew their end." do „…and did not bring them back." Poslednja reč se završava 3:20.98, pa je ~0.3s
tišine pre kraja. Zaokružena celina sa poentom; i petlja se na početak („But the twins knew their end." posle „did not
bring them back." čita se kao odgovor na pitanje koje je Short postavio).
Ne ulaze Sunce i Mesec, vaze i završna rečenica: to ostaje samo u dugom videu.
Cover frame: shot30 (blizanci i dvojica glavnih gospodara, svetlost), u Shortu 0:38–0:41.

TRANSCRIPT (ispravljen):
But the twins knew their end. They told two soothsayers how to answer when the lords asked what to do with their bones: grind them like maize, and scatter them in the river. The lords built an oven. The twins embraced and threw themselves in. The lords did as they were told. But the bones sank to the bottom of the river, and on the fifth day two fish-men rose. Then two ragged wanderers appeared and danced. They burned a house and made it whole. They sacrificed each other, and rose. The lords were delighted. "Do the same to us," they said. The twins killed the two chief lords, One Death and Seven Death, and did not bring them back.

TITLE OPTIONS:
1. "Do the Same to Us," Said the Lords of Death. The Twins Killed Them — the request
2. Two Maya Brothers Threw Themselves Into an Oven on Purpose — the oven
3. The Twins Planned Their Own Death, and the Lords of Death Never Noticed — the plan
4. Two Ragged Wanderers Burned a House and Made It Whole — the dance
5. How the Maya Twins Tricked One Death and Seven Death — the chief lords

DESCRIPTION:
The twins knew their end. They told two soothsayers how to answer when the lords asked what to do with their bones: grind them like maize, and scatter them in the river. The lords built an oven, and the twins embraced and threw themselves in.

The bones sank to the bottom of the river, and on the fifth day two fish-men rose. Then two ragged wanderers appeared and danced. They burned a house and made it whole, sacrificed each other, and rose. The lords were delighted. "Do the same to us," they said. The twins killed the two chief lords, One Death and Seven Death, and did not bring them back.

What the twins did next, and what scholars still argue about, is in the full video, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#MayaMythology #PopolVuh #HeroTwins #AnimatedTales

PINNED COMMENT:
The twins told the soothsayers what to say, and the lords followed it word for word. Was the real trick the dance, or the plan made before the oven? Full story in the linked video ▶️

SUBTITLES:
short4.srt — 15 titlova iz `timing.json` (rečenice S37–S48), od 0:00. Važi samo ako Short kreće tačno od 2:35.05.
