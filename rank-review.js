(function initWintertimeRankReview(root) {
  'use strict';

  // Officer advisory only: no automatic promotions or demotions.
  // Compare the TWO MOST RECENT completed, individually documented War Logs.
  // Unknown entries are never interpreted as zero Decks or a failed War.
  const MIN_DECKS = 10;
  const EXPECTED_DECKS = 16;
  const REQUIRED_WARS = 2;

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

    const latest = Array.isArray(member?.cw2History) ? member.cw2History.slice(0, REQUIRED_WARS) : [];
    const seasons = latest.map(r => String(r?.season || '—'));
    const decks = latest.map(verifiedDecks);
    const donations = verifiedDonations(member?.donations);
    const observed = decks.filter(d => d !== null).length;
    const evidence = decks.map((d, i) => seasons[i] + ': ' + (d === null ? 'chưa xác minh' : d + '/16 Deck')).join(' · ');
    const suffix = ' · Donate hiện tại: ' + (donations === null ? 'chưa xác minh' : donations) +
      '. Cần Leader/Co-leader kiểm tra nghỉ phép, thời điểm gia nhập và độ mới dữ liệu.';

    if (latest.length < REQUIRED_WARS || observed < REQUIRED_WARS || donations === null) {
      return {
        status: 'unknown', label: 'Chưa đủ dữ liệu', warsVerified: observed,
        decks, donations, seasons,
        reason: 'Cần đủ 2 kỳ War gần nhất có Deck xác minh và số Donate hiện tại.' +
          (evidence ? ' ' + evidence : '') + suffix
      };
    }

    const qualified = decks.every(d => d >= MIN_DECKS) && donations > 0;
    const reason = '2 War gần nhất: ' + evidence + suffix;
    const status = qualified ? (role === 'member' ? 'promote' : 'retain')
      : (role === 'elder' ? 'demote' : 'not_eligible');
    const labels = {
      promote: 'Đề xuất lên Trưởng lão',
      retain: 'Giữ chức Trưởng lão',
      demote: 'Cảnh báo xét giáng cấp',
      not_eligible: 'Chưa đạt điều kiện'
    };
    return { status, label: labels[status], warsVerified: observed, decks, donations, seasons, reason };
  }

  const api = { evaluate, MIN_DECKS, EXPECTED_DECKS, REQUIRED_WARS };
  root.WintertimeRankReview = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
