// Load all records on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAllRecords();
    updateStatistics();
    
    // Real-time search
    document.getElementById('search-plate').addEventListener('input', function() {
        filterRecords();
    });
});

// Load all inspection records
function loadAllRecords() {
    const allRecords = getAllRecords();
    displayRecords(allRecords);
}

// Get all records from localStorage
function getAllRecords() {
    const records = [];
    
    // Get from inspections array
    const inspections = JSON.parse(localStorage.getItem('inspections')) || [];
    inspections.forEach((record, index) => {
        records.push({
            key: `inspection_${index}`,
            timestamp: new Date(record.date || Date.now()).getTime(),
            data: record
        });
    });
    
    // Get from individual inspection_ keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('inspection_') && key !== 'inspections') {
            try {
                const record = JSON.parse(localStorage.getItem(key));
                const timestamp = parseInt(key.replace('inspection_', ''));
                records.push({
                    key: key,
                    timestamp: timestamp,
                    data: record
                });
            } catch (e) {
                console.error('Error parsing record:', e);
            }
        }
    }
    
    // Sort by timestamp (newest first)
    records.sort((a, b) => b.timestamp - a.timestamp);
    
    return records;
}

// Display records
function displayRecords(records) {
    const container = document.getElementById('records-container');
    const emptyState = document.getElementById('empty-state');
    
    if (records.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = records.map(record => createRecordCard(record)).join('');
}

// Create record card HTML
function createRecordCard(record) {
    const data = record.data;
    const date = new Date(record.timestamp);
    const dateStr = date.toLocaleDateString('ar-SA');
    const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="record-card">
            <div class="record-header">
                <div class="record-plate">🚗 ${data.plateNumber || 'غير محدد'}</div>
                <div class="record-date">${dateStr}<br>${timeStr}</div>
            </div>
            <div class="record-info">
                <div class="record-info-item">
                    <span class="record-info-label">الإدارة:</span>
                    <span class="record-info-value">${data.department || 'غير محدد'}</span>
                </div>
                <div class="record-info-item">
                    <span class="record-info-label">النوع:</span>
                    <span class="record-info-value">${data.carType || 'غير محدد'}</span>
                </div>
                <div class="record-info-item">
                    <span class="record-info-label">رقم العداد:</span>
                    <span class="record-info-value">${data.meterNumber || 'غير محدد'}</span>
                </div>
                <div class="record-info-item">
                    <span class="record-info-label">المستلم:</span>
                    <span class="record-info-value">${data.receiverName || 'غير محدد'}</span>
                </div>
            </div>
            <div class="record-actions">
                <button class="record-btn btn-view" onclick="viewRecord('${record.key}')">👁️ عرض</button>
                <button class="record-btn btn-delete" onclick="deleteRecord('${record.key}')">🗑️ حذف</button>
            </div>
        </div>
    `;
}

// Filter records
function filterRecords() {
    const searchPlate = document.getElementById('search-plate').value.toLowerCase();
    const fromDate = document.getElementById('filter-from').value;
    const toDate = document.getElementById('filter-to').value;
    
    let records = getAllRecords();
    
    // Filter by plate number
    if (searchPlate) {
        records = records.filter(record => 
            (record.data.plateNumber || '').toLowerCase().includes(searchPlate)
        );
    }
    
    // Filter by date range
    if (fromDate) {
        const fromTimestamp = new Date(fromDate).getTime();
        records = records.filter(record => record.timestamp >= fromTimestamp);
    }
    
    if (toDate) {
        const toTimestamp = new Date(toDate).getTime() + (24 * 60 * 60 * 1000);
        records = records.filter(record => record.timestamp <= toTimestamp);
    }
    
    displayRecords(records);
}

// Clear filters
function clearFilters() {
    document.getElementById('search-plate').value = '';
    document.getElementById('filter-from').value = '';
    document.getElementById('filter-to').value = '';
    loadAllRecords();
}

// Update statistics
function updateStatistics() {
    const records = getAllRecords();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const todayCount = records.filter(r => r.timestamp >= oneDayAgo).length;
    const weekCount = records.filter(r => r.timestamp >= oneWeekAgo).length;
    
    document.getElementById('total-count').textContent = records.length;
    document.getElementById('today-count').textContent = todayCount;
    document.getElementById('week-count').textContent = weekCount;
}

// View record
function viewRecord(key) {
    try {
        const record = JSON.parse(localStorage.getItem(key));
        if (!record) {
            alert('لم يتم العثور على السجل');
            return;
        }
        
        // Save to temporary storage for viewing
        localStorage.setItem('viewRecord', JSON.stringify(record));
        
        // Go to inspection page
        window.location.href = 'inspection-new.html?view=true';
    } catch (e) {
        console.error('Error loading record:', e);
        alert('حدث خطأ أثناء تحميل السجل');
    }
}

// Delete record
function deleteRecord(key) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        try {
            localStorage.removeItem(key);
            
            // Also remove from inspections array if exists
            const inspections = JSON.parse(localStorage.getItem('inspections')) || [];
            const index = parseInt(key.replace('inspection_', ''));
            if (inspections[index]) {
                inspections.splice(index, 1);
                localStorage.setItem('inspections', JSON.stringify(inspections));
            }
            
            alert('تم حذف السجل بنجاح');
            loadAllRecords();
            updateStatistics();
        } catch (e) {
            console.error('Error deleting record:', e);
            alert('حدث خطأ أثناء حذف السجل');
        }
    }
}
