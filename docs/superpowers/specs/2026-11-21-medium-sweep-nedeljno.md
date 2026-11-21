# Medium sweep jednom nedeljno, bez prozora i sa vremenom u logu

**Status:** odobreno (korisnik) · 2026-11-21
**Zahvata:** `tools/medium.mjs` (`--install-task`, `--sweep`), `tests/medium.test.mjs`, `docs/medium.md`.

## Zašto

Task Scheduler zadatak „AnimatedTales Medium Sweep“ se pokreće na svakih 15 minuta kroz `cmd /c`,
u korisnikovoj sesiji. Svaki prolaz otvori vidljiv konzolni prozor (~96 puta dnevno) koji može
da preuzme fokus. Posao je beznačajan: jedan GET na javni feed, pa izlaz posle ~2 s dok video
epizode nije javan. Od 19. 11. svih 58 zabeleženih prolaza čeka el-dorado, a tog videa nema
na kanalu. Log nema vremena, pa se ne vidi kad je šta bilo.

Cilj: članak za Medium izlazi sam, ali bez treperenja prozora i bez beskorisnog ispitivanja.

## Ciljevi i ne-ciljevi

- Cilj: jedan prolaz nedeljno, nevidljiv, sa vremenom u logu; propušten prolaz (računar
  ugašen) se nadoknađuje čim računar proradi.
- Cilj: ništa ne menja ponašanje objave (poklapanje videa, Chrome, Medium editor, `medium.json`).
- Ne-cilj: upload na YouTube preko API-ja (odbačeno: videi iz neverifikovanog API projekta
  mogu da ostanu privatni, a audit nije vredan truda).
- Ne-cilj: obaveštenja (toast/mail) o grešci. Neuspeh ostaje u logu i `medium.json`.
- Ne-cilj: minimizovan Chrome pri objavi. `cdp.mjs` (`ensureWindowShown`) ga namerno vraća,
  jer minimizovan Chrome ne iscrtava stranicu i klikovi u editoru staju bez greške.
- Anti-cilj: da objava pokvari zbog „tihog“ Chrome-a. Zato se Chrome prozor ne dira.

## Pristupi (razmatrano, izabrano B)

| | |
|---|---|
| A) YouTube API upload sa terminom | Najveći dobitak (tačan ID i vreme, bez ručnog Studija), ali videi iz neverifikovanog API projekta mogu da ostanu privatni dok ne prođe audit. **Odbačeno.** |
| **B) nedeljni okidač** | **Izabrano.** Sweep ionako poklapa ceo feed po naslovu (15 unosa ≈ 3 nedelje), pa ne propušta video koji izađe u subotu ili sredu. Članak kasni najviše nedelju dana. |
| C) publish n+1 pokreće članak za n | Odbačeno: redosled proizvodnje i izlaska nije isti, pa prethodni video ne mora biti javan. |

## Dizajn

1. **Okidač:** nedeljno, ponedeljkom 21:00 (lokalno vreme), `StartWhenAvailable` (propušten
   prolaz se pokreće čim je računar dostupan), bez ograničenja na bateriju, `ExecutionTimeLimit`
   1 h (objava kroz Chrome traje minute), `MultipleInstancesPolicy` IgnoreNew.
2. **Nevidljivo pokretanje:** zadatak pokreće `wscript.exe //B //NoLogo` nad malim `.vbs`
   pokretačem (generiše ga `--install-task` u `%LOCALAPPDATA%\AnimatedTales\`). Pokretač pokreće
   isti `cmd /c node medium.mjs --sweep >> log 2>&1` sa stilom prozora 0, čeka ga i vraća
   njegov izlazni kod, pa `LastTaskResult` odražava rezultat prolaza.
3. **Rotacija loga:** pokretač pre pokretanja proverava veličinu loga; preko ~200 KB kopira ga u
   `medium-sweep.log.1` (prepisuje) i briše original. Radi se u pokretaču, jer `cmd` drži log
   otvoren pa ga Node ne može preimenovati.
4. **Vreme u logu:** `--sweep` piše `[YYYY-MM-DD HH:MM:SS] sweep: start` i
   `[…] sweep: kraj (kod N, X s)`, i kad prolaz pukne usred posla.
5. **Instalacija:** `--install-task` piše XML zadatka i pravi ga sa `schtasks /Create /F /XML`,
   što zamenjuje stari zadatak na 15 minuta istim imenom. `--remove-task` ostaje.
6. **Promena jedne rečenice u `docs/medium.md`** (opis zadatka) i komentara u `medium.mjs`
   (15 minuta → nedeljno).

## Poznata posledica

`MAX_ATTEMPTS = 3` važi po prolazu, pa neuspeo članak sa nedeljnim okidačem čeka nedelju dana
do ponovnog pokušaja (tri neuspeha = tri nedelje). Neuspeh se vidi u logu i `medium.json`
(`status: failed`); ručni pokušaj odmah: `node tools/medium.mjs episodes/<slug> --post --force`.
Ne menja se u ovom koraku.

## Provera

- Jedinični testovi: format vremena, sadržaj `.vbs` (navodnici, rotacija, izlazni kod) i XML-a
  (nedeljni okidač, ponedeljak, `StartWhenAvailable`, akcija `wscript`).
- Uživo: `--install-task`, `schtasks /Query /XML`, pa `schtasks /Run`; u logu se vide oba
  vremena, `LastTaskResult` je 0, a tokom prolaza nijedan `cmd`/`wscript` proces nema prozor.
  El Dorado još nije u feedu, pa Chrome ne ni otvara.

## Prepušteno graditelju

Imena pomoćnih funkcija i tačan oblik XML-a. Ako `schtasks /XML` ne primi zadatak bez
`UserId`, uzima se korisnik iz `whoami /user`.
