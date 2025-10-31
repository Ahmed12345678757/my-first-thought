// Vehicle data - Load from localStorage or start empty
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];

// Current vehicle index for upload/view
let currentVehicleIndex = -1;

// Calendar type (gregorian or hijri)
let currentCalendar = 'gregorian';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Display current date
    displayCurrentDate();
    
    // Generate table rows
    generateTableRows();
    
    // Add search event listener
    document.getElementById('search-input').addEventListener('input', searchVehicle);
    
    // Add file input event listeners
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    document.getElementById('camera-input').addEventListener('change', handleFileSelect);
});

// Toggle calendar type
function toggleCalendar(type) {
    currentCalendar = type;
    
    // Update button states
    document.getElementById('gregorian-btn').classList.toggle('active', type === 'gregorian');
    document.getElementById('hijri-btn').classList.toggle('active', type === 'hijri');
    
    // Update date display
    displayCurrentDate();
}

// Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    
    if (currentCalendar === 'gregorian') {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('ar-SA', options);
    } else {
        // Hijri date (approximate conversion)
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(now);
        dateElement.textContent = hijriDate;
    }
}

// Generate table rows
function generateTableRows() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    if (vehicles.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" style="padding: 40px; color: #999;">لا توجد سيارات. اضغط على "إضافة سيارة" لإضافة سيارة جديدة.</td>';
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
        `;
        
        tbody.appendChild(row);
    });
}

// Open add vehicle modal
function openAddVehicleModal() {
    document.getElementById('add-vehicle-modal').style.display = 'block';
}

// Close add vehicle modal
function closeAddVehicleModal() {
    document.getElementById('add-vehicle-modal').style.display = 'none';
    // Clear form
    document.getElementById('vehicle-type').value = '';
    document.getElementById('vehicle-model').value = '';
    document.getElementById('vehicle-plate').value = '';
    document.getElementById('vehicle-center').value = '';
}

// Save new vehicle
function saveNewVehicle() {
    const type = document.getElementById('vehicle-type').value.trim();
    const model = document.getElementById('vehicle-model').value.trim();
    const plate = document.getElementById('vehicle-plate').value.trim();
    const center = document.getElementById('vehicle-center').value.trim();
    
    if (!type || !model || !plate || !center) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }
    
    // Add new vehicle
    vehicles.push({ type, model, plate, center });
    
    // Save to localStorage
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    
    // Regenerate table
    generateTableRows();
    
    // Close modal
    closeAddVehicleModal();
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

// Open upload modal
function openUploadModal(index) {
    currentVehicleIndex = index;
    const vehicle = vehicles[index];
    
    document.getElementById('modal-vehicle-info').textContent = 
        `${vehicle.type} - ${vehicle.model} - ${vehicle.plate}`;
    
    document.getElementById('upload-modal').style.display = 'block';
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
