const assert = require('node:assert/strict');
const { test } = require('node:test');
const { search, suggestCards, royaleApiUrl } = require('./deck-search.js');
const catalog = require('./card-catalog.js');
const snapshot = require('./deck-search-data.json');
const liveDecks = require('./wintertime-data.json').topMetaDecks;

const hasCard = (deck, card) => deck.cards.some(c => c.replace(/-(ev1|hero)$/, '') === card);

test('the full base-card catalog is searchable independently of the deck snapshot', () => {
  assert.ok(catalog.length >= 127);
  assert.equal(new Set(catalog.map(card => card.slug)).size, catalog.length);
  for (const card of catalog) {
    assert.equal(suggestCards(card.name)[0]?.slug, card.slug, card.name);
    assert.deepEqual(search(card.name, [], null), { filters: [card.slug], matches: [] });
  }
  for (const slug of ['tower-princess', 'cannoneer', 'dagger-duchess', 'royal-chef', 'minion-giant']) {
    assert.ok(catalog.some(card => card.slug === slug), slug);
  }
});

test('autocomplete ranks exact names, prefixes, aliases and small typos without forcing irrelevant matches', () => {
  for (const [query, expected] of [
    ['laVa', 'lava-hound'], ['balolon', 'balloon'], ['ballon', 'balloon'],
    ['Bóng bay', 'balloon'], ['mini p.e.k.k.a', 'mini-pekka'], ['hero mega minion', 'mega-minion']
  ]) {
    assert.equal(suggestCards(query)[0]?.slug, expected, query);
  }
  const goblins = suggestCards('gob');
  assert.equal(goblins.length, 3);
  assert.ok(goblins.every(card => /^goblin/.test(card.slug)));
  for (const query of ['', 'zzzz', 'Hog Rider 2.6', 'LavaLoon']) assert.deepEqual(suggestCards(query), []);
});

test('Lava search finds distinct Lava Hound variants beyond the current Top 10', () => {
  const { matches, filters } = search('  LaVA  ', liveDecks, snapshot);
  assert.deepEqual(filters, ['lava-hound']);
  assert.ok(matches.length > 10);
  assert.ok(matches.every(deck => hasCard(deck, 'lava-hound')));
  assert.equal(new Set(matches.map(d => [...d.cards].sort().join(','))).size, matches.length);
  assert.deepEqual(search('lava-hound', liveDecks, snapshot).matches, matches);
});

test('Balloon includes all card forms and LavaLoon requires both cards', () => {
  const balloon = search('Bóng bay', liveDecks, snapshot);
  assert.deepEqual(balloon.filters, ['balloon']);
  assert.ok(balloon.matches.length > 10 && balloon.matches.every(d => hasCard(d, 'balloon')));
  assert.ok(balloon.matches.some(d => d.cards.includes('balloon-hero')));
  const lavaLoon = search('LavaLoon', liveDecks, snapshot).matches;
  assert.ok(lavaLoon.length > 1 && lavaLoon.length < balloon.matches.length);
  assert.ok(lavaLoon.every(d => hasCard(d, 'lava-hound') && hasCard(d, 'balloon')));
});

test('querying a deck title does not widen to all decks containing its main card', () => {
  const { matches, filters } = search('hog rider 2.6', liveDecks, snapshot);
  assert.deepEqual(filters, []);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(d => d.name.toLowerCase().includes('hog rider 2.6')));
  assert.deepEqual(search('', liveDecks, snapshot).matches, []);
  assert.deepEqual(search('not a real deck', liveDecks, snapshot).matches, []);
});

test('RoyaleAPI links use its 1-day rating filter with the canonical card slug', () => {
  assert.equal(royaleApiUrl('balloon'), 'https://royaleapi.com/decks/popular?time=1d&sort=rating&inc=balloon&use_all_forms=true');
  assert.equal(new URL(royaleApiUrl('lava-hound')).searchParams.get('inc'), 'lava-hound');
  assert.equal(royaleApiUrl('balloon&inc=hacked'), '');
});

test('cached deck entries have eight cards, real game copy URLs and snapshot provenance', () => {
  assert.match(snapshot.date, /^\d{4}-\d{2}-\d{2}$/);
  for (const deck of snapshot.decks) {
    assert.equal(deck.cards.length, 8);
    assert.match(deck.copy, /^(?:\d{8};){7}\d{8}$/);
    assert.ok(deck.win >= 0 && deck.win <= 100);
    assert.ok(deck.cards.every(c => /^(?:\/cards\/[\w-]+\.webp\?v=\d+|https:\/\/api-assets\.clashroyale\.com\/(?:cards|cardevolutions|cardheroes)\/\d+\/[\w-]+\.png)$/.test(snapshot.images[c])));
  }
});
