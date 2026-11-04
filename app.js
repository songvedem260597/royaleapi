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

  function updateKPI(rows) {
    const total = rows.length;
    const good = rows.filter((m) => scoreOf(m) >= 70).length;
    const warning = rows.filter((m) => { const s = scoreOf(m); return s >= 40 && s < 70; }).length;
    const kick = rows.filter((m) => scoreOf(m) < 40).length;
    if ($('kpi-members')) $('kpi-members').textContent = fmt(total);
    if ($('kpi-good')) $('kpi-good').textContent = fmt(good);
    if ($('kpi-warning')) $('kpi-warning').textContent = fmt(warning);
    if ($('kpi-kick')) $('kpi-kick').textContent = fmt(kick);
    if ($('totalMembers')) $('totalMembers').textContent = fmt(total);
    if ($('kickRiskCount')) $('kickRiskCount').textContent = fmt(kick);
    const avg = total ? Math.round(rows.reduce((s, m) => s + scoreOf(m), 0) / total) : 0;
    if ($('avgEfficiency')) $('avgEfficiency').textContent = avg + '%';
    if ($('totalWarFame')) $('totalWarFame').textContent = fmt(rows.reduce((s, m) => s + (Number(m.warFame) || 0), 0));
    return { total, good, warning, kick, avg };
  }

  function renderHero(rows, stats) {
    const hero = $('clan-summary');
    if (!hero) return;
    const mvp = rows.slice().sort((a, b) => scoreOf(b) - scoreOf(a))[0];
    const clanName = (window.CLAN_NAME) || 'Royale Clan';
    const clanTag = (window.CLAN_TAG) || '#2PP0JCVQ';
    const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
    hero.innerHTML = `
      <div class="hero-head"><h2>${clanName}</h2><span class="tag-mono">${clanTag}</span></div>
      <div class="hero-stats">
        <div><span class="kpi-label">Điểm TB Clan</span><strong>${stats.avg}/100</strong></div>
        <div><span class="kpi-label">MVP</span><strong>${mvp ? mvp.name + ' (' + scoreOf(mvp) + ')' : '-'}</strong></div>
      </div>
      <div class="progress-stack">
        <div class="progress-row"><span>Tốt</span><div class="progress"><div style="width:${pct(stats.good)}%;background:#16a34a"></div></div><small>${pct(stats.good)}%</small></div>
        <div class="progress-row"><span>Cảnh báo</span><div class="progress"><div style="width:${pct(stats.warning)}%;background:#f59e0b"></div></div><small>${pct(stats.warning)}%</small></div>
        <div class="progress-row"><span>Lọc</span><div class="progress"><div style="width:${pct(stats.kick)}%;background:#dc2626"></div></div><small>${pct(stats.kick)}%</small></div>
      </div>`;
  }
