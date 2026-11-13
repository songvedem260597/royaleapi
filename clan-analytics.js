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
  const known = Array.isArray(src.cw2History) ? src.cw2History : null;
  if (known) {
    return known.map((h, i) => ({
      season: h.season ?? WAR_SEASONS_META[i]?.season ?? null,
      date: h.date ?? WAR_SEASONS_META[i]?.date ?? null,
      rank: h.rank ?? null,
      clan: h.clan || DEFAULT_CLAN_NAME,
      decks: h.decks == null ? null : Number(h.decks),
      fame: h.fameVerified === true && h.fame != null ? Number(h.fame) : null,
      repair: h.repair == null ? null : Number(h.repair),
      boatAttacks: h.boatAttacks == null ? null : Number(h.boatAttacks),
      total: h.fameVerified === true && h.total != null ? Number(h.total) : null,
      fameVerified: h.fameVerified === true,
      decksVerified: h.decksVerified === true,
      recordedInWarLog: h.recordedInWarLog === true,
      warLogAvailable: h.warLogAvailable === true,
      source: h.source || 'unavailable',
      movingAvg: null
    }));
  }
  // No fake battles or Fame for players without observed War history.
  return WAR_SEASONS_META.flatMap((meta, i) => {
    const raw = Array.isArray(src.warDecksHistory) ? src.warDecksHistory[i]
      : Array.isArray(src.recentWars) ? src.recentWars[i]?.split('/')[0] : null;
    if (raw == null || raw === '' || !Number.isFinite(Number(raw))) return [];
    return [{
      season: meta.season, date: meta.date, rank: null, clan: DEFAULT_CLAN_NAME,
      decks: Number(raw), fame: null, repair: null, boatAttacks: null,
      total: null, fameVerified: false, movingAvg: null
    }];
  });
}

function computeContribution(src, cw2History) {
  const result = window.WintertimeContribution.calculate(src);
  const observedDecks = cw2History.filter(h => h && Number.isFinite(h.decks));
  return {
    ...result,
    fameScore: null,
    deckScore: result.breakdown.historicalDeckPoints,
    donateScore: result.breakdown.donationPoints,
    movingAvgFame: null,
    totalFame10Wars: cw2History.filter(h => h.fameVerified).reduce((s, h) => s + h.fame, 0),
    fameVerifiedWeeks: cw2History.filter(h => h.fameVerified).length,
    totalDecks10Wars: observedDecks.reduce((s, h) => s + h.decks, 0)
  };
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
  const warFame = src.warFame == null ? null : Number(src.warFame);
  const daysOffline = Number(src.daysOffline) || 0;
  const trackerStatus = src.trackerStatus || null;
  const warParticipation = src.warParticipation == null ? null : Number(src.warParticipation);
  const decksThisWeek = src.decksThisWeek == null ? null : Number(src.decksThisWeek);
  const warDecksHistory = Array.isArray(src.warDecksHistory) ? src.warDecksHistory : [];

  const cw2History = buildCw2FromMember(src);
  const contribution = computeContribution(src, cw2History);
  const score = contribution.score;
  const warEvaluation = window.WintertimeWarEvaluation.evaluate({ ...src, cw2History });
  const status = warEvaluation.status;
  const statusLabel = warEvaluation.statusLabel;
  const reason = warEvaluation.reason + ' · Điểm hoạt động nội bộ: ' +
    (score == null ? '—' : score + '/100') + ' · Donate: ' + donations +
    ' · Offline: ' + daysOffline + ' ngày';

  return { tag, name, role, roleLabel, trophies, donations, donationsReceived, daysOffline, warParticipation, warFame, decksThisWeek, warDecksHistory, trackerStatus, cw2History, contribution, score, warEvaluation, latestFame: warEvaluation.latestFame, latestWarDecks: warEvaluation.latestDecks, warDecksVerifiedHistory: src.warDecksVerifiedHistory || [], verifiedWarWeeks: src.verifiedWarWeeks ?? 0, status, statusLabel, reason };
}

function analyzeClan(clanData) {
  const src = clanData && typeof clanData === 'object' ? clanData : {};
  const name = src.name || DEFAULT_CLAN_NAME;
  const tag = src.tag || DEFAULT_CLAN_TAG;
  const rawMembers = Array.isArray(src.members) && src.members.length ? src.members : generateDemoClan().members;
  const members = rawMembers.map(analyzeMember);
  const counts = { total: members.length, good: 0, warning: 0, kick: 0 };
  let sum = 0;
  const ranked = window.WintertimeContribution.rankMembers(members);
  const mvp = ranked[0] || null;
  members.forEach((mm) => {
    counts[mm.status] = (counts[mm.status] || 0) + 1;
    if (Number.isFinite(mm.score)) sum += mm.score;
  });
  const avgScore = ranked.length ? Math.round(sum / ranked.length) : null;
  const clanScore = avgScore == null ? null : clamp(Math.round(avgScore * 0.7 + clamp(counts.good / Math.max(1, members.length), 0, 1) * 30), 0, 100);
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
  // Never discard official War Log rows for members marked "Mới vào".
  // A missing historical roster entry is unknown, not zero or a reason to erase history.
  if (!Array.isArray(m?.cw2History) && Array.isArray(m?.recentWars)) r.cw2History = r.cw2History.slice(0, m.recentWars.length);

  // No kick/elite decisions from zero-coerced or fabricated Fame.
  // analyzeMember already grades observed Deck/participation/donate metrics.
  return r;
};
window.ClanAnalytics.analyzeClan = function(d) {
  const c = _origAC(d);
  const raw = Array.isArray(d?.members) && d.members.length ? d.members : c.members;
  c.members = raw.map(window.ClanAnalytics.analyzeMember);
  c.counts = { total: c.members.length, good: 0, warning: 0, kick: 0 };
  let totalDonations = 0;
  let totalDonationsReceived = 0;
  c.members.forEach(x => {
    c.counts[x.status] = (c.counts[x.status] || 0) + 1;
    totalDonations += Number(x.donations) || 0;
    totalDonationsReceived += Number(x.donationsReceived) || 0;
  });
  c.mvpName = window.WintertimeWarEvaluation.rankByLatestWar(c.members)[0]?.name || '';
  c.totalDonations = totalDonations;
  c.totalDonationsReceived = totalDonationsReceived;
  c.rawClanScore = d?.clanScore == null ? null : Number(d.clanScore);
  c.clanWarTrophies = d?.clanWarTrophies == null ? null : Number(d.clanWarTrophies);
  c.updatedAt = d?.updatedAt || null;
  c.fieldSources = d?.fieldSources || {};
  c.warHistoryQuality = d?.warHistoryQuality || {};
  c.warLogSource = d?.warLogSource || null;
  c.warLogRefreshedAt = d?.warLogRefreshedAt || null;
  c.warLogStale = Boolean(d?.warLogStale);

  const seasonsMeta = Array.isArray(d?.warSeasonsMeta) && d.warSeasonsMeta.length ? d.warSeasonsMeta : WAR_SEASONS_META;
  c.warSeasons = seasonsMeta;
  const clanHistory = seasonsMeta.map(meta => {
    let totalDecks = 0, participants = 0, observed = 0;
    for (const m of c.members) {
      const h = (m.cw2History || []).find(x => x.date === meta.date);
      if (h && Number.isFinite(h.decks)) {
        totalDecks += h.decks;
        observed++;
        if (h.decks > 0) participants++;
      }
    }
    return window.WintertimeWarHistory.raceRow(meta, {
      name: c.name || DEFAULT_CLAN_NAME, participants, observed,
      membersCount: c.members.length, decks: totalDecks
    });
  });
  c.cw2ClanHistory = clanHistory;

  if (Array.isArray(d?.topMetaDecks) && d.topMetaDecks.length) {
    const merged = d.topMetaDecks.slice(0, 10);
    if (merged.length < 10 && Array.isArray(window.ClanAnalytics.TOP_META_DECKS)) {
      for (const fb of window.ClanAnalytics.TOP_META_DECKS) {
        if (merged.length >= 10) break;
        if (!merged.some(x => x.name === fb.name)) {
          merged.push({ ...fb, rank: merged.length + 1 });
        }
      }
    }
    window.ClanAnalytics.TOP_META_DECKS = merged;
    c.topMetaDecks = merged;
  }
  return c;
};