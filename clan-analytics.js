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
