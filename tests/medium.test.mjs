// tests/medium.test.mjs
//
//   node --test tests/
//
// Čisti delovi tools/medium.mjs: parsiranje medium.md, pravila iz docs/medium.md, HTML za editor,
// YouTube feed i poklapanje epizode sa videom, argumenti. Chrome i Medium se ovde nikad ne
// pokreću — to je proba uživo (docs/medium.md → WHAT HAPPENS AFTER).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CHANNEL, SITE, PH_VIDEO, PH_THUMB, RULES, PROFILE, CAPTION,
  inlineLinks, plainText, parseMedium, validateMedium, shingles, overlap, descriptionOf,
  inlineHtml, bodyHtml, bodyText, parseFeed, matchEpisode, videoIdFrom, watchUrl, parseArgs,
  checkEpisode, loadEpisode, isPending,
} from '../tools/medium.mjs';

// ---------------------------------------------------------------- gradivo

/** n različitih reči (različiti tagovi -> nikad preklapanje sa skriptom). */
const words = (n, tag) => Array.from({ length: n }, (_, i) => `${tag}x${i}`).join(' ');
const LINK = `[the full 2D animated version on YouTube](${PH_VIDEO})`;
const THUMB = `[![Hunahpu and Xbalanque in the 2D animated story of the underworld](${PH_THUMB})](${PH_VIDEO})`;
const FOOTER = `More animated stories: [Animated Tales on YouTube](${CHANNEL.url}) · [animatedtales.mihailobuilds.com](${SITE})`;
const TITLE = 'Hunahpu and Xbalanque Outwitted the Lords of Death in Xibalba';

/** Članak od niza pasusa; podrazumevano ispravan: 7 pasusa po 100 reči + jedan link na kraju. */
function article({
  tags = 'Mythology, Maya Mythology, Storytelling', title = TITLE, thumb = THUMB, footer = FOOTER, paras,
} = {}) {
  const body = paras ?? [
    `Hunahpu and Xbalanque ${words(98, 'a')}.`,
    `## First section\n\n${words(100, 'b')}.`,
    `${words(100, 'c')}.`,
    `${words(100, 'd')}.`,
    `## Second section\n\n${words(100, 'e')}.`,
    `${words(100, 'f')}.`,
    `${words(90, 'g')}. If you would rather watch, the whole story is a ${LINK}.`,
  ];
  return [`---\ntags: ${tags}\n---`, `# ${title}`, ...(thumb ? [thumb] : []), ...body, ...(footer ? [footer] : [])].join('\n\n');
}

const check = (text, ctx = {}) => validateMedium(parseMedium(text), ctx);
const has = (res, re) => res.errors.some((e) => re.test(e));

// ---------------------------------------------------------------- parsiranje

test('parseMedium: front matter, naslov i vrste blokova', () => {
  const p = parseMedium(`---\ntags: One, Two, Three\n---\n# Title here\n\n${THUMB}\n\nIntro text.\n\n## Big\n\n### Small\n\n> a quote\n\n- item one\n- item two\n\nLast.`);
  assert.deepEqual(p.tags, ['One', 'Two', 'Three']);
  assert.equal(p.title, 'Title here');
  assert.deepEqual(p.blocks.map((b) => b.type), ['image', 'p', 'h2', 'h3', 'quote', 'ul', 'p']);
  assert.equal(p.blocks[0].src, PH_THUMB);
  assert.equal(p.blocks[0].href, PH_VIDEO);
  assert.deepEqual(p.blocks[5].items, ['item one', 'item two']);
  assert.deepEqual(p.problems, []);
});

test('parseMedium: CRLF i BOM ne smetaju', () => {
  const p = parseMedium(`﻿---\r\ntags: A, B, C\r\n---\r\n# T\r\n\r\ntext\r\n`);
  assert.equal(p.title, 'T');
  assert.deepEqual(p.tags, ['A', 'B', 'C']);
});

test('parseMedium: naslov ispod pasusa bez prazne linije je problem (desilo se uživo)', () => {
  const p = parseMedium('# T\n\nA paragraph that ends here.\n## Heading right under it\n\nNext.');
  assert.equal(p.problems.length, 1);
  assert.match(p.problems[0], /bez prazne linije/);
  for (const stray of ['> quote', '- item', '![alt](x.png)']) {
    assert.equal(parseMedium(`# T\n\nText line.\n${stray}`).problems.length, 1, stray);
  }
});

test('parseMedium: dva naslova su problem', () => {
  assert.match(parseMedium('# One\n\ntext\n\n# Two').problems.join(), /više od jednog naslova/);
});

test('inlineLinks i plainText', () => {
  const raw = 'See the [full video](https://x.test/a) and *this* **that** [two](https://x.test/b).';
  assert.deepEqual(inlineLinks(raw).map((l) => [l.text, l.url]), [['full video', 'https://x.test/a'], ['two', 'https://x.test/b']]);
  assert.equal(plainText(raw), 'See the full video and this that two.');
});

// ---------------------------------------------------------------- pravila

test('validateMedium: ispravan članak prolazi (700 reči, 1 link)', () => {
  const r = check(article());
  assert.deepEqual(r.errors, []);
  assert.equal(r.stats.videoLinks, 1);
  assert.equal(r.stats.wantLinks, 1);
  assert.ok(r.stats.words >= 600 && r.stats.words < 800, `reči: ${r.stats.words}`);
});

test('validateMedium: od 800 reči treba 2 linka, prvi oko sredine, drugi na kraju', () => {
  const paras = [];
  for (let i = 0; i < 9; i++) paras.push(`${i === 0 ? 'Hunahpu and Xbalanque ' : ''}${words(98, `p${i}`)}.`);
  const mid = [...paras];
  mid[4] += ` The pace is easiest to follow in the ${LINK}.`;
  const good = [...mid, `${words(80, 'z')}. If you would rather watch: the ${LINK}.`];
  const ok = check(article({ paras: good }));
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.stats.wantLinks, 2);

  const one = check(article({ paras: [...paras, `${words(80, 'z')}. The ${LINK}.`] }));
  assert.ok(has(one, /linkova ka videu u tekstu: 1, treba 2/));

  const early = [...paras];
  early[0] += ` Early: the ${LINK}.`;
  const bad = check(article({ paras: [...early, `${words(80, 'z')}. The ${LINK}.`] }));
  assert.ok(has(bad, /prvi link ka videu je na \d+% teksta/));
});

test('validateMedium: manje od 600 i više od 1500 reči', () => {
  const short = check(article({ paras: [`Hunahpu and Xbalanque ${words(100, 'a')}. The ${LINK}.`] }));
  assert.ok(has(short, /najmanje 600/));
  const long = [];
  for (let i = 0; i < 16; i++) long.push(`${i === 0 ? 'Hunahpu and Xbalanque ' : ''}${words(98, `q${i}`)}.`);
  assert.ok(has(check(article({ paras: [...long, `${words(10, 'z')}. The ${LINK}.`, `The ${LINK}.`] })), /najviše 1500/));
});

test('validateMedium: thumbnail ispod naslova je obavezan i tačan', () => {
  assert.ok(has(check(article({ thumb: '' })), /prvo ispod naslova mora da bude thumbnail/));
  assert.ok(has(check(article({ thumb: `[![Hunahpu and Xbalanque in the animated story](${PH_THUMB})](https://example.com)` })), /mora da vodi na/));
  assert.ok(has(check(article({ thumb: `[![Hunahpu and Xbalanque in the animated story](https://i.ytimg.com/x.jpg)](${PH_VIDEO})` })), /mora da bude \{\{THUMBNAIL\}\}/));
  assert.ok(has(check(article({ thumb: `[![short](${PH_THUMB})](${PH_VIDEO})` })), /alt tekst/));
  const second = article({ paras: [`${words(30, 'a')}.`, `![x](https://x.test/i.png)`] });
  assert.ok(has(check(second), /sme samo jedna slika/));
});

test('validateMedium: tagovi', () => {
  assert.ok(has(check(article({ tags: 'One, Two' })), /tags: 2/));
  assert.ok(has(check(article({ tags: 'A, B, C, D, E, F' })), /tags: 6/));
  assert.ok(has(check(article({ tags: 'A, B, #C' })), /bez #/));
  assert.ok(has(check(article({ tags: `A, B, ${'x'.repeat(26)}` })), /najviše 25/));
});

test('validateMedium: link mora na kraj rečenice ili pasusa i da kaže 2D animated + YouTube', () => {
  const mid = article({ paras: [`Hunahpu and Xbalanque ${words(98, 'a')}.`, `${words(100, 'b')}.`, `${words(100, 'c')}.`, `${words(100, 'd')}.`, `${words(100, 'e')}.`, `${words(100, 'f')}.`,
    `${words(80, 'g')}. See ${LINK} for the rest of it.`] });
  assert.ok(has(check(mid), /nije na kraju rečenice ili pasusa/));

  const nowords = article({ paras: [`Hunahpu and Xbalanque ${words(98, 'a')}.`, `${words(100, 'b')}.`, `${words(100, 'c')}.`, `${words(100, 'd')}.`, `${words(100, 'e')}.`, `${words(100, 'f')}.`,
    `${words(80, 'g')}. The whole story is [here](${PH_VIDEO}).`] });
  assert.ok(has(check(nowords), /ne kaže šta čitalac dobija/));

  const noYt = article({ paras: [`Hunahpu and Xbalanque ${words(98, 'a')}.`, `${words(100, 'b')}.`, `${words(100, 'c')}.`, `${words(100, 'd')}.`, `${words(100, 'e')}.`, `${words(100, 'f')}.`,
    `${words(80, 'g')}. The [whole story in motion online](${PH_VIDEO}).`] });
  assert.ok(has(check(noYt), /"2D animated" i da je na "YouTube"/));
});

test('validateMedium: poslednji link ka videu je u poslednjem pasusu pre podnožja', () => {
  const r = check(article({ paras: [`Hunahpu and Xbalanque ${words(98, 'a')}. The ${LINK}.`, `${words(100, 'b')}.`, `${words(100, 'c')}.`, `${words(100, 'd')}.`, `${words(100, 'e')}.`, `${words(100, 'f')}.`, `${words(100, 'g')}.`] }));
  assert.ok(has(r, /poslednji link ka videu mora da bude u poslednjem pasusu/));
});

test('validateMedium: podnožje sa kanalom i sajtom', () => {
  assert.ok(has(check(article({ footer: 'More animated stories on our channel.' })), /podnožje nema link ka kanalu/));
  assert.ok(has(check(article({ footer: `More: [Animated Tales on YouTube](${CHANNEL.url})` })), /podnožje nema link ka sajtu/));
});

test('validateMedium: rezervisana mesta i pravi YouTube link', () => {
  const unknown = article({ paras: [`Hunahpu and Xbalanque ${words(98, 'a')} {{OTHER}}.`, `${words(500, 'b')}.`, `${words(90, 'g')}. The ${LINK}.`] });
  assert.ok(has(check(unknown), /nepoznato rezervisano mesto \{\{OTHER\}\}/));
  const real = article({ paras: [`Hunahpu and Xbalanque ${words(98, 'a')} https://www.youtube.com/watch?v=abcdefghijk.`, `${words(500, 'b')}.`, `${words(90, 'g')}. The ${LINK}.`] });
  assert.ok(has(check(real), /pravi YouTube link videa ne ide u medium.md/));
});

test('validateMedium: likovi — naslov sve ili nijedan, tekst ih pominje', () => {
  const protagonists = ['Hunahpu', 'Xbalanque'];
  assert.deepEqual(check(article(), { protagonists }).errors, []);
  const partial = check(article({ title: 'Hunahpu and the Lords of Death in the Maya Underworld' }), { protagonists });
  assert.ok(has(partial, /naslov imenuje samo Hunahpu/));
  const none = check(article({ title: 'Two Brothers Outwitted the Lords of Death in the Maya Underworld' }), { protagonists });
  assert.ok(!has(none, /naslov imenuje samo/));
  const noBody = check(article({ paras: [`${words(300, 'a')}.`, `${words(300, 'b')}.`, `${words(90, 'g')}. The ${LINK}.`] }), { protagonists });
  assert.ok(has(noBody, /tekst ne pominje glavne likove: Hunahpu, Xbalanque/));
});

test('validateMedium: naslov nije jedna od YouTube opcija', () => {
  const publishText = `TITLE OPTIONS:\n1. ${TITLE} — names\n2. Another One Entirely — angle\n`;
  assert.ok(has(check(article(), { publishText }), /isti kao jedna od YouTube opcija/));
  assert.ok(!has(check(article({ title: 'A Different Headline for the Same Story' }), { publishText }), /isti kao/));
});

test('validateMedium: članak mora biti drugačiji od skripte', () => {
  const copied = words(104, 'k');
  const script = `Intro. ${copied} Outro.`;
  const near = article({ paras: [`Hunahpu and Xbalanque ${copied}.`, `${words(100, 'b')}.`, `${words(100, 'c')}.`, `${words(100, 'd')}.`, `${words(100, 'e')}.`, `${words(90, 'g')}. The ${LINK}.`] });
  const r = check(near, { script });
  assert.ok(has(r, /ponavlja skriptu/));
  assert.ok(r.stats.scriptOverlap > RULES.maxScriptOverlap);
  const fresh = check(article(), { script });
  assert.ok(!has(fresh, /ponavlja skriptu/));
  assert.ok(fresh.stats.scriptOverlap < 0.01);
});

test('validateMedium: preuzet description je upozorenje, ne greška', () => {
  const desc = words(300, 'd');
  const publishText = `TITLE OPTIONS:\n1. X — a\n\nDESCRIPTION:\n${desc}\n\nChapters:\n0:00 A\n`;
  const body = article({ paras: [`Hunahpu and Xbalanque ${desc}.`, `${words(200, 'b')}.`, `${words(90, 'g')}. The ${LINK}.`] });
  const r = check(body, { publishText });
  assert.ok(r.warnings.some((w) => /description/.test(w)));
  assert.ok(!has(r, /description/));
});

test('shingles, overlap i descriptionOf', () => {
  assert.equal(shingles('one two three four five six seven').size, 2);
  assert.equal(shingles('[thoughtful] one two three four five six').size, 1, 'audio tag ne računa');
  assert.equal(overlap('one two three four five six', 'zero one two three four five six'), 1);
  assert.equal(overlap('a b c d e f', 'x y z'), 0);
  assert.equal(descriptionOf('DESCRIPTION:\nFirst para.\n\nSecond para.\n\nChapters:\n0:00 X'), 'First para.\n\nSecond para.');
  assert.equal(descriptionOf('nothing here'), '');
});

// ---------------------------------------------------------------- HTML za editor

test('inlineHtml: escape, linkovi, naglasci, rezervisana mesta', () => {
  assert.equal(inlineHtml('a < b & "c"'), 'a &lt; b &amp; &quot;c&quot;');
  assert.equal(inlineHtml('see [it](https://x.test/?a=1&b=2)'), 'see <a href="https://x.test/?a=1&amp;b=2">it</a>');
  assert.equal(inlineHtml('**bold** and *soft*'), '<strong>bold</strong> and <em>soft</em>');
  assert.equal(inlineHtml(`[watch](${PH_VIDEO})`, { videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk' }),
    '<a href="https://www.youtube.com/watch?v=abcdefghijk">watch</a>');
  assert.equal(inlineHtml(`[watch](${PH_VIDEO})`), `<a href="${PH_VIDEO}">watch</a>`, 'bez vrednosti ostaje oznaka');
});

test('bodyHtml: ## je veliki naslov Medium-a (h3), ### mali (h4); slika se preskače', () => {
  const p = parseMedium(`# T\n\n${THUMB}\n\nIntro.\n\n## Big\n\n### Small\n\n> q\n\n- a\n- b`);
  const html = bodyHtml(p.blocks, { videoUrl: 'https://v.test/' });
  assert.equal(html, '<p>Intro.</p>\n<h3>Big</h3>\n<h4>Small</h4>\n<blockquote>q</blockquote>\n<ul><li>a</li><li>b</li></ul>');
  assert.equal(bodyText(p.blocks), 'Intro.\n\nBig\n\nSmall\n\nq\n\n- a\n- b');
});

// ---------------------------------------------------------------- feed i poklapanje

const FEED = `<feed>
<entry>
  <id>yt:video:SHORT000001</id><yt:videoId>SHORT000001</yt:videoId>
  <title>How the Maya Twins Greeted Every Lord of Death by Name</title>
  <link rel="alternate" href="https://www.youtube.com/shorts/SHORT000001"/>
  <published>2026-11-18T20:28:10+00:00</published>
  <media:group><media:description>The short about the twins, linked to the full video.</media:description></media:group>
</entry>
<entry>
  <id>yt:video:LONGVIDEO01</id><yt:videoId>LONGVIDEO01</yt:videoId>
  <title>Hunahpu and Xbalanque Went Down to the Maya Underworld, Where Their Father Died</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=LONGVIDEO01"/>
  <published>2026-11-15T19:00:00+00:00</published>
  <media:group><media:description>The lords of the Maya underworld invited two brothers to a ball game. It was a trap, and the brothers knew it, because it was how their father had died.

This is the story of Hunahpu and Xbalanque.</media:description></media:group>
</entry>
<entry>
  <id>yt:video:OTHERVIDEO1</id><yt:videoId>OTHERVIDEO1</yt:videoId>
  <title>Damqi &quot;Ruled&quot; Assyria &amp; Babylonia</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=OTHERVIDEO1"/>
  <published>2026-11-14T10:00:00+00:00</published>
  <media:group><media:description>Something else.</media:description></media:group>
</entry>
</feed>`;

const PUBLISH = `TITLE OPTIONS:
1. Hunahpu and Xbalanque Beat the Maya Lords of Death at Their Own Game — names + premise
2. Hunahpu and Xbalanque Went Down to the Maya Underworld, Where Their Father Died — the family trap

DESCRIPTION:
The lords of the Maya underworld invited two brothers to a ball game. It was a trap, and the brothers knew it, because it was how their father had died.

This is the story of Hunahpu and Xbalanque.

Chapters:
0:00 An Invitation
`;

test('parseFeed: id, naslov, entiteti, Shortovi', () => {
  const e = parseFeed(FEED);
  assert.equal(e.length, 3);
  assert.deepEqual(e.map((x) => x.isShort), [true, false, false]);
  assert.equal(e[1].id, 'LONGVIDEO01');
  assert.equal(e[2].title, 'Damqi "Ruled" Assyria & Babylonia');
  assert.match(e[1].description, /^The lords of the Maya underworld/);
});

test('matchEpisode: po naslovu iz publish.md; Short se preskače', () => {
  const r = matchEpisode(parseFeed(FEED), PUBLISH);
  assert.equal(r.entry.id, 'LONGVIDEO01');
});

test('matchEpisode: po početku description-a kad je naslov izmenjen', () => {
  const edited = FEED.replace('Hunahpu and Xbalanque Went Down to the Maya Underworld, Where Their Father Died', 'A Title The User Rewrote');
  assert.equal(matchEpisode(parseFeed(edited), PUBLISH).entry.id, 'LONGVIDEO01');
});

test('matchEpisode: nema videa, više videa, samo Short', () => {
  const none = matchEpisode(parseFeed(FEED), 'TITLE OPTIONS:\n1. Something Entirely Unrelated — x\n');
  assert.equal(none.entry, null);
  assert.match(none.reason, /još nije u feedu/);

  const twice = FEED.replace('Damqi &quot;Ruled&quot; Assyria &amp; Babylonia', 'Hunahpu and Xbalanque Beat the Maya Lords of Death at Their Own Game');
  const amb = matchEpisode(parseFeed(twice), PUBLISH);
  assert.equal(amb.entry, null);
  assert.match(amb.reason, /više videa/);

  // naslov postoji, ali samo kao Short: nije video epizode
  const shortOnly = FEED.replace('/watch?v=LONGVIDEO01', '/shorts/LONGVIDEO01');
  assert.equal(matchEpisode(parseFeed(shortOnly), PUBLISH).entry, null);
});

test('videoIdFrom i watchUrl', () => {
  assert.equal(videoIdFrom('nxcTrVYjtcg'), 'nxcTrVYjtcg');
  assert.equal(videoIdFrom('https://www.youtube.com/watch?v=nxcTrVYjtcg&t=5'), 'nxcTrVYjtcg');
  assert.equal(videoIdFrom('https://youtu.be/nxcTrVYjtcg'), 'nxcTrVYjtcg');
  assert.equal(videoIdFrom('https://www.youtube.com/shorts/nxcTrVYjtcg'), 'nxcTrVYjtcg');
  assert.equal(videoIdFrom('not a video'), null);
  assert.equal(watchUrl('nxcTrVYjtcg'), 'https://www.youtube.com/watch?v=nxcTrVYjtcg');
});

// ---------------------------------------------------------------- CLI i profil

test('parseArgs', () => {
  assert.equal(parseArgs(['episodes/x']).action, 'check', 'folder bez akcije = provera');
  const a = parseArgs(['episodes/x', '--post', '--draft', '--force', '--video', 'abcdefghijk', '--port', '9444']);
  assert.deepEqual([a.dir, a.action, a.draft, a.force, a.video, a.port], ['episodes/x', 'post', true, true, 'abcdefghijk', 9444]);
  assert.equal(parseArgs(['--sweep']).action, 'sweep');
  assert.equal(parseArgs(['--watch', 'episodes/x', '--every', '3']).every, 3);
  const d = parseArgs(['--dump', 'https://medium.com/me/settings']);
  assert.deepEqual([d.action, d.url], ['dump', 'https://medium.com/me/settings']);
  assert.throws(() => parseArgs(['--nope']), /nepoznata opcija/);
  assert.equal(parseArgs([]).action, null);
});

test('PROFILE: short bio staje u 160 znakova i imenuje kanal i sajt; About nosi prave linkove', () => {
  assert.ok(PROFILE.bio.length <= 160, `bio ima ${PROFILE.bio.length}`);
  assert.ok(PROFILE.bio.includes(CHANNEL.handle));
  assert.ok(PROFILE.bio.includes('animatedtales.mihailobuilds.com'));
  const links = PROFILE.about.filter((p) => p.link).map((p) => p.link.href);
  assert.deepEqual(links, [CHANNEL.url, SITE]);
  // link je uvek na kraju pasusa; tekst linka ne liči na adresu (Medium bi ga sam pretvorio u pogrešan link)
  for (const p of PROFILE.about.filter((x) => x.link)) assert.ok(!/\w\.\w/.test(p.link.text), p.link.text);
  assert.match(CAPTION, /2D animated/);
});

// ---------------------------------------------------------------- epizoda na disku

function tmpEpisode(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'medium-ep-'));
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}

test('checkEpisode: bez medium.md, ispravan i neispravan', () => {
  const dir = tmpEpisode({ 'episode.json': '{"protagonists":["Hunahpu","Xbalanque"]}', 'script.md': 'A short script.' });
  try {
    assert.equal(checkEpisode(dir).exists, false);
    fs.writeFileSync(path.join(dir, 'medium.md'), article());
    const ok = checkEpisode(dir);
    assert.equal(ok.exists, true);
    assert.deepEqual(ok.errors, []);
    fs.writeFileSync(path.join(dir, 'medium.md'), article({ tags: 'One' }));
    assert.ok(checkEpisode(dir).errors.length > 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('isPending: čeka objavu samo epizoda sa medium.md koja nije objavljena', () => {
  const dir = tmpEpisode({ 'medium.md': article() });
  try {
    assert.equal(isPending(loadEpisode(dir)), true);
    fs.writeFileSync(path.join(dir, 'medium.json'), '{"status":"failed"}');
    assert.equal(isPending(loadEpisode(dir)), true, 'neuspeo pokušaj se ponavlja');
    fs.writeFileSync(path.join(dir, 'medium.json'), '{"status":"published","updating":true}');
    assert.equal(isPending(loadEpisode(dir)), false, 'objavljen se nikad ne objavljuje ponovo, ni usred izmene');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  assert.equal(isPending(loadEpisode(tmpEpisode({ 'script.md': 'x' }))), false, 'bez medium.md nema šta da se objavi');
});
