const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const scorer = require('./contribution-score.js');
const fixture = require('./wintertime-data.json');

function analyzeSnapshot() {
  const context = { window: { WintertimeContribution: scorer } };
  vm.runInNewContext(fs.readFileSync('clan-analytics.js', 'utf8'), context, { filename: 'clan-analytics.js' });
  return context.window.ClanAnalytics.analyzeClan(fixture);
}

test('all observed members use only source Deck, participation, donation, inactivity data', () => {
  const clan = analyzeSnapshot();
  assert.equal(clan.members.length, 50);
  assert.equal(clan.clanWarTrophies, null);
  const ranked = scorer.rankMembers(clan.members);
  assert.ok(ranked.length >= 3);
  assert.ok(ranked.every(m => m.score >= 0 && m.score <= 100 && m.contribution.complete));
  assert.equal(clan.mvpName, ranked[0].name);
  const sum = ranked.reduce((s, m) => s + m.score, 0);
  assert.equal(clan.avgScore, Math.round(sum / ranked.length));
  assert.ok(clan.members.some(m => m.warFame === null));
  assert.ok(clan.members.every(m => m.contribution.totalFame10Wars === null));
});

test('unknown Fame and official rank are never fabricated in the output', () => {
  const clan = analyzeSnapshot();
  assert.ok(clan.cw2ClanHistory.every(h => h.fame === null && h.total === null && h.rank === null));
  assert.ok(clan.members.every(m => m.cw2History.every(h => h.fame === null)));
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
  const context = { window: { WintertimeContribution: scorer } };
  vm.runInNewContext(fs.readFileSync('clan-analytics.js', 'utf8'), context, { filename: 'clan-analytics.js' });
  const clan = context.window.ClanAnalytics.analyzeClan(data);
  assert.equal(clan.members[0].score, null);
  assert.equal(clan.members[0].status, 'warning');
  assert.equal(clan.members[0].statusLabel, 'Thiếu dữ liệu');
  assert.equal(scorer.rankMembers(clan.members).length, 0);
});
