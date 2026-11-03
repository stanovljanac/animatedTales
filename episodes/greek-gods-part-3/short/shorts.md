# Shorts — greek-gods-part-3

Sve vezano za Shortove živi u ovom folderu (`episodes/greek-gods-part-3/short/`): `shorts.md` (tekst za YouTube),
`shorts.json` (ulaz za `tools/short.mjs`), `shortN.mp4` i `shortN.srt`.

| Short | Šta | Fajlovi |
|---|---|---|
| 1 Metida | neprekinut rez 0:00–0:44,6, renderovan 9:16 | `short1.mp4`, `short1.srt` |
| 2 Delos | **montaža** iz izvornih kadrova i delova narracije, 45,2s | `short2.mp4`, `short2.srt` |
| 3 Atina | **montaža**, 50,1s | `short3.mp4`, `short3.srt` |
| 4 Apolon i Artemida | **montaža**, 33,8s | `short4.mp4`, `short4.srt` |

Četiri Shorta: Short 3 (Atina) i Short 4 (Apolon i Artemida) su dodati na zahtev. Raniji plan za Atinu (neprekinut rez za
editor, 1:05–1:49) zamenjen je montažom. Nijedna rečenica nije u dva Shorta (S01–S11 · S27–S31, S35–S37, S47–S48 ·
S12–S17, S20–S24 · S38–S44, S51); dva kadra se ponavljaju između Shortova 2 i 4 (31 i 34), ali sa drugim prozorom
i uz drugu rečenicu. Leto i Delos kao neprekinut rez je izbačen: njegov materijal je ušao u Short 2.

Izvor: `final.mp4` i `narration.mp3`. Vremena su iz `timing.json`, ali je svaki rez proveren prema stvarnom govoru
(silencedetect): whisper kasni 0.1–0.17s za stvarnim početkom reči, pa rez kadra na alignment vremenu ume da odseče prvi slog.
Svaki Short: **Related video → Greek Gods, Part 3** (YouTube Studio → Short → Details → Related video).
Linkovi u opisu i komentarima Shortsa nisu klikabilni, pa je Related video jedini klikabilan put ka long videu;
zato opis i pin komentar kažu „linked on this Short" / „linked video", a ne daju URL.
Chaptera nema: YouTube ih na Shortsima ne prikazuje.
Naslov Shorta ne ponavlja izabrani naslov long videa (`publish.md`); gde se hook preklapa, to je označeno.

Redosled objave: 1 → 2 → 3 → 4. Short 1 se završava usred priče (kako je Atina izašla), Short 2 na ironiji koja traži
ostatak, pa najjače vuku na long video; Shortovi 3 i 4 su zaokruženi i petljaju se u svoj početak, pa idu iza njih.
Ako ti smeta što su 1 i 3 susedi u priči (Short 1 staje tamo gde Short 3 počinje), objavi 4 pre 3.
Nijedan Short ne otkriva kraj long videa („His mother is still inside Zeus." ostaje samo u long videu).

## Ruta do Shorta

**Gotov 9:16 fajl** — `short1.mp4` … `short4.mp4` (1080×1920, titlovi ugrađeni, prozor prati likove). Studio → Create →
Upload videos; YouTube ga sam prepozna kao Short (vertikalan, ispod 60s). Titlove ne treba slati: već su u slici;
`.srt` je samo za CC (Studio → Short → Subtitles → Add language (English) → Upload file → With timing).
YouTube editor iz long videa u ovoj epizodi nije potreban: nijedan Short nije samo rez za editor.

---

## 1. Metida (objaviti prvi)

REZ: 0:00.00 – 0:44.58 (44.6s) · frejm 0 – 1070
U EDITORU: početak 0:00.0, kraj 0:44.4 (kraj ne sme posle 0:44.55: tada počinje „In" iz sledeće rečenice).
Od „Zeus had overthrown a father who swallowed his own children." do „But the daughter was already inside her."
Kraj je rez na shot10 (0:44.583): poslednja reč se završava 0:44.19, pa je ~0.4s tišine, a tek onda „In time, Zeus gave
birth to her himself". Short staje na pitanju na koje odgovara tek long video (kako je Atina izašla), i petlja se nazad na početak.
Prvih 10 frejmova izvora (0.4s) ima crnu traku pri vrhu (artefakt klipa u shot01, vidi se i u long videu); u
`short1.mp4` su zamenjeni prvim čistim frejmom. U editoru ruti ta traka ostaje u prvih 0.4s.
Cover frame: shot09 (Metida u Zevsovim grudima), u Shortu 0:40–0:44 — slika na koju odgovara naslov.

TRANSCRIPT (ispravljen):
Zeus had overthrown a father who swallowed his own children. Then he took a wife — and heard the same prophecy his father had heard. Her name was Metis, and she was wiser than any god or mortal. Earth and Sky, the same two who had warned Cronus, told Zeus what she would bear. First a daughter, his equal in strength and judgment. Then a son, who would be king of gods and men. Zeus did not wait for the son. He tricked Metis with soft words, and swallowed her whole. His father had swallowed the children, and one got away. Zeus swallowed the mother. But the daughter was already inside her.

TITLE OPTIONS:
1. What Was Already Inside Metis When Zeus Swallowed Her? — the question
2. Cronus Swallowed His Children. Zeus Swallowed the Mother — the mirror (blisko opciji 2 iz publish.md: „Zeus Swallowed One Mother"; ne koristiti ako long video dobije taj naslov)
3. Zeus Heard His Father's Prophecy and Swallowed His Wife — the echo
4. Metis Was Wiser Than Any God. Zeus Tricked Her Anyway — the trick
5. Earth and Sky Told Zeus: First a Daughter, Then a King — the prophecy

DESCRIPTION:
Zeus had overthrown a father who swallowed his own children. Then he took a wife, Metis, wiser than any god or mortal, and heard the same prophecy his father had heard: first a daughter, his equal, then a son who would be king of gods and men.

Zeus did not wait for the son. He tricked Metis with soft words and swallowed her whole. His father had swallowed the children, and one got away. Zeus swallowed the mother. But the daughter was already inside her.

How she came out, and the two children Hera hunted across the earth, are in Greek Gods, Part 3, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Zeus #Metis #Athena

PINNED COMMENT:
Cronus swallowed his children to escape a prophecy, and Zeus swallowed the mother to escape the same one. Whose choice was worse: the father's or the son's? Full story in the linked video ▶️

SUBTITLES:
short1.srt — 11 titlova iz `timing.json` (rečenice S01–S11), od 0:00; poslednji se gasi na 0:44.58.
Važi samo ako Short kreće tačno od 0:00. Ugrađeni titlovi u `short1.mp4` rade bez ovog fajla.

---

## 2. Delos (montaža — objaviti drugi)

`short2.mp4` · 1080×1920 · 45.2s · **montaža, ne rez**: u dugom videu ove rečenice nisu jedna do druge.
Cold open: počinje rečenicom S47 koja je u long videu skoro minut posle Apolonovog rođenja („Centuries later, Athens ruled that no one could
be born on Delos, or die there."), vraća se na Letu i završava na S48, rečenici koja pretvara pravilo u ironiju. Petlja se
nazad na početak: „…where nobody could." → „Centuries later, Athens ruled that no one could be born…".

Zašto je bolji od reza (ono što YouTube editor ne ume):
- **Redosled:** S47 i S48 su u long videu jedna za drugom (3:47 i 3:52); ovde su okvir oko priče iz 1:58–2:55: pravilo na početku, ironija na kraju.
- **Preskočeno:** devet dana, Hera i boginja porođaja, ogrlica (S32–S34), cela Delfi/Artemida sekcija. Ostaje za long video.
- **Zvuk:** rečenice iz 10 različitih mesta narracije, svaka sečena na stvarnu tišinu; razmak 0.24s umesto ~1s, unutrašnje
  pauze skupljene na 0.3s; S35 počinje na „Leto" (bez „The moment she set foot on Delos,", jer „she" tamo nije Leto).
- **Slika:** 11 kadrova iz izvornih fajlova (klipovi 1080p, slike 2752×1536), ne iz `final.mp4`; svaki ima svoj 9:16 prozor koji
  prati lika i klizi na reč („and Hera hunted her" → Heraino lice; „none dared" → Leta na kapiji). Rez slike je 0.08s pre
  glasa. Zvuk klipova ispod narracije na 15%, kao u long videu.
- **Titlovi** ugrađeni, aktivna reč zlatna.

Gde je šta u long videu: S47 3:47 · S27 1:58 · S28 2:03 · S29 2:08 · S30 2:14 · S31 2:20 · S35 (od „Leto") 2:45 · S36–S37 2:53 · S48 3:52.
Kadrovi: 40 → 21 → 22 → 34 → 23 → 24 → 25 → 29 → 30 → 31 → 41.
Cover frame: shot24 (Leta kleči i obraća se ostrvu), u Shortu 0:19–0:22.
Izmena ili ponovni render: `node tools/short.mjs episodes/greek-gods-part-3 short2 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Centuries later, Athens ruled that no one could be born on Delos, or die there. Leto was pregnant with Zeus's twins, and Hera hunted her across the earth. Land after land turned her away; none dared let her give birth. At last she reached Delos — a bare rock that, in some tellings, floated loose on the sea. Even Delos was afraid the god would despise it and kick it into the waves. So Leto swore an oath: his temple would make Delos rich forever. Leto threw her arms around a palm tree, the earth laughed beneath her, and the child sprang out into the light. It was Apollo. The whole island blossomed with gold, and the newborn god spoke at once. The one land that let Leto give birth became the one place in Greece where nobody could.

TITLE OPTIONS:
1. On Delos, Nobody Was Allowed to Be Born or Die — the rule
2. Apollo Was Born on Delos. Centuries Later, Nobody Else Could Be — the irony
3. Every Land Turned Leto Away. Only One Let Her Give Birth — the refusal
4. Delos Was Afraid of the God Leto Carried, So She Swore an Oath — the oath
5. The Rock That Let Apollo Be Born Became the Only Place Where No One Could — the reversal

DESCRIPTION:
Centuries later, Athens ruled that no one could be born on Delos, or die there. It was the same island where Apollo was born.

Leto was pregnant with Zeus's twins, and Hera hunted her across the earth. Land after land turned her away. At last she reached Delos, a bare rock that, in some tellings, floated loose on the sea, and swore an oath: the god's temple would make Delos rich forever.

When the child sprang out into the light, the whole island blossomed with gold, and the newborn god spoke at once. The one land that let Leto give birth became the one place in Greece where nobody could.

The full story of Athena, Apollo and Artemis is in Greek Gods, Part 3, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Apollo #Leto #Delos

PINNED COMMENT:
Every land turned Leto away, and the one that finally let her give birth became the only place in Greece where nobody could. Athena, Apollo or Artemis: which one would the world miss most if they had never been born? Full story in the linked video ▶️

SUBTITLES:
short2.srt — 13 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short2.mp4`; fajl je samo za CC.

---

## 3. Atina (montaža — objaviti treći)

`short3.mp4` · 1080×1920 · 50.1s · **montaža, ne rez**. Raniji plan za ovaj Short bio je neprekinut rez 1:05–1:49 za
editor: počinje portretom i rečenicom „This was Athena." bez ikakvog konteksta i preskače rođenje. Zamenjen je montažom.
Cold open: počinje rečenicom S14 („Out leapt a grown woman in golden armour, shaking a spear."), koja je u long videu tek
posle glave i sekire. Tako „her" u sledećoj rečenici („Zeus gave birth to her himself — out of his own head") ima koga da
imenuje, a prvi kadar je Atina u skoku sa kopljem, ne portret. Završava na S24 (ključevi Zevsove munje) i petlja se nazad
na skok: „…keys to his thunderbolt." → „Out leapt a grown woman…".

Zašto je bolji od reza (ono što YouTube editor ne ume):
- **Redosled:** S14 ide ispred S12 i S13 (u videu: 0:44 glava → 0:49 sekira → 0:53 skok). Slika koja udara je prva, objašnjenje
  („out of his own head", „an axe to split it open") dolazi iza nje i odgovara na pitanje „iz čega je iskočila?".
- **Predah pred imenom:** „This was Athena." ima 0.6s tišine ispred sebe i 0.5s iza, kao što skripta traži; ostali razmaci
  su 0.24s umesto ~1s, unutrašnje pauze skupljene na 0.3s (opcija `before` u `shorts.json`).
- **Preskočeno:** Metida u Zevsovim grudima (S18–S19) i sve posle S24; rez bi ih ili nosio ili završio ranije.
- **Slika:** 9 kadrova iz izvornih fajlova (klipovi 1080p, slike 2752×1536); prozor 9:16 prati Atinu kroz skok, prelazi
  sa planine na Sunce („the Sun stopped his horses"), sa Atine na Posejdona („her uncle Poseidon") i sa mora na Posejdona
  u poplavi. Rez slike je 0.08s pre glasa. Zvuk klipova ispod narracije na 15%.
- **Titlovi** ugrađeni, aktivna reč zlatna.

Gde je šta u long videu: S14 0:53 · S12 0:44 · S13 0:49 · S15 0:58 · S16 1:05 · S17 1:06 · S20 1:19 · S21 1:26 · S22 1:31 · S23 1:33 · S24 1:40.
Kadrovi: 12 → 10 → 11 → 13 → 14 → 16 → 17 → 18 → 19.
Cover frame: shot12 (Atina izlazi iz svetla, koplje i štit), u Shortu oko 0:01.5.
Izmena ili ponovni render: `node tools/short.mjs episodes/greek-gods-part-3 short3 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Out leapt a grown woman in golden armour, shaking a spear. In time, Zeus gave birth to her himself — out of his own head. Later poets say it took an axe to split it open. Olympus shook, the sea heaved, and the Sun stopped his horses in the sky until she took the armour off. This was Athena. Her mother's name meant cunning wisdom, and Athena became its goddess, in craft and in war. When the gods chose their cities, Athena and her uncle Poseidon both wanted Athens. He struck the rock of the Acropolis with his trident, and salt water welled up. She planted an olive tree. The gods gave her the city, and Poseidon, the brother who never accepted his share, flooded the plain in anger. The daughter of the swallowed wife became her father's favourite — in one Athenian tragedy, the only god trusted with the keys to his thunderbolt.

TITLE OPTIONS:
1. Athena Leapt From Zeus's Head, and the Sun Stopped His Horses — the birth (deli „Zeus's Head" sa opcijom 4 iz `publish.md`; ne koristiti ako long video dobije taj naslov)
2. Poseidon Struck the Acropolis With His Trident. Athena Planted a Tree — the contest
3. The Daughter Zeus Gave Birth to Held the Keys to His Thunderbolt — the keys
4. The Sun Stopped His Horses Until Athena Took Her Armour Off — the image
5. Zeus Gave Birth to Athena Himself, and Later Trusted Her With His Thunderbolt — the favourite

DESCRIPTION:
Out leapt a grown woman in golden armour, shaking a spear. Zeus had given birth to her himself, out of his own head, and the Sun stopped his horses in the sky until she took the armour off. This was Athena.

Her mother's name, Metis, meant cunning wisdom, and Athena became its goddess, in craft and in war. When the gods chose their cities, she and her uncle Poseidon both wanted Athens. He struck the rock of the Acropolis with his trident, and salt water welled up. She planted an olive tree. The gods gave her the city, and Poseidon flooded the plain in anger.

The daughter of the swallowed wife became her father's favourite, and in one Athenian tragedy, the only god trusted with the keys to his thunderbolt. How Zeus came to swallow her mother, and the two children Hera hunted across the earth, are in Greek Gods, Part 3, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Athena #Poseidon #Athens

PINNED COMMENT:
Poseidon struck the rock and salt water welled up; Athena planted an olive tree, and the gods gave her the city. Which would you have wanted in your city: his sea or her olive tree? Full story in the linked video ▶️

SUBTITLES:
short3.srt — 15 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short3.mp4`; fajl je samo za CC.

---

## 4. Apolon i Artemida (montaža — objaviti četvrti)

`short4.mp4` · 1080×1920 · 33.8s · **montaža, ne rez**. Rečenice iz dva dela narracije (S51 i S38–S44), preuređene u redosled koji u long videu ne postoji.
Cold open: počinje rečenicom S51 („Two came off a drifting rock and became the goddess of birth and the voice of prophecy."),
koja je u long videu rekapitulacija pred sam kraj (4:05). Ni Apolon ni Artemida nisu imenovani u prvih 10s, pa prvih pet
sekundi vuče pitanje „ko su ta dva?", a odgovor su Apolon (S43) i Artemida (S39). Završava na S42 i petlja se u početak:
„…every woman in labour called on her." → „Two came off a drifting rock and became the goddess of birth…".

Zašto je bolji od reza (ono što YouTube editor ne ume):
- **Hook sa kraja:** S51 je u videu tek posle cele priče. Neprekinut komad 2:59–3:23 (S38–S42) ima istu poentu, ali bez
  Delfa i bez hooka (počinje zavetom „The lyre and the bow would be his, he said", bez imena); sa Delfima, do 3:35, staje na
  „…or founded colonies", bez poente.
- **Dve niti, jedna po jedna:** Apolon ide od zaveta (S38) preko Delfa (S43) do hiljadu godina proročanstva (S44), pa tek onda
  Artemida (S39–S42). U videu su one ispreplatane (Apolon 2:59 → Artemida 3:06–3:22 → Apolon 3:24), pa se u rezu ne može
  imati čist Apolon i čista Artemida.
- **Kraj na ironiji:** S41 + S42 („Her mother had been turned away by every land on earth. Now every woman in labour called
  on her.") je poenta cele priče o Leti, u videu usred sekcije.
- **Preskočeno:** kamen u Delfima (S45–S46, traži Part 1) i „In a later telling," iz S39; Short kaže „his twin sister
  Artemis was born first" bez ograde, jer bi ograda tražila objašnjenje o dve priče (u long videu ostaje).
- **Slika:** 8 kadrova iz izvornih fajlova; prozor kreće sa Apolona na zmiju (shot 36), sa staze hodočasnika na hram (37),
  sa devojčice na Letu (32); Leta pred kapijom (34) se udaljava, a na samom kraju prozor klizi sa žene koja se moli na
  srebrnu Artemidu u prozoru (35). Rez slike je 0.08s pre glasa. Zvuk klipova ispod narracije na 15%.
- **Titlovi** ugrađeni, aktivna reč zlatna.

Gde je šta u long videu: S51 4:05 · S38 2:59 · S43 3:24 · S44 3:29 · S39 (od „his") 3:06 · S40 3:13 · S41 3:16 · S42 3:20.
Kadrovi: 44 → 31 → 36 → 37 → 32 → 33 → 34 → 35.
Cover frame: shot32 (devojčica Artemida pridržava majku), u Shortu 0:21–0:24.
Izmena ili ponovni render: `node tools/short.mjs episodes/greek-gods-part-3 short4 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Two came off a drifting rock and became the goddess of birth and the voice of prophecy. The lyre and the bow would be his, he said, and he would tell mankind the will of Zeus. Apollo founded his oracle at Delphi, where he killed the serpent that lived there. For a thousand years, cities asked him what was coming before they went to war or founded colonies. His twin sister Artemis was born first — and helped her mother deliver him. She grew up a hunter, unmarried, at home in the wild. Her mother had been turned away by every land on earth. Now every woman in labour called on her.

TITLE OPTIONS:
1. Artemis Was Born First, and Helped Her Mother Deliver Apollo — the midwife twin
2. Every Land Turned Her Mother Away. Now Every Woman in Labour Called on Artemis — the reversal
3. For 1,000 Years, Cities Asked Apollo What Was Coming — the oracle
4. Apollo and Artemis Were Born on a Drifting Rock — the premise (blisko opciji 4 iz `publish.md`: „Two on a Floating Island"; ne koristiti ako long video dobije taj naslov)
5. Why Every Woman in Labour Called on a Hunter Goddess — the twist

DESCRIPTION:
Two came off a drifting rock and became the goddess of birth and the voice of prophecy.

Apollo promised mankind the lyre, the bow and the will of Zeus. At Delphi he killed the serpent that lived there, and for a thousand years cities asked him what was coming before they went to war or founded colonies.

His twin sister Artemis was born first and helped her mother deliver him. She grew up a hunter, unmarried, at home in the wild. Her mother had been turned away by every land on earth. Now every woman in labour called on her.

How Leto reached Delos, and what Hera did to stop her, is in Greek Gods, Part 3, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Apollo #Artemis #Delphi

PINNED COMMENT:
Her mother was turned away by every land on earth, and Artemis became the one every woman in labour called on. Apollo's prophecy or Artemis's protection: which of the twins would you have prayed to? Full story in the linked video ▶️

SUBTITLES:
short4.srt — 11 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short4.mp4`; fajl je samo za CC.
