# Shorts — substitute-king

Sve vezano za Shortove živi u ovom folderu (`episodes/substitute-king/short/`): `shorts.md` (tekst za YouTube),
`shorts.json` (ulaz za `tools/short.mjs`), `short1.mp4` i `short1.srt`.

| Short | Šta | Fajlovi |
|---|---|---|
| 1 Damki | **montaža** iz izvornih slika i delova narracije, 50,3s | `short1.mp4`, `short1.srt` |

Jedan Short, na zahtev: epizoda je celu priču dobila kao slike, pa je izabrana jedna samostalna celina i sastavljena od
12 vizuelno različitih kadrova (04, 01, 02, 18, 19, 20, 21, 23, 24, 22, 25, 26), bez ponavljanja kompozicije.
Izvor: `narration.mp3` i slike iz `shots/`. Vremena su iz `timing.json`, ali je svaki rez proveren prema stvarnom govoru
(silencedetect), kao i u ostalim epizodama.
Short: **Related video → The Substitute King** (YouTube Studio → Short → Details → Related video).
Linkovi u opisu i komentarima Shortsa nisu klikabilni, pa je Related video jedini klikabilan put ka long videu;
zato opis i pin komentar kažu „linked on this Short" / „linked video", a ne daju URL.
Chaptera nema: YouTube ih na Shortsima ne prikazuje.
Naslov Shorta ne ponavlja naslov long videa (`publish.md`): svi naslovi ispod su o Damkiju, a naslovi long videa o celom ritualu.
Short ne otkriva kraj long videa: baštovan Enlil-bani, smrt Asarhadona i priča iz Isina ostaju samo u dugom videu.

## Ruta do Shorta

**Gotov 9:16 fajl** — `short1.mp4` (1080×1920, titlovi ugrađeni, prozor prati likove). Studio → Create → Upload videos;
YouTube ga sam prepozna kao Short (vertikalan, ispod 60s). Titlove ne treba slati: već su u slici; `.srt` je samo za CC
(Studio → Short → Subtitles → Add language (English) → Upload file → With timing).
YouTube editor iz long videa nije potreban: Short je montaža, ne neprekinut rez.

---

## 1. Damki (montaža)

`short1.mp4` · 1080×1920 · 50.3s · **montaža, ne rez**: u dugom videu ove rečenice nisu jedna do druge.
Cold open: počinje rečenicom S01 koja je hook sama po sebi, preskače sve o zvezdama, Asarhadonovim pismima i detaljima
obreda, pa preko tri kandidata („a condemned criminal, a prisoner, a laborer") stiže do Damkija i staje na „She was right."

Zašto je bolji od reza (ono što YouTube editor ne ume):
- **Redosled:** S01–S02 su premisa iz prvih 12s videa, a Damki i proročica su 1:35–2:19; u dugom videu između njih je
  skoro 80s (zvezde, pisma, Šamaš, sto dana). Ovde ide jedan do drugog, pa Short ima premisu i poentu bez ičega između.
- **Preskočeno:** S03–S20 (omeni, Asarhadon, pisma, odora, „To the farmer"), S24 (agent), S30–S50 (Asarhadonova smrt,
  Isin, kraj). Ostaje za long video.
- **Zvuk:** rečenice iz 10 različitih mesta narracije, svaka sečena na stvarnu tišinu; razmak 0.24s umesto ~1s, unutrašnje
  pauze skupljene na 0.3s; 0.7s tišine ispred „She was right." da poenta dobije predah.
- **Slika:** 12 kadrova iz izvornih fajlova (slike 2752×1536), ne iz `final.mp4`; svaki ima svoj 9:16 prozor koji prati lika
  i klizi na reč (tri zarobljenika: „a condemned criminal" → „a prisoner" → „a laborer"; „decorated…" → odri, „wailed over" →
  narikače). Rez slike je 0.08s pre glasa.
- **Titlovi** ugrađeni, aktivna reč zlatna.

Gde je šta u long videu: S01 0:00 · S02 0:06 · S21 1:35 · S22 1:42 · S23 1:47 · S25 1:56 · S26 2:04 · S27 2:09 · S28 2:12 · S29 2:17.
Kadrovi: 04 → 01 → 02 → 18 → 19 → 20 → 21 → 23 → 24 → 22 → 25 → 26.
Cover frame: shot25 (proročica pokazuje na Damkija), u Shortu 0:44–0:48 — slika na koju odgovara naslov.
Izmena ili ponovni render: `node tools/short.mjs episodes/substitute-king short1 --sheet` (~2 min); sve se menja u `shorts.json`.

TRANSCRIPT (kako se čuje u Shortu):
When the moon went dark over ancient Assyria, the king's scholars had a way to save his life. They put another man on his throne — and when the danger had passed, they let that man die in the king's place. The scholars preferred a man whose death would trouble no one: a condemned criminal, a prisoner, a laborer. But in 671 BCE, the substitute was someone who mattered. Damqi was the son of a high temple official in the Babylonian city of Akkad. Damqi, "who had ruled Assyria, Babylonia and all the countries, died with his queen," as a substitute for the king. "He and his queen were decorated, treated, displayed, buried and wailed over." Then the report adds something else. Before the ritual, a prophetess had told Damqi: "You will take over the kingship!" She was right.

TITLE OPTIONS:
1. A Prophetess Told Damqi "You Will Take Over the Kingship." She Was Right — the prophecy
2. Damqi "Ruled" Assyria, Babylonia and All the Countries, Then Died in the King's Place — the quoted report
3. Decorated, Treated, Displayed, Buried and Wailed Over: A Substitute King's Fate — the five verbs
4. Why Was Assyria's Substitute King Buried and Wailed Over Like a Real One? — the question
5. Criminals Were Preferred as Substitutes. In 671 BCE, It Was a Temple Official's Son — the exception

DESCRIPTION:
When the moon went dark over ancient Assyria, the king's scholars had a way to save his life: they put another man on his throne and let him die in the king's place. The scholars preferred a man whose death would trouble no one, a condemned criminal, a prisoner or a laborer. But in 671 BCE, the substitute was someone who mattered.

His name was Damqi, the son of a high temple official in the city of Akkad. The report on his end says he "had ruled Assyria, Babylonia and all the countries" and died with his queen, decorated, treated, displayed, buried and wailed over. Before the ritual, a prophetess had told him: "You will take over the kingship!" She was right.

The full story of the substitute king ritual, the letters of Esarhaddon's scholars and the oldest tale of all is in The Substitute King, linked on this Short. Subscribe to Animated Tales for more animated stories from history, mythology, legends and the ancient world.

HASHTAGS:
#AncientHistory #Assyria #Mesopotamia #Damqi

PINNED COMMENT:
A prophetess told Damqi he would take over the kingship, and the letter never says whether that is why he was chosen. Was it a cruel coincidence, or did the scholars pick him because of the prophecy? Full story in the linked video ▶️

SUBTITLES:
short1.srt — 14 titlova iz plana Shorta (rečenice S01, S02, S21, S22, S23, S25, S26, S27, S28, S29), od 0:00; poslednji se gasi na 0:50.04.
Važi samo za `short1.mp4`. Ugrađeni titlovi u `short1.mp4` rade bez ovog fajla.
