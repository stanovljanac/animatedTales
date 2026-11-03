# Shorts — marathon

Sve vezano za Shortove živi u ovom folderu (`episodes/marathon/short/`): `shorts.md` (tekst za YouTube),
`short2.mp4` i `short2.srt`.

| Short | Šta | Fajlovi |
|---|---|---|
| 1 Dilema komandanata | neprekinut rez 0:00–~1:00, **napravio Mihailo** ručno (nije renderovan ovde) | — |
| 2 Noć na Maratonu | neprekinut rez 3:29.9–4:20.4, renderovan 9:16, 50.5s | `short2.mp4`, `short2.srt` |

Izvor: `finalv2.mp4` (poslednja ručna montaža, `episode.json` → `final_file`). Marathon je legacy epizoda: nema `script.md`,
`timing.json` ni pravog `storyboard.json` (onaj u folderu je sintetički fixture), pa `tools/short.mjs` ne može da ga renderuje.
Short 2 je sastavljen jednokratnom skriptom koja koristi iste funkcije iz `tools/short.mjs` (titlovi sa zlatnom aktivnom
rečju, izrez 9:16 koji prati lika, isti fade i enkoder) nad `finalv2.mp4` i whisper rečima (`medium.en`). Skripta nije
sačuvana u repou.
Vremena su proverena prema zvuku: glas u Shortu 2 kreće ~209.98s (rez 209.875), poslednja reč se gasi ~259.92s (rez 260.375,
sledeća reč „We" tek posle 260.5). Whisper je ispustio „a" u „with a farmer's plow"; ispravljeno prema drugom prolazu
(`small.en` i `medium.en` na samom isečku) i u titlu i u tekstu ispod.

Svaki Short: **Related video → The Battle Won by a Dead Man's Army** (YouTube Studio → Short → Details → Related video).
Linkovi u opisu i komentarima Shortsa nisu klikabilni, pa je Related video jedini klikabilan put ka long videu; zato opis i
pin komentar kažu „linked on this Short" / „linked video", a ne daju URL. Chaptera nema: YouTube ih na Shortsima ne prikazuje.
Nijedan naslov Shorta ne ponavlja naslov long videa. Nijedna rečenica nije u oba Shorta (Short 1: 0:00–1:00, Short 2: 3:30–4:20).

Redosled objave: 1 → 2. Short 1 staje usred priče (Atinjani su formirali liniju), Short 2 na Epizelovoj slepoći bez rane.
Nijedan Short ne otkriva kraj long videa („the living won the battle and the dead never stopped fighting" ostaje samo tamo).
Short 1 staje pre nego što Atinjani krenu u trk, a Short 2 preskače sve između (bitka, povratak u Atinu).

## Ruta do Shorta

**Short 2: gotov 9:16 fajl** — `short2.mp4` (1080×1920, 24 fps, titlovi ugrađeni, prozor prati likove). Studio → Create →
Upload videos → izaberi Schedule; YouTube ga sam prepozna kao Short (vertikalan, ispod 60s). Titlove ne treba slati: već su u
slici; `short2.srt` je samo za CC (Studio → Short → Subtitles → Add language (English) → Upload file → With timing).

---

## 1. Dilema komandanata (napravio Mihailo, objaviti prvi)

REZ: 0:00 – ~1:00 u `finalv2.mp4` (poslednja reč „Marathon." se završava 60.5s; „Then they advanced." je već u sledećem
delu, pa ne ulazi). Rez je Mihailov, ovde je samo tekst za YouTube.

TRANSCRIPT (ispravljen; dijalog 0:19–0:30 je prepisan iz Mihailovog teksta, whisper ga ne hvata):
In 490 BC, a Persian army landed at Marathon. Their target was Athens. The Athenians marched out to meet them, but there was a problem. They knew they were facing a Persian force larger than their own, and their commanders could not even agree on whether they should attack. "We must attack them now on the plain." "That is madness. They will surely surround us." "We must wait for the Spartans. We must wait for the Spartans to arrive." For Athens, this was more than a battle. If the Persians won, the city itself could be next. Some of the Athenian commanders wanted to wait. Miltiades argued that they should fight. The decision eventually came down to Callimachus, the Athenian commander who held the decisive vote. He chose to attack, and that decision set one of the most famous battles of the ancient world in motion. The Athenians formed their line at Marathon.

TITLE OPTIONS:
1. Athens Faced a Bigger Persian Army, and Its Commanders Couldn't Agree — the split
2. One Vote Decided Whether Athens Would Attack at Marathon — the vote
3. Miltiades Wanted to Fight at Marathon. Others Said Wait for the Spartans — the argument
4. 490 BC: Persia Landed at Marathon, and Athens Had to Decide — the setup
5. Why Did Athens March Out to Meet a Larger Persian Army? — the question

DESCRIPTION:
In 490 BC, a Persian army landed at Marathon. Their target was Athens.

The Athenians marched out to meet them, but they knew they were facing a Persian force larger than their own, and their commanders could not even agree on whether to attack. Some wanted to wait for the Spartans. Miltiades argued that they should fight. The decision eventually came down to Callimachus, the Athenian commander who held the decisive vote. He chose to attack, and that decision set one of the most famous battles of the ancient world in motion.

What happened when the Athenian line advanced is in The Battle Won by a Dead Man's Army, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#BattleOfMarathon #AncientGreece #Athens #Persia

PINNED COMMENT:
Athens' commanders split over whether to attack a larger Persian army, and Callimachus held the decisive vote. Would you have attacked at once like Miltiades, or waited for the Spartans? Full story in the linked video ▶️

---

## 2. Noć na Maratonu (rez, renderovan — objaviti drugi, na schedule)

`short2.mp4` · 1080×1920 · 50.5s · neprekinut rez `finalv2.mp4` 3:29.88 – 4:20.38 (209.875 – 260.375s), 9:16 izrez po kadru.
Počinje na „Centuries later, the Greek writer Pausanias described a tradition that the battlefield was not truly silent at
night." (hook: bojište koje noću nije tiho), prolazi kroz „the dead still fighting" i priču o čoveku sa plugom, a završava na
„Epizelus survived, but he was left blind despite having no visible wound." — poenta koja ostavlja pitanje o celoj bici
koju prepričava tek long video. Izostavljeno: „And then the stories became stranger." ispred (Short počinje na hooku, ne na
„And then") i sve posle (kraj long videa: „We cannot know whether the dead really fought…"). Ne petlja se u početak.

Izrez 9:16 (kadrovi long videa, vreme u `finalv2.mp4`):
- 209.9–214.5 Atinjani kod humke (izrez izbegava crni štit sa mačem desno, artefakt klipa koji se vidi i u long videu);
- 214.5–223.1 noćna humka sa stelom, prozor klizi za stelom; 223.1–233.1 duhovi (hoplit, konji, strelac), prozor sa humke na hoplita pa na strelca;
- 233.1–243.2 čovek sa plugom u prašini; 243.2–250 Epizel pa džin (prozor kreće sa Epizelovog lica na džinovsku figuru);
- 250–257.2 Epizelovo lice (zum); 257.2–260.4 humka pa duhovi na horizontu.
Cover frame: 0:39.4 (džin sa šlemom, „gigantic" zlatna) — slika na koju odgovaraju najjači naslovi.

TRANSCRIPT (kako se čuje u Shortu):
Centuries later, the Greek writer Pausanias described a tradition that the battlefield was not truly silent at night. People claimed that after dark they could still hear the sounds of battle there. Horses, men fighting. The dead still fighting the war they had already lost their lives in. There were other stories too. One tradition told of a mysterious figure who appeared during the battle and killed Persians with a farmer's plow before disappearing. And Herodotus recorded another strange account. An Athenian soldier named Epizelus claimed that during the fighting he saw a gigantic armed warrior pass beside him and kill the man standing next to him. Epizelus survived, but he was left blind despite having no visible wound.

TITLE OPTIONS:
1. The Marathon Soldier Who Said He Saw a Giant Warrior, Then Went Blind — the blind witness
2. People Said the Dead Still Fought at Marathon After Dark — the night
3. At Marathon, a Mysterious Man Killed Persians With a Plow, Then Vanished — the plowman
4. Did the Dead Really Keep Fighting at Marathon? — the question
5. After Marathon Was Won, the Strange Stories Began — the aftermath

DESCRIPTION:
Centuries after the Battle of Marathon, the Greek writer Pausanias described a tradition that the battlefield was not truly silent at night. People claimed that after dark they could still hear the sounds of battle there: horses, men fighting, the dead still fighting the war they had already lost their lives in.

There were other stories too. One tradition told of a mysterious figure who appeared during the battle and killed Persians with a farmer's plow before disappearing. And Herodotus recorded another strange account: an Athenian soldier named Epizelus claimed that during the fighting he saw a gigantic armed warrior pass beside him and kill the man standing next to him. Epizelus survived, but he was left blind despite having no visible wound.

How the outnumbered Athenians won at Marathon, and how the legends began, is in The Battle Won by a Dead Man's Army, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#BattleOfMarathon #AncientGreece #Herodotus #GreekHistory

PINNED COMMENT:
Herodotus recorded that Epizelus saw a gigantic warrior kill the man beside him and was left blind with no visible wound. Which story from Marathon is the strangest to you: the dead still fighting at night, the man with the plow who vanished, or the giant warrior? Full story in the linked video ▶️

SUBTITLES:
short2.srt — 12 titlova, vremena iz Shorta (od 0:00). Titlovi su ugrađeni u `short2.mp4`; fajl je samo za CC.
