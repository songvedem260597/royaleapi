/* app.js - Controller: kết nối index.html với window.ClanAnalytics */
(function () {
  'use strict';
  const CA = window.ClanAnalytics;
  if (!CA) { console.error('ClanAnalytics chưa nạp'); return; }

  let members = [];
  let filtered = [];

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('vi-VN'));

  function badgeClass(score) {
    if (score >= 70) return 'badge-active';
    if (score >= 40) return 'badge-warning';
    return 'badge-kick';
  }
  function badgeText(score) {
    if (score >= 70) return 'Hoạt động';
    if (score >= 40) return 'Cảnh báo';
    return 'Kick';
  }

  function renderTable(rows) {
    const tbody = $('memberTableBody');
    if (!tbody) return;
    tbody.innerHTML = rows.map((m) => {
      const score = m.efficiency != null ? m.efficiency : CA.evaluateMember(m);
      const cls = badgeClass(score);
      return `<tr data-tag="${m.tag}">
        <td>${m.name || '-'}</td>
        <td>${m.tag || '-'}</td>
        <td>${m.role || '-'}</td>
        <td>${m.level != null ? m.level : '-'}</td>
        <td>${fmt(m.donations)}</td>
        <td>${fmt(m.warFame)}</td>
        <td>${m.daysOffline != null ? m.daysOffline : '-'}</td>
        <td>${score}</td>
        <td><span class="badge ${cls}">${badgeText(score)}</span></td>
        <td><button class="btn-kick" data-tag="${m.tag}">Kick</button></td>
      </tr>`;
    }).join('');
  }

  function updateKPI(rows) {
    const total = rows.length;
    const avgEff = total ? Math.round(rows.reduce((s, m) => s + (m.efficiency != null ? m.efficiency : CA.evaluateMember(m)), 0) / total) : 0;
    const totalFame = rows.reduce((s, m) => s + (Number(m.warFame) || 0), 0);
    const kickRisk = rows.filter((m) => (m.efficiency != null ? m.efficiency : CA.evaluateMember(m)) < 40).length;
    if ($('totalMembers')) $('totalMembers').textContent = fmt(total);
    if ($('avgEfficiency')) $('avgEfficiency').textContent = avgEff + '%';
    if ($('totalWarFame')) $('totalWarFame').textContent = fmt(totalFame);
    if ($('kickRiskCount')) $('kickRiskCount').textContent = fmt(kickRisk);
  }

  function renderInsights(rows) {
    const panel = $('clanInsightsPanel');
    if (!panel) return;
    if (CA.getClanInsights) {
      const ins = CA.getClanInsights(rows);
      panel.innerHTML = typeof ins === 'string' ? ins : (ins && ins.html) || '';
    } else {
      panel.textContent = `Tổng ${rows.length} thành viên được phân tích.`;
    }
  }

  function applyFilters() {
    const status = ($('statusFilter') && $('statusFilter').value) || 'all';
    const q = (($('searchInput') && $('searchInput').value) || '').trim().toLowerCase();
    const sortBy = ($('sortBy') && $('sortBy').value) || 'efficiency';
    filtered = members.filter((m) => {
      const score = m.efficiency != null ? m.efficiency : CA.evaluateMember(m);
      if (status === 'active' && score < 70) return false;
      if (status === 'warning' && (score < 40 || score >= 70)) return false;
      if (status === 'kick' && score >= 40) return false;
      if (q && !((m.name || '').toLowerCase().includes(q) || (m.tag || '').toLowerCase().includes(q))) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const sa = a.efficiency != null ? a.efficiency : CA.evaluateMember(a);
      const sb = b.efficiency != null ? b.efficiency : CA.evaluateMember(b);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'donations') return (Number(b.donations) || 0) - (Number(a.donations) || 0);
      if (sortBy === 'warFame') return (Number(b.warFame) || 0) - (Number(a.warFame) || 0);
      if (sortBy === 'daysOffline') return (Number(b.daysOffline) || 0) - (Number(a.daysOffline) || 0);
      return sb - sa;
    });
    renderTable(filtered);
    updateKPI(filtered);
    renderInsights(filtered);
  }
