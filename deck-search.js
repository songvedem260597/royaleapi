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
  const catalog = typeof WintertimeCardCatalog !== 'undefined' ? WintertimeCardCatalog :
    typeof module !== 'undefined' && module.exports ? require('./card-catalog.js') : [];
  const cardText = (value) => normalize(value).replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const cardNames = new Map();
  const cardIndex = catalog.map(card => {
    const name = cardText(card.name);
    cardNames.set(name, card.slug);
    cardNames.set(cardText(card.slug), card.slug);
    const shortNames = [...aliases].filter(([, slugs]) => slugs.length === 1 && slugs[0] === card.slug)
      .map(([alias]) => alias);
    return { card, name, terms: [...new Set([name, name.replace(/ /g, ''), cardText(card.slug), ...shortNames])] };
  });

  // Also recognize transposed neighbors (e.g. balolon → Balloon).
  function editDistance(a, b) {
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    let beforePrevious;
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++) {
        row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          row[j] = Math.min(row[j], beforePrevious[j - 2] + 1);
        }
      }
      beforePrevious = previous;
      previous = row;
    }
    return previous[b.length];
  }

  function scoreTerm(query, term) {
    if (query === term) return 0;
    if (term.startsWith(query)) return 10 + (term.length - query.length) / 100;
    if (term.split(' ').some(word => word.startsWith(query))) return 20 + (term.length - query.length) / 100;
    if (query.length > 2 && term.includes(query)) return 30 + (term.length - query.length) / 100;
    if (query.length < 3) return Infinity;
    const limit = query.length < 7 ? 1 : 2;
    if (term.length < query.length - limit) return Infinity;
    let distance = Infinity;
    for (let length = query.length - limit; length <= Math.min(term.length, query.length + limit); length++) {
      distance = Math.min(distance, editDistance(query, term.slice(0, length)));
    }
    return distance <= limit ? 40 + distance + Math.abs(term.length - query.length) / 100 : Infinity;
  }

  function suggestCards(value) {
    const query = cardText(value).replace(/^(?:evo|evolution|hero)\s+|\s+(?:evo|evolution|hero)$/g, '');
    if (!query || query.length > 40 || /\d/.test(query) || aliases.get(query)?.length > 1) return [];
    return cardIndex
      .map(({ card, name, terms }) => ({ card, name, score: Math.min(...terms.map(term => scoreTerm(query, term))) }))
      .filter(result => Number.isFinite(result.score))
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'en'))
      .slice(0, 3)
      .map(({ card }) => card);
  }

  function search(query, liveDecks, snapshot) {
    const term = normalize(query);
    if (!term) return { matches: [], filters: [] };
    const decks = [...liveDecks, ...(snapshot?.decks || [])];
    const slugs = new Set(decks.flatMap(d => (d.cards || []).map(baseCard)));
    const knownCard = cardNames.get(cardText(term));
    const slug = knownCard || term.replace(/ /g, '-');
    const filters = aliases.get(term) || (knownCard || slugs.has(slug) ? [slug] : []);
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
          <div class="deck-search-field">
            <input id="deck-search-query" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="deck-card-suggestions" enterkeyhint="search" placeholder="Nhập Lava, Balloon, Hog Rider 2.6…" maxlength="80" autocomplete="off" spellcheck="false">
            <ul id="deck-card-suggestions" class="deck-card-suggestions" role="listbox" aria-label="Gợi ý tên thẻ" hidden></ul>
          </div>
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
    const list = controls.querySelector('[role="listbox"]');
    const grid = controls.querySelector('[data-search-results]');
    const status = controls.querySelector('[role="status"]');
    const link = controls.querySelector('[data-search-link]');
    const modes = [...controls.querySelectorAll('[data-mode]')];
    let snapshot, loading = false, failed = false;
    let suggestions = [], active = -1;

    function setActive(index) {
      active = index;
      [...list.children].forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
      if (active < 0) input.removeAttribute('aria-activedescendant');
      else input.setAttribute('aria-activedescendant', list.children[active].id);
    }

    function closeSuggestions() {
      suggestions = [];
      setActive(-1);
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    }

    function showSuggestions() {
      if (document.activeElement !== input || panel.hidden) return closeSuggestions();
      suggestions = suggestCards(input.value);
      list.replaceChildren(...suggestions.map(({ name }, index) => {
        const option = document.createElement('li');
        option.id = 'deck-card-option-' + index;
        option.dataset.index = index;
        option.setAttribute('role', 'option');
        option.textContent = name;
        return option;
      }));
      setActive(-1);
      list.hidden = !suggestions.length;
      input.setAttribute('aria-expanded', String(!list.hidden));
    }

    function chooseCard(index) {
      const card = suggestions[index];
      if (!card) return;
      input.value = card.name;
      closeSuggestions();
      update();
    }

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
          !matches.length && url ? ' · Bạn có thể xem thêm trên RoyaleAPI.' :
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
      else closeSuggestions();
      update();
    }));
    function onInput(event) {
      if (event.isComposing) return;
      showSuggestions();
      update();
    }
    input.addEventListener('input', onInput);
    input.addEventListener('compositionend', onInput);
    input.addEventListener('focus', showSuggestions);
    input.addEventListener('blur', closeSuggestions);
    input.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (list.hidden) showSuggestions();
        if (!suggestions.length) return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive(active < 0 ? (step > 0 ? 0 : suggestions.length - 1) :
          (active + step + suggestions.length) % suggestions.length);
      } else if (event.key === 'Enter' && active >= 0) {
        event.preventDefault();
        chooseCard(active);
      } else if (event.key === 'Escape' && !list.hidden) {
        event.preventDefault();
        event.stopPropagation();
        closeSuggestions();
      }
    });
    list.addEventListener('pointerdown', event => {
      if (event.target.closest('[role="option"]')) event.preventDefault();
    });
    list.addEventListener('click', event => {
      const option = event.target.closest('[data-index]');
      if (option) chooseCard(Number(option.dataset.index));
    });
    controls.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
      input.value = button.dataset.query;
      input.focus();
      closeSuggestions();
      update();
    }));
    return { refresh };
  }

  return { search, suggestCards, royaleApiUrl, mount };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = WintertimeDeckSearch;
