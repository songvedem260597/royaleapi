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
  const cScore = (clan?.rawClanScore || 130593).toLocaleString('en-US');
  const wTrophies = (clan?.clanWarTrophies || 2369).toLocaleString('en-US');
  el.innerHTML =
    '<div class="hero-stats">' +
      '<div><span class="kpi-label">Điểm Clan</span><strong>' + cScore + '</strong></div>' +
      '<div><span class="kpi-label">Cúp War</span><strong>' + wTrophies + '</strong></div>' +
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
