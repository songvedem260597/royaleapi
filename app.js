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
  ['filter-status', 'sort-by', 'cw2-member-select', 'cw2-clan-range-select'].forEach(id => {
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
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      menu.id = 'menu-' + id;
      trigger.setAttribute('aria-controls', menu.id);
      menu.setAttribute('role', 'listbox');
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = wrap.classList.contains('open');
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
          d.classList.remove('open');
          const t = d.querySelector('.custom-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          wrap.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        } else {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }
    const menu = wrap.querySelector('.custom-dropdown-menu');
    const label = wrap.querySelector('.custom-dropdown-label');
    menu.innerHTML = '';
    Array.from(sel.options).forEach(opt => {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item' + (opt.value === sel.value ? ' selected' : '');
      item.dataset.value = opt.value;
      item.setAttribute('role', 'option');
      item.setAttribute('tabindex', '-1');
      item.setAttribute('aria-selected', opt.value === sel.value ? 'true' : 'false');
      const txt = document.createElement('span');
      txt.textContent = opt.textContent;
      const chk = document.createElement('span');
      chk.className = 'check';
      chk.textContent = '✓';
      item.appendChild(txt);
      item.appendChild(chk);
      item.addEventListener('click', e => {
        e.stopPropagation();
        sel.value = opt.value;
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => {
          i.classList.remove('selected');
          i.setAttribute('aria-selected', 'false');
        });
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        label.textContent = opt.textContent;
        wrap.classList.remove('open');
        const trg = wrap.querySelector('.custom-dropdown-trigger');
        if (trg) trg.setAttribute('aria-expanded', 'false');
        sel.dispatchEvent(new Event('change'));
        if (trg) trg.focus();
      });
      menu.appendChild(item);
    });
    const cur = sel.options[sel.selectedIndex];
    label.textContent = cur ? cur.textContent : '';
    const trigger = wrap.querySelector('.custom-dropdown-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-controls', menu.id);
    }
    menu.setAttribute('role', 'listbox');
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-dropdown.open').forEach(d => {
    d.classList.remove('open');
    const t = d.querySelector('.custom-dropdown-trigger');
    if (t) t.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', e => {
  const wrap = e.target.closest && e.target.closest('.custom-dropdown');
  if (!wrap) return;
  const trigger = wrap.querySelector('.custom-dropdown-trigger');
  const menu = wrap.querySelector('.custom-dropdown-menu');
  if (!trigger || !menu) return;
  const items = Array.from(menu.querySelectorAll('.custom-dropdown-item'));
  const isTrigger = e.target === trigger;
  const isOpen = wrap.classList.contains('open');
  if (isTrigger) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
          d.classList.remove('open');
          const t = d.querySelector('.custom-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        wrap.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      const first = items.find(i => i.classList.contains('selected')) || items[0];
      if (first) first.focus();
    } else if (e.key === 'Escape' && isOpen) {
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    return;
  }
  const idx = items.indexOf(e.target);
  if (idx === -1) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    (items[idx + 1] || items[0]).focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    (items[idx - 1] || items[items.length - 1]).focus();
  } else if (e.key === 'Home') {
    e.preventDefault();
    items[0].focus();
  } else if (e.key === 'End') {
    e.preventDefault();
    items[items.length - 1].focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.target.click();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    wrap.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  } else if (e.key === 'Tab') {
    wrap.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }
});

function renderSummary(clan) {
  const el = document.getElementById('clan-summary');
  if (!el) return;
  const avg = Math.round(clan.avgScore || 0);
  const cScore = (clan?.rawClanScore == null ? '—' : clan.rawClanScore.toLocaleString('en-US'));
  const wTrophies = (clan?.clanWarTrophies == null ? '—' : clan.clanWarTrophies.toLocaleString('en-US'));
  el.innerHTML =
    '<div class="hero-stats">' +
      '<div><span class="kpi-label">Điểm Clan (ước tính)</span><strong>' + cScore + '</strong></div>' +
      '<div><span class="kpi-label">Cúp War</span><strong>' + wTrophies + '</strong></div>' +
      '<div><span class="kpi-label">Điểm TB nội bộ</span><strong>' + avg + '/100</strong></div>' +
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
      '<option value="' + m.tag + '">' + m.name + ' (' + m.tag + ') — ' + (m.score == null ? '—' : m.score) + ' đ</option>'
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

  renderCW2Chart(member);
  renderCW2History(member);
}

function renderCW2Chart(member) {
  const box = document.getElementById('cw2-chart-box');
  if (!box) return;
  const hist = (member.cw2History || []).slice().reverse();
  if (!hist.some(h => h.fameVerified)) {
    box.textContent = 'Chưa có Fame cá nhân trong War Log. Thiếu bản ghi không đồng nghĩa 0 Fame.';
    return;
  }
  const W = 760, H = 240, left = 40, right = 20, topPad = 34, bottom = 45;
  const chartH = H - topPad - bottom, chartW = W - left - right;
  const maxFame = Math.max(1600, ...hist.filter(h=>h.fameVerified).map(h=>h.fame));
  const scale = x => topPad + chartH - Math.min(x, maxFame) / maxFame * chartH;
  const cellW = chartW / hist.length;
  let bars = '', labels = '';
  hist.forEach((h, i) => {
    const x = left + i * cellW + cellW * 0.14, w = cellW * 0.72;
    const present = h.fameVerified && Number.isFinite(h.fame);
    const value = present ? h.fame : null;
    const y = value == null ? topPad + chartH : scale(value);
    const color = value >= 1600 ? '#10b981' : value > 400 ? '#38bdf8' : '#f59e0b';
    if (present) bars += '<rect x="' + x + '" y="' + y + '" width="' + w +
      '" height="' + Math.max(2, topPad + chartH - y) + '" fill="' + color + '" rx="3"/>';
    bars += '<text x="' + (x + w / 2) + '" y="' + (present ? y - 8 : topPad + chartH - 8) +
      '" fill="#e2e8f0" font-size="11" text-anchor="middle">' +
      (value == null ? '—' : value.toLocaleString('en-US')) + '</text>';
    labels += '<text x="' + (x + w / 2) + '" y="' + (H - 23) +
      '" fill="#94a3b8" font-size="10" text-anchor="middle">' + (h.season || '') + '</text>';
    labels += '<text x="' + (x + w / 2) + '" y="' + (H - 8) +
      '" fill="#94a3b8" font-size="9" text-anchor="middle">' +
      (h.decksVerified ? h.decks + ' Deck' : '—') + '</text>';
  });
  box.innerHTML = '<p class="meta-decks-sub">🏅 Fame cá nhân từng kỳ (WarStats · bản đệm Clash Royale API) · Dòng dưới: Deck đã xác minh · — nghĩa là chưa có bản ghi</p>' +
    '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
    bars + labels + '</svg>';
}

function renderCW2History(member) {
  const tb = document.getElementById('cw2-history-tbody');
  if (!tb) return;
  const hist = member.cw2History || [];
  const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-US');
  const leagueFor = h => {
    const m = (currentClan?.warSeasons || []).find(x => x.season === h.season && x.date === h.date);
    return window.WintertimeWarHistory.leagueFromWarTrophies(m?.warTrophiesAtRace) || '—';
  };
  tb.innerHTML = hist.map(h =>
    '<tr>' +
      '<td>' + (h.season || '') + '</td>' +
      '<td>' + (h.date || '') + '</td>' +
      '<td>' + (h.rank == null ? '—' : h.rank) + '</td>' +
      '<td>' + leagueFor(h) + '</td>' +
      '<td>WinterTime</td>' +
      '<td title="' + (h.decksVerified ? 'Deck từ War Log' : 'Deck chưa xác minh từ War Log') + '">' + (h.decksVerified ? fmt(h.decks) : '—') + '</td>' +
      '<td title="' + (h.fameVerified ? 'Fame cá nhân đã xác minh' : 'Không có bản ghi Fame: không đồng nghĩa 0') + '"><strong>' + (h.fameVerified ? fmt(h.fame) : '—') + '</strong></td>' +
      '<td>' + (h.fameVerified ? fmt(h.repair) : '—') + '</td>' +
      '<td>' + (h.fameVerified ? fmt(h.boatAttacks) : '—') + '</td>' +
      '<td>' + (h.fameVerified ? fmt(h.total) : '—') + '</td>' +
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
  rows.sort((a, b) => ((b[sortBy] ?? -1) - (a[sortBy] ?? -1)) || String(a.tag).localeCompare(String(b.tag)));
  tbody.innerHTML = rows.map((m, i) => {
    const pct = Number.isFinite(m.score) ? m.score : null;
    const decks = (m.cw2History || []).slice(0, 6).map(h => '<span class="deck-pill ' + (h.decks >= 16 ? 'deck-full' : h.decks >= 8 ? 'deck-mid' : h.decks > 0 ? 'deck-low' : 'deck-zero') + '">' + h.decks + '</span>').join('');
    return '<tr class="member-row-clickable" data-tag="' + m.tag + '">' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span></td>' +
      '<td><span class="role-badge">' + m.roleLabel + '</span></td>' +
      '<td>🏆 ' + m.trophies + '</td>' +
      '<td>' + (m.warParticipation == null ? '—' : m.warParticipation + '%') + ' · Fame TB ' + (m.warFame == null ? '—' : m.warFame) + '<div class="deck-mini-list">' + decks + '</div></td>' +
      '<td>' + m.donations + ' / ' + (m.donationsReceived || 0) + '</td>' +
      '<td><div class="score-bar"><div class="score-fill" style="width:' + (pct == null ? 0 : pct) + '%"></div></div><small>' + (pct == null ? '—' : pct + '/100') + '</small></td>' +
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
    ? '<p>Đây là danh sách <strong>đề xuất kiểm tra</strong>, không tự động Kick. Leader cần xác minh báo nghỉ phép và thời điểm gia nhập.</p><ul>' + kicks.map(m => '<li><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span> — ' + (m.warEvaluation?.reason || '') + '</li>').join('') + '</ul>'
    : '<p>Không có thành viên nào cần xem xét do bỏ War liên tiếp.</p>';
  out.removeAttribute('hidden');
}

let lastUpdated = null;
function updateLastUpdatedUI(dt, details = {}) {
  const el = document.getElementById('auto-sync-text');
  if (el && dt instanceof Date) {
    const now = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const warDate = /^\d{4}-\d{2}-\d{2}$/.test(details.warDate || '')
      ? details.warDate.split('-').reverse().join('/') : 'chưa rõ';
    const prefix = details.fallback ? 'Dữ liệu dự phòng' : 'RoyaleTrack · CSV có thể chậm 5 phút';
    const freshness = details.stale ? ' · Lịch sử War đã cũ' : '';
    const warVerified = details.verifiedWars ? ' · War Log ' + details.verifiedWars + '/10 đã đối chiếu' : ' · Chưa có War Log xác minh';
    const fameNote = Number.isInteger(details.individualFameKnown)
      ? ' · Fame cá nhân ' + details.individualFameKnown + '/50 có bản ghi' :
      details.individualFameUnknown ? ' · Fame cá nhân chưa có' : '';
    const warStale = details.warLogStale ? ' · War Log đang dùng cache cũ' : '';
    el.textContent = prefix + ' · War ' + warDate + ' · Đồng bộ ' + now + warVerified + freshness + fameNote + warStale;
  }
}
function updateLiveIndicator(isLive) {
  const dot = document.querySelector('.auto-sync-dot, .sync-dot, .live-dot');
  if (dot) dot.style.background = isLive ? '#10b981' : '#f59e0b';
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
  lastUpdated = new Date();
  updateLastUpdatedUI(lastUpdated);
  updateLiveIndicator(true);
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
  snapshots.push({ date: today, season: clan?.warSeasons?.[0]?.season || 'unknown', membersCount: clan.members.length, avgScore: clan.avgScore, mvpName: clan.mvpName });
  const db = { schemaVersion: '2.1', updatedAt: clan?.updatedAt || new Date().toISOString(), clan: { tag: '#GYQJL9GV', name: 'WinterTime', clanScore: clan?.rawClanScore ?? null, clanWarTrophies: clan?.clanWarTrophies ?? null, membersCount: clan.members.length }, warSeasonsMeta: clan?.warSeasons || [], topMetaDecks: CA.TOP_META_DECKS || [], snapshots, members: clan.members };
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

function isLatestCompletedWarWeek(warDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(warDate || '')) return false;
  const now = new Date();
  const monday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),
    now.getUTCDate() - ((now.getUTCDay() + 6) % 7), 10);
  const latest = monday <= now.getTime() ? monday : monday - 7 * 86400000;
  return warDate === new Date(latest).toISOString().slice(0, 10);
}

async function syncWintertimeDataFile() {
  try {
    const f = await fetch('./wintertime-data.json');
    if (f.ok) {
      const fileData = await f.json();
      // This is only a fallback snapshot. Do not overwrite a newer live response.
      if (lastUpdated && Date.parse(currentClan?.updatedAt || '') >= Date.parse(fileData.updatedAt || '')) return;
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
  const actions = document.querySelector('#cw2-history-panel .cw2-actions');
  if (actions && !document.getElementById('cw2-clan-analytics-link')) {
    const a = document.createElement('a');
    a.id = 'cw2-clan-analytics-link';
    a.className = 'btn btn-ghost';
    a.href = 'https://royaleapi.com/player/' + (selectedMemberTag || '#2LL9V9088').replace('#', '');
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Hồ Sơ Cá Nhân ↗';
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
  rows.sort((a, b) => ((b[sortBy] ?? -1) - (a[sortBy] ?? -1)) || String(a.tag).localeCompare(String(b.tag)));
  tbody.innerHTML = rows.map((m, i) => {
    const pct = Number.isFinite(m.score) ? m.score : null;
    const observedDecks = (m.cw2History || []).filter(h => h.decksVerified).reduce((sum, h) => sum + h.decks, 0);
    const decks = (m.cw2History || []).slice(0, 8).map(h => {
      const d = h.decksVerified ? h.decks : null;
      return '<span class="deck-pill ' +
        (d == null ? 'deck-unknown' : d >= 16 ? 'deck-full' : d >= 8 ? 'deck-mid' : d > 0 ? 'deck-low' : 'deck-zero') +
        '" title="' + h.season + ': ' + (d == null ? 'Chưa có Deck xác minh' : d + ' Deck War Log') +
        '">' + (d == null ? '—' : d) + '</span>';
    }).join('');
    return '<tr class="member-row-clickable' + (m.tag === selectedMemberTag ? ' member-row-active' : '') + '" data-tag="' + m.tag + '">' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span></td>' +
      '<td><span class="role-badge">' + m.roleLabel + '</span></td>' +
      '<td>🏆 ' + m.trophies + '</td>' +
      '<td><strong>🏅 ' + (m.latestFame == null ? '—' : m.latestFame.toLocaleString('en-US')) + ' Fame kỳ ' + (m.warEvaluation?.latestSeason || '—') + '</strong> <small>(' + observedDecks + ' Deck đã xác minh / ' + (m.verifiedWarWeeks || 0) + ' kỳ · War ' + (m.warParticipation == null ? '—' : m.warParticipation + '%') + ')</small><div class="deck-mini-list">' + decks + '</div></td>' +
      '<td>' + m.donations + ' / ' + (m.donationsReceived || 0) + '</td>' +
      '<td><div class="score-bar"><div class="score-fill" style="width:' + (pct == null ? 0 : pct) + '%"></div></div><small>' + (pct == null ? '—' : pct + '/100') + '</small></td>' +
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
    warning: ['badge-warning', 'Cảnh báo'],
    average: ['badge-average', 'Trung bình'],
    unknown: ['badge-unknown', 'Chưa đủ dữ liệu'],
    kick: ['badge-kick', 'Đề xuất xét Kick']
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
    if (optWarn) optWarn.textContent = 'Cảnh báo (≤400 Fame)';
    if (optKick) optKick.textContent = 'Đề xuất xét Kick';
    upgradeCustomSelects();
  }
  if (currentClan && Array.isArray(currentClan.members)) {
    currentClan.members.forEach(m => {
      if (m.status === 'warning') m.statusLabel = 'Cảnh báo';
      else if (m.status === 'average') m.statusLabel = 'Trung bình';
      else if (m.status === 'unknown') m.statusLabel = 'Chưa đủ dữ liệu';
      else if (m.status === 'kick') m.statusLabel = 'Đề xuất xét Kick';
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
    fetchClan().catch(() => {});
  }, 60000);
})();

function statusBadge(s) {
  const map = { good: ['badge-good', 'Ưu tú'], average: ['badge-average', 'Trung bình'], warning: ['badge-warning', 'Cảnh báo'], kick: ['badge-kick', 'Đề xuất xét Kick'], unknown: ['badge-unknown', 'Chưa đủ dữ liệu'] };
  const [cls, label] = map[s] || ['badge-warning', s];
  return '<span class="badge ' + cls + '">' + label + '</span>';
}

function buildPodiumCard(m, cls, crest, crown) {
  if (!m) return '';
  const recentDecks = m.warEvaluation?.latestDecks ?? null;
  const observedWeeks = m.warEvaluation?.verifiedWeeks ?? 0;
  return '<div class="podium-card ' + cls + '" data-tag="' + m.tag + '">' +
    '<div class="podium-rank-crest">' + crest + '</div>' +
    '<div class="podium-avatar-wrap">' + crown + '<span>' + (m.name || 'W').slice(0, 2).toUpperCase() + '</span></div>' +
    '<div class="podium-name">' + m.name + '</div>' +
    '<div class="podium-meta">' + m.roleLabel + ' · <span class="tag-mono">' + m.tag + '</span></div>' +
    '<div class="podium-fame-Main">🏅 ' + (m.latestFame == null ? '—' : m.latestFame.toLocaleString('en-US')) + ' Fame · ' + (recentDecks == null ? '—' : recentDecks) + ' Deck</div>' +
    '<div class="podium-metrics"><span class="podium-metric-pill">⚔️ ' + (m.warEvaluation?.latestSeason || '—') + '</span><span class="podium-metric-pill">📋 ' + observedWeeks + ' kỳ có Fame xác minh</span><span class="podium-metric-pill">⭐ ' + (m.score == null ? '—' : m.score + '/100') + ' điểm nội bộ</span></div></div>';
}

function renderTop3Podium(clan) {
  if (!clan || !Array.isArray(clan.members) || clan.members.length < 3) return;
  let sec = document.getElementById('top3-podium-section');
  if (!sec) {
    sec = document.createElement('section');
    sec.id = 'top3-podium-section';
    sec.className = 'podium-section';
    const ref = document.getElementById('cw2-clan-panel') || document.getElementById('cw2-history-panel') || document.querySelector('.toolbar-bento');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(sec, ref);
  }
  const top = window.WintertimeWarEvaluation.rankByLatestWar(clan.members).slice(0, 3);
  sec.innerHTML = '<div class="podium-header"><span class="podium-eyebrow">★ WINTERTIME ACTIVITY SCORE ★</span><h2 class="podium-title">Top 3 Đóng Góp War · Fame Đã Xác Minh</h2><p class="meta-decks-sub">Xếp theo Fame cá nhân thực của kỳ War đã kết thúc gần nhất (WarStats, bản đệm Clash Royale API). Điểm hoạt động nội bộ hiển thị riêng để tham khảo.</p></div><div class="podium-stage">' +
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
if (kpiKickLbl) kpiKickLbl.textContent = 'Đề xuất xét Kick';

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
  if (t) t.textContent = 'Top 3 Đóng Góp War · Fame Đã Xác Minh';
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
    decks.map(d => '<div class="meta-deck-card"><div class="meta-deck-top"><span class="meta-deck-name"><span class="meta-deck-rank">#' + d.rank + '</span>' + d.name + '</span><a class="meta-pill" href="https://royaleapi.com/decks/stats/' + d.cards.join(',') + '" target="_blank" rel="noopener">Chi ti?t ?</a></div></div><div class="meta-cards-row">' +
      d.cards.map(c => '<div class="meta-card-slot" title="' + c + '"><img src="https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards-150/' + c + '.png" alt="' + c + '" loading="lazy"></div>').join('') + '</div></div>').join('') + '</div>';
}
renderMetaDecks();
renderTop3Podium = function(clan) {
  _prevTop3(clan);
  const t = document.querySelector('#top3-podium-section .podium-title');
  if (t) t.textContent = 'Top 3 Đóng Góp War · Fame Đã Xác Minh';
};
renderTop3Podium(currentClan);
const mhTitle = document.querySelector('#meta-decks-section .meta-decks-title');
if (mhTitle) mhTitle.textContent = '🔥 Top 10 Deck Đang Meta (Top Ranked · 7 Ngày)';
const mhSub = document.querySelector('#meta-decks-section .meta-decks-sub');
if (mhSub) mhSub.textContent = 'Nguồn: RoyaleAPI TopRanked PvP · Xếp theo Rating cao nhất 7 ngày qua';
const mhBtn = document.querySelector('#meta-decks-section .meta-decks-head .btn');
if (mhBtn) mhBtn.textContent = 'Mở Bảng Meta RoyaleAPI ↗';
document.querySelectorAll('#meta-decks-section .meta-deck-badges a.meta-pill').forEach(a => { a.textContent = 'Chi tiết ↗'; });
renderMetaDecks = function() {
  const sec = document.getElementById('meta-decks-section');
  const decks = CA.TOP_META_DECKS || [];
  if (!sec || !decks.length) return;
  const topUrl = 'https://royaleapi.com/decks/popular?time=7d&sort=rating&size=20&players=PvP&min_ranked_trophies=0&max_ranked_trophies=4400&min_elixir=1&max_elixir=9&evo=None&min_cycle_elixir=4&max_cycle_elixir=28&mode=detail&type=TopRanked&&&global_exclude=false';
  const cdn = 'https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v11-a8e42334/';
  sec.innerHTML = '<div class="meta-decks-head"><div><h2 class="meta-decks-title">🔥 Top 10 Deck Đang Meta (Ultimate Champion · 7d Rating)</h2><div class="meta-decks-sub">Nguồn: RoyaleAPI Best Clash Royale Decks (7d · 1,027,925 Games · Sort by Rating)</div></div><a class="btn btn-ghost" href="' + topUrl + '" target="_blank" rel="noopener">Mở Bảng Meta RoyaleAPI ↗</a></div><div class="meta-decks-grid">' +
    decks.map(d => '<div class="meta-deck-card"><div class="meta-deck-top"><span class="meta-deck-name"><span class="meta-deck-rank">#' + d.rank + '</span>' + d.name + '</span><div class="meta-deck-badges"><span class="meta-pill">Rating ' + d.rating + '</span><span class="meta-pill">Usage ' + (d.usage || '1.0%') + '</span><span class="meta-pill meta-pill-win">Wins ' + d.win + '%</span><span class="meta-pill meta-pill-elixir">💧 ' + d.elixir + ' · Cycle ' + d.cycle + '</span><a class="meta-pill" href="https://royaleapi.com/decks/stats/' + d.cards.join(',') + '" target="_blank" rel="noopener">Deck Stats ↗</a></div></div><div class="meta-cards-row">' +
      d.cards.map(c => '<div class="meta-card-slot" title="' + c + '"><img src="' + cdn + c + '.png" alt="' + c + '" loading="lazy"></div>').join('') + '</div></div>').join('') + '</div>';
};
renderMetaDecks();
function isKick2WeeksZero(m) {
  const h = m?.cw2History || [];
  return m?.warEvaluation?.twoVerifiedZeroDecks === true;
}
const _prevRenderTable = renderTable;
renderTable = function(clan) {
  (clan?.members || []).forEach(m => { if (isKick2WeeksZero(m)) m.statusLabel = 'Đề xuất xét Kick'; });
  _prevRenderTable(clan);
  document.querySelectorAll('#member-tbody tr[data-tag]').forEach(tr => {
    const m = clan?.members?.find(x => x.tag === tr.dataset.tag);
    const b = tr.querySelector('.badge-kick');
    if (b && isKick2WeeksZero(m)) { b.className = 'badge badge-kick badge-kick-now'; b.innerHTML = '<span class="kick-icon">⚠️</span> Xét Kick'; }
  });
};
const _prevRenderCW2 = renderCW2Panel;
renderCW2Panel = function(m) {
  if (isKick2WeeksZero(m)) m.statusLabel = 'Đề xuất xét Kick';
  _prevRenderCW2(m);
  const b = document.querySelector('#cw2-player-meta .badge-kick');
  if (b && isKick2WeeksZero(m)) { b.className = 'badge badge-kick badge-kick-now'; b.innerHTML = '<span class="kick-icon">⚠️</span> Xét Kick'; }
};
const _prevRenderMeta = renderMetaDecks;
renderMetaDecks = function() {
  _prevRenderMeta();
  const t = document.querySelector('#meta-decks-section .meta-decks-title');
  if (t) t.textContent = '🔥 Top 10 Deck Meta Season';
  const s = document.querySelector('#meta-decks-section .meta-decks-sub');
  if (s) s.textContent = 'Nguồn: RoyaleAPI';
};
renderMetaDecks();
render();
isKick2WeeksZero = function(m) {
  return m?.warEvaluation?.twoVerifiedZeroDecks === true;
};
currentClan = CA.analyzeClan(currentClan);
function renderClanCW2Panel(clan) {
  if (!clan) return;
  const panel = document.getElementById('cw2-clan-panel');
  if (!panel) return;
  const rangeSel = document.getElementById('cw2-clan-range-select');
  const limit = Number(rangeSel?.value) || 5;
  const fullHist = Array.isArray(clan.cw2ClanHistory) ? clan.cw2ClanHistory : [];
  const slice = fullHist.slice(0, limit);
  const latest = slice[0] || { season: '—', decks: 0, participants: 0, observed: 0, rank: null };


  const verifiedWars = slice.filter(x => x.verified).length;




  const meta = document.getElementById('cw2-clan-meta');
  if (meta) {
    meta.innerHTML =
      '<strong>🏰 Toàn Clan ' + (clan.name || 'WinterTime') + '</strong> ' +
      '<span class="tag-mono">' + (clan.tag || '#GYQJL9GV') + '</span> ' +
      '<span class="role-badge">🏆 ' + (window.WintertimeWarHistory.leagueFromWarTrophies(clan.clanWarTrophies) || 'Chưa rõ giải') + ' · ' + (clan.clanWarTrophies == null ? '— (chưa xác minh)' : clan.clanWarTrophies.toLocaleString('en-US')) + ' Cúp War</span> ' +
      '<span class="badge badge-good">' + (latest.rank == null ? 'Chưa có hạng xác thực' : 'Hạng #' + latest.rank + ' River Race') + '</span>';
  }



  const chartBox = document.getElementById('cw2-clan-chart-box');
  if (chartBox) {
    const hist = slice.slice().reverse();
    const W = 760, H = 230, padL = 46, padR = 20, padT = 30, padB = 40;
    const chartW = W - padL - padR, chartH = H - padT - padB;
    const maxDecks = Math.max(1, ...hist.map(h => Number(h.decks) || 0));
    const y = decks => padT + chartH - (Math.min(decks, maxDecks) / maxDecks) * chartH;
    const bw = chartW / (hist.length || 1);
    let bars = '', labels = '';
    hist.forEach((h, i) => {
      const x = padL + i * bw + bw * 0.15;
      const w = bw * 0.7;
      const decks = Number(h.decks) || 0;
      const top = y(decks);
      bars += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' +
        (padT + chartH - top) + '" fill="#38bdf8" rx="3"/>';
      bars += '<text x="' + (x + w / 2) + '" y="' + (top - 6) +
        '" fill="#e2e8f0" font-size="10" text-anchor="middle">' + decks + ' Deck</text>';
      labels += '<text x="' + (x + w / 2) + '" y="' + (H - 12) +
        '" fill="#94a3b8" font-size="10" text-anchor="middle">' + (h.season || '') + '</text>';
    });
    chartBox.innerHTML = '<p class="meta-decks-sub">Tổng Deck theo từng kỳ River Race Log (WarStats · bộ nhớ đệm Clash Royale API); kỳ thiếu nguồn sẽ chỉ dùng Deck quan sát được</p>' +
      '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' + bars + labels + '</svg>';
  }

  const note = document.getElementById('clan-war-source-note');
  if (note) {
    const lastSourceSync = clan.warLogRefreshedAt && Number.isFinite(Date.parse(clan.warLogRefreshedAt))
      ? new Date(clan.warLogRefreshedAt).toLocaleString('vi-VN') : 'chưa rõ';
    note.textContent = verifiedWars + '/' + slice.length +
      ' kỳ có kết quả từ Clash Royale API qua WarStats (bộ nhớ đệm; cập nhật nguồn: ' + lastSourceSync + ')' +
      (clan.warLogStale ? ' · ĐANG DÙNG BẢN ĐỆM CŨ' : '') +
      '. Fame đóng góp = tổng fame của tất cả người tham chiến trong War Log, không bị giới hạn ở mốc thuyền 10.000. Cột Đích War dùng tiến độ thuyền (Colosseum là tuần cuối mùa). Cột Tham gia tính theo các thành viên hiện tại;' +
      ' TB/TV chia theo toàn bộ người đã tham chiến (có thể gồm người đã rời Clan).' +
      ' Fame từng người trong bảng riêng chưa được đồng bộ từ nguồn War Log.';
  }

  const tbody = document.getElementById('cw2-clan-history-tbody');
  if (tbody) {
    tbody.innerHTML = slice.map(h =>
      '<tr>' +
        '<td>' + (h.season || '') + '</td>' +
        '<td>' + (h.date || '') + '</td>' +
        '<td>' + (h.rank == null ? '—' : Number(h.rank) === 1 ? '🥇 1' : ('#' + h.rank)) + '</td>' +
        '<td>' + (h.league || '—') + '</td>' +
        '<td>' + (h.clan || 'WinterTime') + '</td>' +
        '<td title="Số người thuộc Clan hiện tại đã đánh Deck. Tổng người tham chiến trong log: ' + (h.officialParticipants == null ? '—' : h.officialParticipants) + ' (có thể gồm thành viên đã rời Clan)">' + h.participants + '/' + h.membersCount + ' TV</td>' +
        '<td title="' + (h.officialDecks ? 'Tổng Deck lấy từ River Race Log' : 'Deck của thành viên hiện tại') + '">' + (h.decks || 0).toLocaleString('en-US') + '</td>' +
        '<td title="Tổng Fame cộng từ participants[].fame của River Race Log (không phải tiến độ thuyền)"><strong>' + (h.fame == null ? '—' : h.fame.toLocaleString('en-US')) + '</strong></td>' +
        '<td>' + (h.avgPerParticipant == null ? '—' : h.avgPerParticipant.toLocaleString('en-US')) + '</td>' +
        '<td title="Tiến độ thuyền River Race (giới hạn 10.000) hoặc tuần Colosseum">' + (h.raceTarget || 'Chưa xác minh') + '</td>' +
        '<td title="Thay đổi cúp War sau khi kết thúc kỳ"><strong>' + (h.trophyChange == null ? '—' : (h.trophyChange >= 0 ? '+' : '') + h.trophyChange + ' 🏆') + '</strong></td>' +
      '</tr>'
    ).join('');
  }
}

document.getElementById('cw2-clan-range-select')?.addEventListener('change', () => {
  renderClanCW2Panel(currentClan);
});

const _prevRenderCW2WithLink = renderCW2Panel;
renderCW2Panel = function(m) {
  _prevRenderCW2WithLink(m);
  const pLink = document.getElementById('cw2-clan-analytics-link');
  if (pLink && m?.tag) {
    pLink.href = 'https://royaleapi.com/player/' + m.tag.replace('#', '');
    pLink.textContent = 'Hồ Sơ Cá Nhân ↗';
  }
};

const _prevRenderMain = render;
render = function() {
  _prevRenderMain();
  renderClanCW2Panel(currentClan);
};

render();
fetchClan();
window.handleCardImgErr = function(img, c) {
  const base = String(c || '').replace(/-(ev1|hero)$/, '');
  const step = Number(img.dataset.fb || 0);
  if (step === 0) { img.dataset.fb = '1'; img.src = 'https://cdns3.royaleapi.com/static/img/cards/v11-a8e42334/' + c + '.png'; }
  else if (step === 1) { img.dataset.fb = '2'; img.src = 'https://cdn.jsdelivr.net/gh/RoyaleAPI/cr-api-assets@master/cards-150/' + base + '.png'; }
  else if (step === 2) { img.dataset.fb = '3'; img.src = 'https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards-150/' + base + '.png'; }
};
renderMetaDecks = function() {
  const sec = document.getElementById('meta-decks-section');
  const decks = CA.TOP_META_DECKS || [];
  if (!sec || !decks.length) return;
  const topUrl = 'https://royaleapi.com/decks/popular?time=7d&sort=rating&size=20&players=PvP&min_ranked_trophies=0&max_ranked_trophies=4400&min_elixir=1&max_elixir=9&evo=None&min_cycle_elixir=4&max_cycle_elixir=28&mode=detail&type=TopRanked&&&global_exclude=false';
  const px = 'https://wsrv.nl/?url=cdns3.royaleapi.com/static/img/cards/v11-a8e42334/';
  const syncTime = lastUpdated instanceof Date ? (' · Cập nhật ' + lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })) : '';
  sec.innerHTML = '<div class="meta-decks-head"><div><h2 class="meta-decks-title">🔥 Top 10 Deck Meta Season</h2><div class="meta-decks-sub">Nguồn: RoyaleTrack Meta (cập nhật theo cache nguồn)' + syncTime + '</div></div><a class="btn btn-ghost" href="' + topUrl + '" target="_blank" rel="noopener">Mở Bảng Meta RoyaleAPI ↗</a></div><div class="meta-decks-grid">' +
    decks.map(d => '<div class="meta-deck-card"><div class="meta-deck-top"><span class="meta-deck-name"><span class="meta-deck-rank">#' + d.rank + '</span>' + d.name + '</span><div class="meta-deck-badges"><span class="meta-pill">Rating ' + d.rating + '</span><span class="meta-pill">Usage ' + (d.usage || '1.0%') + '</span><span class="meta-pill meta-pill-win">Wins ' + d.win + '%</span><span class="meta-pill meta-pill-elixir">💧 ' + d.elixir + ' · Cycle ' + d.cycle + '</span>' + (d.copyUrl ? '<a class="meta-pill" href="' + d.copyUrl + '" target="_blank" rel="noopener">Copy Deck ↗</a>' : '') + '<a class="meta-pill" href="https://royaleapi.com/decks/stats/' + d.cards.join(',') + '" target="_blank" rel="noopener">Deck Stats ↗</a></div></div><div class="meta-cards-row">' +
      d.cards.map((c, idx) => {
        const imgSrc = (Array.isArray(d.cardImages) && d.cardImages[idx]) ? d.cardImages[idx] : (px + c + '.png&w=150&output=png');
        return '<div class="meta-card-slot" title="' + c + '"><img src="' + imgSrc + '" alt="' + c + '" referrerpolicy="no-referrer" decoding="async" onerror="window.handleCardImgErr(this,\'' + c + '\')"></div>';
      }).join('') + '</div></div>').join('') + '</div>';
};
renderMetaDecks();
renderSummary = function(clan) {
  const el = document.getElementById('clan-summary');
  if (!el) return;
  const avg = Math.round(clan?.avgScore || 0);
  const cScore = (clan?.rawClanScore == null ? '—' : clan.rawClanScore.toLocaleString('en-US'));
  const wTrophies = (clan?.clanWarTrophies == null ? '—' : clan.clanWarTrophies.toLocaleString('en-US'));
  el.innerHTML =
    '<div class="hero-stats">' +
      '<div><span class="kpi-label">Điểm Clan (ước tính)</span><strong>' + cScore + '</strong></div>' +
      '<div><span class="kpi-label">Cúp War</span><strong>' + wTrophies + '</strong></div>' +
      '<div><span class="kpi-label">Điểm TB nội bộ</span><strong>' + avg + '/100</strong></div>' +
    '</div>' +
    '<div class="health-bar"><div class="health-fill" style="width:' + avg + '%"></div></div>';
};
const _prevTop3Mvp = renderTop3Podium;
renderTop3Podium = function(clan) {
  _prevTop3Mvp(clan);
  const c1 = document.querySelector('#top3-podium-section .podium-1st .podium-rank-crest');
  if (c1) c1.textContent = '🏆 1ST · MVP DẪN ĐẦU';
};
render();
(function mountWinterTimeMarquee() {
  if (document.getElementById('wt-marquee-bar')) return;
  const main = document.querySelector('.bento-main');
  if (!main) return;
  const items = [
    '❄️ Đại gia đình WinterTime: <span class="wt-marquee-grad">Chúc anh em chơi game vui vẻ, leo rank vù vù, mở rương toàn thẻ ngon!</span>',
    '⚔️ Nhắc nhở mỗi ngày: <span class="wt-marquee-grad">Nhớ đánh đủ 4 Deck War kẻo cuối tuần ăn chiếc giày 🥾 từ Thủ lĩnh nha anh em!</span>',
    '👑 Tinh thần BiG Familie: <span class="wt-marquee-grad">Thắng không kiêu, bại không cay, thả emote HEHEHEHA văn minh lịch sự!</span>',
    '🎁 Góc đồng đội: <span class="wt-marquee-grad">Chăm chỉ xin thẻ và Donate đều tay để cả Clan cùng max bài lấy Top 1 War!</span>'
  ];
  const row = items.map(t => '<span class="wt-marquee-item">' + t + '</span>').join('');
  const bar = document.createElement('div');
  bar.id = 'wt-marquee-bar';
  bar.className = 'wt-marquee-bar';
  bar.innerHTML = '<div class="wt-marquee-track">' + row + row + '</div>';
  main.prepend(bar);
})();
(function updateMarqueeText() {
  const track = document.querySelector('#wt-marquee-bar .wt-marquee-track');
  if (!track) return;
  const items = [
    '❄️ Đại gia đình WinterTime: <span class="wt-marquee-grad">Chúc anh em chơi game vui vẻ, leo rank vù vù, mở rương toàn thẻ ngon!</span>',
    '⚔️ Nhắc nhở mỗi ngày: <span class="wt-marquee-grad">Nhớ đánh đủ 4 Deck War kẻo cuối tuần ăn chiếc giày 🥾 nhé anh em</span>',
    '👑 Tinh thần BiG Familie: <span class="wt-marquee-grad">Thắng không kiêu, bại không cay, thả emote HEHEHEHA văn minh lịch sự!</span>',
    '🎁 Góc đồng đội: <span class="wt-marquee-grad">Chăm chỉ xin thẻ và Donate đều tay để cả Clan cùng max bài lấy Top 1 War!</span>'
  ];
  const row = items.map(t => '<span class="wt-marquee-item">' + t + '</span>').join('');
  track.innerHTML = row + row;
})();
(function initBrandAndSnowEffect() {
  const bt = document.querySelector('.brand-title');
  if (bt) bt.innerHTML = '<span class="brand-snowflake"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><polyline points="9 4 12 7 15 4"/><polyline points="9 20 12 17 15 20"/><polyline points="4 9 7 12 4 15"/><polyline points="20 9 17 12 20 15"/></svg></span><span class="brand-title-grad">WINTERTIME · #GYQJL9GV</span>';
  if (document.getElementById('wt-snow-layer')) return;
  const layer = document.createElement('div');
  layer.id = 'wt-snow-layer';
  layer.className = 'wt-snow-layer';
  const glyphs = ['❄', '❅', '❆', '•'];
  let html = '';
  for (let i = 0; i < 14; i++) {
    const left = (i * 7.2 + 3).toFixed(1);
    const dur = (13 + (i % 5) * 2.4).toFixed(1);
    const delay = (-1.5 * i).toFixed(1);
    const size = (0.65 + (i % 4) * 0.16).toFixed(2);
    const op = (0.26 + (i % 4) * 0.11).toFixed(2);
    html += '<span class="wt-snow-flake" style="left:' + left + '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's;font-size:' + size + 'rem;opacity:' + op + '">' + glyphs[i % glyphs.length] + '</span>';
  }
  layer.innerHTML = html;
  document.body.appendChild(layer);
})();
renderSummary = function(clan) {
  const el = document.getElementById('clan-summary');
  if (!el) return;
  const avg = Math.round(clan?.avgScore || 0);
  const cnt = clan?.counts || { good: 0, warning: 0, kick: 0 };
  const total = clan?.members?.length || 0;
  const cScore = (clan?.rawClanScore == null ? '—' : clan.rawClanScore.toLocaleString('en-US'));
  const wTrophies = (clan?.clanWarTrophies == null ? '—' : clan.clanWarTrophies.toLocaleString('en-US'));
  document.querySelectorAll('.kpi-grid').forEach(g => { g.style.display = 'none'; });
  el.innerHTML =
    '<div class="hero-stats hero-stats-unified">' +
      '<div><span class="kpi-label">Điểm Clan (ước tính)</span><strong id="kpi-clan-score">' + cScore + '</strong></div>' +
      '<div><span class="kpi-label">Cúp War</span><strong id="kpi-war-trophies">' + wTrophies + '</strong></div>' +
      '<div><span class="kpi-label">Điểm TB nội bộ</span><strong>' + avg + '/100</strong></div>' +
      '<div><span class="kpi-label">Thành viên WinterTime</span><strong id="kpi-members" style="color:#38bdf8">' + total + '/50</strong></div>' +
      '<div><span class="kpi-label">Thành viên Ưu tú</span><strong id="kpi-good" style="color:#10b981">' + (cnt.good || 0) + '</strong></div>' +
      '<div><span class="kpi-label">Trung bình</span><strong id="kpi-average" style="color:#f59e0b">' + (cnt.average || 0) + '</strong></div>' +
      '<div><span class="kpi-label">Cảnh báo</span><strong id="kpi-warning" style="color:#f97316">' + (cnt.warning || 0) + '</strong></div>' +
      '<div><span class="kpi-label">Đề xuất xét Kick</span><strong id="kpi-kick" style="color:#ef4444">' + (cnt.kick || 0) + '</strong></div>' +
      '<div><span class="kpi-label">Chưa đủ dữ liệu</span><strong id="kpi-unknown">' + (cnt.unknown || 0) + '</strong></div>' +
    '</div>' +
    '<div class="health-bar"><div class="health-fill" style="width:' + avg + '%"></div></div>';
};
render();
fetchClan = async function() {
  const ts = Date.now();
  const isExternalHost = typeof location !== 'undefined' && (location.hostname === 'wintertime.muatenmien.store' || location.hostname.endsWith('.github.io'));
  const urls = isExternalHost
    ? [
        'https://codexpro.muatenmien.store/api/royale-proxy/clans/%23GYQJL9GV?t=' + ts,
        './wintertime-data.json?t=' + ts
      ]
    : [
        '/api/royale-proxy/clans/%23GYQJL9GV?t=' + ts,
        'https://codexpro.muatenmien.store/api/royale-proxy/clans/%23GYQJL9GV?t=' + ts,
        './wintertime-data.json?t=' + ts
      ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d && Array.isArray(d.members) && d.members.length) {
          currentClan = CA.analyzeClan(d);
          lastUpdated = new Date();
          saveClanDatabase(currentClan);
          render();
          renderMetaDecks();
          const warDate = d.warSeasonsMeta?.[0]?.date;
          const fallback = u.includes('wintertime-data.json');
          const stale = !isLatestCompletedWarWeek(warDate);
          updateLastUpdatedUI(lastUpdated, {
            warDate, fallback, stale,
            verifiedWars: (d.warSeasonsMeta || []).filter(x => x.aggregatesVerified).length,
            individualFameUnknown: d.warHistoryQuality?.fame === 'individual-unavailable',
            individualFameKnown: (d.members || []).filter(m => m.cw2History?.[0]?.fameVerified).length,
            warLogStale: Boolean(d.warLogStale)
          });
          updateLiveIndicator(!fallback && !stale && !d.warLogStale);
          return;
        }
      }
    } catch (e) {}
  }
  render();
  renderMetaDecks();
  updateLiveIndicator(false);
  updateLastUpdatedUI(new Date(), { fallback: true, stale: true, warDate: currentClan?.warSeasons?.[0]?.date });
};
fetchClan();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!lastUpdated || (Date.now() - lastUpdated.getTime() > 15000)) {
      fetchClan();
    }
  }
});

/* ===== Mobile 60fps performance optimizer ===== */
(function optimizeMobilePerformance() {
  'use strict';
  var isMobile = false;
  try {
    isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  } catch (e) { isMobile = false; }

  // (1) Remove snow layer on mobile to free GPU
  function removeSnowLayer() {
    if (!isMobile) return;
    var snow = document.getElementById('wt-snow-layer');
    if (snow && snow.parentNode) snow.parentNode.removeChild(snow);
  }

  // (2) Lazy-load + async decode all images
  function optimizeImages(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var imgs = scope.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    }
  }

  // (3) Passive listeners for smooth scrolling on iOS/Android
  function addPassiveListeners() {
    var opts = { passive: true, capture: false };
    try {
      window.addEventListener('touchstart', function () {}, opts);
      window.addEventListener('touchmove', function () {}, opts);
      window.addEventListener('scroll', function () {}, opts);
      document.addEventListener('touchstart', function () {}, opts);
      document.addEventListener('scroll', function () {}, opts);
    } catch (e) {
      window.addEventListener('touchstart', function () {}, false);
      window.addEventListener('scroll', function () {}, false);
    }
  }

  function init() {
    removeSnowLayer();
    optimizeImages(document);
    addPassiveListeners();

    // Lightweight MutationObserver to catch re-rendered images
    if (typeof MutationObserver !== 'undefined') {
      var pending = false;
      var observer = new MutationObserver(function (mutations) {
        if (pending) return;
        pending = true;
        (window.requestAnimationFrame || function (cb) { setTimeout(cb, 16); })(function () {
          pending = false;
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.addedNodes && m.addedNodes.length) {
              for (var j = 0; j < m.addedNodes.length; j++) {
                var node = m.addedNodes[j];
                if (node.nodeType === 1) {
                  if (node.tagName === 'IMG') {
                    if (!node.hasAttribute('loading')) node.setAttribute('loading', 'lazy');
                    if (!node.hasAttribute('decoding')) node.setAttribute('decoding', 'async');
                  }
                  if (node.querySelectorAll) optimizeImages(node);
                }
              }
            }
          }
        });
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    // Re-run after full load in case of late renders
    window.addEventListener('load', function () {
      removeSnowLayer();
      optimizeImages(document);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
