# Medium sweep nedeljno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zadatak „AnimatedTales Medium Sweep“ radi jednom nedeljno (ponedeljak 21:00), bez konzolnog prozora, sa vremenom u logu i rotacijom loga.

**Architecture:** `tools/medium.mjs` dobija male čiste funkcije (vreme, pokretač `.vbs`, XML zadatka, omotač prolaza) koje `--install-task` i `--sweep` samo povezuju; sve se testira bez Chrome-a i Medium-a. Pokretač je generisan `.vbs` koji pokreće isti `cmd /c node … --sweep` sa skrivenim prozorom.

**Tech Stack:** Node 24 (`node:test`), Windows Task Scheduler (`schtasks /XML`), WSH (`wscript.exe`/`cscript.exe`).

**Spec:** `docs/superpowers/specs/2026-11-21-medium-sweep-nedeljno.md`

## Global Constraints

- Trigger: nedeljno, ponedeljak 21:00 lokalno, `StartWhenAvailable`, `DisallowStartIfOnBatteries` false, `ExecutionTimeLimit` PT1H, `MultipleInstancesPolicy` IgnoreNew, bez `<Interval>` (nema ponavljanja na 15 min).
- Akcija: `wscript.exe //B //NoLogo "<vbs>"`; `.vbs` pokreće `cmd /c ""node" "script" --sweep >> "log" 2>&1"` sa stilom prozora 0, čeka ga i vraća njegov izlazni kod (`WScript.Quit`).
- Rotacija: log veći od 200 KB (`SWEEP_LOG_MAX_BYTES = 200 * 1024`) se kopira u `<log>.1` (prepisuje) pa briše, u pokretaču, pre `cmd`-a.
- Log: `[YYYY-MM-DD HH:MM:SS] sweep: start` i `[…] sweep: kraj (kod N, X s)`, i kad prolaz pukne.
- Ne dira se: poklapanje videa, Chrome, Medium editor, `medium.json`, `MAX_ATTEMPTS`, `cdp.mjs`.
- Datoteke se pišu kao UTF-16LE sa BOM-om (`.vbs` i XML), da putanja sa ne-ASCII znakom ne puca.
- Komit samo uz izričit zahtev korisnika; u radnom stablu ima tuđih izmena (`README.md`, `episodes/mansa-musa/storyboard.json`, `tools/config.json`, `tools/disk.mjs`, `tests/disk.test.mjs`) koje se ne dodaju.

## Review Focus

1. Putanja sa razmakom (`F:\AI\Animated Tales`) i navodnicima kroz `.vbs` → `cmd` → `node` (Task 1: test sa stvarnim `cscript`).
2. Računar ugašen u ponedeljak 21:00 → `StartWhenAvailable` u XML-u (Task 1).
3. Prolaz puca pre ikakvog posla (nema mreže, `fetchFeed` baci) → u logu ipak stoji kraj sa kodom 1 (Task 1).
4. Log preko praga → rotacija bez gubitka novog zapisa; ispod praga → bez rotacije (Task 1, `cscript` test).
5. Izlazni kod sweepa stiže do `LastTaskResult` (Task 1 `cscript` test; Task 3 uživo).

---

### Task 1: čiste funkcije za pokretač, zadatak i vreme

**Files:**
- Modify: `tools/medium.mjs` (novi izvozi u odeljku CLI, ispred `const episodesDir`)
- Test: `tests/medium.test.mjs` (uvoz proširiti; dodati `import { spawnSync } from 'node:child_process';`)

**Interfaces:**
- Produces (sve `export` iz `tools/medium.mjs`):
  - `TASK_NAME = 'AnimatedTales Medium Sweep'`, `SWEEP_LOG_MAX_BYTES = 200 * 1024`
  - `stamp(d?: Date): string` → `'2026-11-23 21:00:02'` (lokalno vreme)
  - `nextMonday2100(now?: Date): string` → `'YYYY-MM-DDT21:00:00'`, prvi ponedeljak 21:00 strogo posle `now`
  - `sweepCommand({node, script, log}): string` → `cmd /c ""node" "script" --sweep >> "log" 2>&1"`
  - `launcherVbs({node, script, log, maxBytes?}): string`
  - `sweepTaskXml({vbs, start}): string` (zaglavlje `<?xml version="1.0" encoding="UTF-16"?>`, putanja XML-escape-ovana)
  - `utf16leFile(text: string): Buffer` (BOM `FF FE` + UTF-16LE)
  - `stampedSweep(run: () => Promise<number>, opts?: {now?: () => Date, write?: (s: string) => void}): Promise<number>` — `now()` se zove tačno dvaput (početak, kraj); `write` podrazumevano `log`; vraća kod iz `run`; ako `run` baci, upiše kraj sa kodom 1 i baci istu grešku dalje.

- [ ] **Step 1: Napisati testove** u `tests/medium.test.mjs`, novi odeljak „zadatak za Task Scheduler“. Zajednička građa: `CMD = { node: 'C:\\Program Files\\nodejs\\node.exe', script: 'F:\\AI\\Animated Tales\\tools\\medium.mjs', log: 'C:\\Users\\M\\AppData\\Local\\AnimatedTales\\medium-sweep.log' }`. Testovi i tvrdnje:
  - `stamp`: `new Date(2026, 10, 23, 21, 0, 2)` → `'2026-11-23 21:00:02'`; `new Date(2026, 0, 5, 3, 4, 5)` → `'2026-01-05 03:04:05'`.
  - `nextMonday2100`: subota `(2026,10,21,21,40)` → `'2026-11-23T21:00:00'`; ponedeljak `(2026,10,23,20,0)` → `'2026-11-23T21:00:00'`; ponedeljak tačno `(2026,10,23,21,0)` → `'2026-11-30T21:00:00'`; nedelja `(2026,10,29,12,0)` → `'2026-11-30T21:00:00'`; prelaz godine `(2026,11,29,9,0)` → `'2027-01-04T21:00:00'`.
  - `sweepCommand(CMD)` jednako tačno `cmd /c ""C:\Program Files\nodejs\node.exe" "F:\AI\Animated Tales\tools\medium.mjs" --sweep >> "C:\Users\M\AppData\Local\AnimatedTales\medium-sweep.log" 2>&1"`.
  - `launcherVbs(CMD)`: literal u `.Run "…", 0, True`, kad se `""` vrati u `"`, jednak je `sweepCommand(CMD)`; sadrži `WScript.Quit` i `.Size > ${SWEEP_LOG_MAX_BYTES}`.
  - `sweepTaskXml({ vbs: 'C:\\Users\\A&B\\AnimatedTales\\medium-sweep.vbs', start: '2026-11-23T21:00:00' })`: počinje UTF-16 zaglavljem; sadrži `<StartBoundary>2026-11-23T21:00:00</StartBoundary>`, `<ScheduleByWeek>` sa `<Monday />` i `<WeeksInterval>1</WeeksInterval>`, `<StartWhenAvailable>true<`, `<DisallowStartIfOnBatteries>false<`, `<ExecutionTimeLimit>PT1H<`, `<MultipleInstancesPolicy>IgnoreNew<`, `<LogonType>InteractiveToken<`, `<Command>wscript.exe</Command>`, `<Arguments>//B //NoLogo "C:\Users\A&amp;B\AnimatedTales\medium-sweep.vbs"</Arguments>`; ne sadrži `<Interval>`.
  - `utf16leFile('č x')`: prva dva bajta `0xFF 0xFE`, a `buf.subarray(2).toString('utf16le') === 'č x'`.
  - `stampedSweep` uspeh: `now` daje `(2026,10,23,21,0,0)` pa `(…,21,0,2)`, `run` vraća 4 → rezultat 4, `lines` je tačno `['[2026-11-23 21:00:00] sweep: start', '[2026-11-23 21:00:02] sweep: kraj (kod 4, 2 s)']`.
  - `stampedSweep` greška: `run` baca `Error('feed kanala: HTTP 500')` → `assert.rejects(..., /HTTP 500/)`, a poslednja linija odgovara `/sweep: kraj \(kod 1, /`.
  - **Uživo `.vbs`** (`{ skip: process.platform !== 'win32' }`): u privremenom folderu sa razmakom u imenu (`fs.mkdtempSync(path.join(os.tmpdir(), 'medium sweep '))`) napraviti `fake.mjs` (`console.log('ok', ...process.argv.slice(2)); process.exitCode = 7;`) i `launch.vbs = utf16leFile(launcherVbs({ node: process.execPath, script: <fake.mjs>, log: <dir>\\sweep.log }))`; log prethodno napuniti sa `SWEEP_LOG_MAX_BYTES + 1` znakova. `spawnSync('cscript', ['//nologo', vbs])`: `status === 7`; postoji `sweep.log.1` veličine `SWEEP_LOG_MAX_BYTES + 1`; `sweep.log` sadrži `ok --sweep`. Drugi poziv bez nove rotacije: `.1` ostaje iste veličine, a `sweep.log` ima dve linije `ok --sweep`.

- [ ] **Step 2: Pokrenuti** `node --test tests/medium.test.mjs` — očekivano: novi testovi PADAJU (uvozi ne postoje), ostali prolaze.

- [ ] **Step 3: Implementirati** funkcije iz Interfaces u `tools/medium.mjs`. Navodnici: `launcherVbs` udvostručuje `"` u `sweepCommand`; provera log veličine i `CopyFile … , True` + `DeleteFile` ide pre `Run`; `rc = Run(…, 0, True)` pa `WScript.Quit rc`. `sweepTaskXml` koristi `RunLevel` LeastPrivilege i `Hidden` ne dira.

- [ ] **Step 4: Pokrenuti** `node --test tests/medium.test.mjs` — očekivano: svi testovi PROLAZE (uključujući `cscript` test).

---

### Task 2: povezivanje `--sweep` i `--install-task`, komentari i dokumentacija

**Files:**
- Modify: `tools/medium.mjs` (`case 'sweep'`, `case 'install-task'`, `case 'remove-task'`, komentari na redovima ~9, ~14, ~1163)
- Modify: `docs/medium.md:164-166`

**Interfaces:**
- Consumes: sve iz Task 1.
- Produces: ponašanje CLI-ja; nema novih izvoza.

- [ ] **Step 1: `--sweep`**: telo `case 'sweep'` izdvojiti u `async function sweepAll(args): Promise<number>` (ista logika, isti kodovi), a `case 'sweep': return stampedSweep(() => sweepAll(args));`.

- [ ] **Step 2: `--install-task`**: napraviti folder `dirname(logFile())`; upisati `<folder>\medium-sweep.vbs` = `utf16leFile(launcherVbs({ node: process.execPath, script: fileURLToPath(import.meta.url), log: logFile() }))`; XML (`sweepTaskXml({ vbs, start: nextMonday2100() })` kroz `utf16leFile`) upisati u `os.tmpdir()`, pozvati `schtasks /Create /F /TN <TASK_NAME> /XML <fajl>`, pa obrisati privremeni XML. Poruka: zadatak ide svakog ponedeljka u 21:00, bez prozora, propušten prolaz se nadoknađuje, log putanja. `--remove-task` koristi `TASK_NAME`. Ako `schtasks` odbije XML bez `<UserId>`, dodati `<UserId>` = `DOMAIN\korisnik` iz `USERDOMAIN`/`USERNAME`.

- [ ] **Step 3: Tekst**: komentari „za Task Scheduler“ i „15 minuta“ u `medium.mjs` prepraviti na nedeljno (uz napomenu da `MAX_ATTEMPTS` sada znači tri nedelje); u `docs/medium.md` stavku 2 prepraviti: „every Monday 21:00 (missed runs catch up when the PC is back), hidden window, log with timestamps in `%LOCALAPPDATA%\AnimatedTales\medium-sweep.log`“.

- [ ] **Step 4: Proveriti** `node --test tests/` — očekivano: svi prolaze. Pa `node tools/medium.mjs --sweep` — očekivano: dve vremenske linije oko bloka „— el-dorado … video još nije u feedu“, izlazni kod 0 (`echo $?`), Chrome se ne otvara (video nije u feedu).

---

### Task 3: uživo instalacija i provera (menja korisnikov Task Scheduler)

**Files:** nema izmena u repou; memorija: `C:\Users\Mihailo\.claude\projects\f--AI-Animated-Tales\memory\medium-clanak-uz-video.md` i red u `MEMORY.md`.

**Interfaces:**
- Consumes: `--install-task` iz Task 2.

- [ ] **Step 1: Instalirati**: `node tools/medium.mjs --install-task` — očekivano: `SUCCESS` od `schtasks` i poruka sa ponedeljkom 21:00.

- [ ] **Step 2: Proveriti definiciju**: `schtasks /Query /TN "AnimatedTales Medium Sweep" /XML` — očekivano: `<ScheduleByWeek>` sa `<Monday />`, `wscript.exe`, `StartWhenAvailable` true, nema `<Interval>`. `Get-ScheduledTaskInfo` — `NextRunTime` je ponedeljak 23. 11. 2026 21:00.

- [ ] **Step 3: Pokrenuti i uhvatiti prozore**: zapamtiti PID-ove postojećih `cmd`/`wscript`/`cscript`/`node` procesa; u PowerShell petlji (≈8 s, korak 100 ms) pre `schtasks /Run /TN "AnimatedTales Medium Sweep"` pratiti NOVE procese tih imena sa `MainWindowHandle -ne 0` — očekivano: nijedan.

- [ ] **Step 4: Rezultat**: poslednjih 8 linija `%LOCALAPPDATA%\AnimatedTales\medium-sweep.log` imaju `sweep: start` i `sweep: kraj (kod 0, …)`; `Get-ScheduledTaskInfo` daje `LastTaskResult : 0`.

- [ ] **Step 5: Memorija**: u `medium-clanak-uz-video.md` zameniti „Task Scheduler … na 15 min (`--sweep`, instaliran 2026-11-19 …)“ opisom „nedeljno, ponedeljak 21:00, wscript pokretač bez prozora, log sa vremenom i rotacijom, instalirano 2026-11-21; neuspeh čeka nedelju dana (`MAX_ATTEMPTS` = 3 prolaza)“; ažurirati red u `MEMORY.md` („feed + Task Scheduler 15 min“ → „nedeljno“).

- [ ] **Step 6: Komit** — samo uz korisnikovo odobrenje: `git add tools/medium.mjs tests/medium.test.mjs docs/medium.md docs/superpowers/specs/2026-11-21-medium-sweep-nedeljno.md docs/superpowers/plans/2026-11-21-medium-sweep-nedeljno.md`, poruka `feat: medium sweep jednom nedeljno, bez prozora, sa vremenom u logu`.
