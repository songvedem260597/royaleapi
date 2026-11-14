(function initEliteRanking(root) {
  "use strict";

  // Ranking is an INTERNAL cross-category comparison, not an official game score.
  // War is an average over the most recent 10 completed races, using only
  // verified player Fame entries (missing historical membership != zero).
  // Donations and Trophy Road trophies are current snapshots from RoyaleTrack.
  const POLICY = Object.freeze({
    windowWeeks: 10,
    minVerifiedWeeks: 5,
    minAverageFame: 1600,
    warWeight: 60,
    donationWeight: 20,
    trophyWeight: 20,
    referenceFame: 3000,
    referenceDonations: 500,
    referenceTrophies: 14000
  });
  const numberOrNull = x => x == null || x === "" || !Number.isFinite(Number(x))
    ? null : Number(x);
  const points = (value, reference, weight) =>
    Math.min(1, Math.max(0, value / reference)) * weight;
  const round1 = x => Math.round(x * 10) / 10;

  function calculate(member) {
    const m = member || {};
    const weeks = (Array.isArray(m.cw2History) ? m.cw2History : []).slice(0, POLICY.windowWeeks);
    const observed = weeks
      .filter(h => h?.fameVerified === true && h?.recordedInWarLog === true)
      .map(h => numberOrNull(h.fame))
      .filter(n => n != null && n >= 0);
    const verifiedWeeks = observed.length;
    const avgWarFame = verifiedWeeks
      ? observed.reduce((sum, fame) => sum + fame, 0) / verifiedWeeks : null;
    // Do not confuse current values with ten-week historical averages.
    const donations = numberOrNull(m.donations);
    const trophies = numberOrNull(m.trophies);
    const qualified = verifiedWeeks >= POLICY.minVerifiedWeeks
      && avgWarFame >= POLICY.minAverageFame
      && donations != null && donations >= 0
      && trophies != null && trophies >= 0;
    const warPoints = avgWarFame == null ? null
      : round1(points(avgWarFame, POLICY.referenceFame, POLICY.warWeight));
    const donationPoints = donations == null ? null
      : round1(points(donations, POLICY.referenceDonations, POLICY.donationWeight));
    const trophyPoints = trophies == null ? null
      : round1(points(trophies, POLICY.referenceTrophies, POLICY.trophyWeight));
    const score = qualified
      ? round1(points(avgWarFame, POLICY.referenceFame, POLICY.warWeight)
        + points(donations, POLICY.referenceDonations, POLICY.donationWeight)
        + points(trophies, POLICY.referenceTrophies, POLICY.trophyWeight))
      : null;
    return {
      qualified, score, verifiedWeeks, windowWeeks: POLICY.windowWeeks,
      avgWarFame, donations, trophies,
      warPoints, donationPoints, trophyPoints,
      source: "internal-verified-war-average-current-donations-trophies-v1",
      reason: qualified ? null
        : verifiedWeeks < POLICY.minVerifiedWeeks ? "insufficient-verified-wars"
        : avgWarFame < POLICY.minAverageFame ? "below-elite-average"
        : "missing-donation-or-trophy"
    };
  }

  function rankMembers(members) {
    return (Array.isArray(members) ? members : [])
      .filter(m => m?.eliteRanking?.qualified === true && Number.isFinite(m.eliteRanking.score))
      .slice()
      .sort((a, b) =>
        b.eliteRanking.score - a.eliteRanking.score
        || b.eliteRanking.avgWarFame - a.eliteRanking.avgWarFame
        || b.eliteRanking.donations - a.eliteRanking.donations
        || b.eliteRanking.trophies - a.eliteRanking.trophies
        || String(a.tag).localeCompare(String(b.tag))
      );
  }

  const api = { POLICY, calculate, rankMembers };
  root.WintertimeEliteRanking = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window === "undefined" ? globalThis : window);
