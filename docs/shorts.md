# Shortovi iz long videa

Radi se **posle publish kompleta**, kad je `final.mp4` gotov. **Sve vezano za Shortove ide u folder
`episodes/<slug>/short/`**, ništa u koren epizode, da se fajlovi lako razdvoje:

```
episodes/<slug>/short/
  shorts.md       tekst za YouTube: rezovi, naslovi, description, hashtagovi, pin komentar
  shorts.json     ulaz za tools/short.mjs (rezovi, prozori, montaža)
  short1.mp4      samo ono što je renderovano
  short1.srt
```

Primeri: `greek-gods-part-3/short/`. Starije epizode (Part 1, 2, heavenly-horses) imaju `shorts.md` u korenu;
ne premeštati bez zahteva.

## Koliko Shortova

**Onoliko koliko ima samostalnih celina koje su zanimljive publici: od 1 do 5.** Broj nije cilj i ne puni se da bi
se popravili brojevi. Short koji ne bi gledao neko ko nije video long video ne pravi se. Dva Shorta iste priče se
međusobno jedu, pa se spajaju u jedan bolji. Kad Mihailo traži Short za određenu temu, pravi se;
samo se ne ponavljaju rečenice koje je neki raniji Short iste epizode već iskoristio.

## Šta se renderuje, a šta samo zapisuje

YouTube editor (beta) iseca **jedan neprekinut komad** long videa, do 60s, i to Mihailo radi sam, bez tokena.
Zato postoje dva tipa Shorta:

| Tip | Šta je | Šta se isporučuje |
|---|---|---|
| **Rez** | neprekinut komad `final.mp4` | samo vremena u `shorts.md` + `shortN.srt` (`--srt-only`); **ne renderovati** |
| **Montaža** (`"type": "edit"`) | sastavljen iz delova narracije i izvornih kadrova koji u videu nisu jedan do drugog | `shortN.mp4` renderovan, plus tekst |

Render ide samo za montažu, jer je to jedino što editor ne ume. Rez se renderuje tek ako Mihailo to traži.

### Šta montaža radi bolje od reza

- **Hook ispred:** rečenica koja izaziva pitanje ili udara slikom ide na početak, makar je u videu pred kraj; priča se
  vraća, kraj odgovara. Može biti i rečenica iz sredine koju video objašnjava tek posle (Atina: skok u oklopu ide pre „iz
  glave", pa „her" ima koga da imenuje).
- **Predah:** `before` u `lines` daje tišinu ispred rečenice (ime junaka, poenta), ostali razmaci ostaju 0.24s.
- **Preskakanje:** rečenice koje ne nose Short ispadaju; ostaje ono što se razume bez long videa.
- **Zvuk:** svaka rečenica se seče na stvarnu tišinu, razmak 0.24s, unutrašnje pauze skupljene na 0.3s.
- **Slika iz izvora:** kadrovi iz `shots/` (klip 1080p, slika 2752×1536), svaki sa 9:16 prozorom koji prati lika; rez slike
  je 0.08s pre glasa; zvuk klipova ispod narracije na 10,5%.
- **Titlovi** ugrađeni, aktivna reč zlatna.
- Završetak koji se petlja u početak.

Uslov: Short mora da razume neko ko nije gledao long video. Rečenica sa zamenicom čiji je početak ostao u videu
(„she", „then") ne ide na početak; ako mora, seče se na reč (`from`).

## Kako se bira (za oba tipa)

- 30–58s, ispod 60s.
- **Početak** je rečenica koja je hook sama po sebi.
- **Kraj** je ili zaokružena celina, ili rečenica koja ostavlja pitanje na koje odgovara tek long video.
- **Nikad kraj long videa.** Poslednja poenta ostaje samo u dugom videu.
- Dva Shorta ne dele isti hook, a nijedan ne sme biti naslov long videa (`docs/publish.md`, SHORT TEST).
- **Redosled objave:** prvo cliffhangeri, zaokružena priča poslednja.

## Rez

Rez pada na granicu kadra iz `storyboard.json` (`t_in` / `t_out`), ali se **proverava prema govoru**: whisper
alignment kasni 0.1–0.17s za stvarnim početkom reči, a rez kadra sedi na alignment vremenu, pa rez „tačno na kadru" ume
da odseče prvi slog. `tools/short.mjs` meri govor u `narration.mp3` (silencedetect) i prijavi rez usred reči. Kraj se
stavlja ~0.4–0.6s posle poslednje reči, u tišini, nikad u sledeću rečenicu.

Prvih 10 frejmova klipa može da ima crnu traku pri vrhu (greek-gods-part-3 shot01); alat ih zamenjuje prvim čistim.

## Izrez 9:16

Kadrovi su komponovani za 16:9, a fiksni središnji izrez (to radi i editor) seče likove. Svaki kadar dobija prozor:
`[cx, cy, z]` = središte kao deo kadra (0..1) i zum; dva ključa klize, tri i više idu linearno. Izbor se radi pregledom
jedne slike: `--sheet` daje po tri frejma svakog kadra; položaj lika se proveri ili na toj slici ili na izvornom frejmu
sa mrežom (`drawgrid`). Prvi pokušaj promašuje pozicije (Leta, Apolon su bili pogrešni), pa računaj na jednu ispravku.

## Koraci

1. Izaberi celine iz `timing.json` + `storyboard.json`; odluči koje su rez, a koje montaža.
2. Rezovi: upiši u `shorts.json`, pokreni `node tools/short.mjs episodes/<slug> <id> --srt-only`.
3. Montaža: upiši `lines` i `visuals`, pokreni `... <id> --srt-only` da vidiš plan (vremena rečenica i kadrova), pa
   `... <id> --sheet`, ispravi prozore, ponovi. Ugovor je u zaglavlju `tools/short-edit.mjs`.
4. Napiši `short/shorts.md` po formatu iz primera: REZ ili izvor, U EDITORU (vreme u m:ss.s), cover frame, TRANSCRIPT iz
   `script.md`, 5 naslova (različite strukture), DESCRIPTION, HASHTAGS, PINNED COMMENT, SUBTITLES.
5. Tekst Shorta: description i pin komentar kažu „linked on this Short" / „linked video", bez URL-a (linkovi u Shortovima
   nisu klikabilni; put je Related video). Pin komentar je pitanje izbora, ne da/ne.
