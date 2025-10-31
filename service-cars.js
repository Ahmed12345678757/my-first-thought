// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date
    setTodayDate();
    
    // Initialize signature canvases
    initSignature('receiver-signature');
    initSignature('manager-signature');
});

// Set today's date
function setTodayDate() {
    const dateInput = document.getElementById('date-input');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// Signature functionality
let isDrawing = false;
let signatureData = {};

function initSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // Set canvas actual size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        const pos = getMousePos(canvas, e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        const pos = getMousePos(canvas, e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

// Clear signature
function clearSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Save form
function saveForm() {
    const formData = {
        date: document.getElementById('date-input').value,
        receiverName: document.getElementById('receiver-name').value,
        department: document.getElementById('department').value,
        receiveTime: document.getElementById('receive-time').value,
        returnTime: document.getElementById('return-time').value,
        purpose: document.getElementById('purpose').value,
        notes: document.getElementById('notes').value,
        managerName: document.getElementById('manager-name').value,
        receiverSignature: document.getElementById('receiver-signature').toDataURL(),
        managerSignature: document.getElementById('manager-signature').toDataURL(),
        timestamp: new Date().toISOString()
    };
    
    // Validate required fields
    if (!formData.receiverName || !formData.department || !formData.receiveTime) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    // Get existing records
    let records = JSON.parse(localStorage.getItem('service-car-records')) || [];
    
    // Add new record
    records.push(formData);
    
    // Save to localStorage
    localStorage.setItem('service-car-records', JSON.stringify(records));
    
    alert('تم حفظ النموذج بنجاح!');
    
    // Clear form
    clearForm();
}

// Clear form
function clearForm() {
    document.getElementById('receiver-name').value = '';
    document.getElementById('department').value = '';
    document.getElementById('receive-time').value = '';
    document.getElementById('return-time').value = '';
    document.getElementById('purpose').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('manager-name').value = '';
    
    clearSignature('receiver-signature');
    clearSignature('manager-signature');
}

// Open archive modal
function openArchive() {
    document.getElementById('archive-modal').style.display = 'block';
    
    // Set today's date in archive search
    const archiveDate = document.getElementById('archive-date');
    const today = new Date().toISOString().split('T')[0];
    archiveDate.value = today;
    
    // Search immediately
    searchByDate();
}

// Close archive modal
function closeArchive() {
    document.getElementById('archive-modal').style.display = 'none';
}

// Search by date
function searchByDate() {
    const searchDate = document.getElementById('archive-date').value;
    
    if (!searchDate) {
        document.getElementById('archive-results').innerHTML = 
            '<div class="no-results">الرجاء اختيار تاريخ للبحث</div>';
        return;
    }
    
    // Get all records
    const records = JSON.parse(localStorage.getItem('service-car-records')) || [];
    
    // Filter by date
    const filteredRecords = records.filter(record => record.date === searchDate);
    
    // Display results
    displayArchiveResults(filteredRecords, searchDate);
}

// Display archive results
function displayArchiveResults(records, date) {
    const resultsContainer = document.getElementById('archive-results');
    
    if (records.length === 0) {
        resultsContainer.innerHTML = 
            `<div class="no-results">لا توجد سجلات في تاريخ ${date}</div>`;
        return;
    }
    
    let html = '';
    
    records.forEach((record, index) => {
        html += `
            <div class="archive-item">
                <h4>السجل رقم ${index + 1}</h4>
                <p><strong>اسم المستلم:</strong> ${record.receiverName}</p>
                <p><strong>الإدارة:</strong> ${record.department}</p>
                <p><strong>وقت الاستلام:</strong> ${record.receiveTime}</p>
                <p><strong>وقت التسليم:</strong> ${record.returnTime || 'لم يتم التسليم بعد'}</p>
                <p><strong>الغرض:</strong> ${record.purpose}</p>
                ${record.notes ? `<p><strong>الملاحظات:</strong> ${record.notes}</p>` : ''}
                <p><strong>مدير الصيانة:</strong> ${record.managerName || 'غير محدد'}</p>
                <button class="submit-button" style="margin-top: 10px; padding: 8px 20px; font-size: 14px;" onclick="viewFullRecord(${records.indexOf(record)})">
                    عرض التفاصيل الكاملة
                </button>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// View full record (including signatures)
function viewFullRecord(index) {
    const records = JSON.parse(localStorage.getItem('service-car-records')) || [];
    const record = records[index];
    
    if (!record) return;
    
    // Create a new window to display full record
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>نموذج استلام وتسليم سيارة الخدمة</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    direction: rtl;
                }
                h1 {
                    color: #dc3545;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .info-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 15px;
                }
                .info-item {
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
                .info-item strong {
                    color: #dc3545;
                }
                .signature-section {
                    margin-top: 30px;
                    text-align: center;
                }
                .signature-section h3 {
                    color: #dc3545;
                    margin-bottom: 10px;
                }
                .signature-section img {
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    max-width: 100%;
                }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>نموذج استلام وتسليم سيارة الخدمة</h1>
            
            <div class="info-row">
                <div class="info-item">
                    <strong>التاريخ:</strong> ${record.date}
                </div>
                <div class="info-item">
                    <strong>وقت الحفظ:</strong> ${new Date(record.timestamp).toLocaleString('ar-SA')}
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-item">
                    <strong>اسم المستلم:</strong> ${record.receiverName}
                </div>
                <div class="info-item">
                    <strong>الإدارة:</strong> ${record.department}
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-item">
                    <strong>وقت الاستلام:</strong> ${record.receiveTime}
                </div>
                <div class="info-item">
                    <strong>وقت التسليم:</strong> ${record.returnTime || 'لم يتم التسليم بعد'}
                </div>
            </div>
            
            <div class="info-item" style="margin-bottom: 15px;">
                <strong>الغرض من الاستلام:</strong><br>
                ${record.purpose}
            </div>
            
            ${record.notes ? `
            <div class="info-item" style="margin-bottom: 15px;">
                <strong>الملاحظات:</strong><br>
                ${record.notes}
            </div>
            ` : ''}
            
            <div class="signature-section">
                <h3>توقيع المستلم</h3>
                <img src="${record.receiverSignature}" alt="توقيع المستلم">
            </div>
            
            <div class="signature-section">
                <h3>توقيع مدير الصيانة: ${record.managerName || 'غير محدد'}</h3>
                <img src="${record.managerSignature}" alt="توقيع مدير الصيانة">
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="background: #dc3545; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    طباعة
                </button>
                <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    إغلاق
                </button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Send PDF function
function sendPDF() {
    // Get form data
    const formData = {
        date: document.getElementById('date-input').value,
        receiverName: document.getElementById('receiver-name').value,
        department: document.getElementById('department').value,
        receiveTime: document.getElementById('receive-time').value,
        returnTime: document.getElementById('return-time').value,
        purpose: document.getElementById('purpose').value,
        notes: document.getElementById('notes').value,
        managerName: document.getElementById('manager-name').value,
        receiverSignature: document.getElementById('receiver-signature').toDataURL(),
        managerSignature: document.getElementById('manager-signature').toDataURL()
    };
    
    // Validate required fields
    if (!formData.receiverName || !formData.department || !formData.receiveTime) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    // Create PDF window
    const pdfWindow = window.open('', '_blank');
    pdfWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>نموذج استلام وتسليم سيارة الخدمة</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    direction: rtl;
                }
                h1 {
                    color: #dc3545;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .info-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 15px;
                }
                .info-item {
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
                .info-item strong {
                    color: #dc3545;
                }
                .signature-section {
                    margin-top: 30px;
                    text-align: center;
                }
                .signature-section h3 {
                    color: #dc3545;
                    margin-bottom: 10px;
                }
                .signature-section img {
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    max-width: 100%;
                }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>نموذج استلام وتسليم سيارة الخدمة</h1>
            
            <div class="info-row">
                <div class="info-item">
                    <strong>التاريخ:</strong> ${formData.date}
                </div>
                <div class="info-item">
                    <strong>وقت الحفظ:</strong> ${new Date().toLocaleString('ar-SA')}
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-item">
                    <strong>اسم المستلم:</strong> ${formData.receiverName}
                </div>
                <div class="info-item">
                    <strong>الإدارة:</strong> ${formData.department}
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-item">
                    <strong>وقت الاستلام:</strong> ${formData.receiveTime}
                </div>
                <div class="info-item">
                    <strong>وقت التسليم:</strong> ${formData.returnTime || 'لم يتم التسليم بعد'}
                </div>
            </div>
            
            <div class="info-item" style="margin-bottom: 15px;">
                <strong>الغرض من الاستلام:</strong><br>
                ${formData.purpose}
            </div>
            
            ${formData.notes ? `
            <div class="info-item" style="margin-bottom: 15px;">
                <strong>الملاحظات:</strong><br>
                ${formData.notes}
            </div>
            ` : ''}
            
            <div class="signature-section">
                <h3>توقيع المستلم</h3>
                <img src="${formData.receiverSignature}" alt="توقيع المستلم">
            </div>
            
            <div class="signature-section">
                <h3>توقيع مدير الصيانة: ${formData.managerName || 'غير محدد'}</h3>
                <img src="${formData.managerSignature}" alt="توقيع مدير الصيانة">
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="background: #dc3545; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    طباعة / حفظ PDF
                </button>
                <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    إغلاق
                </button>
            </div>
        </body>
        </html>
    `);
    pdfWindow.document.close();
    
    alert('تم فتح نافذة جديدة للطباعة أو حفظ PDF');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('archive-modal');
    if (event.target === modal) {
        closeArchive();
    }
};
