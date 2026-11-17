(function initRankReviewUI() {
  'use strict';
  // UI-only advisory. Never modifies a player's in-game role.
  const button = document.getElementById('btn-rank-review');
  const panel = document.getElementById('rank-review-output');
  if (!button || !panel) return;

  const escapeText = value => String(value ?? '').replace(/[&<>"']/g,
    char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const membersIn = status => (currentClan?.members || []).filter(m => m.rankReview?.status === status);

  function rankList(items, empty) {
    if (!items.length) return '<p class="rank-review-empty">' + empty + '</p>';
    return '<ul class="rank-review-list">' + items.map(m =>
      '<li><div class="rank-review-person"><strong>' + escapeText(m.name) + '</strong>' +
      '<span class="tag-mono">' + escapeText(m.tag) + '</span><span class="role-badge">' +
      escapeText(m.roleLabel) + '</span></div><p>' + escapeText(m.rankReview.reason) + '</p></li>'
    ).join('') + '</ul>';
  }

  function showPanel() {
    const promote = membersIn('promote');
    const demote = membersIn('demote');
    const retain = membersIn('retain');
    const unknown = membersIn('unknown');
    const latestDate = currentClan?.warSeasons?.[0]?.date;
    const lastRace = latestDate ? Date.parse(latestDate + 'T00:00:00Z') : NaN;
    const stale = currentClan?.warLogStale || !Number.isFinite(lastRace) ||
      Date.now() - lastRace > 8 * 86400000;
    panel.innerHTML =
      '<div class="rank-review-heading"><div><h2>Xét thăng / giáng hạng</h2>' +
      '<p>Thăng: 2 War gần nhất mỗi kỳ ≥8/16 Deck và có Donate; thành viên mới được xét sớm khi 1 War đạt chuẩn (Leader cần xác nhận). Giáng: TB 5 War gần nhất &lt;8/16 Deck hoặc Donate bằng 0. ' +
      'Chỉ đề xuất để Leader/Co-leader xét duyệt, không tự đổi chức vụ.</p></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="rank-review-close">Đóng</button></div>' +
      (stale ? '<p class="rank-review-stale">⚠️ War Log có thể đã cũ: cần đối chiếu các kỳ mới nhất trước khi quyết định.</p>' : '') +
      '<div class="rank-review-stats"><span>↑ Đề xuất thăng: <strong>' + promote.length +
      '</strong></span><span>↓ Cảnh báo giáng: <strong>' + demote.length +
      '</strong></span><span>✓ Giữ hạng: <strong>' + retain.length +
      '</strong></span><span>Chưa đủ dữ liệu: <strong>' + unknown.length + '</strong></span></div>' +
      '<div class="rank-review-groups"><article class="rank-review-group rank-review-up"><h3>↑ Đề xuất lên Trưởng lão</h3>' +
      rankList(promote, 'Chưa có thành viên đủ điều kiện thăng hạng.') + '</article>' +
      '<article class="rank-review-group rank-review-down"><h3>↓ Cảnh báo xét giáng về Thành viên</h3>' +
      rankList(demote, 'Không có Trưởng lão cần cảnh báo giáng hạng.') + '</article></div>' +
      '<p class="rank-review-footnote">Có ' + unknown.length + ' người chưa đủ bằng chứng; giáng hạng yêu cầu 5 kỳ War xác minh và không tính kỳ trống là 0; ' +
      retain.length + ' Trưởng lão đạt chuẩn giữ hạng. Donate là số hiện tại, không phải lịch sử từng kỳ War. ' +
      'Thủ lĩnh / Phó thủ lĩnh không thuộc diện xét. Kiểm tra nghỉ phép và thời điểm gia nhập trước khi quyết định.</p>';
    panel.querySelector('#rank-review-close')?.addEventListener('click', () => {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    });
  }

  function update() {
    const actionable = membersIn('promote').length + membersIn('demote').length;
    button.textContent = 'Xét thăng / giáng hạng' + (actionable ? ' (' + actionable + ')' : '');
    if (!panel.hidden) showPanel();
  }
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
      showPanel();
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  const previousRender = window.render;
  if (typeof previousRender === 'function') {
    window.render = function () { previousRender(); update(); };
  }
  update();
})();
