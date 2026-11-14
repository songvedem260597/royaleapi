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

test('small typographic increase preserves readable desktop and mobile sizes', () => {
  assert.match(css, /body \{ font-size: 16px; \}/);
  assert.match(css, /\.clan-rules-list li \{ font-size: 15px;/);
  assert.match(css, /\.member-table \{ font-size: 14\.5px; \}/);
  assert.match(css, /@media \(max-width: 640px\) \{\s*body \{ font-size: 15\.5px; \}/);
});

test('KPI labels wrap rather than truncating; War chart distinguishes recent race', () => {
  assert.match(css, /\.hero-stats \.kpi-label \{[\s\S]*?white-space: normal/);
  assert.match(css, /\.cw2-clan-chart \.cw2-bar-prior/);
  assert.match(css, /\.cw2-clan-chart \.cw2-bar-current/);
  assert.match(app, /cw2-bar-current/);
});

test('roster always exposes the first ranked member instead of sticky header covering it', () => {
  assert.match(html, /<tbody id="member-tbody"><\/tbody>/);
  assert.match(app, /rows\.map\(\(m, i\) =>/);
  assert.match(app, /'<td>' \+ \(i \+ 1\) \+ '<\/td>'/);
  assert.match(css, /#clan-roster \.member-table thead th \{[\s\S]*?position: static;/);
  assert.match(css, /#clan-roster \.member-table thead th \{[\s\S]*?white-space: nowrap;/);
  assert.match(css, /#clan-roster \.member-table th:nth-child\(1\) \{ width: 6%; \}/);
  assert.match(html, /aria-label="Điểm hoạt động nội bộ">Điểm hoạt động<\/th>/);
});

test('every Meta deck shows exactly eight cards in one row with no oversized black slot', () => {
  assert.match(app, /d\.cards\.map\(c =>/);
  assert.match(css, /\.meta-cards-row \{[\s\S]*?grid-template-columns: repeat\(8, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.meta-card-slot \{[\s\S]*?aspect-ratio: 5 \/ 6;/);
  assert.match(css, /\.meta-card-slot \{[\s\S]*?background: transparent;/);
});

test('Clan rules are permanently visible with no expand control or duplicated overview', () => {
  assert.match(html, /<div class="rules-details rules-always-open"/);
  assert.doesNotMatch(html, /<details class="rules-details">/);
  assert.doesNotMatch(html, /Xem đầy đủ nội quy và tiêu chí đánh giá/);
  assert.doesNotMatch(html, /class="rules-overview"/);
  assert.match(css, /\.clan-info-grid \{ align-items: start; \}/);
  assert.match(css, /\.clan-info-grid > \.info-card \{ align-self: start; height: auto; \}/);
  assert.match(html, /không đồng nghĩa 0 Deck/);
});
