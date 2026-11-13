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
