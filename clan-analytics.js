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
