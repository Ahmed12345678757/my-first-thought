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
    
    // Remove active class from both indicators in this row
    const row = element.closest('tr');
    const indicators = row.querySelectorAll('.indicator');
    indicators.forEach(ind => ind.classList.remove('healthy', 'unhealthy'));
    
    // Add active class to clicked indicator
    element.classList.add(type);
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
        maintenance: document.getElementById('maintenance').value,
        notes: document.getElementById('notes').value,
        submitterName: document.getElementById('submitter-name').value,
        receiverName: document.getElementById('receiver-name').value,
        inspectionResults: getInspectionResults(),
        submitterSignature: document.getElementById('submitter-signature').toDataURL(),
        receiverSignature: document.getElementById('receiver-signature').toDataURL()
    };
    
    localStorage.setItem('vehicleInspectionData', JSON.stringify(data));
    alert('تم حفظ البيانات بنجاح!');
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
    document.getElementById('maintenance').value = data.maintenance || '';
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
