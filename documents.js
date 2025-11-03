// Vehicle data - Load from localStorage or start empty
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];

// Current vehicle index for upload/view/edit
let currentVehicleIndex = -1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date
    setTodayDate();
    
    // Generate table rows
    generateTableRows();
    
    // Add search event listener
    document.getElementById('search-input').addEventListener('input', searchVehicle);
    
    // Add file input event listeners
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    document.getElementById('camera-input').addEventListener('change', handleFileSelect);
});

// Set today's date in date input
function setTodayDate() {
    const dateInput = document.getElementById('date-input');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// Generate table rows
function generateTableRows() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    if (vehicles.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" style="padding: 40px; color: #999;">لا توجد سيارات. اضغط على "إضافة سيارة" لإضافة سيارة جديدة.</td>';
        tbody.appendChild(emptyRow);
        return;
    }
    
    vehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        
        // Check if document exists
        const hasDocument = localStorage.getItem(`vehicle-doc-${index}`) !== null;
        const buttonClass = hasDocument ? 'document-button' : 'document-button no-document';
        const buttonText = hasDocument ? '📄 عرض' : '📄 رفع';
        const buttonAction = hasDocument ? `viewDocument(${index})` : `openUploadModal(${index})`;
        
        row.innerHTML = `
            <td>${vehicle.type}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.plate}</td>
            <td>${vehicle.center}</td>
            <td>
                <button class="${buttonClass}" onclick="${buttonAction}">${buttonText}</button>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editVehicle(${index})" title="تعديل">✏️</button>
                <button class="action-btn delete-btn" onclick="confirmDeleteVehicle(${index})" title="حذف">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Open add vehicle modal
function openAddVehicleModal() {
    currentVehicleIndex = -1; // Reset for new vehicle
    document.getElementById('add-vehicle-modal').style.display = 'block';
    
    // Clear form
    document.getElementById('vehicle-type').value = '';
    document.getElementById('vehicle-model').value = '';
    document.getElementById('vehicle-plate').value = '';
    document.getElementById('vehicle-center').value = '';
}

// Close add vehicle modal
function closeAddVehicleModal() {
    document.getElementById('add-vehicle-modal').style.display = 'none';
    currentVehicleIndex = -1;
}

// Edit vehicle
function editVehicle(index) {
    currentVehicleIndex = index;
    const vehicle = vehicles[index];
    
    // Fill form with current data
    document.getElementById('vehicle-type').value = vehicle.type;
    document.getElementById('vehicle-model').value = vehicle.model;
    document.getElementById('vehicle-plate').value = vehicle.plate;
    document.getElementById('vehicle-center').value = vehicle.center;
    
    // Open modal
    document.getElementById('add-vehicle-modal').style.display = 'block';
}

// Save new or updated vehicle
function saveNewVehicle() {
    const type = document.getElementById('vehicle-type').value.trim();
    const model = document.getElementById('vehicle-model').value.trim();
    const plate = document.getElementById('vehicle-plate').value.trim();
    const center = document.getElementById('vehicle-center').value.trim();
    
    if (!type || !model || !plate || !center) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }
    
    if (currentVehicleIndex === -1) {
        // Add new vehicle
        vehicles.push({ type, model, plate, center });
    } else {
        // Update existing vehicle
        vehicles[currentVehicleIndex] = { type, model, plate, center };
    }
    
    // Save to localStorage
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    
    // Regenerate table
    generateTableRows();
    
    // Close modal
    closeAddVehicleModal();
}

// Confirm delete vehicle
function confirmDeleteVehicle(index) {
    if (confirm('هل أنت متأكد من حذف هذه السيارة؟ سيتم حذف الوثيقة المرفقة أيضاً.')) {
        deleteVehicle(index);
    }
}

// Delete vehicle
function deleteVehicle(index) {
    // Remove vehicle from array
    vehicles.splice(index, 1);
    
    // Remove document if exists
    localStorage.removeItem(`vehicle-doc-${index}`);
    
    // Reindex documents
    for (let i = index; i < vehicles.length; i++) {
        const doc = localStorage.getItem(`vehicle-doc-${i + 1}`);
        if (doc) {
            localStorage.setItem(`vehicle-doc-${i}`, doc);
            localStorage.removeItem(`vehicle-doc-${i + 1}`);
        }
    }
    
    // Save updated vehicles array
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    
    // Regenerate table
    generateTableRows();
}

// Search vehicle
function searchVehicle() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    const rows = document.querySelectorAll('#table-body tr');
    
    rows.forEach(row => {
        row.classList.remove('highlighted');
        
        if (searchTerm) {
            const plateCell = row.cells[2];
            if (plateCell && plateCell.textContent.toLowerCase().includes(searchTerm)) {
                row.classList.add('highlighted');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}

// Open upload action sheet (direct file picker)
function openUploadModal(index) {
    currentVehicleIndex = index;
    const vehicle = vehicles[index];
    
    // Show action sheet
    const actionSheet = document.createElement('div');
    actionSheet.className = 'action-sheet';
    actionSheet.innerHTML = `
        <div class="action-sheet-content">
            <div class="action-sheet-header">
                <span>${vehicle.type} - ${vehicle.model} - ${vehicle.plate}</span>
                <button class="close-sheet" onclick="closeActionSheet()">&times;</button>
            </div>
            <button class="action-sheet-option" onclick="selectFromGallery(); closeActionSheet();">
                📷 اختيار من المكتبة
            </button>
            <button class="action-sheet-option" onclick="capturePhoto(); closeActionSheet();">
                📸 التقاط صورة
            </button>
            <button class="action-sheet-option" onclick="selectFile(); closeActionSheet();">
                📁 رفع ملف
            </button>
        </div>
    `;
    
    document.body.appendChild(actionSheet);
    setTimeout(() => actionSheet.classList.add('show'), 10);
}

// Close action sheet
function closeActionSheet() {
    const actionSheet = document.querySelector('.action-sheet');
    if (actionSheet) {
        actionSheet.classList.remove('show');
        setTimeout(() => actionSheet.remove(), 300);
    }
}

// Close upload modal
function closeModal() {
    document.getElementById('upload-modal').style.display = 'none';
    currentVehicleIndex = -1;
}

// Select from gallery
function selectFromGallery() {
    document.getElementById('file-input').click();
}

// Capture photo
function capturePhoto() {
    document.getElementById('camera-input').click();
}

// Select file
function selectFile() {
    document.getElementById('file-input').click();
}

// Handle file select
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const docData = {
            type: file.type,
            data: e.target.result,
            name: file.name,
            uploadDate: new Date().toISOString()
        };
        
        // Save document
        localStorage.setItem(`vehicle-doc-${currentVehicleIndex}`, JSON.stringify(docData));
        
        // Regenerate table
        generateTableRows();
        
        // Close modal
        closeModal();
    };
    
    reader.readAsDataURL(file);
}

// View document
function viewDocument(index) {
    currentVehicleIndex = index;
    const vehicle = vehicles[index];
    const docData = JSON.parse(localStorage.getItem(`vehicle-doc-${index}`));
    
    if (!docData) {
        alert('لا توجد وثيقة لهذه السيارة');
        return;
    }
    
    document.getElementById('view-vehicle-info').textContent = 
        `${vehicle.type} - ${vehicle.model} - ${vehicle.plate}`;
    
    const viewer = document.getElementById('document-viewer');
    viewer.innerHTML = '';
    
    if (docData.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = docData.data;
        viewer.appendChild(img);
    } else if (docData.type === 'application/pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = docData.data;
        viewer.appendChild(iframe);
    }
    
    document.getElementById('view-modal').style.display = 'block';
}

// Close view modal
function closeViewModal() {
    document.getElementById('view-modal').style.display = 'none';
    currentVehicleIndex = -1;
}

// Download document
function downloadDocument() {
    const docData = JSON.parse(localStorage.getItem(`vehicle-doc-${currentVehicleIndex}`));
    if (!docData) return;
    
    const link = document.createElement('a');
    link.href = docData.data;
    link.download = docData.name;
    link.click();
}

// Delete document
function deleteDocument() {
    if (confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) {
        localStorage.removeItem(`vehicle-doc-${currentVehicleIndex}`);
        generateTableRows();
        closeViewModal();
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const uploadModal = document.getElementById('upload-modal');
    const viewModal = document.getElementById('view-modal');
    const addVehicleModal = document.getElementById('add-vehicle-modal');
    
    if (event.target === uploadModal) {
        closeModal();
    } else if (event.target === viewModal) {
        closeViewModal();
    } else if (event.target === addVehicleModal) {
        closeAddVehicleModal();
    }
};
