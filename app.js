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
      notify('Đang dùng dữ liệu chuẩn WinterTime' + (reason ? ' (' + reason + ')' : ''), 'info');
    } catch (e) { console.error(e); members = []; }
    applyFilters();
  }

  async function fetchClan() {
    const tokenEl = $('api-token-input');
    const token = tokenEl ? tokenEl.value.trim() : '';
    if (!token) { loadDemo('chưa có token'); return; }
    try {
      const res = await fetch(API_BASE, { headers: { 'x-royale-token': token, 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      members = normalize(data);
      if (!members.length) throw new Error('empty');
      notify('Đã tải dữ liệu WinterTime từ API', 'success');
      applyFilters();
    } catch (e) {
      console.warn('Fetch lỗi:', e);
      loadDemo('lỗi mạng/API');
    }
  }

  function applyFilters() {
    const q = ($('search-member') ? $('search-member').value : '').trim().toLowerCase();
    const status = $('filter-status') ? $('filter-status').value : 'all';
    const sortBy = $('sort-by') ? $('sort-by').value : 'score';
    filtered = members.filter((m) => {
      const s = scoreOf(m);
      const st = statusOf(s).key;
      if (status !== 'all' && st !== status) return false;
      if (!q) return true;
      return (m.name || '').toLowerCase().includes(q) || (m.tag || '').toLowerCase().includes(q);
    });
    filtered.sort((a, b) => {
      if (sortBy === 'trophies') return (b.trophies || 0) - (a.trophies || 0);
      if (sortBy === 'donations') return (b.donations || 0) - (a.donations || 0);
      return scoreOf(b) - scoreOf(a);
    });
    const stats = updateKPI(filtered);
    renderHero(filtered, stats);
    renderTable(filtered);
  }
