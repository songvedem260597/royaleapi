const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const scorer = require('./contribution-score.js');
const races = require('./war-history.js');
const evalWar = require('./war-member-evaluation.js');
const fixture = require('./wintertime-data.json');

function analyzeSnapshot() {
  const context = { window: { WintertimeContribution: scorer, WintertimeWarHistory: races, WintertimeWarEvaluation: evalWar } };
  vm.runInNewContext(fs.readFileSync('clan-analytics.js', 'utf8'), context, { filename: 'clan-analytics.js' });
  return context.window.ClanAnalytics.analyzeClan(fixture);
}

test('all observed members use only source Deck, participation, donation, inactivity data', () => {
  const clan = analyzeSnapshot();
  assert.equal(clan.members.length, 50);
  assert.equal(clan.clanWarTrophies, 2389);
  const ranked = scorer.rankMembers(clan.members);
  assert.ok(ranked.length >= 3);
  assert.ok(ranked.every(m => m.score >= 0 && m.score <= 100 && m.contribution.complete));
  assert.equal(clan.mvpName, evalWar.rankByLatestWar(clan.members)[0].name);
  const sum = ranked.reduce((s, m) => s + m.score, 0);
  assert.equal(clan.avgScore, Math.round(sum / ranked.length));
  assert.ok(clan.members.some(m => m.warFame === null));
  assert.ok(clan.members.some(m => m.contribution.totalFame10Wars > 0));
  assert.ok(clan.members.every(m => m.contribution.fameVerifiedWeeks >= 0));
});

test('official clan race values exist while unknown player Fame remains null', () => {
  const clan = analyzeSnapshot();
  assert.equal(clan.cw2ClanHistory[0].rank, 1);
  assert.equal(clan.cw2ClanHistory[0].fame, 63750);
  assert.equal(clan.cw2ClanHistory[0].riverProgress, 10000);
  assert.equal(clan.cw2ClanHistory[0].decks, 412);
  assert.equal(clan.cw2ClanHistory[0].league, 'Vàng II');
  assert.ok(clan.cw2ClanHistory.every(h => h.verified && h.rank != null && h.fame != null));
  assert.equal(clan.members.filter(m => m.cw2History.some(h => h.fameVerified)).length, 46);
  assert.equal(clan.members.find(m => m.name === 'Hung').cw2History[0].fame, 0);
  assert.ok(clan.members.every(m => m.score == null || Number.isFinite(m.score)));
});

test('missing data is not marked elite or automatic kick', () => {
  const data = {
    ...fixture,
    members: [{
      name: 'Incomplete', tag: '#INCOMPLETE', role: 'member',
      donations: 0, daysOffline: 0, warParticipation: null,
      warFame: null, decksThisWeek: null, warDecksHistory: [null, null, null],
      cw2History: []
    }]
  };
  const context = { window: { WintertimeContribution: scorer, WintertimeWarHistory: races, WintertimeWarEvaluation: evalWar } };
  vm.runInNewContext(fs.readFileSync('clan-analytics.js', 'utf8'), context, { filename: 'clan-analytics.js' });
  const clan = context.window.ClanAnalytics.analyzeClan(data);
  assert.equal(clan.members[0].score, null);
  assert.equal(clan.members[0].status, 'unknown');
  assert.equal(clan.members[0].statusLabel, 'Chưa đủ dữ liệu');
  assert.equal(scorer.rankMembers(clan.members).length, 0);
});
