# el-dorado — alternative za Flow

Redosled pokušaja za svaki rizičan shot ([`docs/reference/flow-filter.md`](../../docs/reference/flow-filter.md)):

1. **Plan A** — original (početni frejm, radnja kako je mit traži).
2. **Plan B** — alternativna slika i animacija, sa zamenjenim rečima i preusmerenom radnjom.
3. **Plan C** — still sa slikom koja je prošla (ili sa najboljom koju imaš), bez Flow klipa.

Aktivan plan je onaj koji stoji u `storyboard.json`. Kad padne, sledeći se prekopira odavde, pa se pokrene
`node tools/lint.mjs episodes/el-dorado` i `node tools/render.mjs episodes/el-dorado`. Plan C ne traži nove
promptove, samo izmenu polja ispod.

| Shot | Rizik | Plan A | Plan B | Plan C |
|---|---|---|---|---|
| 13 | „sexual content": zlatom premazan lik pun u kadru, spreda, bez odeće u promptu | pao (17. nov 2026, poruka „sexual content") | **aktivan** (lik mali, tri četvrtine, bela tkanina od struka do ispod kolena, zlatni pektoral) | still `pull` |

---

## Shot 13 — naslednik postaje gospodar jezera

**Plan A (pao).** Slika: naslednik sam na sredini splava, *near-camera and large*, snimljen spreda i odozdo
(`low`, LS), „his whole body coated in gold", ruke spuštene. Za razliku od shotova 10 i 12 (prošli kao klip, oba
MS, oba sa `a plain cloth at his hips`) u promptu nema nikakvog komada odeće, pa je cela figura gola, zlatna i
velika u sredini kadra. Animation prompt je bio miran (zastava pada, obala urla, kamera se povlači), pa je okidač
slika, ne animacija.

**Plan B (aktivan u `storyboard.json`).** Šta je zamenjeno i zašto:

| Plan A | Plan B | Razlog |
|---|---|---|
| „his whole body coated in gold", bez odeće | lice, kosa, ruke i ramena zlatni; „a long plain white cotton cloth wrapped from his waist to below his knees"; „a broad gold pectoral disc on his chest" | gola koža velika u kadru; odeća je van locka, lock je doslovan |
| „near-camera and large", `low`, „from the front and below" | „mid-ground, about a third of the frame height", `eye`, tri četvrtine okrenut ka ekranu-desno | širi kadar i manji razmer; osa ekrana ostaje (Muisca gledaju udesno) |
| ništa ispred donjeg dela tela | mangal u donjem levom uglu, dim tamjana preko splava i njegovih listova | dodatno pokriva donji deo kadra |
| ACTION: „the white flag comes down" (ishod u slici) | „the white flag stands raised … about to roar" | početni frejm; spuštanje zastave radi animacija |
| animation: „light flaring off the gold on his chest" | „light flaring off his gold pectoral" | bez „chest" uz „gold on" |

Nova slika: `node tools/flow-images.mjs episodes/el-dorado --only 13` (četiri kandidata, besplatno). Animation prompt je
u `storyboard.json` (`Kopiraj animation prompt` u pregledu `flow/index.html`), 6s.

**Plan C.** Kad ni Plan B ne prođe: izabranu sliku shota 13 sačuvaj kao `shots/shot13.jpeg`, pa:

```
"source_file": "shots/shot13.jpeg",
"motion_budget": null,
"gen_len": null,
"animation_prompt": null,
"render_mode": "still",
"still_motion": "pull",
"tags.camera_motion": "pull"
```

(`pull` zadržava povlačenje kamere iz Plana A; `push` je jednako dobar.)
