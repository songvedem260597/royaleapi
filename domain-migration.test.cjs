'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('GitHub Pages custom domain is wintertime.site', () => {
  assert.equal(fs.readFileSync('CNAME','utf8').trim(), 'wintertime.site');
});

test('production domain uses existing working clan API proxy without changing backend', () => {
  const js = fs.readFileSync('app.js','utf8');
  const html = fs.readFileSync('index.html','utf8');
  assert.match(js,/location\.hostname === 'wintertime\.site'/);
  assert.match(js,/location\.hostname === 'www\.wintertime\.site'/);
  assert.match(js,/https:\/\/codexpro\.muatenmien\.store\/api\/royale-proxy\/clans\//);
  assert.match(html,/app\.js\?v=20261120-deck-search-v1/);
});
