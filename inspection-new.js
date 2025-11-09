// Inspection items list
const inspectionItems = [
    'الهيكل الخارجي',
    'الإطارات الأمامية',
    'الإطارات الخلفية',
    'الزجاج الأمامي',
    'الزجاج الجانبي',
    'المرايا',
    'المصابيح الأمامية',
    'المصابيح الخلفية',
    'نظام الفرامل',
    'المحرك',
    'ناقل الحركة',
    'أجهزة الاتصال',
    'الإطارات الاحتياطية',
    'النقالة الطبية',
    'شريحة البنزين'
];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inspection-date').value = today;
    
    // Generate inspection table rows
    generateInspectionTable();
    
    // Initialize car diagram drawing canvas
    initializeCarDiagramDrawing();
    
    // Initialize signature canvases
    initializeSignature('submitter-signature');
    initializeSignature('receiver-signature');
    
    // Load saved data if exists
    loadSavedData();
});

// Generate inspection table
function generateInspectionTable() {
    const tbody = document.getElementById('inspection-tbody');
    tbody.innerHTML = '';
    
    inspectionItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item}</td>
            <td>
                <span class="indicator" data-type="healthy" data-index="${index}" onclick="toggleIndicator(this)"></span>
            </td>
            <td>
                <span class="indicator" data-type="unhealthy" data-index="${index}" onclick="toggleIndicator(this)"></span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Toggle indicator (healthy/unhealthy)
function toggleIndicator(element) {
    const type = element.getAttribute('data-type');
    const index = element.getAttribute('data-index');
    
    // Check if this indicator is already active
    const isActive = element.classList.contains(type);
    
    // Remove active class from both indicators in this row
    const row = element.closest('tr');
    const indicators = row.querySelectorAll('.indicator');
    indicators.forEach(ind => ind.classList.remove('healthy', 'unhealthy'));
    
    // If it wasn't active, add the class (toggle on)
    // If it was active, leave it off (toggle off)
    if (!isActive) {
        element.classList.add(type);
    }
}

// Car Diagram Drawing functionality
let carDiagramCanvas = null;
let carDiagramCtx = null;
let isDrawingOnCar = false;
let lastCarX = 0;
let lastCarY = 0;
let currentTool = 'pen';
let currentColor = '#ff0000';
let carImage = null;

function initializeCarDiagramDrawing() {
    const canvas = document.getElementById('car-diagram-canvas');
    carDiagramCanvas = canvas;
    carDiagramCtx = canvas.getContext('2d');
    
    // Set default canvas size
    canvas.width = 500;
    canvas.height = 300;
    
    // Load car diagram image
    carImage = new Image();
    carImage.src = 'car-diagram.png';
    
    carImage.onload = function() {
        // Set canvas size to reasonable dimensions (max 500px width)
        const maxWidth = 500;
        const scale = Math.min(1, maxWidth / carImage.width);
        canvas.width = carImage.width * scale;
        canvas.height = carImage.height * scale;
        
        // Draw the car image on canvas
        carDiagramCtx.drawImage(carImage, 0, 0, canvas.width, canvas.height);
    };
    
    carImage.onerror = function() {
        console.error('Failed to load car diagram image');
        // Draw a placeholder rectangle
        carDiagramCtx.fillStyle = '#f0f0f0';
        carDiagramCtx.fillRect(0, 0, canvas.width, canvas.height);
        carDiagramCtx.strokeStyle = '#ccc';
        carDiagramCtx.strokeRect(0, 0, canvas.width, canvas.height);
        carDiagramCtx.fillStyle = '#999';
        carDiagramCtx.font = '16px Arial';
        carDiagramCtx.textAlign = 'center';
        carDiagramCtx.fillText('مجسم السيارة', canvas.width / 2, canvas.height / 2);
    };
    
    // Setup drawing tools
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            toolButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentTool = this.getAttribute('data-tool');
            if (currentTool === 'pen') {
                currentColor = this.getAttribute('data-color');
            }
        });
    });
    
    // Set default tool (red pen)
    toolButtons[0].classList.add('active');
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawingOnCar);
    canvas.addEventListener('mousemove', drawOnCar);
    canvas.addEventListener('mouseup', stopDrawingOnCar);
    canvas.addEventListener('mouseout', stopDrawingOnCar);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleCarTouchStart);
    canvas.addEventListener('touchmove', handleCarTouchMove);
    canvas.addEventListener('touchend', stopDrawingOnCar);
}

function startDrawingOnCar(e) {
    isDrawingOnCar = true;
    [lastCarX, lastCarY] = [e.offsetX, e.offsetY];
}

function drawOnCar(e) {
    if (!isDrawingOnCar) return;
    
    if (currentTool === 'pen') {
        carDiagramCtx.strokeStyle = currentColor;
        carDiagramCtx.lineWidth = 4;
        carDiagramCtx.globalCompositeOperation = 'source-over';
    } else if (currentTool === 'eraser') {
        // Eraser only removes drawings, not the car image
        // Get current pixel data to check if it's part of the car image
        const imageData = carDiagramCtx.getImageData(e.offsetX - 10, e.offsetY - 10, 20, 20);
        
        // Erase only the drawing layer
        carDiagramCtx.save();
        carDiagramCtx.globalCompositeOperation = 'destination-out';
        carDiagramCtx.lineWidth = 20;
        carDiagramCtx.lineCap = 'round';
        carDiagramCtx.lineJoin = 'round';
        carDiagramCtx.beginPath();
        carDiagramCtx.moveTo(lastCarX, lastCarY);
        carDiagramCtx.lineTo(e.offsetX, e.offsetY);
        carDiagramCtx.stroke();
        carDiagramCtx.restore();
        
        // Always redraw the car image to protect it
        carDiagramCtx.globalCompositeOperation = 'destination-over';
        if (carImage && carImage.complete) {
            carDiagramCtx.drawImage(carImage, 0, 0, carDiagramCanvas.width, carDiagramCanvas.height);
        }
        carDiagramCtx.globalCompositeOperation = 'source-over';
        
        [lastCarX, lastCarY] = [e.offsetX, e.offsetY];
        return;
    }
    
    carDiagramCtx.lineCap = 'round';
    carDiagramCtx.lineJoin = 'round';
    
    carDiagramCtx.beginPath();
    carDiagramCtx.moveTo(lastCarX, lastCarY);
    carDiagramCtx.lineTo(e.offsetX, e.offsetY);
    carDiagramCtx.stroke();
    
    [lastCarX, lastCarY] = [e.offsetX, e.offsetY];
}

function stopDrawingOnCar() {
    isDrawingOnCar = false;
}

function handleCarTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = carDiagramCanvas.getBoundingClientRect();
    isDrawingOnCar = true;
    // Calculate touch position with proper scaling
    const scaleX = carDiagramCanvas.width / rect.width;
    const scaleY = carDiagramCanvas.height / rect.height;
    lastCarX = (touch.clientX - rect.left) * scaleX;
    lastCarY = (touch.clientY - rect.top) * scaleY;
}

function handleCarTouchMove(e) {
    if (!isDrawingOnCar) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = carDiagramCanvas.getBoundingClientRect();
    // Calculate touch position with proper scaling
    const scaleX = carDiagramCanvas.width / rect.width;
    const scaleY = carDiagramCanvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    if (currentTool === 'pen') {
        carDiagramCtx.strokeStyle = currentColor;
        carDiagramCtx.lineWidth = 4;
    } else if (currentTool === 'eraser') {
        carDiagramCtx.globalCompositeOperation = 'destination-out';
        carDiagramCtx.lineWidth = 20;
        
        // After erasing, redraw car image to protect it
        setTimeout(() => {
            carDiagramCtx.globalCompositeOperation = 'destination-over';
            if (carImage && carImage.complete) {
                carDiagramCtx.drawImage(carImage, 0, 0, carDiagramCanvas.width, carDiagramCanvas.height);
            }
            carDiagramCtx.globalCompositeOperation = 'source-over';
        }, 10);
    }
    
    carDiagramCtx.lineCap = 'round';
    carDiagramCtx.lineJoin = 'round';
    
    carDiagramCtx.beginPath();
    carDiagramCtx.moveTo(lastCarX, lastCarY);
    carDiagramCtx.lineTo(x, y);
    carDiagramCtx.stroke();
    
    // Reset composite operation
    carDiagramCtx.globalCompositeOperation = 'source-over';
    
    lastCarX = x;
    lastCarY = y;
}

function clearCarDrawing() {
    // Clear canvas and redraw the car image
    carDiagramCtx.clearRect(0, 0, carDiagramCanvas.width, carDiagramCanvas.height);
    if (carImage && carImage.complete) {
        carDiagramCtx.drawImage(carImage, 0, 0, carDiagramCanvas.width, carDiagramCanvas.height);
    }
}

// Signature functionality
let signatureCanvases = {};

function initializeSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    signatureCanvases[canvasId] = { canvas, ctx };
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        isDrawing = true;
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    }
    
    function handleTouchMove(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    }
}

// Clear signature
function clearSignature(type) {
    const canvasId = type + '-signature';
    const { canvas, ctx } = signatureCanvases[canvasId];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Save data to localStorage
function saveData() {
    // Generate unique ID and receipt number
    const id = 'INS-' + Date.now();
    const receiptNumber = Date.now().toString();
    
    const data = {
        id: id,
        receiptNumber: receiptNumber,
        date: document.getElementById('inspection-date').value,
        department: document.getElementById('department').value,
        odometer: document.getElementById('odometer').value,
        vehicleType: document.getElementById('vehicle-type').value,
        plateNumber: document.getElementById('plate-number').value,
        notes: document.getElementById('notes').value,
        deliverer: document.getElementById('submitter-name').value,
        receiver: document.getElementById('receiver-name').value,
        inspectionResults: getInspectionResults(),
        delivererSignature: document.getElementById('submitter-signature').toDataURL(),
        receiverSignature: document.getElementById('receiver-signature').toDataURL(),
        photos: capturedPhotos,
        savedAt: new Date().toISOString()
    };
    
    // Get existing inspections array
    let inspections = JSON.parse(localStorage.getItem('inspections') || '[]');
    
    // Add new inspection
    inspections.push(data);
    
    // Save back to localStorage
    localStorage.setItem('inspections', JSON.stringify(inspections));
    
    // Also save as current data for backward compatibility
    localStorage.setItem('vehicleInspectionData', JSON.stringify(data));
    
    alert(`تم حفظ البيانات بنجاح!\nرقم الاستلام: ${receiptNumber}`);
}

// Load saved data
function loadSavedData() {
    const savedData = localStorage.getItem('vehicleInspectionData');
    if (!savedData) return;
    
    const data = JSON.parse(savedData);
    
    document.getElementById('inspection-date').value = data.date || '';
    document.getElementById('department').value = data.department || '';
    document.getElementById('odometer').value = data.odometer || '';
    document.getElementById('vehicle-type').value = data.vehicleType || '';
    document.getElementById('plate-number').value = data.plateNumber || '';
    document.getElementById('notes').value = data.notes || '';
    document.getElementById('submitter-name').value = data.submitterName || '';
    document.getElementById('receiver-name').value = data.receiverName || '';
    
    // Load inspection results
    if (data.inspectionResults) {
        data.inspectionResults.forEach((result, index) => {
            if (result) {
                const row = document.getElementById('inspection-tbody').children[index];
                const indicator = row.querySelector(`.indicator[data-type="${result}"]`);
                if (indicator) {
                    indicator.classList.add(result);
                }
            }
        });
    }
    
    // Load signatures
    if (data.submitterSignature) {
        loadSignatureImage('submitter-signature', data.submitterSignature);
    }
    if (data.receiverSignature) {
        loadSignatureImage('receiver-signature', data.receiverSignature);
    }
    
    // Load photos
    if (data.photos) {
        loadPhotos(data.photos);
    }
}

// Load signature image
function loadSignatureImage(canvasId, dataURL) {
    const { canvas, ctx } = signatureCanvases[canvasId];
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
}

// Get inspection results
function getInspectionResults() {
    const results = [];
    const rows = document.getElementById('inspection-tbody').children;
    
    for (let row of rows) {
        const healthyIndicator = row.querySelector('.indicator[data-type="healthy"]');
        const unhealthyIndicator = row.querySelector('.indicator[data-type="unhealthy"]');
        
        if (healthyIndicator.classList.contains('healthy')) {
            results.push('healthy');
        } else if (unhealthyIndicator.classList.contains('unhealthy')) {
            results.push('unhealthy');
        } else {
            results.push(null);
        }
    }
    
    return results;
}

// Copy content to clipboard
function copyContent() {
    let content = '=== محضر فحص السيارة ===\n\n';
    content += `التاريخ: ${document.getElementById('inspection-date').value}\n\n`;
    content += '--- معلومات السيارة ---\n';
    content += `الإدارة: ${document.getElementById('department').value}\n`;
    content += `رقم العداد: ${document.getElementById('odometer').value}\n`;
    content += `النوع: ${document.getElementById('vehicle-type').value}\n`;
    content += `رقم اللوحة: ${document.getElementById('plate-number').value}\n\n`;
    
    content += '--- نتائج الفحص ---\n';
    const results = getInspectionResults();
    inspectionItems.forEach((item, index) => {
        const status = results[index] === 'healthy' ? '✓ سليم' : 
                      results[index] === 'unhealthy' ? '✗ غير سليم' : '- لم يتم الفحص';
        content += `${item}: ${status}\n`;
    });
    
    content += `\nالملاحظات:\n${document.getElementById('notes').value}\n\n`;
    content += `المسلم: ${document.getElementById('submitter-name').value}\n`;
    content += `المستلم: ${document.getElementById('receiver-name').value}\n`;
    
    navigator.clipboard.writeText(content).then(() => {
        alert('تم نسخ المحتوى بنجاح!');
    }).catch(err => {
        alert('حدث خطأ أثناء النسخ');
    });
}

// Share via WhatsApp
function shareWhatsApp() {
    let message = '🚗 *محضر فحص السيارة*\n\n';
    message += `📅 التاريخ: ${document.getElementById('inspection-date').value}\n\n`;
    message += '*معلومات السيارة:*\n';
    message += `الإدارة: ${document.getElementById('department').value}\n`;
    message += `رقم العداد: ${document.getElementById('odometer').value}\n`;
    message += `النوع: ${document.getElementById('vehicle-type').value}\n`;
    message += `رقم اللوحة: ${document.getElementById('plate-number').value}\n\n`;
    
    message += '*نتائج الفحص:*\n';
    const results = getInspectionResults();
    inspectionItems.forEach((item, index) => {
        const status = results[index] === 'healthy' ? '✅' : 
                      results[index] === 'unhealthy' ? '❌' : '⚪';
        message += `${status} ${item}\n`;
    });
    
    const notes = document.getElementById('notes').value;
    if (notes) {
        message += `\n📝 *الملاحظات:*\n${notes}\n`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

// Generate PDF
async function generatePDF() {
    try {
        // Hide buttons temporarily
        const buttonsContainer = document.querySelector('.action-buttons');
        const originalDisplay = buttonsContainer.style.display;
        buttonsContainer.style.display = 'none';
        
        // Capture the entire page
        const canvas = await html2canvas(document.body, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
        
        // Restore buttons
        buttonsContainer.style.display = originalDisplay;
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        const doc = new jsPDF('p', 'mm', 'a4');
        let position = 0;
        
        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add new pages if content is longer than one page
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Save PDF
        const date = document.getElementById('inspection-date').value || 'inspection';
        doc.save(`vehicle-inspection-${date}.pdf`);
        
        alert('تم إنشاء ملف PDF بنجاح!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
}

// Keep old function for reference
function generatePDF_old() {
    const results = getInspectionResults();
    let yPos = 105;
    inspectionItems.forEach((item, index) => {
        const status = results[index] === 'healthy' ? 'OK' : 
                      results[index] === 'unhealthy' ? 'NOT OK' : 'N/A';
        doc.text(`${index + 1}. ${item}: ${status}`, 20, yPos);
        yPos += 7;
        
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    });
    
    // Notes
    const notes = document.getElementById('notes').value;
    if (notes) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(12);
        doc.text('Notes:', 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(notes, 170);
        doc.text(splitNotes, 20, yPos);
    }
    
    // Save PDF
    doc.save(`vehicle-inspection-${date}.pdf`);
    alert('تم إنشاء ملف PDF بنجاح!');
}

// Create new inspection (reset form)
function createNew() {
    if (confirm('هل تريد إنشاء فحص جديد؟ سيتم مسح جميع البيانات الحالية.')) {
        // Reset all form fields
        document.getElementById('inspection-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('department').value = '';
        document.getElementById('odometer').value = '';
        document.getElementById('vehicle-type').value = '';
        document.getElementById('plate-number').value = '';
        document.getElementById('maintenance').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('submitter-name').value = '';
        document.getElementById('receiver-name').value = '';
        
        // Clear all inspection indicators
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach(ind => ind.classList.remove('healthy', 'unhealthy'));
        
        // Clear signatures
        clearSignature('submitter');
        clearSignature('receiver');
        
        alert('تم إنشاء فحص جديد!');
    }
}

// Modal Functions
function openSearchModal() {
    document.getElementById('search-modal').style.display = 'block';
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    document.getElementById('search-to-date').value = today.toISOString().split('T')[0];
    document.getElementById('search-from-date').value = thirtyDaysAgo.toISOString().split('T')[0];
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('search-modal');
    if (event.target == modal) {
        closeSearchModal();
    }
}

// Search Records Function
function searchRecords() {
    const fromDate = document.getElementById('search-from-date').value;
    const toDate = document.getElementById('search-to-date').value;
    
    if (!fromDate || !toDate) {
        alert('الرجاء تحديد الفترة الزمنية للبحث');
        return;
    }
    
    // Convert dates to timestamps for comparison
    const fromTimestamp = new Date(fromDate).getTime();
    const toTimestamp = new Date(toDate).getTime() + (24 * 60 * 60 * 1000); // Add 1 day to include end date
    
    // Get all inspection records from localStorage
    const allRecords = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('inspection_')) {
            try {
                const record = JSON.parse(localStorage.getItem(key));
                const recordTimestamp = parseInt(key.replace('inspection_', ''));
                
                // Check if record is within date range
                if (recordTimestamp >= fromTimestamp && recordTimestamp <= toTimestamp) {
                    allRecords.push({
                        key: key,
                        timestamp: recordTimestamp,
                        data: record
                    });
                }
            } catch (e) {
                console.error('Error parsing record:', e);
            }
        }
    }
    
    // Sort by timestamp (newest first)
    allRecords.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display results
    displaySearchResults(allRecords);
}

function displaySearchResults(records) {
    const resultsContainer = document.getElementById('search-results');
    
    if (records.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#ccc" stroke-width="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على سجلات في الفترة المحددة</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="results-summary">
            تم العثور على ${records.length} سجل في الفترة المحددة
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>رقم الاستلام</th>
                    <th>التاريخ</th>
                    <th>اسم المستلم</th>
                    <th>رقم اللوحة</th>
                    <th>نوع السيارة</th>
                    <th>الإجراء</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    records.forEach(record => {
        const date = new Date(record.timestamp);
        const formattedDate = date.toLocaleDateString('ar-SA');
        const receiptNumber = record.key.replace('inspection_', '');
        const receiverName = record.data.receiverName || 'غير محدد';
        const plateNumber = record.data.plateNumber || 'غير محدد';
        const vehicleType = record.data.vehicleType || 'غير محدد';
        
        html += `
            <tr>
                <td>${receiptNumber}</td>
                <td>${formattedDate}</td>
                <td>${receiverName}</td>
                <td>${plateNumber}</td>
                <td>${vehicleType}</td>
                <td>
                    <button class="view-btn" onclick="viewRecord('${record.key}')">عرض</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    resultsContainer.innerHTML = html;
}

function viewRecord(key) {
    try {
        const record = JSON.parse(localStorage.getItem(key));
        if (!record) {
            alert('لم يتم العثور على السجل');
            return;
        }
        
        // Load the record data into the form
        if (confirm('هل تريد عرض هذا السجل؟ سيتم استبدال البيانات الحالية.')) {
            // Close modal first
            closeSearchModal();
            
            // Load data
            document.getElementById('inspection-date').value = record.date || '';
            document.getElementById('department').value = record.department || '';
            document.getElementById('odometer').value = record.odometer || '';
            document.getElementById('vehicle-type').value = record.vehicleType || '';
            document.getElementById('plate-number').value = record.plateNumber || '';
            document.getElementById('maintenance').value = record.maintenance || '';
            document.getElementById('notes').value = record.notes || '';
            document.getElementById('submitter-name').value = record.submitterName || '';
            document.getElementById('receiver-name').value = record.receiverName || '';
            
            // Load inspection results
            if (record.inspectionResults) {
                const rows = document.getElementById('inspection-tbody').children;
                record.inspectionResults.forEach((result, index) => {
                    if (result && rows[index]) {
                        const row = rows[index];
                        const healthyIndicator = row.querySelector('.indicator[data-type="healthy"]');
                        const unhealthyIndicator = row.querySelector('.indicator[data-type="unhealthy"]');
                        
                        // Clear previous state
                        healthyIndicator.classList.remove('healthy');
                        unhealthyIndicator.classList.remove('unhealthy');
                        
                        // Set new state
                        if (result === 'healthy') {
                            healthyIndicator.classList.add('healthy');
                        } else if (result === 'unhealthy') {
                            unhealthyIndicator.classList.add('unhealthy');
                        }
                    }
                });
            }
            
            // Load signatures
            if (record.delivererSignature) {
                const submitterCanvas = document.getElementById('submitter-signature');
                const submitterCtx = submitterCanvas.getContext('2d');
                const submitterImg = new Image();
                submitterImg.onload = () => {
                    submitterCtx.clearRect(0, 0, submitterCanvas.width, submitterCanvas.height);
                    submitterCtx.drawImage(submitterImg, 0, 0);
                };
                submitterImg.src = record.delivererSignature;
            }
            
            if (record.receiverSignature) {
                const receiverCanvas = document.getElementById('receiver-signature');
                const receiverCtx = receiverCanvas.getContext('2d');
                const receiverImg = new Image();
                receiverImg.onload = () => {
                    receiverCtx.clearRect(0, 0, receiverCanvas.width, receiverCanvas.height);
                    receiverCtx.drawImage(receiverImg, 0, 0);
                };
                receiverImg.src = record.receiverSignature;
            }
            
            // Load photos
            if (record.photos) {
                loadPhotos(record.photos);
            } else {
                clearPhotos();
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            alert('تم تحميل السجل بنجاح!');
        }
    } catch (e) {
        console.error('Error loading record:', e);
        alert('حدث خطأ أثناء تحميل السجل');
    }
}

// ==================== Camera Functionality ====================

let cameraStream = null;
let capturedPhotos = [];

// Open camera modal
async function openCamera() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    const container = document.querySelector('.camera-container');
    
    // Show modal first
    modal.style.display = 'flex';
    
    // Add loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'camera-loading';
    loadingMsg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 18px;
        text-align: center;
        z-index: 10;
    `;
    loadingMsg.innerHTML = 'جاري تشغيل الكاميرا...<br>📷';
    container.style.position = 'relative';
    container.appendChild(loadingMsg);
    
    try {
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        });
        
        video.srcObject = cameraStream;
        
        // Wait for video to load
        video.onloadedmetadata = () => {
            video.play();
            // Remove loading message
            if (loadingMsg && loadingMsg.parentNode) {
                loadingMsg.remove();
            }
        };
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        
        // Remove loading message
        if (loadingMsg && loadingMsg.parentNode) {
            loadingMsg.remove();
        }
        
        // Close modal
        modal.style.display = 'none';
        
        // Show error
        alert('لا يمكن الوصول إلى الكاميرا!\n\nالرجاء التأكد من:\n1. منح الإذن للكاميرا\n2. عدم استخدام الكاميرا في تطبيق آخر');
    }
}

// Close camera modal
function closeCamera() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    
    // Stop camera stream
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    video.srcObject = null;
    modal.style.display = 'none';
}

// Capture photo from camera
function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const photoDataURL = canvas.toDataURL('image/jpeg', 0.8);
    
    // Add photo to array
    capturedPhotos.push({
        id: Date.now(),
        data: photoDataURL,
        timestamp: new Date().toISOString()
    });
    
    // Display photo
    displayPhotos();
    
    // Close camera
    closeCamera();
    
    // Show success message
    showPhotoSuccessMessage();
}

// Display captured photos and videos
function displayPhotos() {
    const container = document.getElementById('photos-container');
    
    if (capturedPhotos.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = capturedPhotos.map(item => {
        if (item.type === 'video') {
            return `
                <div class="photo-item video-item" data-photo-id="${item.id}">
                    <video src="${item.data}" muted loop onclick="this.paused ? this.play() : this.pause()"></video>
                    <div class="video-play-icon"></div>
                    <button class="photo-delete-btn" onclick="deletePhoto(${item.id})" title="حذف الفيديو">
                        ×
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="photo-item" data-photo-id="${item.id}">
                    <img src="${item.data}" alt="صورة السيارة" onclick="openImageZoom('${item.data}')">
                    <button class="photo-delete-btn" onclick="event.stopPropagation(); deletePhoto(${item.id})" title="حذف الصورة">
                        ×
                    </button>
                </div>
            `;
        }
    }).join('');
}

// Delete photo
function deletePhoto(photoId) {
    if (confirm('هل تريد حذف هذه الصورة؟')) {
        capturedPhotos = capturedPhotos.filter(photo => photo.id !== photoId);
        displayPhotos();
    }
}

// Show success message
function showPhotoSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 16px;
        font-weight: 600;
        animation: slideDown 0.3s ease;
    `;
    message.textContent = '✓ تم التقاط الصورة بنجاح';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 2000);
}

// Load photos from saved data
function loadPhotos(photos) {
    if (photos && Array.isArray(photos)) {
        capturedPhotos = photos;
        displayPhotos();
    }
}

// Clear all photos
function clearPhotos() {
    capturedPhotos = [];
    displayPhotos();
}

// Add CSS animation for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// ==================== Video Recording ====================
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
const MAX_RECORDING_SECONDS = 30;

// Start recording video
async function startRecording() {
    try {
        if (!cameraStream) {
            alert('الكاميرا غير مفعلة!');
            return;
        }
        
        // Initialize MediaRecorder
        mediaRecorder = new MediaRecorder(cameraStream, {
            mimeType: 'video/webm;codecs=vp8'
        });
        
        recordedChunks = [];
        recordingSeconds = 0;
        
        // Collect data
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // On stop
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            
            // Convert to base64 for storage
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                
                // Add to photos array
                capturedPhotos.push({
                    type: 'video',
                    data: base64data
                });
                
                // Display video
                displayPhotos();
                
                // Show success message
                showSuccessMessage('تم تسجيل الفيديو بنجاح! 🎥');
            };
            reader.readAsDataURL(blob);
            
            // Reset UI
            stopRecordingTimer();
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Update UI
        document.getElementById('record-btn').style.display = 'none';
        document.getElementById('stop-record-btn').style.display = 'inline-flex';
        document.getElementById('record-timer').style.display = 'inline';
        
        // Start timer
        startRecordingTimer();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('حدث خطأ أثناء بدء التسجيل!');
    }
}

// Stop recording video
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // Update UI
        document.getElementById('record-btn').style.display = 'inline-flex';
        document.getElementById('stop-record-btn').style.display = 'none';
        document.getElementById('record-timer').style.display = 'none';
    }
}

// Start recording timer
function startRecordingTimer() {
    const timerElement = document.getElementById('record-timer');
    
    recordingTimer = setInterval(() => {
        recordingSeconds++;
        
        // Format time
        const minutes = Math.floor(recordingSeconds / 60);
        const seconds = recordingSeconds % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Auto stop at max duration
        if (recordingSeconds >= MAX_RECORDING_SECONDS) {
            stopRecording();
        }
    }, 1000);
}

// Stop recording timer
function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    recordingSeconds = 0;
}

// Image Zoom Functionality
function openImageZoom(imageSrc) {
    const modal = document.getElementById('image-zoom-modal');
    const zoomedImg = document.getElementById('zoomed-image');
    modal.style.display = 'flex';
    zoomedImg.src = imageSrc;
}

function closeImageZoom() {
    const modal = document.getElementById('image-zoom-modal');
    modal.style.display = 'none';
}
