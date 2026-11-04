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

function statusBadge(s) {
  const map = { good: ['badge-good', 'Tốt'], warning: ['badge-warning', 'Cảnh báo'], kick: ['badge-kick', 'Kick'] };
  const [cls, label] = map[s] || ['badge-warning', s];
  return '<span class="badge ' + cls + '">' + label + '</span>';
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
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + m.name + '</strong> <span class="tag-mono">' + m.tag + '</span></td>' +
      '<td><span class="role-badge">' + m.roleLabel + '</span></td>' +
      '<td>🏆 ' + m.trophies + '</td>' +
      '<td>' + m.donations + ' / ' + m.donationsReceived + '</td>' +
      '<td><div class="score-bar"><div class="score-fill" style="width:' + pct + '%"></div></div><small>' + pct + '/100</small></td>' +
      '<td><span class="badge badge-' + m.status + '">' + (m.statusLabel || m.status) + '</span> <small>' + (m.reason || '') + '</small></td>' +
      '</tr>';
  }).join('');
}

function render() {
  renderKPIs(currentClan);
  renderSummary(currentClan);
  renderTable(currentClan);
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
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });
}

function init() {
  bindEvents();
  render();
  fetchClan();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
