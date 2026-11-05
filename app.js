const CA = window.ClanAnalytics;

let currentClan = CA.analyzeClan(CA.generateDemoClan());
let selectedMemberTag = '#2LL9V9088';

function getFilters() {
  return {
    q: (document.getElementById('search-member')?.value || '').toLowerCase().trim(),
    status: document.getElementById('filter-status')?.value || 'all',
    sortBy: document.getElementById('sort-by')?.value || 'score'
  };
}

function upgradeCustomSelects() {
  ['filter-status', 'sort-by', 'cw2-member-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    let wrap = sel.closest('.custom-dropdown');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'custom-dropdown';
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);
      sel.style.display = 'none';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-dropdown-trigger';
      trigger.innerHTML = '<span class="custom-dropdown-label"></span><svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
      const menu = document.createElement('div');
      menu.className = 'custom-dropdown-menu';
      wrap.appendChild(trigger);
      wrap.appendChild(menu);
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = wrap.classList.contains('open');
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) wrap.classList.add('open');
      });
    }
    const menu = wrap.querySelector('.custom-dropdown-menu');
    const label = wrap.querySelector('.custom-dropdown-label');
    menu.innerHTML = '';
    Array.from(sel.options).forEach(opt => {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item' + (opt.value === sel.value ? ' selected' : '');
      item.dataset.value = opt.value;
      item.innerHTML = '<span>' + opt.textContent + '</span><span class="check">✓</span>';
      item.addEventListener('click', e => {
        e.stopPropagation();
        sel.value = opt.value;
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        label.textContent = opt.textContent;
        wrap.classList.remove('open');
        sel.dispatchEvent(new Event('change'));
      });
      menu.appendChild(item);
    });
    const cur = sel.options[sel.selectedIndex];
    label.textContent = cur ? cur.textContent : '';
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
});

function renderSummary(clan) {
  const el = document.getElementById('clan-summary');
  if (!el) return;
  const avg = Math.round(clan.avgScore || 0);
  el.innerHTML =
    '<div class="summary-title"><strong>❄️ WinterTime (#GYQJL9GV)</strong> — Ae là 1 BiG Familie · Yêu cầu bắt buộc biết đánh WAR</div>' +
    '<div class="hero-stats">' +
      '<div><span class="kpi-label">Điểm Clan</span><strong>131,349</strong></div>' +
      '<div><span class="kpi-label">Cúp War</span><strong>2,369</strong></div>' +
      '<div><span class="kpi-label">Điểm TB</span><strong>' + avg + '/100</strong></div>' +
      '<div><span class="kpi-label">Chủ lực MVP</span><strong>' + (clan.mvpName || '—') + '</strong></div>' +
    '</div>' +
    '<div class="health-bar"><div class="health-fill" style="width:' + avg + '%"></div></div>';
}

function renderKPIs(clan) {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('kpi-members', (clan.members.length) + '/50');
  set('kpi-good', clan.counts.good);
  set('kpi-warning', clan.counts.warning);
  set('kpi-kick', clan.counts.kick);
}

function statusBadge(s) {
  const map = { good: ['badge-good', 'Tốt'], warning: ['badge-warning', 'Cảnh báo'], kick: ['badge-kick', 'Kick'] };
  const [cls, label] = map[s] || ['badge-warning', s];
  return '<span class="badge ' + cls + '">' + label + '</span>';
}

function renderCW2Panel(member) {
  if (!member) return;
  const sel = document.getElementById('cw2-member-select');
  if (sel) {
    sel.innerHTML = currentClan.members.map(m =>
      '<option value="' + m.tag + '">' + m.name + ' (' + m.tag + ') — ' + Math.round(m.score || 0) + ' đ</option>'
    ).join('');
    sel.value = member.tag;
    upgradeCustomSelects();
  }
  const meta = document.getElementById('cw2-player-meta');
  if (meta) {
    meta.innerHTML = '<strong>' + member.name + '</strong> <span class="tag-mono">' + member.tag + '</span> ' +
      '<span class="role-badge">' + member.roleLabel + '</span> ' + statusBadge(member.status);
  }
  const link = document.getElementById('cw2-royaleapi-link');
  if (link) link.href = 'https://royaleapi.com/player/' + member.tag.replace('#', '');
  const bd = document.getElementById('cw2-breakdown');
  if (bd) {
    const c = member.contribution || {};
    const cards = [
      ['Điểm Cống Hiến Cá Nhân', Math.round(member.score || 0) + '/100', 'Hạng đánh giá: ' + (member.statusLabel || member.status)],
      ['Điểm War Fame (Chuẩn 1,600+)', (member.warFame || 0) + ' Fame/tuần', 'Fame Score: ' + (c.fameScore || 0) + '/45'],
      ['Chuyên Cần Sử Dụng Deck', (member.warParticipation ?? 0) + '% (' + (c.totalDecks10Wars || 0) + ' deck/10 mùa)', 'Deck Score: ' + (c.deckScore || 0) + '/35'],
      ['Moving Avg (4 mùa gần nhất) & Donate', (c.movingAvgFame || member.warFame || 0) + ' Fame · Tặng ' + (member.donations || 0), 'Donate Score: ' + (c.donateScore || 0) + '/20']
    ];
    bd.innerHTML = cards.map(x =>
      '<div class="cw2-stat-card"><div class="cw2-stat-title">' + x[0] + '</div><div class="cw2-stat-value">' + x[1] + '</div><div class="cw2-stat-sub">' + x[2] + '</div></div>'
    ).join('');
  }
  renderCW2Chart(member);
  renderCW2History(member);
}

function renderCW2Chart(member) {
  const box = document.getElementById('cw2-chart-box');
  if (!box) return;
  const hist = (member.cw2History || []).slice().reverse();
  const W = 760, H = 230, padL = 40, padR = 20, padT = 30, padB = 40;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const maxFame = 3600;
  const y = f => padT + chartH - (Math.min(f, maxFame) / maxFame) * chartH;
  const n = hist.length || 1;
  const bw = chartW / n;
  let bars = '', labels = '', pts = [];
  hist.forEach((h, i) => {
    const x = padL + i * bw + bw * 0.15;
    const w = bw * 0.7;
    const fame = h.fame || 0;
    const top = y(fame);
    const color = fame < 1600 ? '#f472b6' : '#38bdf8';
    bars += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (padT + chartH - top) + '" fill="' + color + '" rx="3"/>';
    bars += '<text x="' + (x + w / 2) + '" y="' + (top - 5) + '" fill="#e2e8f0" font-size="10" text-anchor="middle">' + fame + '</text>';
    labels += '<text x="' + (x + w / 2) + '" y="' + (H - 12) + '" fill="#94a3b8" font-size="10" text-anchor="middle">' + (h.season || '') + '</text>';
    const ma = h.movingAvg || fame;
    pts.push((x + w / 2) + ',' + y(ma));
  });
  const warnTop = y(1600);
  const warn = '<rect x="' + padL + '" y="' + warnTop + '" width="' + chartW + '" height="' + (padT + chartH - warnTop) + '" fill="#f472b6" opacity="0.08"/>';
  const ref1 = '<line x1="' + padL + '" y1="' + y(1600) + '" x2="' + (W - padR) + '" y2="' + y(1600) + '" stroke="#f472b6" stroke-dasharray="4 4" stroke-width="1"/>';
  const ref2 = '<line x1="' + padL + '" y1="' + y(2600) + '" x2="' + (W - padR) + '" y2="' + y(2600) + '" stroke="#38bdf8" stroke-dasharray="4 4" stroke-width="1"/>';
  const poly = pts.length ? '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#3b82f6" stroke-width="2"/>' : '';
  box.innerHTML = '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' + warn + ref1 + ref2 + bars + poly + labels + '</svg>';
}

function renderCW2History(member) {
  const tb = document.getElementById('cw2-history-tbody');
  if (!tb) return;
  const hist = member.cw2History || [];
  tb.innerHTML = hist.map(h =>
    '<tr>' +
      '<td>' + (h.season || '') + '</td>' +
      '<td>' + (h.date || '') + '</td>' +
      '<td>' + (h.rank || '') + '</td>' +
      '<td>🏆 Gold</td>' +
      '<td>WinterTime</td>' +
      '<td>' + (h.decks || 0) + '</td>' +
      '<td>' + (h.fame || 0) + '</td>' +
      '<td>' + (h.repair || 0) + '</td>' +
      '<td>' + (h.boatAttacks || 0) + '</td>' +
      '<td>' + (h.total || 0) + '</td>' +
    '</tr>'
  ).join('');
}

function renderTable(clan) {
  const tbody = document.getElementById('member-tbody');
  if (!tbody) return;
  const { q, status, sortBy } = getFilters();
  let rows = clan.members.filter(m => {
    if (status !== 'all' && m.status !== status) return false;
    if (q && !(m.name.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q))) return false;
    return true;
  });
  rows.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  tbody.innerHTML = rows.map((m, i) => {
    const pct = Math.round(m.score || 0);
    const decks = (m.cw2History || []).slice(0, 6).map(h => '<span class="deck-pill ' + (h.decks >= 16 ? 'deck-full' : h.decks >= 8 ? 'deck-mid' : h.decks > 0 ? 'deck-low' : 'deck-zero') + '">' + h.decks + '</span>').join('');
    return '<tr class="member-row-clickable" data-tag="' + m.tag + '">' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span></td>' +
      '<td><span class="role-badge">' + m.roleLabel + '</span></td>' +
      '<td>🏆 ' + m.trophies + '</td>' +
      '<td>' + (m.warParticipation ?? 0) + '% · ' + (m.warFame || 0) + ' Fame<div class="deck-mini-list">' + decks + '</div></td>' +
      '<td>' + m.donations + ' / ' + (m.donationsReceived || 0) + '</td>' +
      '<td><div class="score-bar"><div class="score-fill" style="width:' + pct + '%"></div></div><small>' + pct + '/100</small></td>' +
      '<td>' + statusBadge(m.status) + ' <small>' + (m.reason || '') + '</small> <button class="btn btn-ghost btn-sm">📊 CW2</button></td>' +
      '</tr>';
  }).join('');
  tbody.querySelectorAll('.member-row-clickable').forEach(tr => {
    tr.addEventListener('click', () => {
      selectedMemberTag = tr.dataset.tag;
      const m = currentClan.members.find(x => x.tag === selectedMemberTag);
      renderCW2Panel(m);
      document.getElementById('cw2-history-panel')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function render() {
  renderKPIs(currentClan);
  renderSummary(currentClan);
  renderTable(currentClan);
  const m = currentClan.members.find(x => x.tag === selectedMemberTag) || currentClan.members[0];
  if (m) {
    selectedMemberTag = m.tag;
    renderCW2Panel(m);
  }
  upgradeCustomSelects();
}

function showKickList() {
  const out = document.getElementById('kick-output');
  if (!out) return;
  const kicks = currentClan.members.filter(m => m.status === 'kick');
  out.innerHTML = kicks.length
    ? '<ul>' + kicks.map(m => '<li><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span> — ' + (m.reason || '') + '</li>').join('') + '</ul>'
    : '<p>Không có thành viên nào cần kick.</p>';
  out.removeAttribute('hidden');
}

async function fetchClan() {
  try {
    const res = await fetch('/api/royale-proxy/clans/%23GYQJL9GV');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    currentClan = CA.analyzeClan(raw);
  } catch (e) {
    currentClan = CA.analyzeClan(CA.generateDemoClan());
  }
  render();
}

function bindEvents() {
  document.getElementById('btn-demo')?.addEventListener('click', fetchClan);
  document.getElementById('btn-fetch')?.addEventListener('click', fetchClan);
  document.getElementById('btn-export-kick')?.addEventListener('click', showKickList);
  ['search-member', 'filter-status', 'sort-by'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => { renderTable(currentClan); });
    el.addEventListener('change', () => { renderTable(currentClan); });
  });
  document.getElementById('cw2-member-select')?.addEventListener('change', e => {
    selectedMemberTag = e.target.value;
    const m = currentClan.members.find(x => x.tag === selectedMemberTag);
    if (m) renderCW2Panel(m);
  });
}

function init() {
  bindEvents();
  upgradeCustomSelects();
  render();
  fetchClan();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

const STORAGE_KEY = 'wintertime_analytics_db';

function saveClanDatabase(clan) {
  let snapshots = [];
  try {
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (Array.isArray(old.snapshots)) snapshots = old.snapshots;
  } catch (e) {}
  const today = new Date().toISOString().slice(0, 10);
  snapshots = snapshots.filter(s => s && s.date !== today);
  snapshots.push({ date: today, season: '137-4', membersCount: clan.members.length, avgScore: clan.avgScore, mvpName: clan.mvpName });
  const db = { schemaVersion: '2.0', updatedAt: new Date().toISOString(), clan: { tag: '#GYQJL9GV', name: 'WinterTime', clanScore: 131349, clanWarTrophies: 2369, membersCount: clan.members.length }, warSeasonsMeta: CA.WAR_SEASONS_META || [], snapshots, members: clan.members };
  window.__wintertimeDB = db;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) {}
  return db;
}

function exportDataFile() {
  const db = saveClanDatabase(currentClan);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json;charset=utf-8' }));
  a.download = 'wintertime-data.json';
  a.click();
}

async function syncWintertimeDataFile() {
  try {
    const f = await fetch('./wintertime-data.json');
    if (f.ok) {
      const fileData = await f.json();
      currentClan = CA.analyzeClan(fileData);
      saveClanDatabase(currentClan);
      render();
    }
  } catch (e) {}
}

document.getElementById('btn-save-data')?.addEventListener('click', exportDataFile);
syncWintertimeDataFile();

(function enhanceAllTimeWarAnalytics() {
  const sortSel = document.getElementById('sort-by');
  if (sortSel && !sortSel.querySelector('option[value="warFame"]')) {
    const opt = document.createElement('option');
    opt.value = 'warFame';
    opt.textContent = 'Điểm War ⚔️ (Toàn TG & Gần nhất)';
    sortSel.appendChild(opt);
    upgradeCustomSelects();
  }
  const actions = document.querySelector('.cw2-actions');
  if (actions && !document.getElementById('cw2-clan-analytics-link')) {
    const a = document.createElement('a');
    a.id = 'cw2-clan-analytics-link';
    a.className = 'btn btn-ghost';
    a.href = 'https://royaleapi.com/clan/GYQJL9GV/war/analytics';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'War Analytics Toàn Clan ↗';
    actions.appendChild(a);
  }
})();

function renderTable(clan) {
  const tbody = document.getElementById('member-tbody');
  if (!tbody) return;
  const { q, status, sortBy } = getFilters();
  let rows = clan.members.filter(m => {
    if (status !== 'all' && m.status !== status) return false;
    if (q && !(m.name.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q))) return false;
    return true;
  });
  rows.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  tbody.innerHTML = rows.map((m, i) => {
    const pct = Math.round(m.score || 0);
    const totalFame = m.contribution?.totalFame10Wars || ((m.warFame || 0) * 10);
    const decks = (m.cw2History || []).slice(0, 8).map(h =>
      '<span class="deck-pill ' + (h.decks >= 16 ? 'deck-full' : h.decks >= 8 ? 'deck-mid' : h.decks > 0 ? 'deck-low' : 'deck-zero') + '" title="' + h.season + ': ' + h.decks + ' deck · ' + h.fame + ' Fame">' + h.decks + '</span>'
    ).join('');
    return '<tr class="member-row-clickable' + (m.tag === selectedMemberTag ? ' member-row-active' : '') + '" data-tag="' + m.tag + '">' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span></td>' +
      '<td><span class="role-badge">' + m.roleLabel + '</span></td>' +
      '<td>🏆 ' + m.trophies + '</td>' +
      '<td><strong>' + totalFame.toLocaleString() + ' Fame</strong> <small>(' + (m.warFame || 0) + '/tuần · ' + (m.warParticipation ?? 0) + '%)</small><div class="deck-mini-list">' + decks + '</div></td>' +
      '<td>' + m.donations + ' / ' + (m.donationsReceived || 0) + '</td>' +
      '<td><div class="score-bar"><div class="score-fill" style="width:' + pct + '%"></div></div><small>' + pct + '/100</small></td>' +
      '<td>' + statusBadge(m.status) + ' <small>' + (m.reason || '') + '</small> <button class="btn btn-ghost btn-sm">📊 CW2</button></td>' +
      '</tr>';
  }).join('');
  tbody.querySelectorAll('.member-row-clickable').forEach(tr => {
    tr.addEventListener('click', () => {
      selectedMemberTag = tr.dataset.tag;
      const m = currentClan.members.find(x => x.tag === selectedMemberTag);
      renderCW2Panel(m);
      renderTable(currentClan);
      document.getElementById('cw2-history-panel')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
renderTable(currentClan);

function statusBadge(s) {
  const map = {
    good: ['badge-good', 'Tốt'],
    warning: ['badge-warning', 'Trung bình'],
    kick: ['badge-kick', 'Cảnh báo']
  };
  const [cls, label] = map[s] || ['badge-warning', s];
  return '<span class="badge ' + cls + '">' + label + '</span>';
}

(function updateStatusLabels() {
  const filterSel = document.getElementById('filter-status');
  if (filterSel) {
    const optGood = filterSel.querySelector('option[value="good"]');
    const optWarn = filterSel.querySelector('option[value="warning"]');
    const optKick = filterSel.querySelector('option[value="kick"]');
    if (optGood) optGood.textContent = 'Tốt';
    if (optWarn) optWarn.textContent = 'Trung bình';
    if (optKick) optKick.textContent = 'Cảnh báo';
    upgradeCustomSelects();
  }
  if (currentClan && Array.isArray(currentClan.members)) {
    currentClan.members.forEach(m => {
      if (m.status === 'warning') m.statusLabel = 'Trung bình';
      else if (m.status === 'kick') m.statusLabel = 'Cảnh báo';
      else if (m.status === 'good') m.statusLabel = 'Tốt';
    });
    render();
  }
})();

(function enableFullAutoSync() {
  document.querySelectorAll('.nav-controls').forEach(el => el.remove());
  const updateSyncBadge = () => {
    const el = document.getElementById('auto-sync-text');
    if (el) {
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      el.textContent = 'Tự động đồng bộ & lưu dữ liệu · Cập nhật ' + now;
    }
  };
  updateSyncBadge();
  setInterval(() => {
    fetchClan().then(updateSyncBadge).catch(() => {});
  }, 60000);
})();

function statusBadge(s) {
  const map = { good: ['badge-good', 'Ưu tú'], warning: ['badge-warning', 'Trung bình'], kick: ['badge-kick', 'Cảnh báo'] };
  const [cls, label] = map[s] || ['badge-warning', s];
  return '<span class="badge ' + cls + '">' + label + '</span>';
}

function buildPodiumCard(m, cls, crest, crown) {
  if (!m) return '';
  const tot = m.contribution?.totalFame10Wars || ((m.warFame || 0) * 10);
  return '<div class="podium-card ' + cls + '" data-tag="' + m.tag + '">' +
    '<div class="podium-rank-crest">' + crest + '</div>' +
    '<div class="podium-avatar-wrap">' + crown + '<span>' + (m.name || 'W').slice(0, 2).toUpperCase() + '</span></div>' +
    '<div class="podium-name">' + m.name + '</div>' +
    '<div class="podium-meta">' + m.roleLabel + ' · <span class="tag-mono">' + m.tag + '</span></div>' +
    '<div class="podium-fame-Main">💎 ' + tot.toLocaleString() + ' Fame</div>' +
    '<div class="podium-metrics"><span class="podium-metric-pill">⚡ ' + Math.round(m.score || 0) + '/100 đ</span><span class="podium-metric-pill">⚔️ ' + (m.warParticipation ?? 100) + '% War</span><span class="podium-metric-pill">🎁 ' + (m.donations || 0) + ' Donate</span></div></div>';
}

function renderTop3Podium(clan) {
  if (!clan || !Array.isArray(clan.members) || clan.members.length < 3) return;
  let sec = document.getElementById('top3-podium-section');
  if (!sec) {
    sec = document.createElement('section');
    sec.id = 'top3-podium-section';
    sec.className = 'podium-section';
    const ref = document.getElementById('cw2-history-panel') || document.querySelector('.toolbar-bento');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(sec, ref);
  }
  const top = clan.members.slice().sort((a, b) => ((b.score || 0) - (a.score || 0)) || ((b.warFame || 0) - (a.warFame || 0)));
  sec.innerHTML = '<div class="podium-header"><span class="podium-eyebrow">★ WINTERTIME HALL OF FAME ★</span><h2 class="podium-title">Bảng Vinh Danh Top 3 Cống Hiến Xuất Sắc Nhất Clan</h2></div><div class="podium-stage">' +
    buildPodiumCard(top[1], 'podium-2nd', '🥈 2ND · Á QUÂN', '') +
    buildPodiumCard(top[0], 'podium-1st', '🏆 1ST · MVP CHỦ LỰC', '<span class="podium-crown">👑</span>') +
    buildPodiumCard(top[2], 'podium-3rd', '🥉 3RD · HẠNG BA', '') + '</div>';
  sec.querySelectorAll('.podium-card').forEach(c => c.addEventListener('click', () => {
    selectedMemberTag = c.dataset.tag;
    const m = currentClan.members.find(x => x.tag === selectedMemberTag);
    if (m) { renderCW2Panel(m); renderTable(currentClan); document.getElementById('cw2-history-panel')?.scrollIntoView({ behavior: 'smooth' }); }
  }));
}

const _origRenderFn = render;
render = function() {
  const kpiGood = document.querySelector('.kpi-good .kpi-label');
  if (kpiGood) kpiGood.textContent = 'Thành viên Ưu tú';
  const optGood = document.querySelector('#filter-status option[value="good"]');
  if (optGood) optGood.textContent = 'Ưu tú';
  _origRenderFn();
  renderTop3Podium(currentClan);
};
render();

const kpiKickLbl = document.querySelector('.kpi-kick .kpi-label');
if (kpiKickLbl) kpiKickLbl.textContent = 'Cảnh Báo';

function bindDropdownSearchInput(inp, menu, empty) {
  ['click', 'keydown'].forEach(ev => inp.addEventListener(ev, e => e.stopPropagation()));
  inp.addEventListener('input', () => {
    const q = inp.value.toLowerCase().trim();
    let vis = 0;
    menu.querySelectorAll('.custom-dropdown-item').forEach(it => {
      const ok = !q || it.textContent.toLowerCase().includes(q);
      it.style.display = ok ? '' : 'none';
      if (ok) vis++;
    });
    empty.hidden = vis > 0;
  });
}

const _baseUpgradeSelects = upgradeCustomSelects;
upgradeCustomSelects = function() {
  _baseUpgradeSelects();
  const wrap = document.getElementById('cw2-member-select')?.closest('.custom-dropdown');
  const menu = wrap?.querySelector('.custom-dropdown-menu');
  if (!menu || menu.querySelector('.custom-dropdown-search')) return;
  const sw = document.createElement('div');
  sw.className = 'custom-dropdown-search-wrap';
  sw.innerHTML = '<input type="text" class="custom-dropdown-search" placeholder="🔍 Tìm thành viên hoặc #tag..." autocomplete="off">';
  const empty = document.createElement('div');
  empty.className = 'custom-dropdown-empty';
  empty.hidden = true;
  empty.textContent = 'Không tìm thấy thành viên';
  menu.prepend(empty);
  menu.prepend(sw);
  bindDropdownSearchInput(sw.querySelector('input'), menu, empty);
};
upgradeCustomSelects();

const _prevTop3 = renderTop3Podium;
renderTop3Podium = function(clan) {
  _prevTop3(clan);
  const t = document.querySelector('#top3-podium-section .podium-title');
  if (t) t.textContent = 'Top 3 C?ng Hi?n Xu?t S?c Nh?t Clan';
};
document.querySelector('#cw2-member-select')?.closest('.custom-dropdown')?.querySelector('.custom-dropdown-trigger')?.addEventListener('click', () => {
  const inp = document.querySelector('#cw2-member-select')?.closest('.custom-dropdown')?.querySelector('.custom-dropdown-search');
  if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input')); setTimeout(() => inp.focus(), 20); }
});
currentClan = CA.analyzeClan(currentClan);
render();

function renderMetaDecks() {
  const sec = document.getElementById('meta-decks-section');
  const decks = CA.TOP_META_DECKS || [];
  if (!sec || !decks.length) return;
  const topUrl = 'https://royaleapi.com/decks/popular?time=7d&sort=rating&size=20&players=PvP&min_ranked_trophies=0&max_ranked_trophies=4400&min_elixir=1&max_elixir=9&evo=None&min_cycle_elixir=4&max_cycle_elixir=28&mode=detail&type=TopRanked&&&global_exclude=false';
  sec.innerHTML = '<div class="meta-decks-head"><div><h2 class="meta-decks-title">?? Top 10 Deck Dang Meta (Top Ranked � 7 Ng�y)</h2><div class="meta-decks-sub">Ngu?n: RoyaleAPI TopRanked PvP � X?p theo Rating cao nh?t 7 ng�y qua</div></div><a class="btn btn-ghost" href="' + topUrl + '" target="_blank" rel="noopener">M? B?ng Meta RoyaleAPI ?</a></div><div class="meta-decks-grid">' +
    decks.map(d => '<div class="meta-deck-card"><div class="meta-deck-top"><span class="meta-deck-name"><span class="meta-deck-rank">#' + d.rank + '</span>' + d.name + '</span><div class="meta-deck-badges"><span class="meta-pill">? ' + d.rating + '</span><span class="meta-pill meta-pill-win">Win ' + d.win + '%</span><span class="meta-pill meta-pill-elixir">?? ' + d.elixir + '</span><a class="meta-pill" href="https://royaleapi.com/decks/stats/' + d.cards.join(',') + '" target="_blank" rel="noopener">Chi ti?t ?</a></div></div><div class="meta-cards-row">' +
      d.cards.map(c => '<div class="meta-card-slot" title="' + c + '"><img src="https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards-150/' + c + '.png" alt="' + c + '" loading="lazy"></div>').join('') + '</div></div>').join('') + '</div>';
}
renderMetaDecks();
renderTop3Podium = function(clan) {
  _prevTop3(clan);
  const t = document.querySelector('#top3-podium-section .podium-title');
  if (t) t.textContent = 'Top 3 Cống Hiến Xuất Sắc Nhất Clan';
};
renderTop3Podium(currentClan);
const mhTitle = document.querySelector('#meta-decks-section .meta-decks-title');
if (mhTitle) mhTitle.textContent = '🔥 Top 10 Deck Đang Meta (Top Ranked · 7 Ngày)';
const mhSub = document.querySelector('#meta-decks-section .meta-decks-sub');
if (mhSub) mhSub.textContent = 'Nguồn: RoyaleAPI TopRanked PvP · Xếp theo Rating cao nhất 7 ngày qua';
const mhBtn = document.querySelector('#meta-decks-section .meta-decks-head .btn');
if (mhBtn) mhBtn.textContent = 'Mở Bảng Meta RoyaleAPI ↗';
document.querySelectorAll('#meta-decks-section .meta-deck-badges a.meta-pill').forEach(a => { a.textContent = 'Chi tiết ↗'; });