(function initWintertimeWarHistory(root) {
  'use strict';

  const numeric = value => value == null || value === '' || !Number.isFinite(Number(value))
    ? null : Number(value);

  // Clan War Leagues are based on War Trophies (not Clan Trophy Score).
  // In Gold, I = 1500-1999, II = 2000-2499, III = 2500-2999.
  function leagueFromWarTrophies(value) {
    const trophies = numeric(value);
    if (trophies == null) return null;
    if (trophies < 200) return 'Đồng I';
    if (trophies < 400) return 'Đồng II';
    if (trophies < 600) return 'Đồng III';
    if (trophies < 900) return 'Bạc I';
    if (trophies < 1200) return 'Bạc II';
    if (trophies < 1500) return 'Bạc III';
    if (trophies < 2000) return 'Vàng I';
    if (trophies < 2500) return 'Vàng II';
    if (trophies < 3000) return 'Vàng III';
    return 'Huyền thoại';
  }

  function raceRow(meta, roster) {
    const r = roster || {};
    const verified = meta?.aggregatesVerified === true
      && Boolean(meta.warResultSource && meta.warResultSource !== 'unavailable');
    const fame = verified ? numeric(meta.clanFame) : null;
    const repair = verified ? numeric(meta.repairPoints) : null;
    const officialDecks = verified ? numeric(meta.clanDecks) : null;
    const historicalCount = verified ? numeric(meta.warParticipants) : null;
    const trophyChange = verified ? numeric(meta.trophyChange) : null;
    const warTrophiesAtRace = verified ? numeric(meta.warTrophiesAtRace) : null;
    const avgPerParticipant = fame != null && historicalCount > 0
      ? Math.round(fame / historicalCount) : null;
    const total = fame != null && repair != null ? fame + repair : null;
    const raceTarget = fame == null ? 'Chưa xác minh'
      : fame > 10000 ? 'Colosseum'
        : fame.toLocaleString('en-US') + '/10,000';
    return {
      season: meta?.season || null,
      date: meta?.date || null,
      rank: verified ? numeric(meta.rank) : null,
      league: leagueFromWarTrophies(warTrophiesAtRace),
      clan: r.name || 'WinterTime',
      participants: numeric(r.participants) ?? 0,
      observed: numeric(r.observed) ?? 0,
      membersCount: numeric(r.membersCount) ?? 0,
      officialParticipants: historicalCount,
      decks: officialDecks ?? (numeric(r.decks) ?? 0),
      officialDecks: officialDecks != null,
      rosterDecks: numeric(r.decks) ?? 0,
      fame,
      repair,
      boatAttacks: null,
      avgPerParticipant,
      trophyChange,
      warTrophiesAtRace,
      total,
      raceTarget,
      verified,
      source: verified ? meta.warResultSource : 'RoyaleTrack current-member decks (not official total)',
      sourceUpdatedAt: verified ? (meta.warResultObservedAt || null) : null
    };
  }

  const api = { leagueFromWarTrophies, raceRow };
  root.WintertimeWarHistory = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
