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
