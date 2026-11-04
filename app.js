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
