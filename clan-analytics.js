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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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

  let score, status, statusLabel, reason;
  if (warParticipation != null || trackerStatus) {
    const warPct = warParticipation != null ? warParticipation : 0;
    score = clamp(Math.round(clamp(warPct / 100, 0, 1) * 60 + clamp(warFame / 3000, 0, 1) * 20 + clamp(donations / 200, 0, 1) * 20), 0, 100);
    if (trackerStatus === 'Bỏ war' || (warParticipation != null && warParticipation <= 25)) {
      status = 'kick'; statusLabel = 'Bỏ War · Lọc';
    } else if (trackerStatus === 'Đáng tin' || score >= 70) {
      status = 'good'; statusLabel = 'Đáng tin · Giữ';
    } else {
      status = 'warning';
      statusLabel = trackerStatus === 'Mới vào' ? 'Mới vào · Theo dõi' : 'Cần theo dõi';
    }
    reason = 'War: ' + (warParticipation != null ? warParticipation : 0) + '% (' + warFame + ' đ/war) · Offline: ' + daysOffline + 'd';
  } else {
    score = clamp(Math.round(clamp(donations / 200, 0, 1) * 45 + clamp(trophies / 7000, 0, 1) * 25 + clamp(warFame / 3000, 0, 1) * 30), 0, 100);
    status = score >= 70 ? 'good' : score >= 40 ? 'warning' : 'kick';
    statusLabel = status === 'good' ? 'Đáng tin · Giữ' : status === 'warning' ? 'Cần theo dõi' : 'Đề xuất lọc';
    reason = 'Donate: ' + donations + ' · Cúp: ' + trophies + ' · War: ' + warFame;
  }

  return { tag, name, role, roleLabel, trophies, donations, donationsReceived, daysOffline, warParticipation, warFame, trackerStatus, score, status, statusLabel, reason };
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
    { name: 'Rock Lee', tag: '#9GRJR099U', role: 'leader', roleLabel: 'Thủ lĩnh', trophies: 10421, donations: 383, donationsReceived: 320, warParticipation: 86, warFame: 2030, trackerStatus: 'Đáng tin' },
    { name: 'Tobi', tag: '#2CJUYCPV', role: 'elder', roleLabel: 'Trưởng lão', trophies: 14000, donations: 558, donationsReceived: 280, warParticipation: 100, warFame: 2820, trackerStatus: 'Đáng tin' },
    { name: 'Trịnh Lam', tag: '#888YV092R', role: 'elder', roleLabel: 'Trưởng lão', trophies: 14000, donations: 99, donationsReceived: 0, warParticipation: 100, warFame: 3100, trackerStatus: 'Đáng tin' },
    { name: 'Love_BoiBoi', tag: '#200GUUVRCJ', role: 'coLeader', roleLabel: 'Phó thủ lĩnh', trophies: 14000, donations: 604, donationsReceived: 320, warParticipation: 57, warFame: 1900, trackerStatus: 'Cần theo dõi' },
    { name: 'Mr.chien', tag: '#209Q0JGYVU', role: 'coLeader', roleLabel: 'Phó thủ lĩnh', trophies: 14000, donations: 238, donationsReceived: 200, warParticipation: 88, warFame: 2675, trackerStatus: 'Đáng tin' },
    { name: 'Người Bán Hành', tag: '#UCGGLUCP0', role: 'coLeader', roleLabel: 'Phó thủ lĩnh', trophies: 14000, donations: 83, donationsReceived: 272, warParticipation: 79, warFame: 2260, trackerStatus: 'Đáng tin' },
    { name: 'toiladem', tag: '#V2PCPL2C2', role: 'member', roleLabel: 'Thành viên', trophies: 7016, donations: 400, donationsReceived: 240, warParticipation: 79, warFame: 1950, trackerStatus: 'Đáng tin' },
    { name: 'prince2k1', tag: '#2GLQRJ0U9', role: 'member', roleLabel: 'Thành viên', trophies: 13384, donations: 191, donationsReceived: 280, warParticipation: 0, warFame: 0, trackerStatus: 'Bỏ war' },
    { name: 'Hung', tag: '#9V8LUVJ0', role: 'member', roleLabel: 'Thành viên', trophies: 12671, donations: 48, donationsReceived: 80, warParticipation: 0, warFame: 0, trackerStatus: 'Bỏ war' },
    { name: 'muronggg', tag: '#VCGVJLGPY', role: 'member', roleLabel: 'Thành viên', trophies: 9672, donations: 0, donationsReceived: 0, warParticipation: 8, warFame: 171, trackerStatus: 'Bỏ war' }
  ];
  return { name: DEFAULT_CLAN_NAME, tag: DEFAULT_CLAN_TAG, region: 'Vietnam', membersCount: 47, clanScore: 131349, warTrophies: 2369, members };
}

window.ClanAnalytics = {
  DEFAULT_CLAN_TAG,
  DEFAULT_CLAN_NAME,
  analyzeMember,
  analyzeClan,
  generateDemoClan
};
