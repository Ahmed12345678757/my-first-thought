// Get inspection ID from URL
const urlParams = new URLSearchParams(window.location.search);
const inspectionId = urlParams.get('id');

// Signature canvas
let canvas, ctx;
let isDrawing = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date
    const dateInput = document.getElementById('date-input');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Load inspection data
    loadInspectionData();
    
    // Initialize signature canvas
    initSignatureCanvas();
});

// Load inspection data
function loadInspectionData() {
    if (!inspectionId) {
        alert('لم يتم تحديد رقم الفحص');
        window.location.href = 'inspection-search.html';
        return;
    }
    
    const inspections = JSON.parse(localStorage.getItem('inspections') || '[]');
    const inspection = inspections.find(i => i.id === inspectionId);
    
    if (!inspection) {
        alert('لم يتم العثور على بيانات الفحص');
        window.location.href = 'inspection-search.html';
        return;
    }
    
    // Display vehicle info
    const vehicleInfo = document.getElementById('vehicle-info');
    vehicleInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">رقم الاستلام:</span>
            <span class="info-value">${inspection.receiptNumber || '-'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">تاريخ الفحص:</span>
            <span class="info-value">${inspection.date || '-'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">رقم اللوحة:</span>
            <span class="info-value">${inspection.plateNumber || '-'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">نوع السيارة:</span>
            <span class="info-value">${inspection.vehicleType || '-'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">المسلم:</span>
            <span class="info-value">${inspection.deliverer || '-'}</span>
        </div>
    `;
    
    // Load receiver data if exists
    if (inspection.receiver) {
        document.getElementById('receiver-name').value = inspection.receiver.name || '';
        document.getElementById('receiver-notes').value = inspection.receiver.notes || '';
        
        if (inspection.receiver.signature) {
            loadSignature(inspection.receiver.signature);
        }
    }
}

// Initialize signature canvas
function initSignatureCanvas() {
    canvas = document.getElementById('signature-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loadSignature(dataUrl) {
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
}

// Save receiver data
function saveReceiver() {
    const receiverName = document.getElementById('receiver-name').value.trim();
    const receiverNotes = document.getElementById('receiver-notes').value.trim();
    
    if (!receiverName) {
        alert('الرجاء إدخال اسم المستلم');
        return;
    }
    
    // Get signature
    const signatureData = canvas.toDataURL();
    
    // Load inspections
    let inspections = JSON.parse(localStorage.getItem('inspections') || '[]');
    const index = inspections.findIndex(i => i.id === inspectionId);
    
    if (index === -1) {
        alert('حدث خطأ في حفظ البيانات');
        return;
    }
    
    // Update inspection with receiver data
    inspections[index].receiver = {
        name: receiverName,
        notes: receiverNotes,
        signature: signatureData,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Save to localStorage
    localStorage.setItem('inspections', JSON.stringify(inspections));
    
    alert('تم حفظ بيانات المستلم بنجاح');
}

// Generate PDF
function generatePDF() {
    alert('سيتم إضافة وظيفة تصدير PDF قريباً');
}

// Go back
function goBack() {
    window.location.href = 'inspection-search.html';
}
