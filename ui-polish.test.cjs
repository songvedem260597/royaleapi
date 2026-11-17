const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

test('Copy Deck uses restrained amber styling without altering deck destination', () => {
  assert.match(app, /class="meta-pill meta-pill-copy-deck" href=/);
  assert.match(css, /a\.meta-pill-copy-deck \{[\s\S]*?background: rgba\(179, 137, 76, 0\.12\);/);
  assert.match(css, /a\.meta-pill-copy-deck:hover,[\s\S]*?background: rgba\(179, 137, 76, 0\.21\);/);
  assert.match(html, /styles\.css\?v=20261117-war-vn-rank-v22/);
  assert.match(html, /app\.js\?v=20261117-war-vn-rank-v15/);
});

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

test('custom War dropdown selections stay one line while preserving full option text', () => {
  const source = app.match(/function formatSelectedDropdownLabel\(sel, opt\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(source, 'selected-label formatter exists');
  const format = new Function(source + '\nreturn formatSelectedDropdownLabel;')();
  assert.equal(format({ id: 'cw2-member-select' }, { textContent: 'Độc cô cầu bại (#2LL9V9088) — 32 đ' }), 'Độc cô cầu bại · 32đ');
  assert.equal(format({ id: 'cw2-clan-range-select' }, { textContent: 'Toàn Clan WinterTime (#GYQJL9GV) — 5 mùa gần nhất' }), 'Toàn Clan WinterTime · 5 mùa');
  assert.match(app, /txt\.textContent = opt\.textContent/);
  assert.match(app, /label\.textContent = formatSelectedDropdownLabel\(sel, opt\)/);
  assert.match(css, /\.custom-dropdown-label \{[\s\S]*?white-space: nowrap;[\s\S]*?text-overflow: ellipsis;/);
});

test('clan rule wording and personal War chart note match requested concise copy', () => {
  assert.match(html, /Tích cực Donate thẻ bài hằng ngày\./);
  assert.doesNotMatch(html, /Ae là 1 BiG Familie/);
  assert.doesNotMatch(html, /Thiếu bản ghi không đồng nghĩa 0 Deck/);
  assert.match(app, /Fame cá nhân từng kỳ/);
  assert.doesNotMatch(app, /WarStats · bản đệm Clash Royale API/);
});

test('Clan rules are permanently visible with no expand control or duplicated overview', () => {
  assert.match(html, /<div class="rules-details rules-always-open"/);
  assert.doesNotMatch(html, /<details class="rules-details">/);
  assert.doesNotMatch(html, /Xem đầy đủ nội quy và tiêu chí đánh giá/);
  assert.doesNotMatch(html, /class="rules-overview"/);
  assert.match(css, /\.clan-info-grid \{ align-items: start; \}/);
  assert.match(css, /\.clan-info-grid > \.info-card \{ align-self: start; height: auto; \}/);
  assert.doesNotMatch(html, /Thiếu bản ghi không đồng nghĩa 0 Deck/);
});

test('War controls remain one horizontal row and rank glow honors reduced motion', () => {
  assert.match(css, /\/\* The War controls belong side by side/);
  assert.match(css, /\.cw2-actions \{[\s\S]*?flex-wrap: nowrap;/);
  assert.match(css, /\.cw2-actions > \.btn \{ flex: 0 0 auto; white-space: nowrap; \}/);
  assert.match(css, /@media \(max-width: 640px\) \{\s*\.cw2-actions \{ flex-wrap: nowrap;/);
  assert.match(css, /\.cw2-clan-panel \.cw2-meta \.badge-good \{[\s\S]*?linear-gradient\(/);
  assert.match(css, /@keyframes cw2-rank-shimmer/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.cw2-clan-panel \.cw2-meta \.badge-good \{ animation: none; \}/);
});

test('WINTERTIME letters contain snow and podium cards have gentle border and float', () => {
  assert.match(html, /id="hero-title">WINTERTIME/);
  assert.equal((html.match(/class="hero-snow-layer"/g) || []).length, 4);
  assert.equal((html.match(/aria-hidden="true">WINTERTIME<\/span>/g) || []).length, 4);
  assert.match(html, /styles\.css\?v=20261117-war-vn-rank-v22/);
  assert.match(css, /\.hero-snow-layer \{[\s\S]*?animation: wintertime-letter-snow var\(--snow-duration, 11s\) linear infinite;/);
  assert.match(css, /@keyframes wintertime-letter-snow/);
  assert.match(css, /url\("\.\/snowflake-six\.svg\?v=variety-v3"\)/);
  assert.match(css, /\.podium-stage \.podium-card \{[\s\S]*?animation: wintertime-cloud-float/);
  assert.match(css, /\.podium-stage \.podium-card::before \{[\s\S]*?padding: 1px;[\s\S]*?mask-composite: exclude;/);
  assert.ok(css.includes('@property --wintertime-border-angle {'));
  assert.ok(css.includes('background: conic-gradient(from var(--wintertime-border-angle)'));
  assert.ok(css.includes('to { --wintertime-border-angle: 360deg; }'));
  assert.match(css, /\.podium-stage \.podium-card::after \{[\s\S]*?filter: blur\(4px\);[\s\S]*?opacity: \.38;/);
  assert.match(css, /\.podium-stage \.podium-card::before \{[\s\S]*?padding: 1px;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.hero-snow-layer,[\s\S]*?animation: none !important;/);
});

test('WINTERTIME snow uses a real six-arm SVG crystal, not round particle dots', () => {
  const snow = fs.readFileSync('snowflake-six.svg', 'utf8');
  assert.match(snow, /<svg[^>]+viewBox="0 0 320 144"/);
  assert.equal((snow.match(/<path d="M0 -4 V-13/g) || []).length, 6);
  assert.equal((snow.match(/<use href="#six-arm-flake"\/>/g) || []).length, 7);
  assert.match(css, /background-size: 320px 144px;/);
  // The 38-unit glyph is rendered at approximately 7–12px, not a 20–60px icon.
  assert.ok(26 * .4346 < 12);
  for (const deg of [60, 120, 180, 240, 300]) {
    assert.ok(snow.includes('rotate(' + deg + ')'));
  }
  assert.match(css, /background-clip: text/);
  assert.match(html, /styles\.css\?v=20261117-war-vn-rank-v22/);
  assert.match(html, /war-member-evaluation\.js\?v=20261115-tenure-v2/);
  assert.match(html, /app\.js\?v=20261117-war-vn-rank-v15/);
  assert.match(app, /Fame TB /);
  assert.match(app, /averagedWarWeeks/);
});

test('snow varies individual crystal scale, opacity and shade while each layer gets independent randomized speed', () => {
  const snow = fs.readFileSync('snowflake-six.svg', 'utf8');
  const sizes = snow.split(' scale(').slice(1).map(s => Number(s.split(')')[0]));
  const hues = snow.split(' stroke="#').slice(1).map(s => '#' + s.slice(0, 6));
  const opacities = snow.split(' opacity="').slice(1).map(s => Number(s.split('"')[0]));
  assert.ok(new Set(sizes).size >= 5);
  assert.ok(new Set(hues).size >= 5);
  assert.ok(new Set(opacities).size >= 5);
  assert.ok(Math.max(...sizes) * 26 < 12);
  assert.ok(Math.min(...sizes) * 26 >= 4);
  assert.ok(app.includes('const durationBands = [[7, 9], [9.5, 12.5], [13, 16], [17, 21]];'));
  assert.ok(app.includes('Math.random()'));
  assert.match(app, /--snow-duration/);
  assert.match(app, /--snow-delay/);
  assert.match(app, /--snow-x/);
});

test('phone menu is a full-height right sidebar occupying one-third of viewport', () => {
  const destinations = [
    '#top3-podium-section', '#top3-weekly-section', '#cw2-clan-panel',
    '#clan-roster', '#meta-decks-section'
  ];
  assert.match(html, /id="mobile-nav-toggle"/);
  assert.match(html, /aria-controls="mobile-side-panel" aria-expanded="false"/);
  assert.match(html, /<nav class="site-nav" id="site-nav" aria-label="Điều hướng chính">/);
  assert.match(html, /<aside class="mobile-side-panel" id="mobile-side-panel" role="dialog"/);
  assert.match(html, /aria-modal="true" aria-label="Menu WinterTime" aria-hidden="true" inert>/);
  assert.match(html, /id="mobile-nav-backdrop" hidden/);
  assert.match(html, /id="mobile-side-close" aria-label="Đóng menu"/);
  assert.match(html, /<nav class="mobile-side-links" aria-label="Điều hướng điện thoại">/);
  const mobileLinks = html.split('class="mobile-side-links"')[1].split('</nav>')[0];
  destinations.forEach(href => assert.equal(mobileLinks.split('href="' + href + '"').length - 1, 1));
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*?\.mobile-nav-toggle \{ display: inline-flex; margin-left: auto; \}/);
  assert.match(css, /\.mobile-side-panel \{[\s\S]*?position: fixed;[\s\S]*?width: 33\.333333vw;[\s\S]*?height: 100dvh;/);
  assert.match(css, /\.mobile-side-panel\.is-open \{[\s\S]*?transform: translateX\(0\);/);
  assert.match(css, /\.mobile-side-links a \{[\s\S]*?min-height: 48px;/);
  assert.match(app, /function initMobileNavigation\(\)/);
  assert.match(app, /panel\.inert = !open/);
  assert.match(app, /backdrop\.hidden = !open/);
  assert.match(app, /setAttribute\('aria-expanded', String\(open\)\)/);
  assert.match(app, /nav\.querySelectorAll\('a\[href\^="#"\]'\)/);
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /event\.key === 'Tab'/);
  assert.match(html, /styles\.css\?v=20261117-war-vn-rank-v22/);
  assert.match(html, /app\.js\?v=20261117-war-vn-rank-v15/);
});

test('mobile navigation uses a neutral black luxury theme and icon-only hamburger', () => {
  const toggle = html.split('id="mobile-nav-toggle"')[1].split('</button>')[0];
  assert.ok(toggle.includes('aria-label="Mở menu điều hướng"'));
  assert.ok(toggle.includes('<svg viewBox="0 0 24 24"'));
  assert.ok(!toggle.includes('<span>Menu</span>'));
  assert.ok(css.includes('width: 44px;'));
  assert.ok(css.includes('height: 44px;'));
  assert.ok(css.includes('background: linear-gradient(165deg, #17181b 0%, #101114 52%, #090a0c 100%);'));
  assert.ok(css.includes('color: #b6bac2;'));
  assert.ok(css.includes('border: 0;'));
  assert.ok(css.includes('background: transparent;'));
  assert.ok(css.includes('padding: 12px 8px;'));
  assert.ok(css.includes('padding: max(16px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 18px 12px;'));
  assert.ok(html.includes('M4 6h16M4 12h11M4 18h16'));
  assert.ok(css.includes('color: #ffffff;'));
  assert.ok(!css.includes('background: linear-gradient(180deg, #182621'));
  assert.ok(html.includes('styles.css?v=20261117-war-vn-rank-v22'));
  for (const [hash, name] of [
    ['#top3-podium-section', 'BXH Ưu tú'],
    ['#top3-weekly-section', 'BXH War tuần'],
    ['#clan-roster', 'BXH Thành viên'],
    ['#cw2-clan-panel', 'Lịch sử War'],
    ['#meta-decks-section', 'Deck Meta']
  ]) {
    assert.equal(html.split('href="' + hash + '">' + name + '</a>').length - 1, 2);
  }
});

test('lightweight CodePen-style screen snow is capped, CSS-animated and disabled on mobile', () => {
  assert.match(css, /\.wt-screen-snow \{[\s\S]*?position: fixed;[\s\S]*?pointer-events: none;/);
  assert.match(css, /\.wt-screen-flake \{[\s\S]*?animation: wt-screen-snow-fall/);
  assert.match(css, /@keyframes wt-screen-snow-fall/);
  assert.match(css, /@media \(max-width: 820px\), \(pointer: coarse\), \(prefers-reduced-motion: reduce\) \{/);
  assert.match(css, /\.wt-screen-snow\.is-paused \.wt-screen-flake \{ animation-play-state: paused; \}/);
  assert.match(app, /function initDesktopScreenSnow\(\)/);
  assert.match(app, /\(min-width: 821px\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(app, /const MAX_FLAKES = 36;/);
  assert.match(app, /document\.createDocumentFragment\(\)/);
  assert.match(app, /random\(1\.5, 3\.5\)/);
  assert.match(app, /random\(10, 22\)/);
  assert.match(app, /random\(-65, 65\)/);
  assert.match(app, /document\.addEventListener\('visibilitychange', setPaused\)/);
  assert.match(app, /eligible\.addEventListener\('change', sync\)/);
  const implementation = app.slice(app.indexOf('function initDesktopScreenSnow()'));
  assert.doesNotMatch(implementation, /requestAnimationFrame\(|setInterval\(/);
  assert.match(html, /styles\.css\?v=20261117-war-vn-rank-v22/);
  assert.match(html, /app\.js\?v=20261117-war-vn-rank-v15/);
});

test('phone screens hide all title snow layers, and marquee uses only the requested War reminder', () => {
  assert.match(css, /@media \(max-width: 820px\) \{[\s\S]*?\.hero-snow-layer \{[\s\S]*?display: none !important;[\s\S]*?animation: none !important;/);
  assert.equal((app.match(/Nhớ đánh đủ 4 Deck War nhé anh em/g) || []).length, 2);
  assert.doesNotMatch(app, /Nhắc nhở mỗi ngày:/);
  assert.doesNotMatch(app, /kẻo cuối tuần ăn chiếc giày/);
});
