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
