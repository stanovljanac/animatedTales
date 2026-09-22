# Flow tabla — generisanje sa posla

Faza 07 je jedina faza koja je čist ručni rad u pregledaču, i jedina koja staje iz
razloga koji nema veze sa poslom: dnevnih 50 kredita propadne jer kod kuće nema vremena,
a na poslu ima pola sata i nema `storyboard.json`.

Tabla rešava tačno to i ništa više: **promptovi odu tamo gde si ti, a mesto na kome si
stao ostane zapisano.** Ništa se ne sinhronizuje, jer nema čime — Google ne daje nikakav
programski pristup ([`google-ai-plus.md`](google-ai-plus.md) §1). Tabla se odštampa,
nalepi u tab i ručno precrtava.

```
node tools/shotlist.mjs episodes/<slug> --board | Set-Clipboard     # PowerShell
```

Izlaz je ista čeklista koju `shotlist.mjs` ispisuje za terminal, prilagođena tabu:
markdown zaglavlja umesto ASCII linija, dva datuma u zaglavlju i red `LAST DONE`.

## Jednom, pri postavljanju

Jedan Google Doc za ceo kanal, jedan **tab dokumenta** po epizodi (Docs ih drži do 100,
u sidebar-u levo). U tom dokumentu, jednom:

- **Alatke → Podešavanja → Markdown** uključeno. Bez toga `## shot 07` ostaje običan
  tekst i tab od 46 shotova nema outline po kome se skače na sledeći kadar.
- **Pametni navodnici isključeni**, u istom meniju. Prompt se nikad ne kuca, samo lepi i
  kopira, pa ih zamena znakova ne dodirne — ali to je osiguranje koje ne košta ništa.

Google Sheets nije izabran svesno: red koji počinje sa `=` ili `-` u ćeliji je formula i
izađe kao `#ERROR!`, a ceo prompt u jednoj ćeliji se kopira nazad umotan u navodnike.
Izlaz `--board` ipak nema nijedan takav red, pa preživi i taj lepak.

NotebookLM je za fazu 03, ne za ovu — on generiše prozu sa izvorima, a ovde treba tekst
koji je **doslovan**. Model između `storyboard.json` i Flow-ovog polja za tekst je jedina
stvar koju ovaj lanac ne sme da ima.

## Krug

**Kod kuće, na kraju sesije** — i posle svakog QA prolaza koji je prepisao prompt:

1. `node tools/shotlist.mjs episodes/<slug> --board | Set-Clipboard`
2. tab `<slug>` u dokumentu → Ctrl+A → Ctrl+V.

**Na poslu, pola sata:** prvi neprecrtan shot je sledeći. Prompt se selektuje, kopira i
lepi u Flow bez ijedne izmene. Kad je kadar gotov — precrtaj ga, ili upiši broj u red
`LAST DONE`. Ništa se ne skida: fajl ostaje u Flow biblioteci.

**Kod kuće posle toga:** otvori Flow, skini generisano **tim redom** i svaki fajl snimi
pod imenom koje tabla daje (`shots/shot13.jpeg`, `shot14.jpeg`, …). Onda je lanac
nepromenjen:

```
node tools/lint.mjs episodes/<slug>      # F1 kaže ima li svaki shot svoju mediju
```

## Tri pravila koja tablu drže iskrenom

**Zastarela tabla je jedini skup kvar.** Prompt prepisan u QA prolazu, a tab nenalepljen
ponovo, znači plaćenu regeneraciju. Zato zaglavlje nosi oba vremena — `generated_at`
storyboarda i datum štampe — jedno pored drugog. Ako se razilaze za QA prolaz, tab je
star. Pravilo je prosto: **svaka sesija koja je dirala `storyboard.json` završava se
lepljenjem tabele.**

**Regeneracija pomera redosled skidanja.** Tri pokušaja istog kadra znače tri stavke
viška u Flow biblioteci, pa imena kod kuće otklize. Tabla zato kaže koliko kadrova i kojim
redom se očekuje; ako se ne poklapa, gleda se slika, ne redni broj. F1 ionako uhvati kadar
koji nedostaje pre montaže.

**U prompt se nikad ne kuca.** Tab je papir za čitanje i kopiranje. Izmena prompta se radi
kod kuće, u `storyboard.json`, i vraća se u tab preko `--board`. Izvor istine je
`storyboard.json`, u tabli kao i svuda drugde.

## Smena se meri kreditima, ne satima

Zaglavlje tabele ispisuje šta dnevnih 50 kredita stvarno nosi: **5 Lite, 2 Fast, 0
Quality** klipova. Pola sata je više nego dovoljno za taj plafon, pa clip epizodu ne
prekida vreme nego kapaljka. Still epizoda nema plafon — slika je besplatna, pa smena
traje koliko traje.
