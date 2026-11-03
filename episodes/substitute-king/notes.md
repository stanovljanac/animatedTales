# substitute-king — beleške produkcije

## Režim: sve slike

Korisnikova odluka: epizoda je u potpunosti od still kadrova (`render_mode: "still"`), nula
kredita. Skelet je napravljen sa `beatplan.mjs --still`.

## Narracija i alignment

`narration.mp3` **255.713s** (4:16), 50 rečenica, `small.en`. Tri rečenice ispod 0.85 (S18
0.819, S37 0.809, S40 0.786), sve na imenima i navodima. `outro_start` 240.32s.

## Beat mapa

**39 beatova · 46 slika · prosek 5.56s · 20/46 u opsegu 4–6s.** Uređaji: `macro-object` ×2,
`ledger-accumulation` ×2, `empty-aftermath` ×2, `process-cutaway` ×1, `timeline-seasons` ×1,
`animated-map` ×1, `silhouette` ×1.

Tri reza unutar rečenica. U sve tri rečenica je duža od 9s, a rez pada na granicu dve planirane
slike:

| Rečenica | Prvi shot | Drugi shot |
|---|---|---|
| S36 | „…from a Babylonian chronicle, and" — ploča hronike (31) | „it is set more than a thousand years before…" — Isin (32) |
| S37 | „…made his gardener, Enlil-bani," — Era-imiti uvodi baštovana (33) | „substitute king, and placed the royal tiara…" — krunisanje (34) |
| S44 | „…the ritual ends the same way: the" — Niniva u zoru (41) | „stand-in dies, and the king lives, for a while" — odora na klupi, kralj na prestolu (42) |

`link_group` (dissolve): **12–13** (`B12`, Šamašovo dvorište), **20–21** (`B19`, hram u Akadu),
**31–32** (`B29`, ploča → Isin), **33–34** (`B30`, Isinska dvorana), **43–44** (`B38`, odar →
dvor kleči). B37 (41–42) nije linkovan, jer su to dve različite lokacije i ide tvrdi rez.

Pokret: 16 pan, 16 push, 6 pull, 8 hold. Svaki pan prati `SCREEN DIRECTION` svog kadra.

## Lockovi i kontinuitet

- 6 likova (`esarhaddon`, `substitute`, `scholar`, `damqi`, `erra-imitti`, `enlil-bani`),
  7 lokacija, 2 rekvizita (`assyrian-crown`, `isin-tiara`). Nijedan nije `scale_critical`.
- **Lockovi ne nose odeću koja se menja.** Asarhadon se krije bez krune i u prostoj tunici (15).
  Zamenik i Damki nose kraljevu odoru samo u kadrovima gde je dobiju. Enlil-bani je u baštovanskoj
  kecelji dok ne postane kralj. Odeća se zato piše po kadru, a lock nosi lice, bradu i ruke.
- **`scholar` je jedan lock za sve učenjake**, pa i za glavnog egzorcistu (19). Grupni kadrovi ga
  uvode sa „each one", da opis ostane doslovan.
- **Novi zamenik iz 669.** (29) namerno nije `substitute`: to je drugi čovek, mršav i sed.
- Kraljev agent (22), Damkijev otac (21), proročica (25) i šegrt (28) pojavljuju se po jednom, pa
  nemaju lock.

## Osa ekrana (zaključana pre pisanja promptova)

> **Pravi kralj i ljudi koji za njega vode ritual drže levu polovinu i gledaju/kreću se udesno.
> Onaj ko sedne na presto umesto njega drži desnu polovinu i gleda/kreće se ulevo — ka kralju.
> Pomračeni mesec i znamenje dolaze sa gornje desne strane, iznad prestola.**

Podrazumevana podela iz `camera-language.md`: priča se čita kroz pisma kraljevih učenjaka, pa je
njihova strana levo. Presto nije vezan za stranu, ljudi jesu: kralj na svom prestolu sedi levo
(shot 06, 27), zamenik na istom prestolu desno (02, 11, 17).

- **Levo, gleda udesno:** Asarhadon (i kad se krije kao „ratar"), učenjaci i glavni egzorcista,
  kraljev agent u Vaviloniji, proročica (gura Damkija ka palati, udesno), Era-imiti dok je kralj,
  stari kalendar poreza (pet gomila).
- **Desno, gleda ulevo:** zamenik u Ninivi i njegova kraljica, trojica kandidata, Damki, njegov
  otac i njegova kraljica, Enlil-bani od trenutka kad ga uvedu u dvoranu.
- **Povlačenje je kretanje ulevo:** Asarhadon napušta presto kroz vrata levo (10), vojska ide ka
  Egiptu dole-levo na karti (30), Era-imitijev odar izlazi kroz levu kapiju (43). Kretanje ulevo
  je otpor ili odlazak, pa ga dobija kraljeva strana kad gubi.
- **Namernog prelaska ose nema.** Dvor koji na kraju kleči pred baštovanom (44) gleda udesno, pa
  ostaje na kraljevoj strani. Dvor se ne prebacuje na drugu stranu, nego se klanja preko ose.

## Tačnost perioda — važi za svaku sliku

- **Dva sveta, ne mešati.** Novoasirska Niniva, 7. vek p.n.e.: sive gipsane reljefne ploče,
  krilati bikovi sa ljudskom glavom na kapijama, kralj u visokoj kupastoj kruni od belog filca
  sa zlatnim trakama i šiljkom, duga četvrtasta brada u redovima uvojaka, plava resasta odora sa
  zlatnim rozetama. Starovavilonski Isin, oko 1860. p.n.e.: zidovi od nepečene opeke, beli malter
  sa crvenim i crnim trakama, palmine grede, kralj u okrugloj kapi sa debelim zavrnutim obodom
  (kao na Hamurabijevoj steli), odora prebačena preko levog ramena.
- **Akad u Vaviloniji** (Damki, 671. p.n.e.) je novoasirsko doba, ali vavilonski grad: hram od
  opeke sa udubljenjima na fasadi, crvena vavilonska odora. Zamenik nosi asirsku kraljevu krunu
  jer zamenjuje Asarhadona, kralja obe zemlje.
- **Pisma su male glinene pločice** u glinenim kovertama, sa cilindričnim pečatima. Klinasto
  pismo sme da se vidi kao znaci, ne kao čitljiv tekst. **Latinice nigde**, osim naslova i dugmeta
  na end kartici.
- **Šamaš** je bronzani sunčev disk sa četvorokrakom zvezdom i talasastim zracima na stepenastom
  oltaru, a obred se vrši u zoru, pod otvorenim nebom.

## Kadrovi koji traže odluku pre promptova

- **Smrt zamenika se ne prikazuje.** „Went to his fate" (18) je prazan presto u sivu zoru:
  presavijena odora, kruna i jedna prazna čaša, bez tela. Damkijeva sahrana (24) prikazuje dva
  pokrivena odra pod vezenim pokrovima, pa se ne vidi ni lice ni rana. Pet glagola iz pisma vide
  se kao pet stvari: zlato na pokrovima, ćupovi ulja, odri u nizu lampi, otvoreni sarkofazi i
  narikače.
- **Asarhadonova smrt** (30) je karta: kraljev barjak pao na pola puta ka Egiptu, kolona stala.
  Hronika ne imenuje mesto, pa ni karta ne imenuje mesto.
- **Era-imiti i supa** (35): kralj srkne vruću supu, bez traga smrti i otrova. Ironiju nosi
  naracija. Na glavi nema tijaru jer ju je dao baštovanu.
- **„The gods took the king"** (43) je jedini kadar u mitskom registru: odar izlazi kroz vrata
  koja gore belo-zlatnom svetlošću i veća su od četiri čoveka. `SCALE` blok tvrdi nesrazmeru.
- **Brojevi iz naracije u slici:** sto dana su sto crtica u deset redova po deset (17, i opet uz
  krunu u 45). Dvadeset četiri godine su klinasti broj 24 na fragmentu spiska kraljeva, dva ugaona
  klina i četiri uspravna (37). Petina i desetina su dva gumna, jedno sa pet gomila i jedno sa
  deset, i sa svakog odnose po jednu (39). Tri kandidata su tri imenovana čoveka (19).
- **„To the farmer"** (16): uz pločicu leže tri klasa ječma. To je jedini vizuelni nagoveštaj
  kraljevog imena u skrivanju.
- **End kartica (46)** je poster cele priče:
  - Asarhadon levo, Enlil-bani u tijari desno, a Damki sa kraljicom manji uz njegovo rame.
  - U sredini daleko: prazan presto pod krvavim mesecom, Niniva levo, Isin desno.
  - U prvom planu: pisma, pločica vezana za porub, sto crtica, supa, kosir i ječam.
  - Naslov „THE SUBSTITUTE KING", ispod linija „CROWNED TO DIE", SUBSCRIBE na sredini.
