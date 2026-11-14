const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

test('sync state remains internal; verbose RoyaleTrack banner is not rendered in header', () => {
  assert.doesNotMatch(html, /id="auto-sync-text"/);
  assert.doesNotMatch(html, /class="header-status"/);
  assert.match(app, /updateLastUpdatedUI/);
  assert.match(app, /setInterval\(/);
});

test('War source provenance is accessible on demand and no longer falsely says player Fame is unsynced', () => {
  assert.match(html, /<details class="cw2-source-details">/);
  assert.match(html, /id="clan-war-source-note"/);
  assert.doesNotMatch(app, /Fame từng người trong bảng riêng chưa được đồng bộ/);
  assert.match(app, /Fame cá nhân chỉ hiển thị khi có bản ghi xác minh/);
});

test('elite podium score separates figure from compact label without modifying ranking formula', () => {
  assert.match(app, /class="podium-score-value"/);
  assert.match(app, /class="podium-score-unit"/);
  assert.match(app, /WintertimeEliteRanking\.rankMembers/);
  assert.match(css, /\.podium-score-unit/);
});

test('member status rows present concise badges and an accessible detail action', () => {
  assert.match(app, /Xem chi tiết War của/);
  assert.match(app, /class="sr-only"/);
  assert.match(css, /\.table-card \.table-scroll \{ contain: paint; \}/);
  assert.match(css, /\.member-table tbody td:last-child \{ min-width: 0; \}/);
});

test('KPI labels wrap rather than truncating; War chart distinguishes recent race', () => {
  assert.match(css, /\.hero-stats \.kpi-label \{[\s\S]*?white-space: normal/);
  assert.match(css, /\.cw2-clan-chart \.cw2-bar-prior/);
  assert.match(css, /\.cw2-clan-chart \.cw2-bar-current/);
  assert.match(app, /cw2-bar-current/);
});

test('full clan rules are retained in expandable accessible details', () => {
  assert.match(html, /<details class="rules-details">/);
  assert.match(html, /Xem đầy đủ nội quy và tiêu chí đánh giá/);
  assert.match(html, /không đồng nghĩa 0 Deck/);
});
