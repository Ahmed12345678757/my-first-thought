// تعيين التاريخ الحالي
document.getElementById('currentDate').valueAsDate = new Date();

// بيانات السيارات (فارغة في البداية)
let vehicles = [];

// تحميل البيانات من localStorage
function loadData() {
    const savedData = localStorage.getItem('vehiclesData');
    if (savedData) {
        vehicles = JSON.parse(savedData);
        renderTable();
    }
}

// حفظ البيانات في localStorage
function saveData() {
    // جمع البيانات من الجدول
    const rows = document.querySelectorAll('#vehicleTableBody tr');
    vehicles = [];
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        vehicles.push({
            number: index + 1,
            type: cells[1].querySelector('input').value,
            model: cells[2].querySelector('input').value,
            plate: cells[3].querySelector('input').value,
            chassis: cells[4].querySelector('input').value,
            center: cells[5].querySelector('input').value,
            status: cells[6].querySelector('select').value,
            notes: cells[7].querySelector('textarea').value
        });
    });
    
    localStorage.setItem('vehiclesData', JSON.stringify(vehicles));
    alert('✅ تم حفظ البيانات بنجاح!');
}

// عرض الجدول
function renderTable() {
    const tbody = document.getElementById('vehicleTableBody');
    tbody.innerHTML = '';
    
    if (vehicles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #999;">لا توجد سيارات. اضغط على "إضافة سيارة" لإضافة سيارة جديدة.</td></tr>';
        return;
    }
    
    vehicles.forEach((vehicle, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" value="${vehicle.type}" onchange="autoSave()"></td>
            <td><input type="text" value="${vehicle.model}" onchange="autoSave()"></td>
            <td><input type="text" value="${vehicle.plate}" onchange="autoSave()"></td>
            <td><input type="text" value="${vehicle.chassis}" onchange="autoSave()"></td>
            <td><input type="text" value="${vehicle.center}" onchange="autoSave()"></td>
            <td>
                <select onchange="autoSave()">
                    <option value="عاملة" ${vehicle.status === 'عاملة' ? 'selected' : ''}>عاملة</option>
                    <option value="قيد الإصلاح" ${vehicle.status === 'قيد الإصلاح' ? 'selected' : ''}>قيد الإصلاح</option>
                    <option value="احتياط" ${vehicle.status === 'احتياط' ? 'selected' : ''}>احتياط</option>
                    <option value="عطلانة" ${vehicle.status === 'عطلانة' ? 'selected' : ''}>عطلانة</option>
                </select>
            </td>
            <td><textarea onchange="autoSave()">${vehicle.notes}</textarea></td>
        `;
        tbody.appendChild(row);
    });
}

// حفظ تلقائي عند التعديل
function autoSave() {
    const rows = document.querySelectorAll('#vehicleTableBody tr');
    vehicles = [];
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            vehicles.push({
                number: index + 1,
                type: cells[1].querySelector('input').value,
                model: cells[2].querySelector('input').value,
                plate: cells[3].querySelector('input').value,
                chassis: cells[4].querySelector('input').value,
                center: cells[5].querySelector('input').value,
                status: cells[6].querySelector('select').value,
                notes: cells[7].querySelector('textarea').value
            });
        }
    });
    
    localStorage.setItem('vehiclesData', JSON.stringify(vehicles));
}

// البحث عن سيارة
function searchVehicle() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const rows = document.querySelectorAll('#vehicleTableBody tr');
    
    rows.forEach(row => {
        row.classList.remove('highlight');
        const plateCell = row.querySelector('td:nth-child(4) input');
        if (plateCell) {
            const plateValue = plateCell.value.toLowerCase();
            if (searchTerm && plateValue.includes(searchTerm)) {
                row.classList.add('highlight');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}

// فتح نافذة إضافة سيارة
function openAddModal() {
    document.getElementById('addModal').style.display = 'block';
}

// إغلاق نافذة إضافة سيارة
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    // مسح الحقول
    document.getElementById('newType').value = '';
    document.getElementById('newModel').value = '';
    document.getElementById('newPlate').value = '';
    document.getElementById('newChassis').value = '';
    document.getElementById('newCenter').value = '';
    document.getElementById('newStatus').value = 'عاملة';
    document.getElementById('newNotes').value = '';
}

// إضافة سيارة جديدة
function addVehicle() {
    const type = document.getElementById('newType').value.trim();
    const model = document.getElementById('newModel').value.trim();
    const plate = document.getElementById('newPlate').value.trim();
    const chassis = document.getElementById('newChassis').value.trim();
    const center = document.getElementById('newCenter').value.trim();
    const status = document.getElementById('newStatus').value;
    const notes = document.getElementById('newNotes').value.trim();
    
    if (!type || !model || !plate || !chassis || !center) {
        alert('⚠️ الرجاء ملء جميع الحقول المطلوبة!');
        return;
    }
    
    vehicles.push({
        number: vehicles.length + 1,
        type: type,
        model: model,
        plate: plate,
        chassis: chassis,
        center: center,
        status: status,
        notes: notes
    });
    
    localStorage.setItem('vehiclesData', JSON.stringify(vehicles));
    renderTable();
    closeAddModal();
    alert('✅ تم إضافة السيارة بنجاح!');
}

// إرسال PDF
function sendPDF() {
    const printWindow = window.open('', '_blank');
    const date = document.getElementById('currentDate').value;
    
    let tableHTML = '<table border="1" style="width:100%; border-collapse: collapse; text-align: center;">';
    tableHTML += '<thead><tr style="background: #dc3545; color: white;">';
    tableHTML += '<th>العدد</th><th>النوع</th><th>الموديل</th><th>رقم اللوحة</th><th>رقم الشاسيه</th><th>اسم المركز</th><th>الحالة</th><th>ملاحظات</th>';
    tableHTML += '</tr></thead><tbody>';
    
    vehicles.forEach((vehicle, index) => {
        tableHTML += '<tr>';
        tableHTML += `<td>${index + 1}</td>`;
        tableHTML += `<td>${vehicle.type}</td>`;
        tableHTML += `<td>${vehicle.model}</td>`;
        tableHTML += `<td>${vehicle.plate}</td>`;
        tableHTML += `<td>${vehicle.chassis}</td>`;
        tableHTML += `<td>${vehicle.center}</td>`;
        tableHTML += `<td>${vehicle.status}</td>`;
        tableHTML += `<td>${vehicle.notes}</td>`;
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>متابعة السيارات - ${date}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #dc3545; }
                p { text-align: center; color: #666; margin-bottom: 20px; }
                table { margin: 20px auto; }
                th, td { padding: 10px; }
            </style>
        </head>
        <body>
            <h1>متابعة السيارات</h1>
            <p>هيئة الهلال الأحمر السعودي</p>
            <p>التاريخ: ${date}</p>
            ${tableHTML}
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// إغلاق النافذة المنبثقة عند الضغط خارجها
window.onclick = function(event) {
    const modal = document.getElementById('addModal');
    if (event.target == modal) {
        closeAddModal();
    }
}

// تحميل البيانات عند فتح الصفحة
loadData();
