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
  const kick2Zero = cw2History.some((h, i) => i < cw2History.length - 1 && (Number(h.fame) || 0) === 0 && (Number(cw2History[i + 1].fame) || 0) === 0);
  if (warFame <= 400) {
    status = 'kick'; statusLabel = kick2Zero ? '🥾 Kick' : 'Cảnh báo';
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
  return { name: DEFAULT_CLAN_NAME, tag: DEFAULT_CLAN_TAG, region: 'Vietnam', membersCount: 46, clanScore: 130593, warTrophies: 2369, members };
}

window.ClanAnalytics = {
  DEFAULT_CLAN_TAG,
  DEFAULT_CLAN_NAME,
  WAR_SEASONS_META,
  analyzeMember,
  analyzeClan,
  generateDemoClan
};

window.ClanAnalytics.TOP_META_DECKS = [
  { rank: 1, name: 'Giant 4.0', rating: 59, usage: '2.37%', win: 53.5, elixir: '4.0', cycle: '12.0', cards: ['giant-snowball-ev1','bowler-hero','witch-ev1','graveyard','zappies','guards','giant','arrows'], cardImages: ['https://royaletrack.com/cards/cardevolutions-7MaJLa6hK9WN2_VIshuh5DIDfGwm0wEv98gXtAxLDPs.webp?v=2','https://royaletrack.com/cards/cardheroes-SU4qFXmbQXWjvASxVI6z9IJuTYolx4A0MKK90sTIE88.webp?v=2','https://royaletrack.com/cards/cardevolutions-cfwk1vzehVyHC-uloEIH6NOI0hOdofCutR5PyhIgO6w.webp?v=2','https://royaletrack.com/cards/cards-Icp8BIyyfBTj1ncCJS7mb82SY7TPV-MAE-J2L2R48DI.webp?v=2','https://royaletrack.com/cards/cards-QZfHRpLRmutZbCr5fpLnTpIp89vLI6NrAwzGZ8tHEc4.webp?v=2','https://royaletrack.com/cards/cards-1ArKfLJxYo6_NU_S9cAeIrfbXqWH0oULVJXedxBXQlU.webp?v=2','https://royaletrack.com/cards/cards-Axr4ox5_b7edmLsoHxBX3vmgijAIibuF6RImTbqLlXE.webp?v=2','https://royaletrack.com/cards/cards-Flsoci-Y6y8ZFVi5uRFTmgkPnCmMyMVrU7YmmuPvSBo.webp?v=2'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=28000017;26000034;26000007;28000010;26000052;26000025;26000003;28000001' },
  { rank: 2, name: 'Lightning 3.0', rating: 65, usage: '2.04%', win: 60.4, elixir: '3.0', cycle: '8.0', cards: ['cannon-ev1','ice-wizard-hero','bats-ev1','minion-giant','knight','lightning','skeletons','barbarian-barrel'], cardImages: ['https://royaletrack.com/cards/cardevolutions-nZK1y-beLxO5vnlyUhK6-2zH2NzXJwqykcosqQ1cmZ8.webp?v=2','https://royaletrack.com/cards/cardheroes-W3dkw0HTw9n1jB-zbknY2w3wHuyuLxSRIAV5fUT1SEY.webp?v=2','https://royaletrack.com/cards/cardevolutions-EnIcvO21hxiNpoI-zO6MDjLmzwPbq8Z4JPo2OKoVUjU.webp?v=2','https://royaletrack.com/cards/cards-VRjL0yVLzrnoe-IBh2l2fDHDok0L-UoM9cG-X_8xbMk.webp?v=2','https://royaletrack.com/cards/cards-jAj1Q5rclXxU9kVImGqSJxa4wEMfEhvwNQ_4jiGUuqg.webp?v=2','https://royaletrack.com/cards/cards-fpnESbYqe5GyZmaVVYe-SEu7tE0Kxh_HZyVigzvLjks.webp?v=2','https://royaletrack.com/cards/cards-oO7iKMU5m0cdxhYPZA3nWQiAUh2yoGgdThLWB1rVSec.webp?v=2','https://royaletrack.com/cards/cards-Gb0G1yNy0i5cIGUHin8uoFWxqntNtRPhY_jeMXg7HnA.webp?v=2'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=27000000;26000023;26000049;26000107;26000000;28000007;26000010;28000015' },
  { rank: 3, name: 'Hog Rider 2.6', rating: 57, usage: '1.92%', win: 52.6, elixir: '2.6', cycle: '6.0', cards: ['skeletons-ev1','musketeer-hero','cannon-ev1','ice-spirit','hog-rider','ice-golem','the-log','fireball'], cardImages: ['https://royaletrack.com/cards/cardevolutions-oO7iKMU5m0cdxhYPZA3nWQiAUh2yoGgdThLWB1rVSec.webp?v=2','https://royaletrack.com/cards/cardheroes-Tex1C48UTq9FKtAX-3tzG0FJmc9jzncUZG3bb5Vf-Ds.webp?v=2','https://royaletrack.com/cards/cardevolutions-nZK1y-beLxO5vnlyUhK6-2zH2NzXJwqykcosqQ1cmZ8.webp?v=2','https://royaletrack.com/cards/cards-lv1budiafU9XmSdrDkk0NYyqASAFYyZ06CPysXKZXlA.webp?v=2','https://royaletrack.com/cards/cards-Ubu0oUl8tZkusnkZf8Xv9Vno5IO29Y-jbZ4fhoNJ5oc.webp?v=2','https://royaletrack.com/cards/cards-r05cmpwV1o7i7FHodtZwW3fmjbXCW34IJCsDEV5cZC4.webp?v=2','https://royaletrack.com/cards/cards-_iDwuDLexHPFZ_x4_a0eP-rxCS6vwWgTs6DLauwwoaY.webp?v=2','https://royaletrack.com/cards/cards-lZD9MILQv7O-P3XBr_xOLS5idwuz3_7Ws9G60U36yhc.webp?v=2'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=26000010;26000014;27000000;26000030;26000021;26000038;28000011;28000000' },
  { rank: 4, name: 'Royal Hogs 2.9', rating: 55, usage: '1.87%', win: 51.1, elixir: '2.9', cycle: '7.0', cards: ['royal-hogs-ev1','royal-ghost-ev1','archer-queen','cannon','earthquake','skeletons','ice-spirit','the-log'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=26000059;26000050;26000072;27000000;28000014;26000010;26000030;28000011' },
  { rank: 5, name: 'Minion Giant 2.8', rating: 62, usage: '1.80%', win: 57.8, elixir: '2.8', cycle: '8.0', cards: ['cannon-ev1','ice-wizard-hero','bats-ev1','minion-giant','miner','poison','skeletons','barbarian-barrel'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=27000000;26000023;26000049;26000107;26000032;28000009;26000010;28000015' },
  { rank: 6, name: 'Golem 4.3', rating: 60, usage: '1.77%', win: 55.9, elixir: '4.3', cycle: '11.0', cards: ['electro-dragon-ev1','bowler-hero','baby-dragon-ev1','minion-giant','tornado','golem','vines','barbarian-barrel'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=26000063;26000034;26000015;26000107;28000012;26000009;28000026;28000015' },
  { rank: 7, name: 'Electro Giant 3.8', rating: 64, usage: '1.31%', win: 60.9, elixir: '3.8', cycle: '9.0', cards: ['goblin-cage-ev1','ice-wizard-hero','baby-dragon-ev1','electro-giant','tornado','lightning','vines','barbarian-barrel'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=27000012;26000023;26000015;26000085;28000012;28000007;28000026;28000015' },
  { rank: 8, name: 'Graveyard 3.1', rating: 55, usage: '1.08%', win: 52.8, elixir: '3.1', cycle: '8.0', cards: ['royal-ghost-ev1','bowler-hero','skeletons-ev1','ice-wizard-hero','graveyard','vines','poison','barbarian-barrel'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=26000050;26000034;26000010;26000023;28000010;28000026;28000009;28000015' },
  { rank: 9, name: 'Hog Rider 2.8', rating: 58, usage: '1.06%', win: 55.6, elixir: '2.8', cycle: '6.0', cards: ['firecracker-ev1','knight-hero','tesla-ev1','earthquake','hog-rider','skeletons','ice-spirit','the-log'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=26000064;26000000;27000006;28000014;26000021;26000010;26000030;28000011' },
  { rank: 10, name: 'Royal Hogs 3.9', rating: 57, usage: '0.94%', win: 55.1, elixir: '3.9', cycle: '11.0', cards: ['royal-recruits-ev1','goblin-cage-ev1','flying-machine','electro-spirit','barbarian-barrel','zappies','royal-hogs','fireball'], copyUrl: 'https://link.clashroyale.com/deck/fr?deck=26000047;27000012;26000057;26000084;28000015;26000052;26000059;28000000' }
];
const _origAM = window.ClanAnalytics.analyzeMember;
const _origAC = window.ClanAnalytics.analyzeClan;
window.ClanAnalytics.analyzeMember = function(m) {
  const r = _origAM(m);
  if (Array.isArray(m?.recentWars)) r.cw2History = r.cw2History.slice(0, m.recentWars.length);
  else if (m?.trackerStatus === 'Mới vào' || (Array.isArray(m?.cw2History) && !m.cw2History.length)) r.cw2History = [];
  const h = r.cw2History || [];
  const z2 = h.length >= 2 && r.trackerStatus !== 'Mới vào' && (r.warFame <= 400 || (!h[0].fame && !h[1].fame)) && h.some((x, i) => i < h.length - 1 && !x.fame && !h[i + 1].fame);
  const noWar = r.warFame === 0 || (h.length >= 2 && !h[0].fame && !h[1].fame) || (r.warFame <= 400 && h.length > 0 && !h[0].fame);
  const leech = r.donationsReceived > r.donations * 2;
  const okDon = r.donations > 0 && !leech;
  if ((noWar && leech) || (z2 && !okDon)) { r.status = 'kick'; r.statusLabel = '🥾 Kick'; }
  else if (r.warFame === 0 && okDon) { r.status = 'warning'; r.statusLabel = 'Trung bình'; }
  else if (r.warFame <= 400) { r.status = 'kick'; r.statusLabel = 'Cảnh báo'; }
  return r;
};
window.ClanAnalytics.analyzeClan = function(d) {
  const c = _origAC(d);
  const raw = Array.isArray(d?.members) && d.members.length ? d.members : c.members;
  c.members = raw.map(window.ClanAnalytics.analyzeMember);
  c.counts = { total: c.members.length, good: 0, warning: 0, kick: 0 };
  c.members.forEach(x => { c.counts[x.status] = (c.counts[x.status] || 0) + 1; });
  c.rawClanScore = Number(d?.clanScore) > 1000 ? Number(d.clanScore) : (Number(d?.rawClanScore) || 130593);
  c.clanWarTrophies = Number(d?.clanWarTrophies || d?.warTrophies) || 2369;
  c.updatedAt = d?.updatedAt || new Date().toISOString();
  if (Array.isArray(d?.topMetaDecks) && d.topMetaDecks.length) {
    window.ClanAnalytics.TOP_META_DECKS = d.topMetaDecks;
    c.topMetaDecks = d.topMetaDecks;
  }
  return c;
};