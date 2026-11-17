const assert = require('node:assert/strict');
const { test } = require('node:test');
const { calculate, rankMembers } = require('./contribution-score.js');

const active = (more = {}) => ({
  tag: '#EXAMPLE', warParticipation: 100, decksThisWeek: 16,
  warDecksHistory: [16, 16, 16, 16, 16],
  donations: 300, daysOffline: 0, ...more
});

test('fully active member scores 100 and is excellent using observed stats', () => {
  const s = calculate(active({ warFame: null, cw2History: [{ fame: null }] }));
  assert.equal(s.score, 100);
  assert.equal(s.excellent, true);
  assert.deepEqual(s.breakdown, {
    participationPoints: 40, historicalDeckPoints: 40,
    currentDeckPoints: 10, donationPoints: 10, offlinePenalty: 0
  });
});

test('missing Fame does not change score; fabricated Fame cannot improve rank', () => {
  const plain = calculate(active({ warFame: null }));
  const fake = calculate(active({ warFame: 999999, cw2History: [{ fame: 999999 }] }));
  assert.equal(fake.score, plain.score);
});

test('two observed zero Deck wars and low participation flag review; never from missing Fame', () => {
  assert.equal(calculate(active({
    warParticipation: 10, warDecksVerifiedHistory: [0, 0, 16, 16]
  })).review, true);
  assert.equal(calculate(active({
    warParticipation: 10, warDecksVerifiedHistory: [null, null, 0, 0]
  })).review, false);
});

test('unknown Deck or participation data cannot be awarded a zero score or Top 3', () => {
  const missing = calculate(active({ warParticipation: null }));
  const incomplete = calculate(active({ warDecksHistory: [12, null, null] }));
  assert.equal(missing.score, null);
  assert.equal(missing.excellent, false);
  assert.equal(missing.review, false);
  assert.equal(incomplete.score, null);
});

test('weekly decks and donations contribute, inactivity reduces score', () => {
  const base = calculate(active({ warParticipation: 75, warDecksHistory: [12,12,12,12], decksThisWeek: 0, donations: 0, daysOffline: 0 }));
  const better = calculate(active({ warParticipation: 75, warDecksHistory: [12,12,12,12], decksThisWeek: 16, donations: 300, daysOffline: 0 }));
  assert.equal(better.score - base.score, 20);
  const offline = calculate(active({ warParticipation: 75, warDecksHistory: [12,12,12,12], decksThisWeek: 16, donations: 300, daysOffline: 10 }));
  assert.equal(offline.score, better.score - 15);
});

test('Top 3 ranking excludes incomplete candidates and uses verified score only', () => {
  const good = [{...active(),tag:'#A', score:100, contribution:calculate(active())},
   {...active({ warParticipation:70 }),tag:'#C',score:70,contribution:calculate(active({ warParticipation:70 }))},
   {...active(),tag:'#B',score:null,contribution:calculate(active({ warDecksHistory:[] }))}];
  assert.deepEqual(rankMembers(good).map(m=>m.tag), ['#A','#C']);
});

test('calculate handles non-object and empty input gracefully', () => {
  assert.equal(calculate(null).score, null);
  assert.equal(calculate(undefined).complete, false);
  assert.equal(calculate({}).score, null);
  assert.equal(calculate('string').complete, false);
});

test('breakdown fields are null when their inputs are unknown', () => {
  const s = calculate({ warParticipation: 80, decksThisWeek: null, donations: null, daysOffline: null, warDecksHistory: [16, 16] });
  assert.equal(s.breakdown.currentDeckPoints, null);
  assert.equal(s.breakdown.donationPoints, null);
  assert.equal(s.breakdown.offlinePenalty, null);
  assert.equal(s.score, null);
});

test('offline penalty caps at 15 points', () => {
  const s = calculate(active({ daysOffline: 100 }));
  assert.equal(s.breakdown.offlinePenalty, 15);
});

test('score is clamped to 0 minimum', () => {
  const s = calculate(active({ warParticipation: 0, warDecksHistory: [0, 0], decksThisWeek: 0, donations: 0, daysOffline: 30 }));
  assert.equal(s.score, 0);
});

test('excellent requires participation, average decks and low offline', () => {
  assert.equal(calculate(active({ warParticipation: 60 })).excellent, false);
  assert.equal(calculate(active({ warDecksHistory: [8, 8, 8, 8] })).excellent, false);
  assert.equal(calculate(active({ daysOffline: 10 })).excellent, false);
});

test('warDecksVerifiedHistory takes precedence over warDecksHistory', () => {
  const s = calculate(active({ warDecksHistory: [0, 0, 0, 0], warDecksVerifiedHistory: [16, 16, 16, 16] }));
  assert.equal(s.averageDecks, 16);
  assert.equal(s.lastTwoZeroDecks, false);
});

test('rankMembers returns empty array for non-array input', () => {
  assert.deepEqual(rankMembers(null), []);
  assert.deepEqual(rankMembers(undefined), []);
  assert.deepEqual(rankMembers([]), []);
});

test('rankMembers breaks ties by completedDecks then participation', () => {
  const a = { tag: '#A', score: 80, warParticipation: 80, donations: 100, contribution: { complete: true, completedDecks: 40 } };
  const b = { tag: '#B', score: 80, warParticipation: 90, donations: 100, contribution: { complete: true, completedDecks: 40 } };
  const c = { tag: '#C', score: 80, warParticipation: 80, donations: 100, contribution: { complete: true, completedDecks: 50 } };
  assert.deepEqual(rankMembers([a, b, c]).map(m => m.tag), ['#C', '#B', '#A']);
});

test('rankMembers excludes candidates with non-finite score', () => {
  const ok = { tag: '#OK', score: 50, warParticipation: 50, donations: 0, contribution: { complete: true, completedDecks: 10 } };
  const bad = { tag: '#BAD', score: NaN, warParticipation: 50, donations: 0, contribution: { complete: true, completedDecks: 10 } };
  assert.deepEqual(rankMembers([ok, bad]).map(m => m.tag), ['#OK']);
});

test('rankMembers orders by score and excludes unknown scores', () => {
  const ranked = rankMembers([
    active({ tag: '#A', warParticipation: 100 }),
    active({ tag: '#B', warParticipation: null }),
    active({ tag: '#C', warParticipation: 50, decksThisWeek: 8 })
  ]);
  assert.ok(Array.isArray(ranked));
  const tags = ranked.map((m) => m.tag);
  assert.ok(!tags.includes('#B'));
  assert.equal(tags[0], '#A');
});

test('calculate clamps score within 0..100 and reports breakdown keys', () => {
  const s = calculate(active({ daysOffline: 999, donations: 0, warParticipation: 0 }));
  assert.ok(s.score === null || (s.score >= 0 && s.score <= 100));
  if (s.breakdown) {
    for (const k of ['participationPoints','historicalDeckPoints','currentDeckPoints','donationPoints','offlinePenalty']) {
      assert.ok(k in s.breakdown);
    }
  }
});

test('excellent flag requires high score and no review flag', () => {
  const s = calculate(active());
  assert.equal(s.excellent, s.score >= 90 && !s.review);
});
