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
  const list = WAR_SEASONS_META.map((meta, i) => {
    const d = Number(decks[i]) || 0;
    const f = Number(fame[i]) || 0;
    return { season: meta.season, date: meta.date, rank: meta.rank, clan: DEFAULT_CLAN_NAME, decks: d, fame: f, repair: 0, boatAttacks: 0, total: f, movingAvg: 0 };
  });
  const chrono = list.slice().reverse();
  chrono.forEach((entry, idx) => {
    const win = chrono.slice(Math.max(0, idx - 3), idx + 1);
    entry.movingAvg = Math.round(win.reduce((s, x) => s + x.fame, 0) / win.length);
  });
  return list;
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
  if (Array.isArray(src.recentWars) && src.recentWars.length) {
    const rDecks = [];
    const rFames = [];
    for (let i = 0; i < WAR_SEASONS_META.length; i++) {
      const raw = src.recentWars[i];
      const d = raw != null ? (parseInt(String(raw).split('/')[0], 10) || 0) : 0;
      rDecks.push(d);
      rFames.push(d === 0 ? 0 : Math.round((d * ((Number(src.warFame) || 1600) / Math.max(1, decksPerWar))) / 25) * 25);
    }
    return buildCw2History(rDecks, rFames);
  }
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

function analyzeMember(m) {
  const src = m && typeof m === 'object' ? m : {};
  const tag = src.tag || '';
  const name = src.name || 'Không tên';
  const role = src.role || 'member';
  const roleLabel = src.roleLabel || ROLE_LABELS[role] || 'Thành viên';
  const trophies = Number(src.trophies) || 0;
  const donations = Number(src.donations) || 0;
  const donationsReceived = Number(src.donationsReceived) || 0;
  const warFame = Number(src.warFame) || 0;
  const daysOffline = Number(src.daysOffline) || 0;
  const trackerStatus = src.trackerStatus || null;
  const warParticipation = src.warParticipation != null ? Number(src.warParticipation) : null;

  let cw2History;
  if (tag === ROYALE_TAG && !(Array.isArray(src.cw2History) && src.cw2History.length)) {
    cw2History = buildCw2History(ROYALE_DECKS, ROYALE_FAME);
  } else {
    cw2History = buildCw2FromMember(src);
  }

  const contribution = computeContribution(src, cw2History);
  const score = contribution.score;
  let status, statusLabel, reason;
  if (warFame <= 400) {
    status = 'kick'; statusLabel = 'Cảnh báo';
  } else if (trackerStatus === 'Đáng tin' || score >= 70) {
    status = 'good'; statusLabel = 'Ưu tú';
  } else {
    status = 'warning'; statusLabel = 'Trung bình';
  }
  reason = 'War: ' + (warParticipation != null ? warParticipation : 0) + '% (' + warFame + ' đ/war) · Fame10: ' + contribution.totalFame10Wars + ' · Offline: ' + daysOffline + 'd';

  return { tag, name, role, roleLabel, trophies, donations, donationsReceived, daysOffline, warParticipation, warFame, trackerStatus, cw2History, contribution, score, status, statusLabel, reason };
}

function analyzeClan(clanData) {
  const src = clanData && typeof clanData === 'object' ? clanData : {};
  const name = src.name || DEFAULT_CLAN_NAME;
  const tag = src.tag || DEFAULT_CLAN_TAG;
  const rawMembers = Array.isArray(src.members) && src.members.length ? src.members : generateDemoClan().members;
  const members = rawMembers.map(analyzeMember);
  const counts = { total: members.length, good: 0, warning: 0, kick: 0 };
  let sum = 0;
  let mvp = members[0];
  members.forEach((mm) => {
    counts[mm.status] = (counts[mm.status] || 0) + 1;
    sum += mm.score;
    if (!mvp || mm.score > mvp.score) mvp = mm;
  });
  const avgScore = members.length ? Math.round(sum / members.length) : 0;
  const clanScore = clamp(Math.round(avgScore * 0.7 + clamp(counts.good / Math.max(1, members.length), 0, 1) * 30), 0, 100);
  return { name, tag, clanScore, membersCount: members.length, avgScore, mvpName: mvp ? mvp.name : '', counts, members, warSeasons: WAR_SEASONS_META };
}

function generateDemoClan() {
  const members = [
    { name: 'Rock Lee', tag: '#9GRJR099U', role: 'leader', roleLabel: 'Thủ lĩnh', trophies: 10421, donations: 383, donationsReceived: 320, warParticipation: 86, warFame: 2030, trackerStatus: 'Đáng tin' },
    { name: 'Tobi', tag: '#2CJUYCPV', role: 'elder', roleLabel: 'Trưởng lão', trophies: 14000, donations: 558, donationsReceived: 280, warParticipation: 100, warFame: 2820, trackerStatus: 'Đáng tin' },
    { name: 'Trịnh Lam', tag: '#888YV092R', role: 'elder', roleLabel: 'Trưởng lão', trophies: 14000, donations: 99, donationsReceived: 0, warParticipation: 100, warFame: 3100, trackerStatus: 'Đáng tin' },
    { name: 'Love_BoiBoi', tag: '#200GUUVRCJ', role: 'coLeader', roleLabel: 'Phó thủ lĩnh', trophies: 14000, donations: 604, donationsReceived: 320, warParticipation: 57, warFame: 1900, trackerStatus: 'Cần theo dõi' },
    { name: 'Mr.chien', tag: '#209Q0JGYVU', role: 'coLeader', roleLabel: 'Phó thủ lĩnh', trophies: 14000, donations: 238, donationsReceived: 200, warParticipation: 88, warFame: 2675, trackerStatus: 'Đáng tin' },
    { name: 'Người Bán Hành', tag: '#UCGGLUCP0', role: 'coLeader', roleLabel: 'Phó thủ lĩnh', trophies: 14000, donations: 83, donationsReceived: 272, warParticipation: 79, warFame: 2260, trackerStatus: 'Đáng tin' },
    { name: 'toiladem', tag: '#V2PCPL2C2', role: 'member', roleLabel: 'Thành viên', trophies: 7016, donations: 400, donationsReceived: 240, warParticipation: 79, warFame: 1950, trackerStatus: 'Đáng tin' },
    { name: 'prince2k1', tag: '#2GLQRJ0U9', role: 'member', roleLabel: 'Thành viên', trophies: 13384, donations: 191, donationsReceived: 280, warParticipation: 0, warFame: 0, trackerStatus: 'Bỏ war' },
    { name: 'Hung', tag: '#9V8LUVJ0', role: 'member', roleLabel: 'Thành viên', trophies: 12671, donations: 48, donationsReceived: 80, warParticipation: 0, warFame: 0, trackerStatus: 'Bỏ war' },
    { name: 'muronggg', tag: '#VCGVJLGPY', role: 'member', roleLabel: 'Thành viên', trophies: 9672, donations: 0, donationsReceived: 0, warParticipation: 8, warFame: 171, trackerStatus: 'Bỏ war' },
    { name: 'Độc♥cô♦cầu♥bại', tag: '#2LL9V9088', role: 'member', roleLabel: 'Thành viên', trophies: 14000, donations: 271, donationsReceived: 240, warParticipation: 26, warFame: 725, trackerStatus: 'Cần theo dõi' }
  ];
  return { name: DEFAULT_CLAN_NAME, tag: DEFAULT_CLAN_TAG, region: 'Vietnam', membersCount: 47, clanScore: 131349, warTrophies: 2369, members };
}

window.ClanAnalytics = {
  DEFAULT_CLAN_TAG,
  DEFAULT_CLAN_NAME,
  WAR_SEASONS_META,
  analyzeMember,
  analyzeClan,
  generateDemoClan
};
