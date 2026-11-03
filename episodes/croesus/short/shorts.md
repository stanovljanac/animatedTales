# Shorts — croesus

Sve vezano za Shortove živi u ovom folderu (`episodes/croesus/short/`): `shorts.md` (tekst za YouTube),
`short1.mp4`, `short1.srt`, `short2.mp4`, `short2.srt`.

| Short | Šta | Fajlovi |
|---|---|---|
| 1 Solon i najsrećniji čovek | neprekinut rez 0:26.96–1:01.0, renderovan 9:16, 34.0s | `short1.mp4`, `short1.srt` |
| 2 Test proročišta | neprekinut rez 1:01.33–1:54.5, renderovan 9:16, 53.2s | `short2.mp4`, `short2.srt` |

Izvor: `final.mp4` (2560×1440, `episode.json` → `final_file`). Croesus je legacy epizoda: nema `script.md`, `timing.json` ni
`storyboard.json`, pa `tools/short.mjs` ne može da ga renderuje. Oba Shorta su sastavljena jednokratnom skriptom koja koristi
iste funkcije iz `tools/short.mjs` (titlovi sa zlatnom aktivnom rečju, izrez 9:16 koji prati lika, isti fade i enkoder) nad
`final.mp4` i whisper rečima (`medium.en`). Skripta nije sačuvana u repou. Granice kadrova su iz scene-detekcije na finalnom
videu (većina kadrova je ~10s; riznica traje 40.03–60.03 bez reza oko 50s, pa je prozor tamo podeljen po govoru, ne po kadru).

Vremena su proverena prema zvuku. `final.mp4` ima pozadinski sloj (~ −41 dB) koji maskira tišinu, pa su granice reči merene
nad `narration.mp3` (isto trajanje, pomak 0). Whisper je početke rečenica stavljao do 0.6s ranije od stvarnog govora, pa je
prva reč svake rečenice pomerena na kraj tišine (titl ne kreće pre glasa).

| Short | glas kreće | rez od | poslednja reč se gasi | rez do | sledeća rečenica |
|---|---|---|---|---|---|
| 1 | 27.09 | 26.958 | 60.69 | 61.0 | 61.47 |
| 2 | 61.47 | 61.333 | 114.13 | 114.5 | 115.57 |

Short 2 počinje tamo gde Short 1 staje, ali nijedna rečenica nije u oba. Kraj Shorta 2 pada baš na rez kadra (114.53), pa se
u njemu ne vidi sledeći kadar.

Dva čitanja: whisper `medium.en` i `small.en` nad gotovim Shortovima slažu se u svakoj reči. Jedina ispravka je „Halas" →
„Halys" u titlu i tekstu (kao na end kartici, „HALYS RIVER").

Svaki Short: **Related video → The Last Lydian King, Croesus** (YouTube Studio → Short → Details → Related video; naslov uzet
iz `episode.json`, proveri da je isti kao na kanalu).
Linkovi u opisu i komentarima Shortsa nisu klikabilni, pa je Related video jedini klikabilan put ka long videu; zato opis i
pin komentar kažu „linked on this Short" / „linked video", a ne daju URL. Chaptera nema: YouTube ih na Shortsima ne prikazuje.
Nijedan naslov Shorta ne ponavlja naslov long videa.

Redosled objave: 1 → 2. Short 1 staje na Solonovom upozorenju („Croesus did not know how important those words would become"),
Short 2 na „that assumption changed everything". Nijedan Short ne otkriva kraj long videa: ni da se proročanstvo odnosilo na
njegovo sopstveno carstvo, ni pad Sardisa, ni završnu poentu.

## Ruta do Shorta

**Gotovi 9:16 fajlovi** — `short1.mp4`, `short2.mp4` (1080×1920, 24 fps, titlovi ugrađeni, prozor prati likove). Studio →
Create → Upload videos → izaberi Schedule; YouTube ga sam prepozna kao Short (vertikalan, ispod 60s). Titlove ne treba slati:
već su u slici; `short1.srt` / `short2.srt` su samo za CC (Studio → Short → Subtitles → Add language (English) → Upload file →
With timing).

---

## 1. Solon i najsrećniji čovek (rez, renderovan — objaviti prvi)

`short1.mp4` · 1080×1920 · 34.0s · neprekinut rez `final.mp4` 0:26.96 – 1:01.0 (26.958 – 61.000s), 9:16 izrez po kadru.
Počinje na „Croesus had a choice." (hook: kratka rečenica koja odmah traži odgovor), prolazi kroz Solonov posetu i
Krezovo bogatstvo, a završava na „Croesus did not know how important those words would become." — rečenica koja ostavlja
pitanje na koje odgovara tek long video. Izostavljeno: Lidija, Kir i uvod ispred (rečenica „To the east, the Persian king Cyrus
was building an empire." ostaje u long videu, jer „To the east" nema na šta da se osloni) i sve posle (proročišta).
Ne petlja se u početak.

Izrez 9:16 (kadrovi long videa, vreme u `final.mp4`):
- 26.96–30.0 Krez za stolom sa mapom, prozor na Krezu (generali desno van kadra); 30.0–40.0 Solon u hodniku, prozor prati
  njegov hod ulevo→udesno;
- 40.0–50.4 riznica: prozor na Krezu dok pokazuje bogatstvo (Solon na desnoj ivici); 50.4–56.0 prozor prelazi na Solona
  („Solon refused", njegovo upozorenje); 56.0–60.0 klizi nazad na Kreza za „Croesus did not know";
- 60.0–61.0 jahači kod Sardisa (poslednja sekunda je već sledeći kadar long videa).

Cover frame: 0:24.0 (Solon odbija, „refused" zlatna) — slika na koju odgovaraju najjači naslovi.

TRANSCRIPT (kako se čuje u Shortu):
Croesus had a choice. Wait for Persia to grow stronger or strike first. But Croesus was not a man who liked leaving important decisions to chance. Years earlier, according to Herodotus, the Athenian statesman Solon had visited him. Croesus showed him his immense wealth and expected to be called the happiest man alive. Solon refused. His warning was simple. A man's fortune cannot truly be judged until the end of his life. Croesus did not know how important those words would become.

TITLE OPTIONS:
1. Croesus Showed Solon All His Wealth and Expected to Be Called the Happiest Man Alive — the setup
2. Solon Refused to Call King Croesus the Happiest Man Alive — the refusal
3. A Man's Fortune Cannot Truly Be Judged Until the End of His Life — the warning
4. Why Did Solon Refuse to Call a Wealthy King Happy? — the question
5. Croesus Had to Choose Between Waiting for Persia and Striking First — the dilemma

DESCRIPTION:
Croesus had a choice: wait for Persia to grow stronger or strike first. But he was not a man who liked leaving important decisions to chance.

Years earlier, according to Herodotus, the Athenian statesman Solon had visited him. Croesus showed him his immense wealth and expected to be called the happiest man alive. Solon refused. His warning was simple: a man's fortune cannot truly be judged until the end of his life. Croesus did not know how important those words would become.

What happened when Croesus went to war with Persia is in The Last Lydian King, Croesus, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#Croesus #Solon #Herodotus #AncientHistory

PINNED COMMENT:
Croesus wanted to hear that he was the happiest man alive, and Solon would not say it. Do you judge a life by its wealth or by how it ends? Full story in the linked video ▶️

SUBTITLES:
short1.srt — 10 titlova, vremena iz Shorta (od 0:00). Titlovi su ugrađeni u `short1.mp4`; fajl je samo za CC.

---

## 2. Test proročišta (rez, renderovan — objaviti drugi, na schedule)

`short2.mp4` · 1080×1920 · 53.2s · neprekinut rez `final.mp4` 1:01.33 – 1:54.5 (61.333 – 114.500s), 9:16 izrez po kadru.
Počinje na „When Persia became a serious threat, Croesus turned to the gods for an answer." (Krez i Persija su imenovani, pa
Short razume neko ko nije gledao long video), prolazi kroz test sa kornjačom i jagnjetom i pitanje „Should he attack Persia?",
a završava na „…and that assumption changed everything." — poenta koja ostavlja pitanje o čemu je proročanstvo zaista
govorilo; odgovor je samo u long videu. Izostavljeno: sve ispred (Solon) i sve posle (prelazak reke, Tirija, pad Sardisa i
završna poenta). Ne petlja se u početak.

Izrez 9:16 (kadrovi long videa, vreme u `final.mp4`):
- 61.3–70.1 jahač ka Sardisu, prozor sa jahača klizi za njim; 70.1–76.5 proročica pa kotao (kamera se spušta, prozor sa
  proročice na kotao); 76.5–78.6 dva uplašena glasnika (prozor na prvom); 78.6–80.1 proročica u širokom kadru;
- 80.1–91.4 Krez u hramu (prozor na Krezu, proročica van kadra); 91.4–100.1 Krez u krupnom planu sa lovorovim vencem;
- 100.1–110.1 prelazak reke i vojska, prozor klizi ulevo→udesno za konjanikom; 110.1–114.5 konjanik na putu.

Cover frame: 0:14.9 (kornjača i jagnje u kotlu) — slika na koju odgovaraju naslovi 1 i 2.

TRANSCRIPT (kako se čuje u Shortu):
When Persia became a serious threat, Croesus turned to the gods for an answer. But first he decided to test the famous oracles of the ancient world. He sent messengers to several sacred sites and asked them what he was doing on a particular day. At Delphi, the answer was astonishing. The priestess described Croesus boiling a tortoise and a lamb together in a bronze cauldron. That was exactly what he had been doing. The test convinced Croesus that Delphi truly possessed extraordinary knowledge. So he asked the question that mattered. Should he attack Persia? The oracle gave him an answer that seemed almost perfect. If Croesus crossed the Halys River and attacked, he would destroy a great empire. Croesus assumed the great empire meant Persia, and that assumption changed everything.

TITLE OPTIONS:
1. Delphi Knew Croesus Was Boiling a Tortoise and a Lamb in a Bronze Cauldron — the astonishing answer
2. How a Boiling Cauldron Convinced Croesus That Delphi Could Be Trusted — the test
3. The Oracle Said Croesus Would Destroy a Great Empire. He Assumed It Was Persia — the prophecy
4. Which Great Empire Did the Oracle Mean When It Told Croesus to Cross the Halys? — the question
5. Before Attacking Persia, Croesus Tested the Oracles of the Ancient World — the setup

DESCRIPTION:
When Persia became a serious threat, Croesus turned to the gods for an answer. But first he decided to test the famous oracles of the ancient world. He sent messengers to several sacred sites and asked them what he was doing on a particular day.

At Delphi, the answer was astonishing: the priestess described Croesus boiling a tortoise and a lamb together in a bronze cauldron, exactly what he had been doing. The test convinced him that Delphi truly possessed extraordinary knowledge, so he asked the question that mattered: should he attack Persia? The oracle's answer seemed almost perfect. If Croesus crossed the Halys River and attacked, he would destroy a great empire. Croesus assumed the great empire meant Persia, and that assumption changed everything.

What the oracle really meant is in The Last Lydian King, Croesus, linked on this Short. Subscribe to Animated Tales for more animated stories from mythology, legends, history and the ancient world.

HASHTAGS:
#Croesus #OracleOfDelphi #Lydia #AncientHistory

PINNED COMMENT:
Croesus tested the oracles with a tortoise and a lamb before trusting Delphi with the question that mattered. If you were Croesus, would that test have convinced you, or would you have tested the oracle again before going to war? Full story in the linked video ▶️

SUBTITLES:
short2.srt — 15 titlova, vremena iz Shorta (od 0:00). Titlovi su ugrađeni u `short2.mp4`; fajl je samo za CC.
