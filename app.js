const CA = window.ClanAnalytics;

let currentClan = CA.analyzeClan(CA.generateDemoClan());

function getFilters() {
  return {
    q: (document.getElementById('search-member')?.value || '').toLowerCase().trim(),
    status: document.getElementById('filter-status')?.value || 'all',
    sortBy: document.getElementById('sort-by')?.value || 'score'
  };
}

function renderSummary(clan) {
  const el = document.getElementById('clan-summary');
  if (!el) return;
  const avg = Math.round(clan.avgScore || 0);
  const members = (clan.members && clan.members.length) || 0;
  el.innerHTML =
    '<div class="summary-title">❄️ WinterTime (#GYQJL9GV) — Ae là 1 BiG Familie · Yêu cầu bắt buộc biết đánh WAR</div>' +
    '<div>Điểm Clan: <strong>131,349</strong> · Cúp War: <strong>2,369</strong> · Thành viên: <strong>' + members + '/50</strong> · Chủ lực MVP: <strong>' + (clan.mvpName || '—') + '</strong></div>' +
    '<div>Điểm Clan TB: <strong>' + avg + '/100</strong></div>' +
    '<div class="health-bar"><div class="health-fill" style="width:' + avg + '%"></div></div>';
}

function renderKPIs(clan) {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('kpi-members', (clan.members.length) + '/50');
  set('kpi-good', clan.counts.good);
  set('kpi-warning', clan.counts.warning);
  set('kpi-kick', clan.counts.kick);
}

function statusBadge(s, label) {
  const map = { good: ['badge-good', 'Tốt'], warning: ['badge-warning', 'Cảnh báo'], kick: ['badge-kick', 'Kick'] };
  const [cls, def] = map[s] || ['badge-warning', s];
  return '<span class="badge ' + cls + '">' + (label || def) + '</span>';
}
