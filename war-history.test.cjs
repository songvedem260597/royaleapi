const assert = require('node:assert/strict');
const { test } = require('node:test');
const { raceRow, leagueFromWarTrophies } = require('./war-history.js');
const source = require('./wintertime-data.json');

test('War league follows historical War Trophies and never uses Clan Score', () => {
  assert.equal(leagueFromWarTrophies(null), null);
  assert.equal(leagueFromWarTrophies(1999), 'Vàng I');
  assert.equal(leagueFromWarTrophies(2369), 'Vàng II');
  assert.equal(leagueFromWarTrophies(2589), 'Vàng III');
});

test('138-1 official War displays all verified fields', () => {
  const meta = source.warSeasonsMeta[0];
  const row = raceRow(meta, { name: 'WinterTime', decks: 395, participants: 43, observed: 50, membersCount: 50 });
  assert.equal(meta.season, '138-1');
  assert.equal(row.rank, 1);
  assert.equal(row.league, 'Vàng II');
  assert.equal(row.fame, 10000);
  assert.equal(row.decks, 412);
  assert.equal(row.rosterDecks, 395);
  assert.equal(row.avgPerParticipant, Math.round(10000/48));
  assert.equal(row.officialParticipants, 48);
  assert.equal(row.participants, 43);
  assert.equal(row.trophyChange, 20);
  assert.equal(row.total, 10000);
  assert.equal(row.raceTarget, '10,000/10,000');
});

test('Colosseum War uses source Fame and includes historical departed players in TB denominator', () => {
  const row = raceRow(source.warSeasonsMeta[1], { decks: 350, participants: 37, observed: 50, membersCount: 50 });
  assert.equal(row.rank, 1);
  assert.equal(row.fame, 60500);
  assert.equal(row.officialParticipants, 85);
  assert.equal(row.avgPerParticipant, Math.round(60500/85));
  assert.equal(row.decks, 355);
  assert.equal(row.raceTarget, 'Colosseum');
  assert.equal(row.trophyChange, 100);
});

test('unknown race result never borrows historical rank, Fame or trophies', () => {
  const x = raceRow({ season: '138-1', date: '2026-11-09', aggregatesVerified: false,
    rank: 1, clanFame: 60500, clanDecks: 355, trophyChange: 100 },
    { decks: 10, participants: 2, observed: 20, membersCount: 50 });
  assert.equal(x.rank, null);
  assert.equal(x.fame, null);
  assert.equal(x.league, null);
  assert.equal(x.trophyChange, null);
  assert.equal(x.decks, 10);
  assert.equal(x.officialDecks, false);
  assert.equal(x.total, null);
});

test('last 10 source races all verified with per-war rank, Fame, Deck', () => {
  assert.equal(source.warSeasonsMeta.length, 10);
  assert.ok(source.warSeasonsMeta.every(x => x.aggregatesVerified));
  const rows = source.warSeasonsMeta.map(x => raceRow(x, { membersCount: 50 }));
  assert.ok(rows.every(x => x.rank > 0 && x.fame >= 0 && x.officialDecks));
  assert.deepEqual(rows.slice(0, 3).map(x => [x.rank, x.fame, x.decks]), [[1,10000,412],[1,60500,355],[1,10000,416]]);
});
