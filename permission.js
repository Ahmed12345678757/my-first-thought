// Set today's date
document.getElementById('form-date').valueAsDate = new Date();

// Signature canvas setup
const canvas = document.getElementById('supervisor-signature');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events for mobile
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
    isDrawing = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastX = x;
    lastY = y;
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Toggle sub-options for work mission
document.getElementById('permission-work').addEventListener('change', function() {
    const subOptions = document.getElementById('work-options');
    if (this.checked) {
        subOptions.classList.add('active');
    } else {
        subOptions.classList.remove('active');
        // Uncheck all sub-options
        document.querySelectorAll('#work-options input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
});

// Toggle time range for return permission
document.getElementById('permission-return').addEventListener('change', function() {
    const timeRange = document.getElementById('return-time');
    if (this.checked) {
        timeRange.classList.add('active');
    } else {
        timeRange.classList.remove('active');
        document.getElementById('time-from').value = '';
        document.getElementById('time-to').value = '';
    }
});

// Generate PDF function
async function generatePDF() {
    try {
        const container = document.getElementById('pdf-content');
        
        // Store original styles
        const originalPadding = container.style.padding;
        const originalFontSize = document.body.style.fontSize;
        
        // Apply normal styles for PDF (not too compressed)
        container.style.padding = '20px';
        document.body.style.fontSize = '12px';
        
        // Hide elements that shouldn't be in PDF
        const noprint = document.querySelectorAll('.no-print');
        noprint.forEach(el => el.style.display = 'none');
        
        // Keep logo at reasonable size
        const logo = document.querySelector('.logo');
        const originalLogoWidth = logo.style.width;
        const originalLogoHeight = logo.style.height;
        logo.style.width = '80px';
        logo.style.height = '80px';
        
        // Keep section headers readable
        const sectionHeaders = document.querySelectorAll('.section-header');
        const originalHeaderPaddings = [];
        sectionHeaders.forEach(header => {
            originalHeaderPaddings.push(header.style.padding);
            header.style.padding = '10px 15px';
            header.style.fontSize = '14px';
        });
        
        // Keep signature canvas at reasonable height
        const signatureCanvas = document.getElementById('supervisor-signature');
        const originalCanvasHeight = signatureCanvas.style.height;
        signatureCanvas.style.height = '100px';
        
        // Wait a bit for styles to apply
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the page as canvas with good quality
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowHeight: container.scrollHeight
        });
        
        // Restore original styles
        container.style.padding = originalPadding;
        document.body.style.fontSize = originalFontSize;
        noprint.forEach(el => el.style.display = '');
        logo.style.width = originalLogoWidth;
        logo.style.height = originalLogoHeight;
        sectionHeaders.forEach((header, i) => {
            header.style.padding = originalHeaderPaddings[i];
            header.style.fontSize = '';
        });
        signatureCanvas.style.height = originalCanvasHeight;
        
        // Create PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        // A4 dimensions
        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 15;
        
        // Use 85% of page width for better readability (not too wide)
        const contentWidth = (pdfWidth - (margin * 2)) * 0.85;
        const contentHeight = (canvas.height * contentWidth) / canvas.width;
        
        // Center horizontally
        const xOffset = (pdfWidth - contentWidth) / 2;
        
        // Check if fits in one page
        if (contentHeight <= pdfHeight - (margin * 2)) {
            // Fits in one page - center vertically
            const yOffset = (pdfHeight - contentHeight) / 2;
            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, contentWidth, contentHeight, undefined, 'SLOW');
        } else {
            // Too tall - scale down to fit
            const scaledHeight = pdfHeight - (margin * 2);
            const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
            const scaledXOffset = (pdfWidth - scaledWidth) / 2;
            pdf.addImage(imgData, 'JPEG', scaledXOffset, margin, scaledWidth, scaledHeight, undefined, 'SLOW');
        }
        
        // Generate filename with date
        const date = document.getElementById('form-date').value || 'permission';
        const filename = `استئذان_${date}.pdf`;
        
        pdf.save(filename);
        alert('تم إنشاء ملف PDF بنجاح!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
}

// Save data function
function saveData() {
    const data = {
        date: document.getElementById('form-date').value,
        employeeName: document.getElementById('employee-name').value,
        employeeId: document.getElementById('employee-id').value,
        department: document.getElementById('department').value,
        jobTitle: document.getElementById('job-title').value,
        permissionLeave: document.getElementById('permission-leave').checked,
        permissionWork: document.getElementById('permission-work').checked,
        workField: document.getElementById('work-field').checked,
        workHours: document.getElementById('work-hours').checked,
        workDay: document.getElementById('work-day').checked,
        permissionReturn: document.getElementById('permission-return').checked,
        timeFrom: document.getElementById('time-from').value,
        timeTo: document.getElementById('time-to').value,
        permissionReason: document.getElementById('permission-reason').value,
        description: document.getElementById('description').value,
        startTime: document.getElementById('start-time').value,
        endTime: document.getElementById('end-time').value,
        supervisorName: document.getElementById('supervisor-name').value,
        approvalDate: document.getElementById('approval-date').value,
        signature: canvas.toDataURL()
    };
    
    // Save to localStorage
    localStorage.setItem('permissionFormData', JSON.stringify(data));
    alert('تم حفظ البيانات بنجاح!');
}

// Load saved data on page load
window.addEventListener('load', function() {
    const savedData = localStorage.getItem('permissionFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restore form fields
        if (data.date) document.getElementById('form-date').value = data.date;
        if (data.employeeName) document.getElementById('employee-name').value = data.employeeName;
        if (data.employeeId) document.getElementById('employee-id').value = data.employeeId;
        if (data.department) document.getElementById('department').value = data.department;
        if (data.jobTitle) document.getElementById('job-title').value = data.jobTitle;
        if (data.permissionLeave) document.getElementById('permission-leave').checked = data.permissionLeave;
        if (data.permissionWork) {
            document.getElementById('permission-work').checked = data.permissionWork;
            if (data.permissionWork) {
                document.getElementById('work-options').classList.add('active');
            }
        }
        if (data.workField) document.getElementById('work-field').checked = data.workField;
        if (data.workHours) document.getElementById('work-hours').checked = data.workHours;
        if (data.workDay) document.getElementById('work-day').checked = data.workDay;
        if (data.permissionReturn) {
            document.getElementById('permission-return').checked = data.permissionReturn;
            if (data.permissionReturn) {
                document.getElementById('return-time').classList.add('active');
            }
        }
        if (data.timeFrom) document.getElementById('time-from').value = data.timeFrom;
        if (data.timeTo) document.getElementById('time-to').value = data.timeTo;
        if (data.permissionReason) document.getElementById('permission-reason').value = data.permissionReason;
        if (data.description) document.getElementById('description').value = data.description;
        if (data.startTime) document.getElementById('start-time').value = data.startTime;
        if (data.endTime) document.getElementById('end-time').value = data.endTime;
        if (data.supervisorName) document.getElementById('supervisor-name').value = data.supervisorName;
        if (data.approvalDate) document.getElementById('approval-date').value = data.approvalDate;
        
        // Restore signature
        if (data.signature) {
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
            };
            img.src = data.signature;
        }
    }
});
