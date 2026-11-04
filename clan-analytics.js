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
  const daysOffline = Number(src.daysOffline) || 0;
  const warFame = Number(src.warFame) || 0;
  const trackerStatus = src.trackerStatus || null;
  const warParticipation = src.warParticipation === null || src.warParticipation === undefined ? null : Number(src.warParticipation);

  const warPartScore = clamp((warParticipation ?? 0) / 100, 0, 1) * 60;
  const fameScore = clamp(warFame / 3000, 0, 1) * 20;
  const donateScore = clamp(donations / 200, 0, 1) * 20;
  const score = clamp(Math.round(warPartScore + fameScore + donateScore), 0, 100);

  let status, statusLabel;
  if (trackerStatus === 'Bỏ war' || (warParticipation !== null && warParticipation <= 25)) {
    status = 'kick'; statusLabel = 'Bỏ War · Lọc';
  } else if (trackerStatus === 'Đáng tin' || score >= 70) {
    status = 'good'; statusLabel = 'Đáng tin · Giữ';
  } else {
    status = 'warning';
    statusLabel = trackerStatus === 'Mới vào' ? 'Mới vào · Theo dõi' : 'Cần theo dõi';
  }

  const reason = 'War: ' + (warParticipation ?? 0) + '% (' + (warFame || 0) + ' đ/war) · Offline: ' + (daysOffline || 0) + 'd';

  return { tag, name, role, roleLabel, trophies, donations, donationsReceived, daysOffline, warFame, warParticipation, trackerStatus, score, status, statusLabel, reason };
}
