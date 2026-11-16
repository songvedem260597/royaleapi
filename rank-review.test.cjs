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
const member = (role, decks, donations=20) => ({
  role, donations, cw2History: decks.map((n, i) => war('138-' + (2-i), n))
});

test('member: two verified 12/16 War + Donate yields promotion advisory', () => {
  const result = review.evaluate(member('member', [12,12], 1));
  assert.equal(result.status, 'promote');
  assert.equal(result.warsVerified, 2);
  assert.match(result.reason, /12\/16 Deck/);
});
test('elder: two verified War + Donate retains title', () => {
  assert.equal(review.evaluate(member('elder', [16,12], 80)).status, 'retain');
});
test('elder: an under-12 War or zero Donate warns about demotion only', () => {
  assert.equal(review.evaluate(member('elder', [11, 16], 50)).status, 'demote');
  assert.equal(review.evaluate(member('elder', [16, 16], 0)).status, 'demote');
  assert.equal(review.evaluate(member('member', [11, 16], 50)).status, 'not_eligible');
});
test('threshold is per War, not 24 decks across two War', () => {
  assert.equal(review.evaluate(member('member', [16, 8], 100)).status, 'not_eligible');
  assert.equal(review.evaluate(member('member', [12, 12], 100)).status, 'promote');
});
test('do not borrow older good War when latest War is below threshold', () => {
  assert.equal(review.evaluate(member('elder', [5, 16, 16], 100)).status, 'demote');
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
  assert.equal(review.evaluate(member('elder',[16,16],null)).status, 'unknown');
  assert.equal(review.evaluate(member('member',[16,16],undefined)).status, 'promote'); // default donation = 20
  assert.equal(review.evaluate({role:'member',cw2History:member('member',[16,16]).cw2History}).status,'unknown');
});
test('leader and coleader are exempt from rank assessment', () => {
  for (const role of ['leader','coLeader']) {
    assert.equal(review.evaluate(member(role,[0,0],0)).status,'excluded');
  }
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
  assert.match(html,/rank-review\.js\?v=20261117-role-review-v1/);
  assert.match(html,/rank-review-ui\.js\?v=20261117-role-review-v1/);
  assert.match(html,/rank-review\.css\?v=20261117-role-review-v1/);
  assert.match(analytics,/r\.rankReview = window\.WintertimeRankReview\?\.evaluate\?\./);
  assert.match(app,/rank-mini-promote/);
  assert.match(app,/rank-mini-demote/);
  assert.match(ui,/rank-review-group rank-review-down/);
  assert.match(ui,/previousRender/);
  assert.match(css,/\.rank-review-output\[hidden\] \{ display: none; \}/);
  assert.doesNotMatch(ui,/fetch\(|PUT|PATCH|POST/);
});
