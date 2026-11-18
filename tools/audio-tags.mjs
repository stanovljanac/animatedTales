// tools/audio-tags.mjs
//
// ElevenLabs audio tagovi u `script.md` — `[thoughtful]`, `[chuckles]`, `[short pause]`.
//
// Tag je režijska napomena glasu, ne izgovoreni tekst: Eleven v3 ga čita kao uputstvo
// ("ovde se nasmej", "ovde stani"), a ne kao reči. Zato `script.md` ostaje JEDAN izvor —
// isti fajl se lepi u ElevenLabs sa tagovima, a svaki alat nizvodno (align, timing.json,
// titlovi, chapteri) vidi samo izgovoreni tekst. Sve što skida tagove prolazi kroz ovaj modul,
// da pravilo ne bude prepisano na dva mesta.
//
// Zabranjeni tagovi: korisnik ne želi sigh tag — previše veštački zvuči. Pravilo važi i za
// bliske oblike (sigh, sighing, "sighs heavily"). Proverava ga `align.mjs` (greška pre
// poravnanja) i `tests/audio-tags.test.mjs` (nad svim skriptama u `episodes/`). Proverava se
// CEO fajl, i HTML komentari: u njima stoje ALT varijante outra, a svaka od njih može sutra da
// postane narracija.

/** Izvor regularnog izraza za tag; zasebno da bi se od njega pravili i anchored oblici. */
const TAG_SOURCE =
  // uglaste zagrade · jedna do pet reči od slova (razmak, apostrof ili crtica između) ·
  // iza zatvorene zagrade ne sme odmah `(` — to je Markdown link `[tekst](url)`, ne tag
  String.raw`\[(?=[A-Za-z])[A-Za-z]+(?:[ '’-][A-Za-z]+){0,4}\](?!\()`;

/** Jedan tag; `[1]`, `[...]` i `[tekst](url)` nisu tag. */
export const AUDIO_TAG = new RegExp(TAG_SOURCE, 'g');

/** Prva reč taga koja ga čini zabranjenim: sigh, sighs, sighing, sighed. */
export const BANNED_TAG_WORD = /^sigh/i;

/**
 * Tekst sa uklonjenim tagovima. Tag na početku reda odnosi i svoje razmake, tag usred reda
 * ostavlja tačno jedan razmak, a razmak ispred interpunkcije posle taga nestaje
 * ("so [short pause]." -> "so.").
 */
export function stripAudioTags(text) {
  const s = String(text);
  if (!new RegExp(TAG_SOURCE).test(s)) return s;
  return s
    .replace(new RegExp(String.raw`^[ \t]*(?:${TAG_SOURCE}[ \t]*)+`, 'gm'), '')
    .replace(AUDIO_TAG, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?…])/g, '$1')
    .replace(/[ \t]+$/gm, '');
}

/** Svi tagovi u tekstu, redom, bez zagrada i u malim slovima: `['thoughtful', 'short pause']`. */
export function listAudioTags(text) {
  return [...String(text).matchAll(AUDIO_TAG)].map((m) => m[0].slice(1, -1).trim().toLowerCase());
}

/** Zabranjeni tagovi (`[sighs]` i srodni), redom, sa zagradama kakvi su napisani. */
export function findBannedAudioTags(text) {
  return [...String(text).matchAll(AUDIO_TAG)]
    .map((m) => m[0])
    .filter((tag) => BANNED_TAG_WORD.test(tag.slice(1, -1).trim()));
}
