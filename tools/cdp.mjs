// tools/cdp.mjs
//
// Minimalan Chrome DevTools Protocol klijent — bez zavisnosti, na Node-ovom ugrađenom
// `WebSocket`-u (Node 22+). Postoji zbog `flow-images.mjs`: Google ne daje programski pristup
// Flow-u (docs/reference/google-ai-plus.md §1), pa se Flow vozi kroz pravi Chrome, kao ruka.
//
// Zašto pravi Chrome sa sopstvenim profilom, a ne Playwright-ov Chromium:
//
//   1. Google odbija prijavu u pregledač koji se predstavlja kao automatizovan
//      (`navigator.webdriver`, `--enable-automation`). Ovde Chrome pokreće obična komanda sa
//      jednim dodatkom — `--remote-debugging-port` — pa je prijava ista kao kod kuće.
//   2. Od Chrome-a 136 port za debagovanje ne radi nad podrazumevanim profilom, pa profil mora
//      da bude zaseban. Drži se van repoa (`%LOCALAPPDATA%\AnimatedTales\flow-chrome`) i
//      pamti prijavu: uloguješ se jednom, posle toga alat ulazi sam.
//   3. Klik i kucanje idu kroz `Input.*` domen — to su pravi (isTrusted) događaji, isti kao
//      mišem i tastaturom, a ne sintetički `el.click()` koji React ili zaštita mogu da odbiju.
//
// `Runtime.enable` se namerno ne zove: `Runtime.evaluate` radi i bez njega, a uključen domen
// je ono po čemu stranica može da prepozna da je posmatrana.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_PORT = 9333;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Zaseban, trajan profil — ovde živi Google prijava za Flow. */
export const defaultProfileDir = () => path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'),
  'AnimatedTales', 'flow-chrome');

/** @returns {string} putanja do chrome.exe; `CHROME_PATH` ima prednost */
export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const hit = candidates.find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`Chrome nije pronađen. Postavi CHROME_PATH na chrome.exe.\n  tražio: ${candidates.join('\n          ')}`);
  return hit;
}

async function getJson(url, timeoutMs = 2000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

/** `/json/version` ili `null` ako na portu nema Chrome-a. */
export async function browserVersion(port = DEFAULT_PORT) {
  try {
    return await getJson(`http://127.0.0.1:${port}/json/version`);
  } catch {
    return null;
  }
}

/**
 * Chrome sa portom za debagovanje: postojeći ako već radi, inače nov, odvojen od ovog procesa
 * (prozor ostaje otvoren i kad se alat završi — u njemu se posle bira slika i pravi klip).
 *
 * @param {{port?: number, profileDir?: string, startUrl?: string, chromePath?: string}} [opts]
 * @returns {Promise<{launched: boolean, wsUrl: string}>}
 */
export async function ensureChrome({ port = DEFAULT_PORT, profileDir = defaultProfileDir(), startUrl = 'about:blank', chromePath } = {}) {
  let v = await browserVersion(port);
  if (v) return { launched: false, wsUrl: v.webSocketDebuggerUrl };

  fs.mkdirSync(profileDir, { recursive: true });
  const child = spawn(chromePath ?? findChrome(), [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    // Prozor u kome alat radi je obično iza drugih prozora. Bez ova tri flaga Chrome takav tab
    // proglasi skrivenim i uspori mu tajmere — a Flow tajmerima prati generisanje, pa bi se
    // gotova slika videla tek posle minut.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    startUrl,
  ], { detached: true, stdio: 'ignore' });
  child.unref();

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    await sleep(300);
    v = await browserVersion(port);
    if (v) return { launched: true, wsUrl: v.webSocketDebuggerUrl };
  }
  throw new Error(`Chrome se nije javio na portu ${port} za 30s. Ako je već otvoren bez porta, zatvori ga i pokušaj ponovo.`);
}

// ------------------------------------------------------------------ veza

export class CDP {
  #ws;
  #id = 0;
  #pending = new Map();
  #listeners = new Map();

  /** @param {string} url `webSocketDebuggerUrl` pregledača */
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error(`CDP: ne mogu da se povežem na ${url}`)), { once: true });
    });
    return new CDP(ws);
  }

  constructor(ws) {
    this.#ws = ws;
    ws.addEventListener('message', (ev) => this.#onMessage(ev.data));
    ws.addEventListener('close', () => {
      for (const p of this.#pending.values()) p.reject(new Error(`${p.method}: veza sa Chrome-om je zatvorena`));
      this.#pending.clear();
    });
  }

  #onMessage(data) {
    const msg = JSON.parse(typeof data === 'string' ? data : Buffer.from(data).toString('utf8'));
    if (msg.id !== undefined) {
      const p = this.#pending.get(msg.id);
      if (!p) return;
      this.#pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}${msg.error.data ? ` (${msg.error.data})` : ''}`));
      else p.resolve(msg.result);
      return;
    }
    for (const key of [`${msg.sessionId ?? ''}|${msg.method}`, `*|${msg.method}`]) {
      for (const fn of this.#listeners.get(key) ?? []) fn(msg.params, msg.sessionId);
    }
  }

  /**
   * @param {string} method
   * @param {object} [params]
   * @param {string} [sessionId] za komande stranice (flatten režim — jedna veza za sve)
   */
  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject, method });
      this.#ws.send(JSON.stringify(payload));
    });
  }

  /**
   * @param {string} method događaj, npr. `Page.downloadProgress`
   * @param {(params: object, sessionId?: string) => void} fn
   * @param {string} [sessionId] `*` ili izostavljeno = sa bilo koje sesije
   * @returns {() => void} odjava
   */
  on(method, fn, sessionId = '*') {
    const key = `${sessionId}|${method}`;
    if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
    this.#listeners.get(key).add(fn);
    return () => this.#listeners.get(key)?.delete(fn);
  }

  close() {
    this.#ws.close();
  }
}

// ------------------------------------------------------------------ stranica

const KEYS = {
  Enter: { code: 'Enter', keyCode: 13, text: '\r' },
  Tab: { code: 'Tab', keyCode: 9 },
  Escape: { code: 'Escape', keyCode: 27 },
  Backspace: { code: 'Backspace', keyCode: 8 },
  Delete: { code: 'Delete', keyCode: 46 },
  ArrowDown: { code: 'ArrowDown', keyCode: 40 },
  ArrowUp: { code: 'ArrowUp', keyCode: 38 },
  End: { code: 'End', keyCode: 35 },
  Home: { code: 'Home', keyCode: 36 },
};

const MODIFIERS = { Alt: 1, Control: 2, Meta: 4, Shift: 8 };

export class Page {
  /**
   * @param {CDP} cdp
   * @param {string} sessionId
   * @param {string} targetId
   */
  constructor(cdp, sessionId, targetId) {
    this.cdp = cdp;
    this.sessionId = sessionId;
    this.targetId = targetId;
  }

  send(method, params = {}) {
    return this.cdp.send(method, params, this.sessionId);
  }

  /**
   * Izvršava izraz ili funkciju u stranici i vraća vrednost (JSON). Funkcija dobija `args`
   * serijalizovane — ne zatvara ništa iz Node-a.
   * @param {string|Function} fnOrExpr
   * @param {...any} args
   */
  async evaluate(fnOrExpr, ...args) {
    const expression = typeof fnOrExpr === 'function'
      ? `(${fnOrExpr.toString()})(...${JSON.stringify(args)})`
      : fnOrExpr;
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true, userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error(`evaluate: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    }
    return r.result.value;
  }

  /**
   * Čeka da funkcija u stranici vrati nešto istinito i vraća to.
   * @param {Function} fn
   * @param {{timeout?: number, interval?: number, args?: any[], what?: string}} [opts]
   */
  async waitFor(fn, { timeout = 30_000, interval = 300, args = [], what = 'uslov' } = {}) {
    const deadline = Date.now() + timeout;
    let last;
    for (;;) {
      try {
        last = await this.evaluate(fn, ...args);
        if (last) return last;
      } catch (err) {
        // Navigacija usred provere briše kontekst — to nije greška, samo se ponavlja.
        if (!/context|navigat|Cannot find/i.test(err.message)) throw err;
      }
      if (Date.now() > deadline) throw new Error(`isteklo ${Math.round(timeout / 1000)}s čekanja: ${what}`);
      await sleep(interval);
    }
  }

  /** Pravi klik (isTrusted) na koordinatama prozora, u CSS pikselima. */
  async click(x, y, { button = 'left', clickCount = 1 } = {}) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount, buttons: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount, buttons: 0 });
  }

  async hover(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  }

  /** Tekst kao da je otkucan (IME commit) — bez keydown događaja po slovu. */
  async insertText(text) {
    await this.send('Input.insertText', { text });
  }

  /**
   * Taster, opciono sa modifikatorima: `press('Enter')`, `press('a', ['Control'])`.
   * `commands` su Chrome-ove komande uređivanja (`selectAll`, `paste`…) koje taster okida.
   */
  async press(key, modifiers = [], commands = []) {
    const mod = modifiers.reduce((m, k) => m | (MODIFIERS[k] ?? 0), 0);
    const spec = KEYS[key] ?? {
      code: `Key${key.toUpperCase()}`, keyCode: key.toUpperCase().charCodeAt(0), text: key,
    };
    const base = { key, code: spec.code, windowsVirtualKeyCode: spec.keyCode, modifiers: mod };
    const text = mod & (MODIFIERS.Control | MODIFIERS.Meta | MODIFIERS.Alt) ? undefined : spec.text;
    await this.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', ...base, text, commands });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  }

  /** PNG prozora (ili isečka `clip: {x,y,width,height}`) na disk. */
  async screenshot(file, clip) {
    const params = { format: 'png' };
    if (clip) params.clip = { ...clip, scale: 1 };
    const { data } = await this.send('Page.captureScreenshot', params);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }

  async navigate(url, { timeout = 60_000 } = {}) {
    await this.send('Page.navigate', { url });
    await sleep(500);
    await this.waitFor(() => document.readyState === 'complete', { timeout, what: `učitavanje ${url}` });
  }

  async url() {
    return this.evaluate(() => location.href);
  }

  async bringToFront() {
    await this.send('Page.bringToFront');
  }
}

/**
 * Tab čiji URL počinje sa `prefix` (prvi takav), ili nov tab na `newUrl`.
 * @param {CDP} cdp veza na nivou pregledača
 * @param {{prefix?: string, newUrl?: string}} opts
 * @returns {Promise<Page>}
 */
export async function openPage(cdp, { prefix, newUrl = 'about:blank' } = {}) {
  const { targetInfos } = await cdp.send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');
  let target = prefix ? pages.find((t) => t.url.startsWith(prefix)) : null;
  if (!target) {
    const { targetId } = await cdp.send('Target.createTarget', { url: newUrl });
    target = { targetId };
  }
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  return new Page(cdp, sessionId, target.targetId);
}

/**
 * Vraća prozor taba ako je minimizovan. Minimizovan prozor Chrome ne iscrtava, a klik kroz
 * `Input.*` čeka iscrtavanje — alat bi stao bez greške. Prozor iza drugih prozora je u redu.
 * @returns {Promise<boolean>} da li je prozor bio minimizovan
 */
export async function ensureWindowShown(cdp, targetId) {
  const { windowId, bounds } = await cdp.send('Browser.getWindowForTarget', { targetId });
  if (bounds.windowState !== 'minimized') return false;
  await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
  return true;
}

/**
 * Trenutni URL taba, pročitan sa nivoa pregledača — bez ijednog poziva u samu stranicu.
 * Koristi se dok je tab na Google prijavi, gde alat ne sme ništa da dira.
 * @param {CDP} cdp
 * @param {string} targetId
 */
export async function targetUrl(cdp, targetId) {
  const { targetInfo } = await cdp.send('Target.getTargetInfo', { targetId });
  return targetInfo.url;
}
