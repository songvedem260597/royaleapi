/* app.js - Bento Dashboard Controller cho Clash Royale Clan Manager */
(function () {
  'use strict';
  const CA = window.ClanAnalytics;
  if (!CA) { console.error('ClanAnalytics chưa nạp'); return; }

  let members = [];
  let filtered = [];
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('vi-VN'));
  const scoreOf = (m) => (m.efficiency != null ? m.efficiency : CA.evaluateMember(m));

  function statusOf(score) {
    if (score >= 70) return { cls: 'badge-good', key: 'good', label: 'Tốt', reason: 'Đóng góp tốt, duy trì phong độ' };
    if (score >= 40) return { cls: 'badge-warning', key: 'warning', label: 'Cảnh báo', reason: 'Cần cải thiện donate/war fame' };
    return { cls: 'badge-kick', key: 'kick', label: 'Lọc', reason: 'Hiệu suất thấp, ít hoạt động' };
  }

  function renderTable(rows) {
    const tbody = $('member-tbody') || $('memberTableBody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#94a3b8">Không có thành viên phù hợp</td></tr>'; return; }
    tbody.innerHTML = rows.map((m, i) => {
      const score = scoreOf(m);
      const st = statusOf(score);
      const rank = i + 1;
      const rankCls = rank <= 3 ? 'rank-top' : '';
      const barColor = score >= 70 ? '#16a34a' : score >= 40 ? '#f59e0b' : '#dc2626';
      return `<tr data-tag="${m.tag || ''}">
        <td class="rank ${rankCls}">#${rank}</td>
        <td><strong>${m.name || '-'}</strong><br><em class="tag-mono">${m.tag || '-'}</em></td>
        <td><span class="role-badge">${m.role || '-'}</span></td>
        <td>🏆 ${fmt(m.level)}</td>
        <td>${fmt(m.donations)}</td>
        <td>${fmt(m.warFame)}</td>
        <td>${m.daysOffline != null ? m.daysOffline + 'd' : '-'}</td>
        <td><div class="score-bar"><div class="score-fill" style="width:${score}%;background:${barColor}"></div></div><small>${score}/100</small></td>
        <td><span class="badge ${st.cls}">${st.label}</span><br><small class="reason">${st.reason}</small></td>
        <td><button class="btn-kick" data-tag="${m.tag || ''}">Kick</button></td>
      </tr>`;
    }).join('');
  }
