(function initContributionScoring(root) {
  "use strict";

  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const optionalNumber = (value) => value === "" || value == null || !Number.isFinite(Number(value))
    ? null : Number(value);

  // Internal activity score, NOT an official Clash Royale ranking.
  // War participation 40%, played decks over last 4 completed wars 40%,
  // decks in current race 10%, donations 10%, inactivity penalty 0-15 pts.
  // Unknown values never become zero for grading purposes.
  function calculate(member) {
    const m = member && typeof member === "object" ? member : {};
    const participation = optionalNumber(m.warParticipation);
    const currentDecks = optionalNumber(m.decksThisWeek);
    const donations = optionalNumber(m.donations);
    const daysOffline = optionalNumber(m.daysOffline);
    const rawHistory = Array.isArray(m.warDecksVerifiedHistory) ? m.warDecksVerifiedHistory.slice(0, 4)
      : Array.isArray(m.warDecksHistory) ? m.warDecksHistory.slice(0, 4) : [];
    const observed = rawHistory.map(optionalNumber).filter(x => x != null && x >= 0);
    const complete = participation != null && currentDecks != null && donations != null
      && daysOffline != null && observed.length >= 2;
    const completedDecks = observed.reduce((s, n) => s + n, 0);
    const averageDecks = observed.length ? completedDecks / observed.length : null;
    const breakdown = {
      participationPoints: participation == null ? null : Math.round(clamp(participation / 100, 0, 1) * 40),
      historicalDeckPoints: averageDecks == null ? null : Math.round(clamp(averageDecks / 16, 0, 1) * 40),
      currentDeckPoints: currentDecks == null ? null : Math.round(clamp(currentDecks / 16, 0, 1) * 10),
      donationPoints: donations == null ? null : Math.round(clamp(donations / 300, 0, 1) * 10),
      offlinePenalty: daysOffline == null ? null : Math.min(15, Math.floor(Math.max(0, daysOffline)) * 2)
    };
    const score = complete ? clamp(
      breakdown.participationPoints + breakdown.historicalDeckPoints
      + breakdown.currentDeckPoints + breakdown.donationPoints - breakdown.offlinePenalty,
      0, 100
    ) : null;
    const lastTwoZeroDecks = Array.isArray(m.warDecksVerifiedHistory) && rawHistory.length >= 2
      && optionalNumber(rawHistory[0]) === 0 && optionalNumber(rawHistory[1]) === 0;
    const review = lastTwoZeroDecks; // Review only; never automatic removal
    const excellent = complete && score >= 75 && participation >= 75 && averageDecks >= 12 && daysOffline <= 3;
    return {
      score,
      scoreSource: "internal-observed-activity-v1",
      complete,
      participation,
      currentDecks,
      donations,
      daysOffline,
      completedDecks,
      observedWeeks: observed.length,
      averageDecks,
      lastTwoZeroDecks,
      review,
      excellent,
      breakdown
    };
  }

  function rankMembers(members) {
    return (Array.isArray(members) ? members : [])
      .filter(m => Number.isFinite(m?.score) && m?.contribution?.complete)
      .slice()
      .sort((a, b) =>
        b.score - a.score
        || (b.contribution.completedDecks - a.contribution.completedDecks)
        || (b.warParticipation - a.warParticipation)
        || (b.donations - a.donations)
        || String(a.tag).localeCompare(String(b.tag))
      );
  }

  const api = { calculate, rankMembers };
  root.WintertimeContribution = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window === "undefined" ? globalThis : window);
