// Search records
function searchRecords() {
    const plateSearch = document.getElementById('plate-search').value.trim();
    
    // Get all inspections from localStorage
    const inspections = JSON.parse(localStorage.getItem('inspections') || '[]');
    
    let filtered;
    
    if (plateSearch) {
        // Search by plate number
        filtered = inspections.filter(inspection => {
            const plateNumber = (inspection.plateNumber || '').toLowerCase();
            return plateNumber.includes(plateSearch.toLowerCase());
        });
    } else {
        // Show all if no search term
        filtered = inspections;
    }
    
    displayResults(filtered);
}

// Display search results
function displayResults(inspections) {
    const resultsSection = document.getElementById('results-section');
    const noResults = document.getElementById('no-results');
    const tbody = document.getElementById('results-tbody');
    const summary = document.getElementById('results-summary');
    
    if (inspections.length === 0) {
        resultsSection.style.display = 'none';
        noResults.style.display = 'flex';
        return;
    }
    
    noResults.style.display = 'none';
    resultsSection.style.display = 'block';
    
    summary.textContent = `تم العثور على ${inspections.length} سجل فحص`;
    
    tbody.innerHTML = '';
    
    inspections.forEach((inspection, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${inspection.receiptNumber || '-'}</td>
            <td>${inspection.date || '-'}</td>
            <td>${inspection.receiver || '-'}</td>
            <td>${inspection.plateNumber || '-'}</td>
            <td>${inspection.vehicleType || '-'}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewInspection('${inspection.id}')" title="عرض">
                    👁️
                </button>
                <button class="action-btn proceed-btn" onclick="proceedToReceiver('${inspection.id}')" title="إجراء">
                    ➡️
                </button>
                <button class="action-btn delete-btn" onclick="deleteInspection('${inspection.id}')" title="حذف">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View inspection details
function viewInspection(id) {
    // Open inspection-new.html with the inspection ID
    window.location.href = `inspection-new.html?id=${id}&mode=view`;
}

// Proceed to receiver page
function proceedToReceiver(id) {
    // Save current inspection ID and redirect to receiver page
    localStorage.setItem('currentInspectionId', id);
    window.location.href = `receiver.html?id=${id}`;
}

// Delete inspection
function deleteInspection(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        return;
    }
    
    let inspections = JSON.parse(localStorage.getItem('inspections') || '[]');
    inspections = inspections.filter(inspection => inspection.id !== id);
    localStorage.setItem('inspections', JSON.stringify(inspections));
    
    // Refresh search results
    searchRecords();
    
    alert('تم حذف السجل بنجاح');
}
