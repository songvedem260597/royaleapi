// Sample Vietnamese Clan Data
const sampleClanData = [
    { name: "Rồng Lửa VN", role: "Leader", trophies: 8950, donationsGiven: 840, donationsReceived: 320, warFame: 3200, decks: 16, lastSeen: 0, tag: "#9UL82PV" },
    { name: "Sát Thủ Đêm", role: "Co-leader", trophies: 8620, donationsGiven: 710, donationsReceived: 290, warFame: 2950, decks: 16, lastSeen: 0, tag: "#28J9Q0L" },
    { name: "Hoàng Tử Bang", role: "Co-leader", trophies: 8410, donationsGiven: 620, donationsReceived: 250, warFame: 2800, decks: 15, lastSeen: 1, tag: "#8V2KP9R" },
    { name: "Pháp Sư Tối Thượng", role: "Elder", trophies: 8100, donationsGiven: 540, donationsReceived: 310, warFame: 2450, decks: 14, lastSeen: 1, tag: "#LQ902RC" },
    { name: "Chiến Binh Thép", role: "Elder", trophies: 7850, donationsGiven: 460, donationsReceived: 280, warFame: 2200, decks: 13, lastSeen: 1, tag: "#3X7K9M2" },
    { name: "Ninja Ánh Sáng", role: "Member", trophies: 7600, donationsGiven: 380, donationsReceived: 240, warFame: 2000, decks: 12, lastSeen: 2, tag: "#5N4R8T1" },
    { name: "Vua Săn Mồi", role: "Member", trophies: 7350, donationsGiven: 320, donationsReceived: 200, warFame: 1800, decks: 12, lastSeen: 2, tag: "#7P9Q2W5" },
    { name: "Hiệp Sĩ Bóng Đêm", role: "Member", trophies: 7100, donationsGiven: 290, donationsReceived: 180, warFame: 1650, decks: 11, lastSeen: 3, tag: "#9B6D4F3" },
    { name: "Thợ Săn Quái Vật", role: "Member", trophies: 6850, donationsGiven: 250, donationsReceived: 170, warFame: 1500, decks: 11, lastSeen: 3, tag: "#2H8J6K7" },
    { name: "Cung Thủ Tinh Anh", role: "Member", trophies: 6600, donationsGiven: 220, donationsReceived: 150, warFame: 1350, decks: 10, lastSeen: 4, tag: "#4L3M9N8" },
    { name: "Tàn Quân", role: "Member", trophies: 6350, donationsGiven: 190, donationsReceived: 130, warFame: 1200, decks: 10, lastSeen: 4, tag: "#6O5P1Q9" },
    { name: "Sát Thủ Im Lặng", role: "Member", trophies: 6100, donationsGiven: 170, donationsReceived: 120, warFame: 1100, decks: 9, lastSeen: 5, tag: "#8R2S3T6" },
    { name: "Vệ Thần", role: "Member", trophies: 5850, donationsGiven: 150, donationsReceived: 110, warFame: 1000, decks: 9, lastSeen: 5, tag: "#1U4V7W9" },
    { name: "Hủy Diệt", role: "Member", trophies: 5600, donationsGiven: 130, donationsReceived: 100, warFame: 900, decks: 8, lastSeen: 6, tag: "#3X5Y7Z0" },
    { name: "Bão Tố", role: "Member", trophies: 5350, donationsGiven: 110, donationsReceived: 90, warFame: 800, decks: 8, lastSeen: 6, tag: "#5A8B2C4" }
];

let currentData = [];
let sortDirection = { column: null, ascending: true };

// Load Vietnamese sample data
function loadVietnameseClan() {
    currentData = sampleClanData.map(member => ({
        ...member,
        effectiveness: calculateEffectiveness(member.warFame, member.donationsGiven, member.donationsReceived, member.lastSeen),
        status: determineStatus(calculateEffectiveness(member.warFame, member.donationsGiven, member.donationsReceived, member.lastSeen), member.lastSeen, member.warFame)
    }));
    updateUI();
    showSuccess("Đã tải dữ liệu mẫu VN thành công!");
}

// Calculate effectiveness score
function calculateEffectiveness(warFame, donationsGiven, donationsReceived, lastSeen) {
    const baseScore = warFame * 0.3 + donationsGiven * 0.4 + donationsReceived * 0.2;
    const penalty = lastSeen > 0 ? Math.min(lastSeen * 2, 20) : 0;
    return Math.max(0, Math.min(100, Math.round(baseScore - penalty)));
}

// Determine status
function determineStatus(effectiveness, lastSeen, warFame) {
    if (lastSeen >= 5 && warFame === 0) return "Cần Kick";
    if (effectiveness >= 70) return "Tốt";
    if (effectiveness >= 40) return "Cảnh Báo";
    return "Cần Kick";
}

// Load clan data from API or use sample data
async function loadClanData() {
    const clanTagInput = document.getElementById('clanTagInput').value.trim();
    const apiToken = document.getElementById('apiTokenInput').value.trim();
    
    if (!clanTagInput || !apiToken) {
        showError("Vui lòng nhập Clan Tag và API Token");
        return;
    }
    
    showLoading(true);
    showError("");
    
    try {
        // Try to load from API
        const response = await fetch(`/api/royale-proxy/clans/${clanTagInput}`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('API call failed');
        }
        
        const data = await response.json();
        currentData = data.members || [];
        showSuccess("Đã tải dữ liệu từ API thành công!");
        
    } catch (error) {
        console.error('API error:', error);
        // Fallback to sample data
        currentData = sampleClanData.map(member => ({
            ...member,
            effectiveness: calculateEffectiveness(member.warFame, member.donationsGiven, member.donationsReceived, member.lastSeen),
            status: determineStatus(calculateEffectiveness(member.warFame, member.donationsGiven, member.donationsReceived, member.lastSeen), member.lastSeen, member.warFame)
        }));
        showSuccess("Đã sử dụng dữ liệu mẫu (API không khả dụng)");
    }
    
    showLoading(false);
    updateUI();
}

// Load Vietnamese sample data
function loadVietnameseClan() {
    currentData = sampleClanData.map(member => ({
        ...member,
        effectiveness: calculateEffectiveness(member.warFame, member.donationsGiven, member.donationsReceived, member.lastSeen),
        status: determineStatus(calculateEffectiveness(member.warFame, member.donationsGiven, member.donationsReceived, member.lastSeen), member.lastSeen, member.warFame)
    }));
    updateUI();
    showSuccess("Đã tải dữ liệu mẫu VN thành công!");
}

// Update UI with current data
function updateUI() {
    updateKPI();
    renderMemberTable();
    applyFilters();
}

// Update KPI cards
function updateKPI() {
    const totalMembers = currentData.length;
    const avgTrophies = currentData.reduce((sum, m) => sum + m.trophies, 0) / totalMembers || 0;
    const weeklyDonations = currentData.reduce((sum, m) => sum + m.donationsGiven, 0) / 4; // approximate weekly
    const warningCount = currentData.filter(m => m.status !== "Tốt").length;
    
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('avgTrophies').textContent = Math.round(avgTrophies);
    document.getElementById('weeklyDonations').textContent = Math.round(weeklyDonations);
    document.getElementById('warningCount').textContent = warningCount;
}

// Render member table
function renderMemberTable() {
    const tbody = document.getElementById('memberTableBody');
    tbody.innerHTML = '';
    
    currentData.forEach((member, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="https://via.placeholder.com/40" class="member-avatar" alt="Avatar">
                    <span class="member-name">${member.name}</span>
                </div>
            </td>
            <td><span class="member-role role-${member.role.toLowerCase()}">${member.role}</span></td>
            <td>${member.trophies}</td>
            <td>${member.donationsGiven}</td>
            <td>${member.donationsReceived}</td>
            <td>${member.warFame}</td>
            <td>${member.decks}</td>
            <td>${member.lastSeen > 0 ? member.lastSeen + ' ngày' : 'Hôm nay'}</td>
            <td>
                <div class="status-badges">
                    <span class="badge ${getStatusClass(member.status)}">${member.status}</span>
                </div>
            </td>
            <td>${member.effectiveness}</td>
            <td>
                <button class="kick-btn" onclick="kickMember(${index})" ${member.role === 'Leader' ? 'disabled' : ''}>Kick</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get status badge class
function getStatusClass(status) {
    switch(status) {
        case 'Tốt': return 'tích-cực';
        case 'Cảnh Báo': return 'cảnh-báo';
        case 'Cần Kick': return 'cần-cảnh-cáo';
        default: return 'tích-cực';
    }
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    const minTrophies = parseInt(document.getElementById('minTrophies').value) || 0;
    
    let filteredData = currentData.filter(member => {
        if (statusFilter !== 'all' && member.status !== statusFilter) return false;
        if (member.trophies < minTrophies) return false;
        return true;
    });
    
    // Sort
    filteredData.sort((a, b) => {
        if (sortBy === 'trophies') {
            return a.trophies - b.trophies;
        } else if (sortBy === 'donations') {
            return a.donationsGiven - b.donationsGiven;
        } else if (sortBy === 'warFame') {
            return a.warFame - b.warFame;
        } else if (sortBy === 'lastSeen') {
            return a.lastSeen - b.lastSeen;
        }
        return 0;
    });
    
    // Update current data with filtered and sorted data
    currentData = filteredData;
    renderMemberTable();
}

// Sort table
function sortTable(column) {
    if (sortDirection.column === column) {
        sortDirection.ascending = !sortDirection.ascending;
    } else {
        sortDirection.column = column;
        sortDirection.ascending = true;
    }
    
    currentData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (sortDirection.ascending) {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
    
    renderMemberTable();
}

// Kick member
async function kickMember(index) {
    const member = currentData[index];
    if (member.role === 'Leader') {
        showError("Không thể kick Leader clan!");
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn kick ${member.name}?`)) return;
    
    try {
        // Try to call API to kick member
        const response = await fetch(`/api/royale-proxy/clans/${getCurrentClanTag()}/members/${member.tag}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${document.getElementById('apiTokenInput').value}`
            }
        });
        
        if (response.ok) {
            showSuccess(`Đã kick ${member.name} thành công!`);
            currentData.splice(index, 1);
            updateUI();
        } else {
            throw new Error('API call failed');
        }
        
    } catch (error) {
        console.error('Kick error:', error);
        // Remove from local data
        currentData.splice(index, 1);
        updateUI();
        showSuccess(`Đã kick ${member.name} (chỉ xóa khỏi danh sách local)`);
    }
}

// Export kick list
function exportKickList() {
    const kickList = currentData.filter(m => m.status === 'Cần Kick' || m.status === 'Cảnh Báo');
    const csvContent = 'name,tag,role,trophies,donationsGiven,donationsReceived,warFame,lastSeen,status,effectiveness\n' +
        kickList.map(m => `${m.name},${m.tag},${m.role},${m.trophies},${m.donationsGiven},${m.donationsReceived},${m.warFame},${m.lastSeen},${m.status},${m.effectiveness}`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kick-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess("Đã xuất danh sách kick thành công!");
}

// Copy clan tags
function copyClanTags() {
    const tags = currentData.map(m => m.tag).join('\n');
    navigator.clipboard.writeText(tags).then(() => {
        showSuccess("Đã copy tất cả clan tags!");
    }).catch(err => {
        console.error('Copy failed:', err);
        showError("Không thể copy clan tags");
    });
}

// Helper functions
function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.toggle('hidden', !message);
    if (message) setTimeout(() => showError(''), 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.toggle('hidden', !message);
    if (message) setTimeout(() => showSuccess(''), 3000);
}

function getCurrentClanTag() {
    return document.getElementById('clanTagInput').value.trim();
}

// Initialize with sample data on page load
window.addEventListener('load', () => {
    loadVietnameseClan();
});