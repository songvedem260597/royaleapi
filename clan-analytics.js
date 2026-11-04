// clan-analytics.js - Esports Analytics Engine for Clash Royale Clan Manager
'use strict';

const ROLE_LABELS = { leader: 'Leader', coLeader: 'Co-Leader', elder: 'Elder', member: 'Member' };

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function analyzeMember(member) {
  const m = member || {};
  const donations = Number(m.donations) || 0;
  const received = Number(m.donationsReceived) || 0;
  const trophies = Number(m.trophies) || 0;
  const role = m.role || 'member';

  const donateScore = clamp(donations / 200, 0, 1) * 45;
  const ratio = received > 0 ? donations / received : (donations > 0 ? 2 : 0);
  const ratioScore = clamp(ratio / 1.5, 0, 1) * 15;
  const trophyScore = clamp(trophies / 7500, 0, 1) * 25;
  const roleScore = role === 'leader' ? 15 : role === 'coLeader' ? 12 : role === 'elder' ? 9 : 6;

  const score = clamp(Math.round(donateScore + ratioScore + trophyScore + roleScore), 0, 100);
  const status = score >= 65 ? 'good' : score >= 40 ? 'warning' : 'kick';
  const statusLabel = status === 'good' ? 'Đóng góp tốt' : status === 'warning' ? 'Cần theo dõi' : 'Đề xuất lọc';

  let reason;
  if (score >= 90) reason = 'MVP Donate & Cúp cao';
  else if (donations < 50 && received > 100) reason = 'Nhận quân nhiều nhưng donate thấp';
  else if (donations === 0 && received > 0) reason = 'Nhận quân nhiều nhưng 0 donate';
  else if (donations < 50) reason = 'Donate thấp (<50)';
  else if (trophies < 5000) reason = 'Cúp thấp (<5000)';
  else if (ratio < 0.5) reason = 'Tỷ lệ donate/nhận kém';
  else if (score >= 65) reason = 'Đóng góp ổn định';
  else reason = 'Cần cải thiện hoạt động';

  return {
    tag: m.tag || '', name: m.name || 'Unknown', role, roleLabel: ROLE_LABELS[role] || 'Member',
    expLevel: Number(m.expLevel) || 0, trophies, donations, donationsReceived: received,
    donationRatio: Math.round(ratio * 100) / 100, score, status, statusLabel, reason
  };
}

function analyzeClan(clanData) {
  const clan = clanData || {};
  const rawMembers = Array.isArray(clan.memberList) ? clan.memberList : (Array.isArray(clan.members) ? clan.members : []);
  const members = rawMembers.map(analyzeMember);
  const total = members.length;
  const good = members.filter((m) => m.status === 'good').length;
  const warning = members.filter((m) => m.status === 'warning').length;
  const kick = members.filter((m) => m.status === 'kick').length;
  const avgScore = total ? Math.round(members.reduce((s, m) => s + m.score, 0) / total) : 0;
  const healthPercent = total ? Math.round(((good + warning * 0.5) / total) * 100) : 0;
  const mvpMember = members.slice().sort((a, b) => b.score - a.score)[0] || null;

  return {
    name: clan.name || 'Unknown Clan', tag: clan.tag || '', badgeId: clan.badgeId || 0,
    clanScore: Number(clan.clanScore) || 0, membersCount: total, avgScore, healthPercent,
    counts: { total, good, warning, kick }, mvpMember, members
  };
}

function generateDemoClan() {
  const memberList = [
    { name: 'VN_DragonLord', tag: '#2PP99PRO', role: 'leader', expLevel: 15, trophies: 8200, donations: 480, donationsReceived: 120 },
    { name: 'MinhKhoi', tag: '#8YQ2L0RG', role: 'coLeader', expLevel: 14, trophies: 7800, donations: 420, donationsReceived: 150 },
    { name: 'HaiDang', tag: '#9RKL2P8V', role: 'coLeader', expLevel: 14, trophies: 7600, donations: 390, donationsReceived: 180 },
    { name: 'TuanAnh', tag: '#P0Q8XZ2M', role: 'elder', expLevel: 13, trophies: 7200, donations: 310, donationsReceived: 200 },
    { name: 'QuocBao', tag: '#L2M9N4K7', role: 'elder', expLevel: 13, trophies: 6900, donations: 280, donationsReceived: 210 },
    { name: 'VanNam', tag: '#R7T3V6B1', role: 'member', expLevel: 12, trophies: 6500, donations: 220, donationsReceived: 190 },
    { name: 'DucHuy', tag: '#K4W8N2Q9', role: 'member', expLevel: 12, trophies: 6100, donations: 150, donationsReceived: 220 },
    { name: 'ThanhTung', tag: '#M6B3X7L1', role: 'member', expLevel: 11, trophies: 5800, donations: 90, donationsReceived: 260 },
    { name: 'HoangLong', tag: '#T9V5C2R8', role: 'member', expLevel: 11, trophies: 5400, donations: 40, donationsReceived: 300 },
    { name: 'GiaBao', tag: '#W2N7K4P6', role: 'member', expLevel: 10, trophies: 4900, donations: 0, donationsReceived: 180 },
    { name: 'AnhTuan', tag: '#Z8L1M5Q3', role: 'member', expLevel: 10, trophies: 4600, donations: 0, donationsReceived: 250 },
    { name: 'LeVan', tag: '#C3R9T6B2', role: 'member', expLevel: 9, trophies: 4200, donations: 0, donationsReceived: 0 }
  ];
  return { name: 'VN Esports Legends', tag: '#2PP99PRO', badgeId: 16000000, clanScore: 42000, memberList };
}

const ClanAnalytics = { analyzeMember, analyzeClan, generateDemoClan };
if (typeof window !== 'undefined') window.ClanAnalytics = ClanAnalytics;
if (typeof module !== 'undefined' && module.exports) module.exports = ClanAnalytics;
