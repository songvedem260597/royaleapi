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
