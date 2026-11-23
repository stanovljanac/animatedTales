# greek-gods-compilation — beleške produkcije

Sva četiri dela serije Greek Gods u jednom videu, **15:04** (904.79s), 1080p, bez ijednog novog
kadra, klipa ili reda naracije. Odluka korisnika 2026-11-22; plan je u `docs/series/greek-gods.md` §8.

Pravi se alatom `tools/compile.mjs` iz `compile.json`, a montira ga običan `tools/assemble.mjs`:

```
node tools/compile.mjs   episodes/greek-gods-compilation      # prozori, narration.mp3, storyboard/timing/episode.json
node tools/assemble.mjs  episodes/greek-gods-compilation      # final.mp4 (segmenti iz .cache/seg)
node tools/publish.mjs   episodes/greek-gods-compilation      # subtitles.srt
```

`storyboard.json` je montažni dokument (vremena, izvori, poreklo `origin` svakog kadra), ne
prompt-dokument — promptovi žive u izvornim delovima, pa ga `lint.mjs` i `render.mjs` ne obrađuju.
Mediji u `shots/<1-4>/` su tvrdi linkovi na izvorne delove (0 bajtova viška na disku).

## Šta ostaje, šta otpada

| Deo | Ostaje | Otpada | Skinuto |
|---|---|---|---|
| Part 1 | S01–S54 (cela priča) | outro S55–S60, end kartica | 27.9s |
| Part 2 | S02 (most), S10–S53 | rekap S01, S03–S09 (tri brata, Kron, podela — sve iz Part 1), outro, end kartica | 64.3s |
| Part 3 | S01–S53 (cela priča) | outro S54–S60 (uključujući teaser mreže), end kartica | 30.3s |
| Part 4 | S02 (most), S04–S52 | rekap S01 (Atina iz glave) i S03, oba kadra kopirana iz Part 3; outro S53–S58 sa „twelve thrones" i end karticom | 37.5s |

Ukupno 17:45 → 15:04 (skinuto 2:40). Poglavlja: 0:00 Part 1 · 3:33 Part 2 · 7:07 Part 3 · 11:26 Part 4.

## Treba li nove scene? Ne — spojevi staju na postojeći materijal

Pitanje je bilo da li su potrebne nove scene koje spajaju delove ili dopunjuju priču. Prošao sam
sva tri spoja i nijedan ne traži generisanje (Flow krediti: nula).

**Part 1 → 2.** Part 1 se završava jakom rečenicom („…arrives, eventually, in his share of it.") i
kolonom sivih figura. Part 2 bez rekapa počinje „The sisters got no kingdom" — a ko su sestre, nije
rečeno. Most je Part 2 S02, „Their three sisters were never given a lot.", koju je Part 2 već imao u
svom otvaranju. Za nju je Part 2 već imao i kadar koji ništa ne ponavlja: still kacige na boku u pepelu
i tri duge senke žena (Part 2 shot 07). Isti still nosi i S10, pa je to jedan kadar od 4.8s sa jednim
pokretom kamere. S11 se ne može odvojiti od S10 (u zvuku nema tišine između njih, izmereno), pa S10
ostaje: „Their three sisters were never given a lot. The sisters got no kingdom. They got something
smaller…" — blago ponavljanje, ali kao retorička figura prolazi.

**Part 2 → 3.** Direktan rez. Part 3 počinje svojom uvodnom rečenicom („Zeus had overthrown a father
who swallowed his own children. Then he took a wife…"), koja ujedno vraća Zevsa kao subjekat posle
poglavlja o sestrama. Kadrovi su novi (Zevs nad poraženim Kronom, Zevs i nova žena), ne kopije iz Part 1,
pa to nije ponovljena scena. **Ovo je jedino mesto gde rekap-rečenica ostaje**, svesno: bez nje „Then he
took a wife" nema o kome da se kaže. Ako korisnik hoće i nju van, to traži novu uvodnu rečenicu.

**Part 3 → 4.** Part 4 bez rekapa počinje „So, Hesiod says, she answered in anger" — „she" bi se posle
„His mother is still inside Zeus" pročitalo kao Metida. Most je Part 4 S02, „Hera could not stop a
child born from her husband's head.", ali njen originalni kadar je kopija Part 3 shot 20 (isti klip
koji je gledalac video oko 2.5 minuta ranije, na 8:58). Zato S02 ide preko Herinog besa, Part 4 shot 03 (klip
napravljen za S03, sada sa S02): Hera lupa pesnicama o sto, prosuti pehar. Onda S04 sa Herom i
novorođenčetom. Gubi se S03 („So, Hesiod says, she answered in anger.") — bes pokazuje kadar, a
Hesiodovo ime se vraća u S49.

**Opciono, ako korisnik želi više od ovoga** (ništa od toga nije potrebno za priču):

1. *Završna rečenica compilationa.* Video staje na „…he let them go." i Hefestovim otvorenim šakama.
   Part 4 outro ima sliku dvanaest prestola (shot 43) koja je pravi završetak za compilation od 12 bogova,
   ali je vezana za rečenicu „Next on the channel…", pa je izbačena. Upotrebljiva je samo uz novu
   naraciju (npr. jedna rečenica o dvanaest bogova) — nju može da snimi samo korisnik (ElevenLabs).
2. *Naslovne kartice poglavlja.* Nisu pravljene; poglavlja idu kroz YouTube chaptere u opisu.

## Za proveru uhom i okom

- Tri spoja zvuka (3:33, 7:07, 11:26) su rezovi u digitalnoj tišini; slušaj ih jednom.
- Pauze na spojevima: Part 1→2 1.2s, most→S10 0.8s, Part 2→3 0.7s, Part 3→4 0.9s, most→Part 4 telo 0.8s.
- Titlovi: `subtitles.srt` je engleski. Part 3 ima es/fr/it prevode; za compilation nisu spajani.
- `publish.md` i `medium.md` nisu pisani. `episode.json` nema `protagonists` (dvanaest bogova ne staje
  u naslov); `publish.mjs` će to prijaviti dok se ne upiše grupa, npr. `[["12 Gods", "Twelve Gods"]]`.

## Šta je popravljeno u alatima usput

`assemble.mjs`: ambijentalni trag pravi jednu ffmpeg komandu sa po jednim ulazom po klipu. Sa 105
klipova komanda je prešla Windows limit (`spawn ENAMETOOLONG`); iznad 24000 znakova filter graf sada
ide u `.cache/ambient-filter.txt` (`filterToScript`). Pojedinačne epizode (~30 klipova) nisu bile pogođene.

## Okvir: uvod i završetak (odluka korisnika 2026-11-22)

Korisnik je odlučio da compilation dobije kratak uvod koji obećava celinu i završnu rečenicu. Tekst je u
`framing.md`; snima ga korisnik (ElevenLabs, isti glas) kao `framing/intro.mp3` (~25 s) i `framing/outro.mp3`
(~10 s). Plan sa okvirom je `compile.framed.json`; `compile.json` je „goli" compilation koji je već montiran.

Kadrovi okvira su slike iz outroa delova koje compilation inače ne koristi, pa nijedna scena nije ponovljena:

| Gde | Kadar | Zašto |
|---|---|---|
| uvod, „father who swallowed his own children… prophecy" | Part 3 shot 47 (Kron iza Zevsa sa zavijenim kamenom) | očev senka nad sinom, tačno rečenica |
| uvod, „a son who built a net no one could see" | Part 3 `part48` (mreža nad krevetom, crveni sjaj kovačnice) | klip od 7.9s koji je Part 3 imao kao teaser |
| uvod, „the sky, the sea, the dead" | Part 1 `part36` (tri sprata sveta) | |
| uvod, „the harvest" / „the hunt" / „the war" | Part 2 shot 45 (kruna, žito, vatra) / Part 3 shot 49 (maslina, lira, luk) / Part 4 shot 44 (čekić, pojas, šlem) | po jedan emblem trojke |
| završetak | Part 4 shot 43 (dvanaest prestola oko vatre), uz 10 s držanja bez glasa | mesto za YouTube završni ekran (subscribe + sledeći video) |

Sklapanje čim fajlovi postoje (alat staje ako ijedan fali):

```
node tools/compile.mjs  episodes/greek-gods-compilation --plan compile.framed.json
node tools/assemble.mjs episodes/greek-gods-compilation      # samo novi segmenti se renderuju, ostalo iz keša
node tools/publish.mjs  episodes/greek-gods-compilation      # subtitles.srt
```

**Sklopljeno 2026-11-22** sa pravim fajlovima: **15:50** (950.83s), 163 kadra, `final.mp4` 1080p.
`intro.mp3` 24.2s (govor 0.13–23.96s), `outro.mp3` 11.4s (govor 0.15–11.13s) + 10s tišine nad prestolima.
Poglavlja: 0:00 uvod · 0:24 Part 1 · 3:58 Part 2 · 7:32 Part 3 · 11:50 Part 4 · završetak 15:29.

Šta je podešeno po izmerenim fajlovima (silencedetect, `speechGaps`):

- `text` uvoda i završetka nosi `{ text, start, end }` po stavci, pa titlovi prate stvaran govor (bez
  srazmerne raspodele po slovima). Nabrajanje „the sky, the sea, the dead — the harvest, the hunt, the war"
  je razbijeno na tri titla po pauzama.
- Rezovi kadrova uvoda (`at`) su u tišini tik pre reči: mreža 10.1s, tri sprata sveta 13.95s, kruna/žito/vatra
  18.5s, maslina/lira/luk 19.45s, čekić/pojas/šlem 20.3s. Prvi kadar (Kron) ostaje od 0.
- Uvod ima `hold: 0.6` — fajl se završava 0.23s posle poslednje reči, pa je pauza ka Part 1 bila 0.32s;
  sada je 0.79s (izmereno u final.mp4).
- Pauza ispred završne rečenice je 0.6s (izmereno); duža traži početnu tišinu u spoljnom runu, kojeg alat nema.
- Jedini kandidat za regeneraciju iz QC-a: shot 348 (klip mreže, Part 3 `part48.mp4`), iskorišćeno 48.3% —
  uvod koristi prvih 3.8s od 7.9s klipa.

Thumbnailovi (korisnik, 2026-11-22): `shots/thumb1.jpg` „HIS SON SWALLOWED A WIFE", `thumb2.jpg` „ZEUS CHAINED
HIS WIFE", `thumb3.jpg` „ONE FAMILY 12 THRONES". Natpisi se razlikuju od `thumbnails.md` (B varijante), pa
naslove u `publish.md` treba pisati prema ovim.

Thumbnailovi i naslovi za A/B test: `thumbnails.md` (tri koncepta, A i B), `publish.md` posle montaže.
