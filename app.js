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
