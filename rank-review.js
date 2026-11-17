(function initWintertimeRankReview(root) {
  'use strict';

  // Officer advisory only: no automatic promotions or demotions.
  // Promotion requires at least 14 days in the clan, plus War and Donate evidence.
  // One War can be reviewed early only with a verified join date.
  // Demotion: average of 5 latest fully verified weeks.
  // Unknown entries are never interpreted as zero Decks or a failed War.
  const MIN_DECKS = 8;
  const EXPECTED_DECKS = 16;
  const REQUIRED_WARS = 2; // Promotion: both latest War weeks must hit the threshold.
  const MIN_TENURE_DAYS = 14;
  const DAY_MS = 24 * 60 * 60 * 1000;
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

  function parseWarDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const timestamp = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
  }

  function getTenureEvidence(member, history, nowMs) {
    const joinedAt = parseWarDate(member?.joinedAt);
    if (member?.joinedAtVerified === true) {
      if (joinedAt === null) return { eligible: false, reason: 'Ngày gia nhập được đánh dấu xác minh nhưng không hợp lệ.' };
      const days = Math.floor((nowMs - joinedAt) / DAY_MS);
      return { eligible: days >= MIN_TENURE_DAYS, verifiedJoinDate: true, days, reason: 'Ngày gia nhập xác minh: ' + member.joinedAt };
    }
    // War Log proves the player was in the clan on that date, but it cannot
    // establish continuous membership after a leave/rejoin. Officer review required.
    const observed = history.filter(row => verifiedDecks(row) !== null)
      .map(row => parseWarDate(row.date)).filter(timestamp => timestamp !== null && timestamp <= nowMs);
    if (!observed.length) return { eligible: false, reason: 'Chưa có ngày gia nhập hoặc mốc War xác minh để kiểm tra đủ 14 ngày.' };
    const firstSeen = Math.min(...observed);
    const days = Math.floor((nowMs - firstSeen) / DAY_MS);
    return {
      eligible: days >= MIN_TENURE_DAYS,
      verifiedJoinDate: false,
      days,
      reason: 'Có War Log ghi nhận từ ' + new Date(firstSeen).toISOString().slice(0, 10) +
        '; phải xác nhận thành viên không rời rồi gia nhập lại.'
    };
  }

  function evaluate(member, options = {}) {
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
    const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
    const tenure = role === 'member' ? getTenureEvidence(member, history, nowMs) : null;
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
    if (!tenure.eligible) {
      return unknown('Chưa đủ điều kiện xét thăng: yêu cầu tối thiểu 14 ngày trong clan. ' + tenure.reason);
    }
    if (latest.length >= REQUIRED_WARS && observed === REQUIRED_WARS) {
      const qualified = decks.every(d => d >= MIN_DECKS) && donations > 0;
      return {
        status: qualified ? 'promote' : 'not_eligible',
        label: qualified ? 'Đề xuất lên Trưởng lão' : 'Chưa đạt điều kiện',
        warsVerified: observed, decks, donations, seasons,
        reason: '2 War gần nhất: ' + evidence + '. Điều kiện thời gian: ' + tenure.reason + suffix
      };
    }

    // Early promotion with ONE War requires a verified join date proving >=14
    // full days of tenure. Older War evidence alone is not sufficient for this.
    const onlyLatestWar = verifiedDecks(history[0]) !== null &&
      history.slice(1).every(row => verifiedDecks(row) === null);
    if (onlyLatestWar && tenure.verifiedJoinDate && decks[0] >= MIN_DECKS && donations > 0) {
      return {
        status: 'promote', label: 'Đề xuất xét thăng sớm',
        warsVerified: 1, decks, donations, seasons,
        newcomerReview: true,
        reason: 'Đề xuất xét thăng sớm (1 War xác minh ' + seasons[0] + ': ' +
          decks[0] + '/16 Deck).' + suffix +
          ' ' + tenure.reason + ' (đã đủ tối thiểu 14 ngày). Leader xác nhận thời gian ở clan trước khi quyết định.'
      };
    }
    return unknown('Chưa đủ 2 kỳ War gần nhất; chỉ xét sớm sau ít nhất 14 ngày ở clan khi ngày gia nhập được xác minh, War gần nhất ≥8/16 và có Donate.');
  }

  const api = { evaluate, MIN_DECKS, EXPECTED_DECKS, REQUIRED_WARS, DEMOTION_WARS, MIN_TENURE_DAYS };
  root.WintertimeRankReview = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
