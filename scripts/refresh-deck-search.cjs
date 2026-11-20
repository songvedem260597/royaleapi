// Print the public RoyaleTrack snapshot; no API key or browser session is needed.
const sources = ['', 'lava-hound', 'balloon'];
const origin = 'https://royaletrack.com';

async function readDeckPage(filter) {
  const url = origin + '/en/decks' + (filter ? '/' + filter : '');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(url + ' returned HTTP ' + response.status);
  const html = await response.text();
  const date = html.match(/<time dateTime="(\d{4}-\d{2}-\d{2})T/)?.[1];
  const decks = [];
  const images = {};
  for (const [block] of html.matchAll(/<li class="flex flex-col gap-3 py-4[\s\S]*?<\/li>/g)) {
    const name = block.match(/<p class="font-extrabold"><span[^>]*>\d+(?:<!-- -->)?\.<\/span>([^<]+)<\/p>/)?.[1]?.trim();
    const copy = block.match(/href="https:\/\/link\.clashroyale\.com\/deck\/fr\?deck=((?:\d{8};){7}\d{8})"/)?.[1];
    const cards = [];
    for (const [, slug, content] of block.matchAll(/<a[^>]+href="\/en\/cards\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const title = content.match(/title="([^"]+)"/)?.[1] || '';
      const key = slug + (title.endsWith('(evolution)') ? '-ev1' : title.endsWith('(hero)') ? '-hero' : '');
      const image = content.match(/\bsrc="(\/cards\/[\w-]+\.webp\?v=\d+)"/)?.[1] ||
        content.match(/\?url=(https%3A%2F%2Fapi-assets\.clashroyale\.com%2F(?:cards|cardevolutions|cardheroes)%2F\d+%2F[\w-]+\.png)/)?.[1];
      if (image) images[key] = decodeURIComponent(image);
      cards.push(key);
    }
    if (!name || !copy || cards.length !== 8) continue;
    const value = (regex) => block.match(regex)?.[1];
    const win = value(/<dt[^>]*>Win rate<\/dt><dd><span[^>]*>([\d.]+)%<\/span><\/dd>/i);
    const usage = value(/<dt[^>]*>Usage<\/dt><dd[^>]*>([\d.]+%)<\/dd>/i);
    const elixir = value(/title="Average Elixir cost"[^>]*>[\s\S]*?<\/svg>([\d.]+)<\/span>/);
    const cycle = value(/<span>([\d.]+)\s*cycle<\/span>/i);
    decks.push({ name, cards, copy, ...(win && { win: Number(win) }), usage, elixir, cycle });
  }
  const matching = filter ? decks.filter(d => d.cards.some(c => c.replace(/-(ev1|hero)$/, '') === filter)) : decks;
  if (!date || matching.length < 5) {
    throw new Error('Unexpected deck data from ' + url + ' (' + matching.length + ' matching decks)');
  }
  return { decks: matching, images, date };
}

async function main() {
  const pages = await Promise.all(sources.map(readDeckPage));
  const [common, ...filtered] = pages;
  const seen = new Set();
  const decks = [...common.decks, ...filtered.flatMap(p => p.decks)].filter(d => {
    const key = [...d.cards].sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const images = Object.assign({}, ...pages.map(p => p.images));
  const date = pages.map(p => p.date).sort()[0];
  const keys = [...new Set(decks.flatMap(d => d.cards))].sort();
  const usedImages = Object.fromEntries(keys.filter(k => images[k]).map(k => [k, images[k]]));
  console.log('{' +
    '\n  "date": ' + JSON.stringify(date) + ',' +
    '\n  "images": ' + JSON.stringify(usedImages, null, 2).replace(/\n/g, '\n  ') + ',' +
    '\n  "decks": [\n    ' + decks.map(d => JSON.stringify(d)).join(',\n    ') + '\n  ]\n}');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
