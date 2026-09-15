# A/B test forme image prompta — antikythera-mechanism

Spec: `docs/superpowers/specs/2026-09-13-forma-image-prompta.md` §4.

**A** je prompt iz `storyboard.json` (profil v3: `SHOT` na početku, blokovi, `RENDER` na kraju) —
uzima se doslovno iz `node tools/shotlist.mjs episodes/antikythera-mechanism --only 06,07,09,10,16,17`.
**B** je ista scena napisana kao `episodes/tyr-and-fenrir/visuals.md`: jedan neprekinut opis, bez
blokova, medij na početku i na kraju, namera kompozicije umesto koordinata. Zaključani opisi
likova stoje i u B verziji, da se poredi forma, a ne sadržaj.

Šest kadrova, po jedan od svake vrste:

| kadar | vrsta | ideja kadra |
|---|---|---|
| 17 | macro | zupčanik izranja iz kore |
| 16 | lik | Stais sa lupom |
| 06 | grupa | posada oko prestravljenog ronioca |
| 09 | okruženje | celo polje olupine |
| 10 | presek | presek mora, brodovi gore, ronioci dole |
| 07 | silueta | ljudi i konji u mraku, kroz okno kacige |

## Postupak

1. Generiši A u Flow-u i sačuvaj kao `shots/shotNN.jpeg`.
2. Generiši B i sačuvaj kao `shots/shotNN-b.jpeg`.
3. Ako je bolja B, preimenuj je u `shots/shotNN.jpeg`, jer montaža čita samo taj fajl.
4. Upiši pobednika u tabelu na dnu. Jedna rečenica zašto je dovoljna.

Ista seed/varijacija nije moguća, pa po verziji uzmi **prvu upotrebljivu** sliku, a ne najbolju od
četiri. Inače poredimo sreću, a ne formu.

Pravilo odluke: ako A pobedi u **≥4/6**, profil v3 ulazi u `prompt-templates.md`. Ako ne pobedi,
`shotlist.mjs` dobija sklapanje neprekinutog opisa iz blokova, a blokovi ostaju ugovor za linter.

---

## 17 — macro

**VISUAL PURPOSE:** otkriće u jednoj slici. Gledalac treba da vidi da je ovo mašina, pre nego što
narracija kaže „a gear wheel".

**B:**

Detailed hand-drawn 2D historical animation illustration, extreme macro close-up of a single hand-cut four-spoked bronze gear wheel emerging from a slab of green-brown corroded bronze crusted like stone, fine sharp triangular teeth catching raking window light, every tooth throwing a tiny hard shadow, rough crystalline verdigris crust breaking away around the rim, bright fresh bronze showing at the breaks, the brass rim of a magnifying glass huge and cropped at the upper-right corner to show how tiny the gear is, the gear filling the frame and facing the viewer squarely, strong sense of something impossibly precise hidden inside a lump of rock, shallow focus with the crust dissolving into warm blur, clean dark outlines, richly detailed hand-drawn 2D historical animation illustration, cinematic film frame, 16:9.

## 16 — lik

**VISUAL PURPOSE:** lice čoveka koji prvi vidi. Emocija je pažnja, ne šok.

**B:**

Detailed hand-drawn 2D historical animation illustration, Valerios Stais, a Greek archaeologist of about forty in 1902, neatly parted dark hair, a full dark moustache, round wire spectacles, a dark wool three-piece suit and a white high-collared shirt, leaning low over a wooden museum tray with a brass magnifying glass raised to one eye, his face lit warm by a tall shuttered window, three-quarter view, eyes fixed on the broken corroded bronze fragments on the tray, intense quiet concentration, the fragments glowing in a bar of light while the museum workroom with long tables of finds falls into soft shadow, composition built on the line from his eye through the lens to the bronze, clean dark outlines, expressive stylized character, richly detailed hand-drawn 2D historical animation illustration, cinematic film frame, 16:9.

## 06 — grupa

**VISUAL PURPOSE:** strah se prenosi sa jednog lica na posadu. Priča o „telima" još nije rešena.

**B:**

Detailed hand-drawn 2D historical animation illustration, cramped deck of a small Greek sponge-diving boat in 1900 after a storm, a sponge diver in a heavy patched canvas diving suit, lead-weighted boots and a thick black air hose, his round copper helmet with three small glass portholes just lifted off by a crewman, his wet bare face white with terror and eyes staring past the viewer, gripping a crewman's arm mid-word, three rough sailors in wool caps crowding in around him with faces shifting from curiosity to fear, coils of rope and a hand-cranked brass air pump beside the mast, pale limestone cliffs hazy in the distance, flat grey post-storm light and wet sheen on canvas, tight claustrophobic group composition with every face turned toward the diver, clean dark outlines, richly layered foreground midground and background, richly detailed hand-drawn 2D historical animation illustration, cinematic film frame, 16:9.

## 09 — okruženje

**VISUAL PURPOSE:** razmera nalaza. Ceo teret broda, a ne jedna statua.

**B:**

Detailed hand-drawn 2D historical animation illustration, vast high-angle view over an ancient Roman-era shipwreck on a steep slope of grey sand and pale rock deep under blue-green water, the scattered curved timber ribs of the hull, dozens of broken amphorae half-buried in sand, bronze and marble statues lying among the stones, a broken amphora and toppled marble torso large in the foreground, two tiny sponge divers in copper helmets standing among the statues for scale, a school of silver fish crossing the scene, broad shafts of sunlight falling from the surface and pooling on the timbers, the slope falling away into deep blue haze, overwhelming sense of an entire ship's cargo frozen where it sank two thousand years ago, strong depth and scale contrast, clean dark outlines, richly layered foreground midground and background, richly detailed hand-drawn 2D historical animation illustration, cinematic film frame, 16:9.

## 10 — presek

**VISUAL PURPOSE:** objasniti posao jednim pogledom — koliko je duboko i koliko je veza gore–dole.

**B:**

Detailed hand-drawn 2D historical animation illustration in the style of an explanatory museum cutaway, a vertical cross-section of the sea from sky to seabed, a grey steam-era Greek navy ship with a tall funnel and a small single-masted sponge boat floating on the sunlit waterline across the top, long thin air hoses and a heavy rope dropping almost straight down through water that darkens in clear bands from aqua to deep ink, at the bottom two tiny divers in copper helmets roping a green bronze statue into a sling on the grey wreck slope, a column of bubbles rising, the rope taut up to the ship's crane, clean readable diagram composition emphasising the enormous depth between the men and the boats, hard noon light at the surface, clean dark outlines, richly detailed hand-drawn 2D historical animation illustration, cinematic film frame, 16:9.

## 07 — silueta

**VISUAL PURPOSE:** gledalac vidi ono što je ronilac mislio da vidi. Nijedan detalj ne sme da oda statue.

**B:**

Detailed hand-drawn 2D historical animation illustration, point of view from inside an old copper diving helmet looking out through its round glass porthole, the thick dark copper rim framing the whole image as a circle, beyond the glass a murky green-black seabed slope thick with silt, dozens of dark tangled shapes lying across the sand that read as the bodies of men and horses, outstretched limbs and a raised horse head, pure silhouettes with no surface detail, one pale shaft of light grazing the shapes in the center, condensation beads on the inside of the glass, oppressive claustrophobic atmosphere of dread, composition focused on the ambiguous shapes rather than any clear object, clean dark outlines, richly layered foreground midground and background, richly detailed hand-drawn 2D historical animation illustration, cinematic film frame, 16:9.

---

## Rezultat

| kadar | pobednik (A/B) | zašto |
|---|---|---|
| 17 | | |
| 16 | | |
| 06 | | |
| 09 | | |
| 10 | | |
| 07 | | |

**A ukupno:** _ / 6
