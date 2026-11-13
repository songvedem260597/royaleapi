(function initWintertimeWarEvaluation(root) {
  "use strict";
  const valid = v => v != null && v !== "" && Number.isFinite(Number(v));
  const format = v => valid(v) ? Number(v).toLocaleString("en-US") : "—";

  // Clan rules, not a general engagement score:
  // 1,600+ verified Fame: excellent; 401–1,599: average; <=400: warning.
  // 2 consecutive completed races with VERIFIED zero decks = proposal to review,
  // never automatic removal (leave notice/tenure must be confirmed by officers).
  function evaluate(member) {
    const rows = Array.isArray(member?.cw2History) ? member.cw2History : [];
    const latest = rows[0] ?? null, prev = rows[1] ?? null;
    const actualFame = latest?.fameVerified === true && valid(latest.fame) ? Number(latest.fame) : null;
    const actualDecks = latest?.decksVerified === true && valid(latest.decks) ? Number(latest.decks) : null;
    const bothDocumentedZero = Boolean(latest?.decksVerified && prev?.decksVerified &&
      latest?.recordedInWarLog && prev?.recordedInWarLog &&
      Number(latest.decks) === 0 && Number(prev.decks) === 0);
    const verifiedWeeks = rows.filter(row => row.fameVerified).length;
    const details = latest?.season || "kỳ gần nhất";
    const reason = bothDocumentedZero
      ? "2 kỳ War đã kết thúc liên tiếp (" + latest.season + ", " + prev.season + ") đều ghi nhận 0 Deck; kiểm tra báo nghỉ phép và thời điểm gia nhập"
      : actualFame == null
        ? "Không có Fame được xác nhận trong War Log " + details + "; chưa thể xếp loại"
        : "War " + details + ": " + format(actualFame) + " Fame, " +
          format(actualDecks) + " Deck; ngưỡng Ưu tú ≥1.600, Trung bình >400, Cảnh báo ≤400";
    const status = bothDocumentedZero ? "kick"
      : actualFame == null ? "unknown"
      : actualFame >= 1600 ? "good"
      : actualFame > 400 ? "average"
      : "warning";
    const labels = {
      kick: "Đề xuất xét Kick", unknown: "Chưa đủ dữ liệu",
      good: "Ưu tú", average: "Trung bình", warning: "Cảnh báo"
    };
    return {
      status, statusLabel: labels[status], reason, latestFame: actualFame,
      latestDecks: actualDecks, latestSeason: latest?.season || null,
      verifiedWeeks, twoVerifiedZeroDecks: bothDocumentedZero,
      decisionRequiresOfficer: bothDocumentedZero
    };
  }

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
