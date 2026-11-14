(function initWintertimeWarEvaluation(root) {
  "use strict";
  const valid = v => v != null && v !== "" && Number.isFinite(Number(v));
  const format = v => valid(v) ? Number(v).toLocaleString("en-US") : "—";

  // Grade using EVERY verified WinterTime War Log participation available
  // for this individual (not the latest race or a fixed five/ten-race window).
  // Historical gaps are UNKNOWN, not zero. The source does not include an
  // independently verified join date, so never claim complete tenure coverage.
  // Two consecutive fully documented zero-Deck races still trigger review.
  function evaluate(member) {
    const rows = Array.isArray(member?.cw2History) ? member.cw2History : [];
    const latest = rows[0] ?? null, prev = rows[1] ?? null;
    const hasVerifiedFame = row => row?.recordedInWarLog === true &&
      row?.fameVerified === true && valid(row.fame) && Number(row.fame) >= 0;
    const verifiedRows = rows.filter(hasVerifiedFame);
    const verifiedWeeks = verifiedRows.length;
    const averageFame = verifiedWeeks
      ? verifiedRows.reduce((total, row) => total + Number(row.fame), 0) / verifiedWeeks
      : null;
    const actualFame = hasVerifiedFame(latest) ? Number(latest.fame) : null;
    const actualDecks = latest?.recordedInWarLog === true &&
      latest?.decksVerified === true && valid(latest.decks) ? Number(latest.decks) : null;
    const bothDocumentedZero = Boolean(latest?.decksVerified && prev?.decksVerified &&
      latest?.recordedInWarLog && prev?.recordedInWarLog &&
      Number(latest.decks) === 0 && Number(prev.decks) === 0);
    const firstVerifiedSeason = verifiedRows[verifiedWeeks - 1]?.season || null;
    const latestVerifiedSeason = verifiedRows[0]?.season || null;

    const reason = bothDocumentedZero
      ? "2 kỳ War đã kết thúc liên tiếp (" + latest.season + ", " + prev.season +
        ") đều ghi nhận 0 Deck; kiểm tra báo nghỉ phép và thời điểm gia nhập"
      : averageFame == null
        ? "Không có Fame cá nhân được xác minh trong War Log; chưa thể xếp loại. Kỳ thiếu bản ghi không đồng nghĩa 0 Fame."
        : "Fame trung bình " + format(Math.round(averageFame)) + " qua " + verifiedWeeks +
          " kỳ War đã xác minh của cá nhân" +
          (firstVerifiedSeason ? " (từ " + firstVerifiedSeason + " đến " + latestVerifiedSeason + ")" : "") +
          "; kỳ gần nhất " + (latest?.season || "—") + ": " + format(actualFame) +
          " Fame, " + format(actualDecks) + " Deck." +
          " Chưa có ngày gia nhập được xác minh; các kỳ không có bản ghi không tính là 0." +
          " Ngưỡng Ưu tú ≥1.600, Trung bình >400, Cảnh báo ≤400.";

    const status = bothDocumentedZero ? "kick"
      : averageFame == null ? "unknown"
      : averageFame >= 1600 ? "good"
      : averageFame > 400 ? "average" : "warning";
    const labels = {
      kick: "Đề xuất xét Kick", unknown: "Chưa đủ dữ liệu",
      good: "Ưu tú", average: "Trung bình", warning: "Cảnh báo"
    };
    return {
      status, statusLabel: labels[status], reason,
      averageFame, averagedWarWeeks: verifiedWeeks,
      firstVerifiedSeason, latestVerifiedSeason,
      latestFame: actualFame, latestDecks: actualDecks,
      latestSeason: latest?.season || null,
      verifiedWeeks, twoVerifiedZeroDecks: bothDocumentedZero,
      decisionRequiresOfficer: bothDocumentedZero
    };
  }

  // Weekly podium remains based on the latest verified race alone.
  function rankByLatestWar(members) {
    return (Array.isArray(members) ? members : []).filter(m=>Number.isFinite(m?.warEvaluation?.latestFame))
      .slice().sort((a,b)=>b.warEvaluation.latestFame - a.warEvaluation.latestFame
        || (b.warEvaluation.latestDecks??-1) - (a.warEvaluation.latestDecks??-1)
        || String(a.tag).localeCompare(String(b.tag)));
  }
  const api={evaluate,rankByLatestWar};
  root.WintertimeWarEvaluation=api;
  if (typeof module !== "undefined" && module.exports) module.exports=api;
})(typeof window === "undefined" ? globalThis : window);
