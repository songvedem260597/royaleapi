// clan-analytics.js - Clan Analytics Engine (Worker #3)
'use strict';

const DEMO_MEMBERS = [
  { name: 'DragonSlayer', tag: '#2PP0JCVQ', role: 'leader', level: 8500, donations: 1200, warFame: 3400, daysOffline: 0 },
  { name: 'NightHawk', tag: '#8YQ2L0RG', role: 'coLeader', level: 7200, donations: 980, warFame: 2900, daysOffline: 1 },
  { name: 'StormBreaker', tag: '#9RKL2P8V', role: 'elder', level: 6100, donations: 750, warFame: 2100, daysOffline: 2 },
  { name: 'IceQueen', tag: '#P0Q8XZ2M', role: 'elder', level: 5800, donations: 620, warFame: 1850, daysOffline: 3 },
  { name: 'FireMage', tag: '#L2M9N4K7', role: 'member', level: 4900, donations: 410, warFame: 1200, daysOffline: 5 },
  { name: 'ShadowWolf', tag: '#R7T3V6B1', role: 'member', level: 4500, donations: 180, warFame: 600, daysOffline: 12 }
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function evaluateMember(m) {
  if (!m || typeof m !== 'object') return 0;
  const level = Number(m.level) || 0;
  const donations = Number(m.donations) || 0;
  const warFame = Number(m.warFame) || 0;
  const daysOffline = Number(m.daysOffline) || 0;

  const levelScore = clamp((level - 4500) / (8500 - 4500), 0, 1) * 40;
  const donationScore = clamp(donations / 1200, 0, 1) * 25;
  const warScore = clamp(warFame / 3400, 0, 1) * 25;
  const activityScore = clamp(1 - daysOffline / 14, 0, 1) * 10;

  const total = levelScore + donationScore + warScore + activityScore;
  return clamp(Math.round(total), 0, 100);
}

function getClanInsights(rows) {
  const list = Array.isArray(rows) && rows.length ? rows : DEMO_MEMBERS;
  const scores = list.map(evaluateMember);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const inactive = list.filter((m) => (Number(m.daysOffline) || 0) > 7).length;
  const top = list[scores.indexOf(Math.max(...scores))];
  const health = avg >= 75 ? 'XUAT SAC' : avg >= 50 ? 'TOT' : avg >= 30 ? 'TRUNG BINH' : 'YEU';
  return `Clan Health: ${health} | Diem TB: ${avg}/100 | Thanh vien: ${list.length} | Khong hoat dong (>7 ngay): ${inactive} | MVP: ${top.name} (${Math.max(...scores)} diem)`;
}

window.ClanAnalytics = { DEMO_MEMBERS, evaluateMember, getClanInsights };
