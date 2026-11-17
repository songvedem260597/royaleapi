'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const review = require('./rank-review.js');
const war = (season, decks, options={}) => ({
  season,
  decks,
  decksVerified: true,
  recordedInWarLog: true,
  warLogAvailable: true,
  ...options
});
const NOW = Date.parse('2026-11-17T12:00:00Z');
const member = (role, decks, donations=20) => ({
  role, donations,
  // Test baseline has a verified member tenure exceeding 14 days.
  joinedAt: '2026-10-01', joinedAtVerified: true,
  cw2History: decks.map((n, i) => war('138-' + (2-i), n, {
    date: new Date(NOW - (i * 7 + 1) * 86400000).toISOString().slice(0,10)
  }))
});

test('member: two verified 8/16 War + Donate yields promotion advisory', () => {
  const result = review.evaluate(member('member', [8,8], 1));
  assert.equal(result.status, 'promote');
  assert.equal(result.warsVerified, 2);
  assert.match(result.reason, /8\/16 Deck/);
});
test('elder: five verified War averaging at least 8/16 retains title', () => {
  const result = review.evaluate(member('elder', [16, 8, 8, 8, 8], 80));
  assert.equal(result.status, 'retain');
  assert.equal(result.warsVerified, 5);
  assert.equal(result.averageDecks, 9.6);
});
test('elder: average below 8/16 across five War or zero Donate warns about demotion', () => {
  const below = review.evaluate(member('elder', [7, 8, 8, 8, 8], 50));
  assert.equal(below.averageDecks, 7.8);
  assert.equal(below.status, 'demote');
  assert.equal(review.evaluate(member('elder', [8, 8, 8, 8, 8], 50)).status, 'retain');
  assert.equal(review.evaluate(member('elder', [16, 16, 16, 16, 16], 0)).status, 'demote');
  assert.equal(review.evaluate(member('member', [7, 16], 50)).status, 'not_eligible');
});
test('threshold is per War, not just 16 decks across two War', () => {
  assert.equal(review.evaluate(member('member', [16, 0], 100)).status, 'not_eligible');
  assert.equal(review.evaluate(member('member', [8, 8], 100)).status, 'promote');
});
test('do not demote elders with fewer than five verified War weeks', () => {
  assert.equal(review.evaluate(member('elder', [5, 16, 16], 100)).status, 'unknown');
  assert.equal(review.evaluate(member('elder', [1, 1, 1, 1], 100)).status, 'unknown');
  const result = review.evaluate(member('elder', [5, 16, 16, 3, 10], 100));
  assert.equal(result.averageDecks, 10);
  assert.equal(result.status, 'retain');
});
test('missing, unverified or out-of-range War never causes rank change', () => {
  for (const history of [
    [war('138-2', null), war('138-1', 16)],
    [war('138-2', 0, {decksVerified:false}), war('138-1', 16)],
    [war('138-2', 16, {recordedInWarLog:false}), war('138-1', 16)],
    [war('138-2', 16, {warLogAvailable:false}), war('138-1', 16)],
    [war('138-2', 17), war('138-1', 16)],
    [war('138-2', 16)]
  ]) {
    assert.equal(review.evaluate({role:'elder',donations:100,cw2History:history}).status, 'unknown');
  }
});
test('missing Donate must be unknown rather than zero', () => {
  assert.equal(review.evaluate(member('elder',[16,16,16,16,16],null)).status, 'unknown');
  assert.equal(review.evaluate(member('member',[16,16],undefined)).status, 'promote'); // default donation = 20
  assert.equal(review.evaluate({role:'member',cw2History:member('member',[16,16]).cw2History}).status,'unknown');
});
test('newcomer with one verified latest War above 8 and Donate can get early promotion review', () => {
  const r = review.evaluate(member('member', [8], 1));
  assert.equal(r.status, 'promote');
  assert.equal(r.newcomerReview, true);
  assert.match(r.reason, /Leader xác nhận/);
  assert.equal(review.evaluate(member('member', [7], 20)).status, 'unknown');
  assert.equal(review.evaluate(member('member', [8], 0)).status, 'unknown');
});
test('promotion requires full 14 days in clan, 13 days is never eligible', () => {
  const recent = { ...member('member', [8, 8], 25), joinedAt: '2026-11-04' };
  const enough = { ...recent, joinedAt: '2026-11-03' };
  assert.equal(review.evaluate(recent, {nowMs: NOW}).status, 'unknown');
  assert.match(review.evaluate(recent, {nowMs: NOW}).reason, /tối thiểu 14 ngày/);
  assert.equal(review.evaluate(enough, {nowMs: NOW}).status, 'promote');
  assert.equal(review.MIN_TENURE_DAYS, 14);
  // Even a perfect one-week War cannot override a short membership duration.
  assert.equal(review.evaluate({...recent, cw2History: recent.cw2History.slice(0, 1)}, {nowMs: NOW}).status, 'unknown');
});

test('without joinedAt, require 14-day-old documented clan War history and officer verification', () => {
  const m = { ...member('member', [8, 8], 20), joinedAt: undefined, joinedAtVerified: false };
  assert.equal(review.evaluate(m, {nowMs: NOW}).status, 'unknown'); // earliest War only 8 days ago
  m.cw2History[1].date = '2026-11-02'; // 15 days ago
  const result = review.evaluate(m, {nowMs: NOW});
  assert.equal(result.status, 'promote');
  assert.match(result.reason, /không rời rồi gia nhập lại/);
  assert.equal(review.evaluate({...m,cw2History: m.cw2History.slice(0,1)}, {nowMs: NOW}).status,'unknown');
});

test('an unverified or future join date never authorizes an early promotion by itself', () => {
  const m = member('member', [8], 20);
  assert.equal(review.evaluate({...m, joinedAt:'2026-11-18'}, {nowMs:NOW}).status,'unknown');
  assert.equal(review.evaluate({...m, joinedAt:'2026-11-03',joinedAtVerified:false}, {nowMs:NOW}).status,'unknown');
});

test('no early promotion from an old War when latest is unverified or from a documented older failed War', () => {
  const rows = [war('138-2', null, {decksVerified:false}), war('138-1', 16)];
  assert.equal(review.evaluate({role:'member',donations:10,cw2History:rows}).status, 'unknown');
  assert.equal(review.evaluate(member('member', [8, 0], 10)).status, 'not_eligible');
});
test('five-week demotion cannot average through missing recent War records', () => {
  const rows = member('elder', [0, 0, 0, 0, 0, 0], 100).cw2History;
  rows[1].decksVerified = false;
  assert.equal(review.evaluate({role:'elder',donations:100,cw2History:rows}).status, 'unknown');
});
test('leader and coleader are exempt from rank assessment', () => {
  for (const role of ['leader','coLeader']) {
    assert.equal(review.evaluate(member(role,[0,0],0)).status,'excluded');
  }
});
test('rank warning sits below the role and cannot overlap the trophy column', () => {
  const css=fs.readFileSync('rank-review.css','utf8');
  const app=fs.readFileSync('app.js','utf8');
  assert.match(css, /\.rank-mini \{[\s\S]*?display: block;[\s\S]*?max-width: 100%;[\s\S]*?white-space: normal;/);
  assert.match(css, /#clan-roster \.member-table tbody td:nth-child\(3\) \{/);
  assert.equal((app.match(/title="Cảnh báo xét giáng về Thành viên">↓ Xét giáng/g) || []).length, 2);
  assert.equal((app.match(/title="Đề xuất thăng lên Trưởng lão">↑ Xét thăng/g) || []).length, 2);
});

test('existing Kick status remains separate; UI includes dedicated review controls', () => {
  const html=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('app.js','utf8');
  const analytics=fs.readFileSync('clan-analytics.js','utf8');
  const ui=fs.readFileSync('rank-review-ui.js','utf8');
  const css=fs.readFileSync('rank-review.css','utf8');
  assert.match(html,/id="btn-export-kick"/);
  assert.match(html,/id="btn-rank-review"/);
  assert.match(html,/id="rank-review-output"/);
  assert.match(html,/rank-review\.js\?v=20261117-role-review-v5/);
  assert.match(html,/rank-review-ui\.js\?v=20261117-role-review-v5/);
  assert.match(html,/rank-review\.css\?v=20261117-role-review-v2/);
  assert.match(analytics,/r\.rankReview = window\.WintertimeRankReview\?\.evaluate\?\./);
  assert.match(app,/rank-mini-promote/);
  assert.match(app,/rank-mini-demote/);
  assert.match(ui,/rank-review-group rank-review-down/);
  assert.match(ui,/previousRender/);
  assert.match(css,/\.rank-review-output\[hidden\] \{ display: none; \}/);
  assert.doesNotMatch(ui,/fetch\(|PUT|PATCH|POST/);
});
