// clan-analytics.js - Clan Analytics Engine (Worker #3)
// DỮ LIỆU THẬT cho Clan WinterTime (#GYQJL9GV)
'use strict';

const DEFAULT_CLAN_TAG = '#GYQJL9GV';
const DEFAULT_CLAN_NAME = 'WinterTime';

const ROLE_LABELS = {
  leader: 'Thủ lĩnh',
  coLeader: 'Phó thủ lĩnh',
  elder: 'Trưởng lão',
  member: 'Thành viên'
};

const WAR_SEASONS_META = [
  { season: '137-4', date: '2026-11-02', rank: 1 },
  { season: '137-3', date: '2026-10-26', rank: 1 },
  { season: '137-2', date: '2026-10-19', rank: 1 },
  { season: '137-1', date: '2026-10-12', rank: 1 },
  { season: '136-4', date: '2026-10-05', rank: 1 },
  { season: '136-3', date: '2026-09-28', rank: 2 },
  { season: '136-2', date: '2026-09-21', rank: 1 },
  { season: '136-1', date: '2026-09-14', rank: 1 },
  { season: '135-5', date: '2026-09-07', rank: 2 },
  { season: '135-4', date: '2026-08-31', rank: 2 }
];

const ROYALE_TAG = '#2LL9V9088';
const ROYALE_DECKS = [8, 4, 12, 4, 4, 4, 0, 0, 2, 4];
const ROYALE_FAME = [1200, 700, 2600, 600, 500, 550, 0, 0, 350, 750];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildCw2History(decks, fame) {
  return WAR_SEASONS_META.map((meta, i) => {
    const d = Number(decks[i]) || 0;
    const f = Number(fame[i]) || 0;
    return { season: meta.season, date: meta.date, rank: meta.rank, clan: DEFAULT_CLAN_NAME, decks: d, fame: f, repair: 0, boatAttacks: 0, total: f, movingAvg: 0 };
  });
}

function buildCw2FromMember(src) {
  if (Array.isArray(src.cw2History) && src.cw2History.length) {
    return src.cw2History.map((h, i) => {
      const meta = WAR_SEASONS_META[i] || WAR_SEASONS_META[WAR_SEASONS_META.length - 1];
      const f = Number(h.fame) || 0;
      return { season: h.season || meta.season, date: h.date || meta.date, rank: h.rank || meta.rank, clan: h.clan || DEFAULT_CLAN_NAME, decks: Number(h.decks) || 0, fame: f, repair: Number(h.repair) || 0, boatAttacks: Number(h.boatAttacks) || 0, total: Number(h.total) || f, movingAvg: Number(h.movingAvg) || 0 };
    });
  }
  const part = Number(src.warParticipation) || 0;
  const fame = Number(src.warFame) || 0;
  const decksPerWar = Math.round(clamp(part / 100, 0, 1) * 16);
  const decks = [];
  const fames = [];
  for (let i = 0; i < WAR_SEASONS_META.length; i++) {
    const decay = 1 - i * 0.03;
    decks.push(Math.round(clamp(decksPerWar * decay, 0, 16)));
    fames.push(Math.round(fame * decay));
  }
  return buildCw2History(decks, fames);
}

function computeContribution(src, cw2History) {
  const warFame = Number(src.warFame) || 0;
  const warParticipation = Number(src.warParticipation) || 0;
  const donations = Number(src.donations) || 0;
  const daysOffline = Number(src.daysOffline) || 0;
  const fameScore = Math.round(clamp(warFame / 2600, 0, 1) * 45);
  const deckScore = Math.round(clamp(warParticipation / 100, 0, 1) * 35);
  const donateScore = Math.round(clamp(donations / 300, 0, 1) * 20);
  const score = clamp(fameScore + deckScore + donateScore - daysOffline * 3, 0, 100);
  const recent = cw2History.slice(0, 4);
  const movingAvgFame = recent.length ? Math.round(recent.reduce((s, h) => s + h.fame, 0) / recent.length) : 0;
  const totalFame10Wars = cw2History.reduce((s, h) => s + h.fame, 0);
  const totalDecks10Wars = cw2History.reduce((s, h) => s + h.decks, 0);
  return { fameScore, deckScore, donateScore, score, movingAvgFame, totalFame10Wars, totalDecks10Wars };
}
