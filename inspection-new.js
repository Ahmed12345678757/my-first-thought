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
        // For eraser, we need to redraw the car image first, then erase only the drawing
        // Store current canvas content
        const imageData = carDiagramCtx.getImageData(0, 0, carDiagramCanvas.width, carDiagramCanvas.height);
        
        // Clear the eraser area
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
        
        // Redraw the car image underneath
        carDiagramCtx.globalCompositeOperation = 'destination-over';
        if (carImage.complete) {
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
    const data = {
        date: document.getElementById('inspection-date').value,
        department: document.getElementById('department').value,
        odometer: document.getElementById('odometer').value,
        vehicleType: document.getElementById('vehicle-type').value,
        plateNumber: document.getElementById('plate-number').value,
        notes: document.getElementById('notes').value,
        submitterName: document.getElementById('submitter-name').value,
        receiverName: document.getElementById('receiver-name').value,
        inspectionResults: getInspectionResults(),
        submitterSignature: document.getElementById('submitter-signature').toDataURL(),
        receiverSignature: document.getElementById('receiver-signature').toDataURL(),
        savedAt: new Date().toISOString()
    };
    
    // Generate unique receipt number (timestamp-based)
    const receiptNumber = Date.now();
    
    // Save with unique key for search functionality
    localStorage.setItem(`inspection_${receiptNumber}`, JSON.stringify(data));
    
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
            
            // Load inspection status
            if (record.inspectionStatus) {
                Object.keys(record.inspectionStatus).forEach(item => {
                    const indicator = document.querySelector(`[data-item="${item}"]`);
                    if (indicator) {
                        indicator.classList.remove('healthy', 'unhealthy');
                        indicator.classList.add(record.inspectionStatus[item]);
                    }
                });
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
