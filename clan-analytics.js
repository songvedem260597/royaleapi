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
