(function initWintertimeRankReview(root) {
  'use strict';

  // Officer advisory only: no automatic promotions or demotions.
  // Promotion: latest 2 verified War weeks (or 1 verified week for newcomer review).
  // Demotion: average of 5 latest fully verified weeks.
  // Unknown entries are never interpreted as zero Decks or a failed War.
  const MIN_DECKS = 8;
  const EXPECTED_DECKS = 16;
  const REQUIRED_WARS = 2; // Promotion: both latest War weeks must hit the threshold.
  const DEMOTION_WARS = 5; // Elders: average of the five latest fully verified War weeks.

  function verifiedDecks(row) {
    if (!row || row.recordedInWarLog !== true || row.warLogAvailable !== true ||
        row.decksVerified !== true || row.decks == null || row.decks === '') return null;
    const decks = Number(row.decks);
    return Number.isInteger(decks) && decks >= 0 && decks <= EXPECTED_DECKS ? decks : null;
  }

  function verifiedDonations(value) {
    if (value == null || value === '' || typeof value === 'boolean') return null;
    const donations = Number(value);
    return Number.isSafeInteger(donations) && donations >= 0 ? donations : null;
  }

  function evaluate(member) {
    const role = member?.role || 'member';
    if (role !== 'member' && role !== 'elder') {
      return { status: 'excluded', label: 'Không áp dụng', reason: 'Thủ lĩnh và Phó thủ lĩnh không nằm trong quy tắc xét Trưởng lão.' };
    }

    // The source lists War weeks newest first. Do NOT skip unknown recent weeks
    // to borrow older strong results; that could produce a false rank decision.
    const history = Array.isArray(member?.cw2History) ? member.cw2History : [];
    const required = role === 'elder' ? DEMOTION_WARS : REQUIRED_WARS;
    const latest = history.slice(0, required);
    const seasons = latest.map(r => String(r?.season || '—'));
    const decks = latest.map(verifiedDecks);
    const donations = verifiedDonations(member?.donations);
    const observed = decks.filter(d => d !== null).length;
    const evidence = decks.map((d, i) => seasons[i] + ': ' + (d === null ? 'chưa xác minh' : d + '/16 Deck')).join(' · ');
    const suffix = ' · Donate hiện tại: ' + (donations === null ? 'chưa xác minh' : donations) +
      '. Leader/Co-leader phải đối chiếu nghỉ phép, thời điểm gia nhập và dữ liệu War mới nhất.';

    const unknown = reason => ({
      status: 'unknown', label: 'Chưa đủ dữ liệu', warsVerified: observed,
      decks, donations, seasons, reason: reason + (evidence ? ' ' + evidence : '') + suffix
    });

    if (role === 'elder') {
      // Demotion uses FIVE complete and verified latest weeks, never averages
      // just 1–4 weeks or fabricates zeroes for gaps.
      if (latest.length < DEMOTION_WARS || observed < DEMOTION_WARS) {
        return unknown('Cần đủ 5 kỳ War gần nhất được xác minh để xét duy trì chức Trưởng lão.');
      }
      const averageDecks = decks.reduce((sum, d) => sum + d, 0) / DEMOTION_WARS;
      const status = averageDecks < MIN_DECKS || donations === 0 ? 'demote'
        : donations === null ? 'unknown' : 'retain';
      const reason = 'TB 5 kỳ War: ' + averageDecks.toFixed(1) + '/16 Deck (' +
        evidence + ')' + suffix;
      return {
        status, label: status === 'demote' ? 'Cảnh báo xét giáng cấp'
          : status === 'retain' ? 'Giữ chức Trưởng lão' : 'Chưa đủ dữ liệu',
        warsVerified: observed, decks, donations, seasons, averageDecks, reason
      };
    }

    if (donations === null) {
      return unknown('Chưa có số Donate xác minh để xét thăng hạng.');
    }
    if (latest.length >= REQUIRED_WARS && observed === REQUIRED_WARS) {
      const qualified = decks.every(d => d >= MIN_DECKS) && donations > 0;
      return {
        status: qualified ? 'promote' : 'not_eligible',
        label: qualified ? 'Đề xuất lên Trưởng lão' : 'Chưa đạt điều kiện',
        warsVerified: observed, decks, donations, seasons,
        reason: '2 War gần nhất: ' + evidence + suffix
      };
    }

    // Newcomers may have only one documented completed War. Offer an early
    // promotion review for a strong most-recent War, but never assume a join
    // date from missing older history: explicit officer confirmation required.
    const onlyLatestWar = verifiedDecks(history[0]) !== null &&
      history.slice(1).every(row => verifiedDecks(row) === null);
    if (onlyLatestWar && decks[0] >= MIN_DECKS && donations > 0) {
      return {
        status: 'promote', label: 'Đề xuất xét thăng sớm',
        warsVerified: 1, decks, donations, seasons,
        newcomerReview: true,
        reason: 'Đề xuất xét thăng sớm (1 War xác minh ' + seasons[0] + ': ' +
          decks[0] + '/16 Deck).' + suffix +
          ' Chưa xác minh được ngày gia nhập: chỉ thăng nếu Leader xác nhận thành viên thật sự mới vào.'
      };
    }
    return unknown('Chưa đủ 2 kỳ War gần nhất; người mới có thể được xét thăng sớm khi kỳ gần nhất đạt ≥8/16 và có Donate.');
  }

  const api = { evaluate, MIN_DECKS, EXPECTED_DECKS, REQUIRED_WARS, DEMOTION_WARS };
  root.WintertimeRankReview = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
