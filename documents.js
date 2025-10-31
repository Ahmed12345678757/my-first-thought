// Sample vehicle data (70+ vehicles)
const vehicles = [
    { type: 'هايلوكس', model: '2023', plate: 'أ ب ج 1234', center: 'الرياض' },
    { type: 'كامري', model: '2022', plate: 'د هـ و 5678', center: 'جدة' },
    { type: 'لاندكروزر', model: '2023', plate: 'ز ح ط 9012', center: 'الدمام' },
    { type: 'فورد', model: '2021', plate: 'ي ك ل 3456', center: 'مكة' },
    { type: 'نيسان', model: '2022', plate: 'م ن س 7890', center: 'المدينة' },
    { type: 'تويوتا', model: '2023', plate: 'ع ف ص 1122', center: 'الرياض' },
    { type: 'شيفروليه', model: '2021', plate: 'ق ر ش 3344', center: 'جدة' },
    { type: 'جي ام سي', model: '2022', plate: 'ت ث خ 5566', center: 'الدمام' },
    { type: 'هوندا', model: '2023', plate: 'ذ ض ظ 7788', center: 'مكة' },
    { type: 'مازدا', model: '2021', plate: 'غ أ ب 9900', center: 'المدينة' },
];

// Generate 70 vehicles
for (let i = vehicles.length; i < 70; i++) {
    const types = ['هايلوكس', 'كامري', 'لاندكروزر', 'فورد', 'نيسان', 'تويوتا', 'شيفروليه', 'جي ام سي', 'هوندا', 'مازدا'];
    const centers = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الطائف', 'تبوك', 'أبها', 'القصيم', 'حائل'];
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
    
    vehicles.push({
        type: types[Math.floor(Math.random() * types.length)],
        model: String(2020 + Math.floor(Math.random() * 4)),
        plate: `${letters[Math.floor(Math.random() * letters.length)]} ${letters[Math.floor(Math.random() * letters.length)]} ${letters[Math.floor(Math.random() * letters.length)]} ${Math.floor(1000 + Math.random() * 9000)}`,
        center: centers[Math.floor(Math.random() * centers.length)]
    });
}

// Current vehicle index for upload/view
let currentVehicleIndex = -1;

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

// Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateElement.textContent = now.toLocaleDateString('ar-SA', options);
}

// Generate table rows
function generateTableRows() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    vehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        row.id = `vehicle-row-${index}`;
        
        const hasDocument = localStorage.getItem(`vehicle-doc-${index}`) !== null;
        
        row.innerHTML = `
            <td>${vehicle.type}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.plate}</td>
            <td>${vehicle.center}</td>
            <td>
                <button class="document-button ${hasDocument ? '' : 'no-document'}" onclick="handleDocumentClick(${index})">
                    📄 ${hasDocument ? 'عرض' : 'رفع'}
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Search vehicle by plate number
function searchVehicle() {
    const searchTerm = document.getElementById('search-input').value.trim();
    
    // Remove all highlights
    document.querySelectorAll('.highlighted').forEach(row => {
        row.classList.remove('highlighted');
    });
    
    if (searchTerm === '') return;
    
    // Find matching vehicles
    vehicles.forEach((vehicle, index) => {
        if (vehicle.plate.includes(searchTerm)) {
            const row = document.getElementById(`vehicle-row-${index}`);
            row.classList.add('highlighted');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// Handle document button click
function handleDocumentClick(index) {
    currentVehicleIndex = index;
    const hasDocument = localStorage.getItem(`vehicle-doc-${index}`) !== null;
    
    if (hasDocument) {
        viewDocument(index);
    } else {
        openUploadModal(index);
    }
}

// Open upload modal
function openUploadModal(index) {
    const modal = document.getElementById('upload-modal');
    const vehicle = vehicles[index];
    const vehicleInfo = document.getElementById('modal-vehicle-info');
    
    vehicleInfo.textContent = `${vehicle.type} - ${vehicle.model} - ${vehicle.plate}`;
    modal.style.display = 'block';
}

// Close upload modal
function closeModal() {
    document.getElementById('upload-modal').style.display = 'none';
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
        // Save document to localStorage
        const docData = {
            type: file.type,
            data: e.target.result,
            name: file.name,
            uploadDate: new Date().toISOString()
        };
        
        localStorage.setItem(`vehicle-doc-${currentVehicleIndex}`, JSON.stringify(docData));
        
        // Close modal and refresh table
        closeModal();
        generateTableRows();
        
        // Show success message
        alert('تم رفع الوثيقة بنجاح!');
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
}

// View document
function viewDocument(index) {
    const docData = JSON.parse(localStorage.getItem(`vehicle-doc-${index}`));
    if (!docData) return;
    
    const modal = document.getElementById('view-modal');
    const vehicle = vehicles[index];
    const vehicleInfo = document.getElementById('view-vehicle-info');
    const viewer = document.getElementById('document-viewer');
    
    vehicleInfo.textContent = `${vehicle.type} - ${vehicle.model} - ${vehicle.plate}`;
    
    // Display document
    if (docData.type.startsWith('image/')) {
        viewer.innerHTML = `<img src="${docData.data}" alt="وثيقة السيارة">`;
    } else if (docData.type === 'application/pdf') {
        viewer.innerHTML = `<iframe src="${docData.data}"></iframe>`;
    } else {
        viewer.innerHTML = `<p>نوع الملف غير مدعوم</p>`;
    }
    
    modal.style.display = 'block';
    currentVehicleIndex = index;
}

// Close view modal
function closeViewModal() {
    document.getElementById('view-modal').style.display = 'none';
}

// Download document
function downloadDocument() {
    const docData = JSON.parse(localStorage.getItem(`vehicle-doc-${currentVehicleIndex}`));
    if (!docData) return;
    
    const vehicle = vehicles[currentVehicleIndex];
    const link = document.createElement('a');
    link.href = docData.data;
    link.download = `وثيقة_${vehicle.plate.replace(/ /g, '_')}_${docData.name}`;
    link.click();
}

// Delete document
function deleteDocument() {
    if (!confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) return;
    
    localStorage.removeItem(`vehicle-doc-${currentVehicleIndex}`);
    closeViewModal();
    generateTableRows();
    
    alert('تم حذف الوثيقة بنجاح!');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const uploadModal = document.getElementById('upload-modal');
    const viewModal = document.getElementById('view-modal');
    
    if (event.target === uploadModal) {
        closeModal();
    }
    if (event.target === viewModal) {
        closeViewModal();
    }
};
