/* app.js - Bento Dashboard Controller cho Clan WinterTime (#GYQJL9GV) */
(function () {
  'use strict';
  const CA = window.ClanAnalytics;
  if (!CA) { console.error('ClanAnalytics chưa nạp'); return; }

  const CLAN_TAG = '#GYQJL9GV';
  const CLAN_NAME = '❄️ WinterTime';
  const API_BASE = '/api/royale-proxy/clans/' + encodeURIComponent(CLAN_TAG);

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

  function notify(msg, type) {
    const el = $('app-toast') || $('toast');
    if (el) { el.textContent = msg; el.className = 'toast show ' + (type || 'info'); setTimeout(() => { el.className = 'toast'; }, 3500); }
    else console.log('[WinterTime]', msg);
  }

  function normalize(raw) {
    const list = (raw && (raw.items || raw.members)) || [];
    return list.map((m) => ({
      tag: m.tag || '', name: m.name || '', role: m.role || 'member',
      level: m.expLevel != null ? m.expLevel : m.level,
      trophies: m.trophies || 0, donations: m.donations || 0,
      warFame: m.warFame != null ? m.warFame : (m.fame || 0),
      daysOffline: m.daysOffline != null ? m.daysOffline : (m.lastSeen != null ? m.lastSeen : null),
      efficiency: m.efficiency != null ? m.efficiency : null
    }));
  }

  function loadDemo(reason) {
    try {
      const demo = CA.generateDemoClan ? CA.generateDemoClan() : null;
      members = normalize(demo);
      notify('Đang dùng dữ liệu chuẩn WinterTime' + (reason ? ' (' + reason + ')' : ''), 'info');
    } catch (e) { console.error(e); members = []; }
    applyFilters();
  }

  async function fetchClan() {
    const tokenEl = $('api-token-input');
    const token = tokenEl ? tokenEl.value.trim() : '';
    if (!token) { loadDemo('chưa có token'); return; }
    try {
      const res = await fetch(API_BASE, { headers: { 'x-royale-token': token, 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      members = normalize(data);
      if (!members.length) throw new Error('empty');
      notify('Đã tải dữ liệu WinterTime từ API', 'success');
      applyFilters();
    } catch (e) {
      console.warn('Fetch lỗi:', e);
      loadDemo('lỗi mạng/API');
    }
  }

  function applyFilters() {
    const q = ($('search-member') ? $('search-member').value : '').trim().toLowerCase();
    const status = $('filter-status') ? $('filter-status').value : 'all';
    const sortBy = $('sort-by') ? $('sort-by').value : 'score';
    filtered = members.filter((m) => {
      const s = scoreOf(m);
      const st = statusOf(s).key;
      if (status !== 'all' && st !== status) return false;
      if (!q) return true;
      return (m.name || '').toLowerCase().includes(q) || (m.tag || '').toLowerCase().includes(q);
    });
    filtered.sort((a, b) => {
      if (sortBy === 'trophies') return (b.trophies || 0) - (a.trophies || 0);
      if (sortBy === 'donations') return (b.donations || 0) - (a.donations || 0);
      return scoreOf(b) - scoreOf(a);
    });
    const stats = updateKPI(filtered);
    renderHero(filtered, stats);
    renderTable(filtered);
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
        <td>🏆 ${fmt(m.trophies)}</td>
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
    const avg = total ? Math.round(rows.reduce((s, m) => s + scoreOf(m), 0) / total) : 0;
    return { total, good, warning, kick, avg };
  }

  function renderHero(rows, stats) {
    const hero = $('clan-summary');
    if (!hero) return;
    const mvp = rows.slice().sort((a, b) => (b.donations || 0) - (a.donations || 0))[0];
    const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
    hero.innerHTML = `
      <div class="hero-head"><h2>${CLAN_NAME} <span class="tag-mono">(${CLAN_TAG})</span></h2></div>
      <div class="hero-stats">
        <div><span class="kpi-label">Điểm hiệu quả TB</span><strong>${stats.avg}/100</strong></div>
        <div><span class="kpi-label">MVP Donate</span><strong>${mvp ? mvp.name + ' (' + fmt(mvp.donations) + ')' : '-'}</strong></div>
      </div>
      <div class="progress-stack">
        <div class="progress-row"><span>Tốt</span><div class="progress"><div style="width:${pct(stats.good)}%;background:#16a34a"></div></div><small>${pct(stats.good)}%</small></div>
        <div class="progress-row"><span>Cảnh báo</span><div class="progress"><div style="width:${pct(stats.warning)}%;background:#f59e0b"></div></div><small>${pct(stats.warning)}%</small></div>
        <div class="progress-row"><span>Lọc</span><div class="progress"><div style="width:${pct(stats.kick)}%;background:#dc2626"></div></div><small>${pct(stats.kick)}%</small></div>
      </div>`;
  }

  function exportKick() {
    const out = $('kick-output');
    const kickList = members.filter((m) => scoreOf(m) < 40);
    const text = kickList.length
      ? 'Danh sách cần lọc - ' + CLAN_NAME + ' (' + CLAN_TAG + '):\n' + kickList.map((m) => `- ${m.name} (${m.tag}) | Điểm: ${scoreOf(m)} | Donate: ${fmt(m.donations)} | Offline: ${m.daysOffline != null ? m.daysOffline + 'd' : '-'}`).join('\n')
      : 'Không có thành viên nào cần lọc trong ' + CLAN_NAME + ' (' + CLAN_TAG + ').';
    if (out) { out.textContent = text; out.style.display = 'block'; }
    notify('Đã xuất danh sách cần lọc (' + kickList.length + ' thành viên)', 'success');
  }
