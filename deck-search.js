'use strict';

const WintertimeDeckSearch = (() => {
  const aliases = new Map([
    ['lava', ['lava-hound']], ['lavahound', ['lava-hound']],
    ['lavaloon', ['lava-hound', 'balloon']], ['lava loon', ['lava-hound', 'balloon']],
    ['lava balloon', ['lava-hound', 'balloon']], ['loon', ['balloon']],
    ['bong bay', ['balloon']], ['hog', ['hog-rider']], ['mk', ['mega-knight']],
    ['logbait', ['goblin-barrel']], ['log bait', ['goblin-barrel']]
  ]);
  const normalize = (value) => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9.]+/g, ' ').trim();
  const baseCard = (slug) => slug.replace(/-(ev1|hero)$/, '');

  function search(query, liveDecks, snapshot) {
    const term = normalize(query);
    if (!term) return { matches: [], filters: [] };
    const decks = [...liveDecks, ...(snapshot?.decks || [])];
    const slugs = new Set(decks.flatMap(d => (d.cards || []).map(baseCard)));
    const slug = term.replace(/ /g, '-');
    const filters = aliases.get(term) || (slugs.has(slug) ? [slug] : []);
    const keys = new Set();
    const matches = decks.filter(deck => {
      if (!Array.isArray(deck.cards) || deck.cards.length !== 8) return false;
      const cards = deck.cards.map(baseCard);
      const matched = filters.length ? filters.every(card => cards.includes(card)) :
        normalize(deck.name).includes(term);
      const key = [...deck.cards].sort().join(',');
      if (!matched || keys.has(key)) return false;
      keys.add(key);
      return true;
    });
    return { filters, matches };
  }

  function royaleApiUrl(card) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card || '')) return '';
    const url = new URL('https://royaleapi.com/decks/popular');
    url.search = new URLSearchParams({ time: '1d', sort: 'rating', inc: card, use_all_forms: 'true' });
    return url.href;
  }

  function mount(section, { getDecks, renderDecks }) {
    const top = section.querySelector('.meta-decks-grid');
    const controls = document.createElement('div');
    controls.className = 'deck-search-controls';
    controls.innerHTML = `
      <div class="deck-search-modes" role="group" aria-label="Chế độ xem deck">
        <button class="btn btn-ghost" type="button" data-mode="top" aria-pressed="true">Top 10 Meta</button>
        <button class="btn btn-ghost" type="button" data-mode="search" aria-pressed="false" aria-controls="deck-search-panel">Tìm theo tên</button>
      </div>
      <div id="deck-search-panel" hidden>
        <label class="sr-only" for="deck-search-query">Tên deck hoặc thẻ chính</label>
        <div class="deck-search-bar">
          <input id="deck-search-query" type="search" placeholder="Nhập Lava, Balloon, Hog Rider 2.6…" maxlength="80" autocomplete="off">
          <a class="btn btn-ghost" data-search-link target="_blank" rel="noopener" hidden>Xem trên RoyaleAPI ↗</a>
        </div>
        <div class="deck-search-shortcuts" aria-label="Tìm nhanh">
          <button class="meta-pill" type="button" data-query="Lava">Lava</button>
          <button class="meta-pill" type="button" data-query="Balloon">Balloon</button>
          <button class="meta-pill" type="button" data-query="Hog Rider">Hog Rider</button>
        </div>
        <p class="meta-decks-sub deck-search-status" role="status"></p>
        <div class="meta-decks-grid" data-search-results></div>
      </div>`;
    top.before(controls);
    const panel = controls.querySelector('#deck-search-panel');
    const input = controls.querySelector('input');
    const grid = controls.querySelector('[data-search-results]');
    const status = controls.querySelector('[role="status"]');
    const link = controls.querySelector('[data-search-link]');
    const modes = [...controls.querySelectorAll('[data-mode]')];
    let snapshot, loading = false, failed = false;

    function refresh() {
      if (panel.hidden) return;
      const term = normalize(input.value);
      const { filters, matches } = search(term, getDecks(), snapshot);
      const url = filters.length === 1 ? royaleApiUrl(filters[0]) : '';
      link.hidden = !url;
      if (url) link.href = url;
      else link.removeAttribute('href');
      grid.innerHTML = renderDecks(matches, { searchMode: true, images: snapshot?.images });
      const date = snapshot?.date?.split('-').reverse().join('/');
      status.textContent = !term ? 'Gõ tên deck hoặc thẻ chính, hoặc chọn một gợi ý bên trên.' :
        (matches.length ? matches.length + ' deck phù hợp' : 'Không có deck phù hợp trong dữ liệu hiện có') +
        (loading ? ' · Đang tải thêm deck…' : failed ? ' · Không tải được bộ deck lưu sẵn.' :
          date ? ' · Bao gồm dữ liệu RoyaleTrack lưu ngày ' + date + '.' : '.');
    }

    function update() {
      if (!panel.hidden && normalize(input.value) && !snapshot && !loading && !failed) {
        loading = true;
        fetch('./deck-search-data.json?v=20261120', { signal: AbortSignal.timeout(8000) })
          .then(response => {
            if (!response.ok) throw new Error('Deck snapshot unavailable');
            return response.json();
          })
          .then(data => {
            if (!Array.isArray(data?.decks)) throw new Error('Invalid deck snapshot');
            snapshot = data;
          })
          .catch(() => { failed = true; })
          .finally(() => { loading = false; refresh(); });
      }
      refresh();
    }

    modes.forEach(button => button.addEventListener('click', () => {
      const searching = button.dataset.mode === 'search';
      panel.hidden = !searching;
      top.hidden = searching;
      modes.forEach(mode => mode.setAttribute('aria-pressed', String(mode === button)));
      if (searching) input.focus();
      update();
    }));
    input.addEventListener('input', update);
    controls.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
      input.value = button.dataset.query;
      input.focus();
      update();
    }));
    return { refresh };
  }

  return { search, royaleApiUrl, mount };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = WintertimeDeckSearch;
