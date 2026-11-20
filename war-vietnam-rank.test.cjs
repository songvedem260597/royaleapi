'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

test('hero summary has ten KPI tiles including clan-reported Vietnam War Top 53', () => {
  const prelude = app.slice(0, app.indexOf('let currentClan ='));
  const start = app.lastIndexOf('renderSummary = function(clan) {');
  assert.ok(start > 0, 'find the final/visible KPI renderer');
  const finalRenderer = app.slice(start).match(/^[\s\S]*?\};\r?\nrender\(\);/);
  assert.ok(finalRenderer, 'find the final visible renderer end');
  const el = {innerHTML: ''};
  const sandbox = {
    window: {ClanAnalytics: {}},
    document: {
      getElementById: id => id === 'clan-summary' ? el : null,
      querySelectorAll: () => []
    },
    renderSummary() {}
  };
  vm.runInNewContext(prelude + '\n' + finalRenderer[0].replace(/\r?\nrender\(\);$/, '') + '\n' +
    "renderSummary({avgScore:47, rawClanScore:133154, clanWarTrophies:2409, members:Array(50).fill({}), " +
    "counts:{good:23,average:14,warning:12,kick:0,unknown:1}});", sandbox);
  assert.equal((el.innerHTML.match(/class="kpi-label"/g) || []).length, 10);
  assert.match(el.innerHTML, /Hạng Hội chiến Việt Nam/);
  assert.match(el.innerHTML, /id="kpi-vietnam-war-rank">Top 53/);
  assert.match(el.innerHTML, /Theo clan · 17\/11/);
  assert.match(el.innerHTML, /Chưa xác minh qua API xếp hạng realtime/);
  assert.ok(el.innerHTML.indexOf('Cúp War') < el.innerHTML.indexOf('Điểm TB nội bộ'));
  assert.ok(el.innerHTML.indexOf('Chưa đủ dữ liệu') < el.innerHTML.indexOf('Hạng Hội chiến Việt Nam'),
    'Vietnam War rank must be the LAST KPI tile');
  assert.match(el.innerHTML, /Hạng Hội chiến Việt Nam[\s\S]*?Theo clan · 17\/11<\/small><\/div><\/div><div class="health-bar">/,
    'Vietnam rank closes the KPI grid as the tenth card');
  assert.match(el.innerHTML, /133,154/);
  assert.match(el.innerHTML, /2,409/);
});

test('ranking snapshot is not represented as a verified live API field', () => {
  assert.match(app, /VIETNAM_WAR_RANK_REPORT = Object\.freeze\(\{ rank: 53, asOf: '17\/11\/2026' \}\)/);
  assert.match(app, /not a live API field/);
  assert.match(css, /\.hero-stats-unified > div:last-child \{ grid-column: auto; \}/);
  assert.match(css, /\.hero-stats-unified \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(html, /styles\.css\?v=20261121-kpi-spacing-v2/);
  assert.match(html, /app\.js\?v=20261121-meta-header-v1/);
});
