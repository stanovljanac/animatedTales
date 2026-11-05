# Shorts — greek-gods-part-4

Sve vezano za Shortove živi u ovom folderu (`episodes/greek-gods-part-4/short/`): `shorts.md` (tekst za YouTube),
`shorts.json` (ulaz za `tools/short.mjs`), `shortN.mp4` i `shortN.srt`.

| Short | Šta | Fajlovi |
|---|---|---|
| 1 Zlatni presto | **montaža**, 34.8s | `short1.mp4`, `short1.srt` |
| 2 Lanci koje niko ne vidi | **montaža**, 50.5s | `short2.mp4`, `short2.srt` |
| 3 Bogovi dolaze da vide | **montaža**, 47.4s | `short3.mp4`, `short3.srt` |

Tri Shorta, tri samostalne celine u redosledu priče: presto za majku (S04–S13), mreža za ženu (S20–S31), bogovi pred
mrežom (S32–S44). Nijedna rečenica nije u dva Shorta, nijedan kadar se ne ponavlja. Preskočeno je ono što bi traženo
objašnjenje ili otkrilo kraj: S14–S19 (Hefest kao zanatlija, Afroditin brak, pevač kod kralja), S35–S36 (traži nazad
poklone, boginje ostaju kod kuće) i sve od S45 (Posejdonovo obećanje, Aresov beg, deca, poenta i outro). **Nijedan Short ne
otkriva kraj long videa** („a net for his wife", „both times he let them go" ostaju samo u dugom videu).

Sva tri su renderovana, a razlozi nisu isti: Short 1 počinje usred rečenice (S04 od „Hephaestus"), Short 3 preskače S35–S36 (kao rez
iz editora, 2:13–3:11, bio bi 57s uz njih), a Short 2 je neprekinut komad videa koji je renderovan zbog prozora koji prati
likove i skupljenih pauza (v. niže).

Izvor: `narration.mp3` i izvorni kadrovi iz `shots/`. Vremena su iz `timing.json`, ali je svaki rez rečenice sečen na stvarnu
tišinu (silencedetect): whisper kasni 0.1–0.17s za stvarnim početkom reči. Alat nije prijavio nijedan rez usred reči.
Svaki Short: **Related video → Greek Gods, Part 4** (YouTube Studio → Short → Details → Related video).
Linkovi u opisu i komentarima Shortsa nisu klikabilni, pa je Related video jedini klikabilan put ka long videu;
zato opis i pin komentar kažu „linked on this Short" / „linked video", a ne daju URL.
Chaptera nema: YouTube ih na Shortsima ne prikazuje.
Naslov Shorta ne ponavlja nijedan od pet naslova long videa (`publish.md`); svaki je o jednom delu priče, što je mesto
za naslov Shorta, a ne long videa (SHORT TEST).

Redosled objave: 1 → 2 → 3, kao u priči. Sva tri staju na pitanju na koje odgovara tek long video (kako je Hera izašla iz
prestola, šta je bilo kad su se lanci zatvorili, zašto se Posejdon nije smejao), pa sva tri vuku ka dugom videu. Ako objaviš samo
jedan, Short 2 je najjači hook (lanci, tegla, Sunce).

Napomena o Short 2: u kadru 24 Afrodita i Ares leže pod pokrivačem navučenim do ramena, vide im se samo glave, a mreža pada
preko pokrivača (`docs/series/greek-gods.md` 4.7). Izvorni klip traje 5.97s, a Short traži 6.00s za taj kadar: poslednji
frejm se drži 0.03s, što se ne vidi.

## Ruta do Shorta

**Gotov 9:16 fajl** — `short1.mp4` … `short3.mp4` (1080×1920, titlovi ugrađeni, prozor prati likove). Studio → Create →
Upload videos; YouTube ga sam prepozna kao Short (vertikalan, ispod 60s). Titlove ne treba slati: već su u slici;
`.srt` je samo za CC (Studio → Short → Subtitles → Add language (English) → Upload file → With timing).
YouTube editor iz long videa u ovoj epizodi nije potreban: nijedan Short nije samo rez za editor.

---

## 1. Zlatni presto (montaža — objaviti prvi)

`short1.mp4` · 1080×1920 · 34.8s · **montaža, ne rez**: počinje usred rečenice S04 (od „Hephaestus"), jer „She bore a son of
her own, without Zeus" traži Heru i Atinino rođenje, koji su u prethodnom delu priče.
Počinje imenom i obećanjem („the greatest craftsman among the gods"), odmah posle toga udara „But he was born lame", a
završava na pitanju na koje odgovara samo long video: Hera je zarobljena, a on neće da je oslobodi. Petlja se nazad na
početak: „…free her." → „Hephaestus, who would become the greatest craftsman among the gods."

Zašto je renderovan, a ne rez:
- **Početak usred rečenice:** S04 od „Hephaestus" (bez „She bore a son of her own, without Zeus —"), pa Short ne traži
  prethodnu priču. Editor ume samo ceo komad.
- **Pauze:** razmak između rečenica 0.24s umesto ~0.5–1.2s, unutrašnje pauze skupljene na 0.3s. Zato je Short 34.8s, a isti
  komad u long videu (0:13.5–0:54.2) traje 40.7s.
- **Preskočeno:** ništa u sredini; Short je neprekinut S04–S13 osim prvog dela S04 i skraćenih pauza.
- **Slika:** 8 kadrova iz izvornih fajlova (klipovi 1080p, slike 2752×1536); prozor 9:16 ostaje na Heri sa detetom, prati
  Heru preko ograde, pa prelazi na boginje u talasima, dečaka u pećini, kovača, presto na nosilima, Heru u prestolu i na kraju
  Hefesta kod nakovnja, koji kuje dalje. Rez slike je 0.08s pre glasa. Zvuk klipova ispod narracije na 15%.
- **Titlovi** ugrađeni, aktivna reč zlatna.

Gde je šta u long videu: S04 (od „Hephaestus") 0:13 · S05 0:21 · S06 0:25 · S07 0:26 · S08 0:30 · S09 0:37 · S10 0:40 · S11 0:45 · S12 0:49 · S13 0:51.
Kadrovi: 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11.
Cover frame: shot10 (Hera na zlatnom prestolu, niti svetla oko ruku), u Shortu oko 0:28.
Izmena ili ponovni render: `node tools/short.mjs episodes/greek-gods-part-4 short1 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Hephaestus, who would become the greatest craftsman among the gods. But he was born lame, and Hera was ashamed of him. She threw him off Olympus. Two sea goddesses caught him as he fell. For nine years he lived in a cave beneath the waves, making jewellery for them, and no other god knew he was alive. A later tradition says he took his revenge. When he was grown, he sent his mother a gift: a golden throne. Hera sat down, and invisible chains closed around her. She could not stand. Hephaestus refused to come to Olympus and free her.

TITLE OPTIONS:
1. Hera Threw Her Son Off Olympus. He Sent Her a Golden Throne — the revenge
2. Hephaestus Sent Hera a Golden Throne, and Invisible Chains Closed Around Her — the trap
3. For Nine Years, No Other God Knew Hephaestus Was Alive — the hidden years
4. Why Did Hephaestus Refuse to Free His Own Mother? — the question
5. Two Sea Goddesses Caught the God Hera Threw Off Olympus — the rescue

DESCRIPTION:
Hephaestus was born lame, and Hera was ashamed of him. She threw him off Olympus, and two sea goddesses caught him as he fell. For nine years he lived in a cave beneath the waves, making jewellery for them, and no other god knew he was alive.

A later tradition says he took his revenge. When he was grown, he sent his mother a gift: a golden throne. Hera sat down, and invisible chains closed around her. She could not stand, and Hephaestus refused to come to Olympus and free her.

How she finally went free, and what Hephaestus built for his wife, are in Greek Gods, Part 4, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Hephaestus #Hera #GoldenThrone

PINNED COMMENT:
Hera threw her son off Olympus, and he sent her a throne she could not rise from. Who was crueler here: the mother who threw him away, or the son who chained her to a gift? Full story in the linked video ▶️

SUBTITLES:
short1.srt — 11 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short1.mp4`; fajl je samo za CC.

---

## 2. Lanci koje niko ne vidi (montaža — objaviti drugi)

`short2.mp4` · 1080×1920 · 50.5s · **renderovan neprekinut komad**: S20–S31 su u long videu jedan do drugog (1:21–2:13, ~52s),
pa bi ga editor mogao iseći i sam. Renderovan je jer editor seče središnji deo kadra, a kadrovi su komponovani za 16:9 (Ares, Helije
i Hefest ispadaju iz sredine), i jer su pauze skupljene. Nije rearanžiran: nema hooka s kraja, redosled je kao u videu.
Počinje S20 („Aphrodite loved another: Ares, the god of war."), prvom rečenicom o ljubavnoj priči, a
završava u trenutku kad se lanci zatvore („…neither could lift a limb."). Petlja se nazad na početak.

Šta renderovanje radi bolje od reza:
- **Skraćene pauze:** razmak 0.24s umesto ~0.5–1s, unutrašnje pauze 0.3s; predah 0.4s ispred „But the Sun sees everything."
  (opcija `before`), jer ta rečenica je okretna tačka.
- **Slika:** 10 kadrova iz izvornih fajlova; prozor kreće sa Afrodite na Aresa („Ares, the god of war"), prati ga u trku do
  Zevsa, u teglu sa Hermesom, na Helija i Hefesta, na lance na nakovnju, na krevet sa mrežom, na kovača koji pokazuje ka
  moru i na Aresa koji dolazi. Poslednji kadar je krevet pod pokrivačem navučenim do ramena i mreža koja pada preko njega.
  Rez slike je 0.08s pre glasa. Zvuk klipova ispod narracije na 15%.
- **Titlovi** ugrađeni, aktivna reč zlatna.

Gde je šta u long videu: S20 1:21 · S21 1:25 · S22 1:33 · S23 1:40 · S24 1:43 · S25 1:47 · S26 1:49 · S27 1:57 · S28 2:01 · S29 2:04 · S30 2:06 · S31 2:07.
Kadrovi: 14 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24.
Cover frame: shot20 (Hefest kuje lance na nakovnju, lanci se vuku po podu), u Shortu 0:26–0:34.
Izmena ili ponovni render: `node tools/short.mjs episodes/greek-gods-part-4 short2 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Aphrodite loved another: Ares, the god of war. He was Hera's other son — Hephaestus's own brother — the swiftest god on Olympus, and the one Zeus said he hated most. Once, two giants had chained him in a bronze jar for thirteen months, until Hermes stole him out. But the Sun sees everything. Helios saw the two of them together, and went straight to Hephaestus. Hephaestus went to his forge. He hammered out chains as fine as spider webs — too fine for any god to see, too strong for any god to break. He fixed them around his bed, and hung them from the roof beams. Then he announced that he was leaving for Lemnos. Ares had been watching the house. He came at once. The two lay down together — and the chains closed around them, and neither could lift a limb.

TITLE OPTIONS:
1. Helios Saw Aphrodite With Ares and Went Straight to Her Husband — the tip-off
2. Hephaestus Hammered Out Chains Too Fine for Any God to See — the chains
3. The God of War Was Once Chained in a Bronze Jar for Thirteen Months — the jar
4. Hephaestus Said He Was Leaving for Lemnos. Ares Came at Once — the trick
5. Why Ares, the Swiftest God on Olympus, Could Not Lift a Limb — the irony

DESCRIPTION:
Aphrodite loved another: Ares, the god of war, Hera's other son, Hephaestus's own brother, the swiftest god on Olympus, and the one Zeus said he hated most. Once, two giants had chained him in a bronze jar for thirteen months, until Hermes stole him out.

But the Sun sees everything. Helios saw the two of them together and went straight to Hephaestus, who went to his forge and hammered out chains as fine as spider webs, too fine for any god to see, too strong for any god to break. He fixed them around his bed and hung them from the roof beams, announced that he was leaving for Lemnos, and Ares came at once. The two lay down together, and the chains closed around them.

Who came to look, who laughed and how the trap ended are in Greek Gods, Part 4, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Ares #Aphrodite #Hephaestus

PINNED COMMENT:
Chains too fine for any god to see, too strong for any god to break. Whose fault was the trap: the husband who forged it, the brother who walked into it, or the Sun who told? Full story in the linked video ▶️

SUBTITLES:
short2.srt — 16 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short2.mp4`; fajl je samo za CC.

---

## 3. Bogovi dolaze da vide (montaža — objaviti treći)

`short3.mp4` · 1080×1920 · 47.4s · **montaža, ne rez**: S32–S44 sa dve preskočene rečenice (S35–S36) i skupljenim pauzama.
Počinje kad se Hefest vraća („Hephaestus turned back before Lemnos."), odmah posle toga stoji u vratima i zove sve bogove na
nešto „laughable and unbearable", a završava na S44 („Only Poseidon did not laugh.") sa 0.5s predaha ispred: pitanje na
koje odgovara tek long video. Petlja se nazad na početak.

Zašto je renderovan, a ne rez:
- **Preskočeno:** S35 (traži nazad poklone) i S36 (boginje ostaju kod kuće): ne nose ovaj Short, a rez bi ih nosio.
  Bez njih Short staje na 47s umesto 57s.
- **Pauze:** razmak 0.24s umesto ~0.5s, unutrašnje pauze skupljene na 0.3s; predah 0.5s pred „Only Poseidon did not laugh."
  (opcija `before`).
- **Slika:** 9 kadrova iz izvornih fajlova; prozor prati Hefesta kroz prag, sa Hefesta na Hermesa, Apolona i Posejdona na
  stazi, na Hermesa koji se šeguje, na bogove koji se smeju i, na kraju, na Posejdona koji ne. Rez slike je 0.08s pre
  glasa. Zvuk klipova ispod narracije na 15%.
- **Titlovi** ugrađeni, aktivna reč zlatna.

„such chains" u S38 nema antecedent u ovom Shortu (S31 je u Shortu 2), ali ga nose kadrovi: u kadrovima 31–34 se vidi mreža
iznad kreveta, a S33 kaže „something laughable and unbearable".

Gde je šta u long videu: S32 2:13 · S33 2:16 · S34 2:23 · S37 2:38 · S38 2:42 · S39 2:48 · S40 2:54 · S41 2:57 · S42 3:00 · S43 3:02 · S44 3:09.
Kadrovi: 25 → 26 → 27 → 30 → 31 → 32 → 33 → 34 → 35.
Cover frame: shot33 (bogovi se smeju, Hermes i Apolon u prvom planu), u Shortu 0:31–0:36.
Izmena ili ponovni render: `node tools/short.mjs episodes/greek-gods-part-4 short3 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
Hephaestus turned back before Lemnos. He stood in his doorway and called for Zeus and every god to come and see something laughable and unbearable. Aphrodite, he said, had always scorned him for his lame leg, and loved Ares because Ares was handsome and sound of foot. The gods came — Poseidon, Apollo and Hermes. Apollo asked Hermes whether he would take such chains for a night with golden Aphrodite. Hermes said he would take three times as many, with every god looking on. The gods roared with laughter. "Bad deeds do not prosper," one said. "The slow one has caught the swift. Lame as he is, Hephaestus has caught the swiftest god on Olympus — by craft." Only Poseidon did not laugh.

TITLE OPTIONS:
1. Hermes Said He Would Take Three Times as Many Chains, With Every God Looking On — the boast
2. Only Poseidon Did Not Laugh at Hephaestus's Net — the cliffhanger
3. Hephaestus Called Every God on Olympus to Come and See — the summons
4. Apollo Asked Hermes if He Would Take Such Chains for a Night With Aphrodite — the question
5. "The Slow One Has Caught the Swift": The Gods Laugh at Hephaestus — the verdict

DESCRIPTION:
Hephaestus turned back before Lemnos. He stood in his doorway and called for Zeus and every god to come and see something laughable and unbearable. Aphrodite, he said, had always scorned him for his lame leg, and loved Ares because Ares was handsome and sound of foot.

The gods came: Poseidon, Apollo and Hermes. Apollo asked Hermes whether he would take such chains for a night with golden Aphrodite, and Hermes said he would take three times as many, with every god looking on. The gods roared with laughter. "The slow one has caught the swift," one said. Only Poseidon did not laugh.

Why he did not, and what he promised Hephaestus, are in Greek Gods, Part 4, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#GreekMythology #Hephaestus #Hermes #Poseidon

PINNED COMMENT:
Hermes said he would take three times as many chains with every god looking on, and only Poseidon did not laugh. Hermes, Apollo or Poseidon: which of the three would you want standing beside you in that doorway? Full story in the linked video ▶️

SUBTITLES:
short3.srt — 14 titlova, vremena iz montaže (ne iz long videa). Titlovi su ugrađeni u `short3.mp4`; fajl je samo za CC.
