/* app.js - Bento Dashboard Controller cho Clan WinterTime (#GYQJL9GV) */
(function () {
  'use strict';
  const CA = window.ClanAnalytics;
  if (!CA) { console.error('ClanAnalytics chưa nạp'); return; }

  const CLAN_TAG = '#GYQJL9GV';
  const CLAN_NAME = '❄️ WinterTime';
  const API_BASE = '/api/royale-proxy/clans/' + encodeURIComponent(CLAN_TAG);

  let members = [];
  let filtered = [];
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('vi-VN'));
  const scoreOf = (m) => (m.efficiency != null ? m.efficiency : CA.evaluateMember(m));

  function statusOf(score) {
    if (score >= 70) return { cls: 'badge-good', key: 'good', label: 'Tốt', reason: 'Đóng góp tốt, duy trì phong độ' };
    if (score >= 40) return { cls: 'badge-warning', key: 'warning', label: 'Cảnh báo', reason: 'Cần cải thiện donate/war fame' };
    return { cls: 'badge-kick', key: 'kick', label: 'Lọc', reason: 'Hiệu suất thấp, ít hoạt động' };
  }

  function notify(msg, type) {
    const el = $('app-toast') || $('toast');
    if (el) { el.textContent = msg; el.className = 'toast show ' + (type || 'info'); setTimeout(() => { el.className = 'toast'; }, 3500); }
    else console.log('[WinterTime]', msg);
  }

  function normalize(raw) {
    const list = (raw && (raw.items || raw.members)) || [];
    return list.map((m) => ({
      tag: m.tag || '', name: m.name || '', role: m.role || 'member',
      level: m.expLevel != null ? m.expLevel : m.level,
      trophies: m.trophies || 0, donations: m.donations || 0,
      warFame: m.warFame != null ? m.warFame : (m.fame || 0),
      daysOffline: m.daysOffline != null ? m.daysOffline : (m.lastSeen != null ? m.lastSeen : null),
      efficiency: m.efficiency != null ? m.efficiency : null
    }));
  }

  function loadDemo(reason) {
    try {
      const demo = CA.generateDemoClan ? CA.generateDemoClan() : null;
      members = normalize(demo);
      if (!members.length) members = normalize({ items: [] });
      notify('Đang dùng dữ liệu chuẩn WinterTime' + (reason ? ' (' + reason + ')' : ''), 'info');
    } catch (e) { console.error(e); members = []; }
    applyFilters();
  }
