// clan-analytics.js - Clan Analytics Engine (Worker #3)
// ĐỘC QUYỀN cho Clan WinterTime (#GYQJL9GV)
'use strict';

const DEFAULT_CLAN_TAG = '#GYQJL9GV';
const DEFAULT_CLAN_NAME = 'WinterTime';

const ROLE_LABELS = {
  leader: 'Trưởng Clan',
  coLeader: 'Phó Clan',
  elder: 'Trưởng Lão',
  member: 'Thành Viên'
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function analyzeMember(m) {
  const src = m && typeof m === 'object' ? m : {};
  const tag = src.tag || '';
  const name = src.name || 'Không tên';
  const role = src.role || 'member';
  const roleLabel = ROLE_LABELS[role] || 'Thành Viên';
  const trophies = Number(src.trophies) || 0;
  const donations = Number(src.donations) || 0;
  const donationsReceived = Number(src.donationsReceived) || 0;
  const warFame = Number(src.warFame) || 0;

  const donateScore = clamp(donations / 200, 0, 1) * 45;
  const ratio = donationsReceived > 0 ? donations / donationsReceived : (donations > 0 ? 2 : 0);
  const ratioScore = clamp(ratio / 1.5, 0, 1) * 15;
  const trophyScore = clamp(trophies / 7000, 0, 1) * 25;
  const roleBonus = role === 'leader' ? 8 : role === 'coLeader' ? 6 : role === 'elder' ? 4 : 0;
  const warScore = clamp(warFame / 3000, 0, 1) * 7 + roleBonus;
  const score = clamp(Math.round(donateScore + ratioScore + trophyScore + warScore), 0, 100);

  let status, statusLabel, reason;
  if (score >= 65) {
    status = 'good'; statusLabel = 'Đóng góp tốt';
    reason = donations >= 200 ? 'Chủ lực WinterTime · Donate & Cúp cao' : 'Đóng góp ổn định · Cúp/War tốt';
  } else if (score >= 40) {
    status = 'warning'; statusLabel = 'Cần theo dõi';
    reason = donations < 50 ? 'Donate yếu (<50/tuần)' : 'Hoạt động trung bình · Cần cải thiện';
  } else {
    status = 'kick'; statusLabel = 'Đề xuất lọc';
    reason = donations === 0 ? '0 Donate · Nhận quân không đóng góp -> Lọc' : 'Đóng góp quá thấp · Đề xuất lọc';
  }

  return { tag, name, role, roleLabel, trophies, donations, donationsReceived, score, status, statusLabel, reason };
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
  return { name, tag, clanScore, membersCount: members.length, avgScore, mvpName: mvp ? mvp.name : '', counts, members };
}

function generateDemoClan() {
  const members = [
    { name: 'WinterKing', tag: '#GYQJL9GV', role: 'leader', trophies: 7200, donations: 480, donationsReceived: 120, warFame: 3200 },
    { name: 'SnowStorm', tag: '#2PP0JCVQ', role: 'coLeader', trophies: 6800, donations: 420, donationsReceived: 150, warFame: 2900 },
    { name: 'FrostBlade', tag: '#8YQ2L0RG', role: 'coLeader', trophies: 6500, donations: 380, donationsReceived: 160, warFame: 2700 },
    { name: 'IceArrow', tag: '#9RKL2P8V', role: 'elder', trophies: 6100, donations: 300, donationsReceived: 180, warFame: 2200 },
    { name: 'GlacierX', tag: '#P0Q8XZ2M', role: 'elder', trophies: 5800, donations: 260, donationsReceived: 200, warFame: 1900 },
    { name: 'PolarWolf', tag: '#L2M9N4K7', role: 'elder', trophies: 5400, donations: 220, donationsReceived: 210, warFame: 1600 },
    { name: 'SnowFang', tag: '#R7T3V6B1', role: 'member', trophies: 5000, donations: 150, donationsReceived: 220, warFame: 1100 },
    { name: 'WinterFox', tag: '#K4N8M2Q9', role: 'member', trophies: 4600, donations: 90, donationsReceived: 240, warFame: 700 },
    { name: 'ColdWind', tag: '#V5B1C7X3', role: 'member', trophies: 4200, donations: 40, donationsReceived: 260, warFame: 400 },
    { name: 'FrostKid', tag: '#M3Q9L6T2', role: 'member', trophies: 3800, donations: 20, donationsReceived: 300, warFame: 200 },
    { name: 'IceNewbie', tag: '#Z8W4R1P5', role: 'member', trophies: 3200, donations: 0, donationsReceived: 320, warFame: 0 },
    { name: 'SnowGhost', tag: '#T6Y2K8N4', role: 'member', trophies: 2800, donations: 0, donationsReceived: 280, warFame: 0 }
  ];
  return { name: DEFAULT_CLAN_NAME, tag: DEFAULT_CLAN_TAG, region: 'Vietnam', members };
}

window.ClanAnalytics = {
  DEFAULT_CLAN_TAG,
  DEFAULT_CLAN_NAME,
  analyzeMember,
  analyzeClan,
  generateDemoClan
};
