(function initContributionScoring(root) {
  "use strict";

  // ---- Small numeric helpers -------------------------------------------------
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

  /** Returns a finite Number, or null for empty / non-numeric input. */
  const optionalNumber = (value) =>
    value === "" || value == null || !Number.isFinite(Number(value))
      ? null
      : Number(value);

  /** Rounds a 0..1 ratio scaled to `maxPoints`. Returns null when input is null. */
  const scaledPoints = (value, divisor, maxPoints) =>
    value == null ? null : Math.round(clamp(value / divisor, 0, 1) * maxPoints);

  /** Picks the first available deck-history array, capped to the last 4 wars. */
  const pickDeckHistory = (member) => {
    if (Array.isArray(member.warDecksVerifiedHistory)) {
      return member.warDecksVerifiedHistory.slice(0, 4);
    }
    if (Array.isArray(member.warDecksHistory)) {
      return member.warDecksHistory.slice(0, 4);
    }
    return [];
  };

  // ---- Scoring constants -----------------------------------------------------
  const WEIGHTS = Object.freeze({
    participation: 40,
    historicalDecks: 40,
    currentDecks: 10,
    donations: 10,
    maxOfflinePenalty: 15
  });
  const DECKS_PER_WAR = 16;
  const DONATIONS_TARGET = 300;
  const EXCELLENT_THRESHOLD = 75;

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
    const rawHistory = pickDeckHistory(m);
    const observed = rawHistory.map(optionalNumber).filter((x) => x != null && x >= 0);
    const complete =
      participation != null &&
      currentDecks != null &&
      donations != null &&
      daysOffline != null &&
      observed.length >= 2;
    const completedDecks = observed.reduce((sum, n) => sum + n, 0);
    const averageDecks = observed.length ? completedDecks / observed.length : null;
