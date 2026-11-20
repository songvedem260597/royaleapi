// Print the catalog's base card names and canonical filter slugs from RoyaleTrack.
async function main() {
  const source = 'https://royaletrack.com/en/cards';
  const response = await fetch(source, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(source + ' returned HTTP ' + response.status);
  const html = await response.text();
  const cards = new Map();
  for (const [, slug, body] of html.matchAll(/<a\b[^>]*\bhref="\/en\/cards\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const name = body.match(/<p class="line-clamp-2 font-extrabold leading-tight">([^<]+)<\/p>/)?.[1]?.trim();
    if (name) cards.set(slug, name.replace(/&amp;/g, '&').replace(/&#x27;|&#39;|&apos;/g, "'"));
  }
  if (cards.size < 127 || !['lava-hound', 'minion-giant', 'tower-princess'].every(slug => cards.has(slug))) {
    throw new Error('Card catalog incomplete (' + cards.size + ' cards)');
  }
  console.log("'use strict';\n");
  console.log('// Source: ' + source + ' — regenerate with node scripts/refresh-card-catalog.cjs');
  console.log('const WintertimeCardCatalog = [');
  for (const [slug, name] of [...cards].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    console.log('  ' + JSON.stringify({ slug, name }) + ',');
  }
  console.log('];\n\nif (typeof module !== "undefined" && module.exports) module.exports = WintertimeCardCatalog;');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
