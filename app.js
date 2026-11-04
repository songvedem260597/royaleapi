// Sample Vietnamese Clan Data
const sampleClanData = [
    { name: "Player1", role: "Leader", trophies: 4500, donationsGiven: 120, donationsReceived: 45, warFame: 2500, decks: 8, lastSeen: 0, tag: "#PLAYER1" },
    { name: "Player2", role: "Co-leader", trophies: 4200, donationsGiven: 95, donationsReceived: 38, warFame: 2200, decks: 7, lastSeen: 1, tag: "#PLAYER2" },
    { name: "Player3", role: "Elder", trophies: 3800, donationsGiven: 80, donationsReceived: 32, warFame: 1800, decks: 6, lastSeen: 2, tag: "#PLAYER3" },
    { name: "Player4", role: "Member", trophies: 3500, donationsGiven: 65, donationsReceived: 28, warFame: 1500, decks: 5, lastSeen: 3, tag: "#PLAYER4" },
    { name: "Player5", role: "Member", trophies: 3200, donationsGiven: 50, donationsReceived: 25, warFame: 1200, decks: 4, lastSeen: 4, tag: "#PLAYER5" },
    { name: "Player6", role: "Member", trophies: 2800, donationsGiven: 40, donationsReceived: 22, warFame: 800, decks: 3, lastSeen: 5, tag: "#PLAYER6" },
    { name: "Player7", role: "Member", trophies: 2500, donationsGiven: 35, donationsReceived: 20, warFame: 600, decks: 3, lastSeen: 6, tag: "#PLAYER7" },
    { name: "Player8", role: "Member", trophies: 2200, donationsGiven: 30, donationsReceived: 18, warFame: 400, decks: 2, lastSeen: 7, tag: "#PLAYER8" },
    { name: "Player9", role: "Member", trophies: 2000, donationsGiven: 25, donationsReceived: 15, warFame: 300, decks: 2, lastSeen: 8, tag: "#PLAYER9" },
    { name: "Player10", role: "Member", trophies: 1800, donationsGiven: 20, donationsReceived: 12, warFame: 200, decks: 1, lastSeen: 9, tag: "#PLAYER10" },
    { name: "Player11", role: "Member", trophies: 1600, donationsGiven: 18, donationsReceived: 10, warFame: 150, decks: 1, lastSeen: 10, tag: "#PLAYER11" },
    { name: "Player12", role: "Member", trophies: 1400, donationsGiven: 15, donationsReceived: 8, warFame: 100, decks: 1, lastSeen: 11, tag: "#PLAYER12" },
    { name: "Player13", role: "Member", trophies: 1200, donationsGiven: 12, donationsReceived: 7, warFame: 80, decks: 1, lastSeen: 12, tag: "#PLAYER13" },
    { name: "Player14", role: "Member", trophies: 1000, donationsGiven: 10, donationsReceived: 6, warFame: 60, decks: 1, lastSeen: 13, tag: "#PLAYER14" },
    { name: "Player15", role: "Member", trophies: 800, donationsGiven: 8, donationsReceived: 5, warFame: 40, decks: 1, lastSeen: 14, tag: "#PLAYER15" }
];

let currentData = [];
let sortDirection = { column: null, ascending: true };

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
        showSuccess(`Đã kick ${member.name} (chỉ xóa khỏi danh sách local)");
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
    setTimeout(() => showError(''), 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.toggle('hidden', !message);
    setTimeout(() => showSuccess(''), 3000);
}

function getCurrentClanTag() {
    return document.getElementById('clanTagInput').value.trim();
}

// Initialize with sample data on page load
window.addEventListener('load', () => {
    loadVietnameseClan();
});