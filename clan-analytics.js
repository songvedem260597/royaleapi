// clan-analytics.js - Module Analytics (Worker #3)
(function () {
  'use strict';

  var DEMO_MEMBERS = [
    { name: 'Rồng Lửa', tag: '#2PP0YVQ8', role: 'leader', trophies: 6800, donationsGiven: 420, warFame: 1850, decksUsed: 16, lastSeenDays: 0 },
    { name: 'Bão Tố', tag: '#8LQ2R9CV', role: 'coLeader', trophies: 6500, donationsGiven: 380, warFame: 1620, decksUsed: 16, lastSeenDays: 1 },
    { name: 'Sấm Sét', tag: '#9YV3K2LP', role: 'elder', trophies: 6200, donationsGiven: 310, warFame: 1400, decksUsed: 14, lastSeenDays: 2 },
    { name: 'Tia Chớp', tag: '#P0Q8R7ST', role: 'member', trophies: 5900, donationsGiven: 260, warFame: 1180, decksUsed: 12, lastSeenDays: 3 },
    { name: 'Mặt Trăng', tag: '#L2M4N6P8', role: 'member', trophies: 5600, donationsGiven: 210, warFame: 950, decksUsed: 10, lastSeenDays: 5 },
    { name: 'Ngôi Sao', tag: '#R3S5T7V9', role: 'elder', trophies: 5400, donationsGiven: 180, warFame: 820, decksUsed: 9, lastSeenDays: 4 },
    { name: 'Hành Tinh', tag: '#W1X3Y5Z7', role: 'member', trophies: 5100, donationsGiven: 140, warFame: 640, decksUsed: 8, lastSeenDays: 7 },
    { name: 'Vì Sao', tag: '#A2B4C6D8', role: 'member', trophies: 4800, donationsGiven: 95, warFame: 480, decksUsed: 6, lastSeenDays: 10 },
    { name: 'Đại Dương', tag: '#E1F3G5H7', role: 'member', trophies: 4500, donationsGiven: 60, warFame: 320, decksUsed: 4, lastSeenDays: 14 },
    { name: 'Núi Lửa', tag: '#J2K4L6M8', role: 'member', trophies: 4200, donationsGiven: 30, warFame: 180, decksUsed: 2, lastSeenDays: 21 },
    { name: 'Sa Mạc', tag: '#N3P5Q7R9', role: 'member', trophies: 3900, donationsGiven: 10, warFame: 60, decksUsed: 1, lastSeenDays: 30 },
    { name: 'Băng Giá', tag: '#S4T6U8V0', role: 'member', trophies: 3600, donationsGiven: 0, warFame: 0, decksUsed: 0, lastSeenDays: 45 }
  ];

  window.ClanAnalytics = { DEMO_MEMBERS: DEMO_MEMBERS };
})();

  function evaluateMember(m) {
    var warScore = Math.min(100, (m.warFame / 1850) * 100);
    var donScore = Math.min(100, (m.donationsGiven / 420) * 100);
    var base = warScore * 0.6 + donScore * 0.4;
    var penalty = Math.min(40, m.lastSeenDays * 1.5);
    var efficiency = Math.max(0, Math.min(100, Math.round(base - penalty)));
    var status, recommendation;
    if (efficiency >= 70) { status = 'Tích cực'; recommendation = 'Thăng chức'; }
    else if (efficiency >= 40) { status = 'Cảnh báo'; recommendation = 'Nhắc nhở'; }
    else { status = 'Cần lọc'; recommendation = 'Kick'; }
    return {
      name: m.name, tag: m.tag, role: m.role,
      efficiency: efficiency, status: status, recommendation: recommendation
    };
  }

  function summarizeClan(members) {
    var list = members || DEMO_MEMBERS;
    var evaluated = list.map(evaluateMember);
    var total = evaluated.length;
    var avg = total ? Math.round(evaluated.reduce(function (s, e) { return s + e.efficiency; }, 0) / total) : 0;
    var counts = { 'Tích cực': 0, 'Cảnh báo': 0, 'Cần lọc': 0 };
    evaluated.forEach(function (e) { counts[e.status]++; });
    var kickList = evaluated.filter(function (e) { return e.recommendation === 'Kick'; });
    return {
      totalMembers: total,
      averageEfficiency: avg,
      statusCounts: counts,
      kickCandidates: kickList,
      members: evaluated
    };
  }

  window.ClanAnalytics.evaluateMember = evaluateMember;
  window.ClanAnalytics.summarizeClan = summarizeClan;
})();
