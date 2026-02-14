// ========================================
// EXCEL EXPORT FUNCTIONALITY  
// ========================================

/**
 * Opens export settings modal (reuses print settings modal)
 */
function openExportSettingsModal() {
    openPrintSettingsModal(); // Reuse existing modal
}

/**
 * Handles Excel export with selected filters
 */
async function handleExcelExport() {
    console.log('=== Starting Excel Export ===');

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not loaded');
        alert('Excel library belum dimuat. Silakan refresh halaman dan coba lagi.');
        return;
    }
    console.log('✓ XLSX library loaded');

    // Get selected classes
    const classCheckboxes = document.querySelectorAll('.print-class-checkbox:checked');
    const selectedClasses = Array.from(classCheckboxes).map(cb => cb.value);

    // Get selected columns
    const columnCheckboxes = document.querySelectorAll('.print-column-checkbox:checked');
    const selectedColumns = Array.from(columnCheckboxes).map(cb => cb.value);

    console.log('Excel Export - Selected classes:', selectedClasses);
    console.log('Excel Export - Selected columns:', selectedColumns);

    // Show loading indicator
    const excelBtn = document.getElementById('excel-export-btn');
    if (excelBtn) {
        excelBtn.disabled = true;
        excelBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 inline mr-2 animate-spin"></i>Memproses...';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        console.log('✓ Button set to loading state');
    }

    try {
        console.log('Extracting data from table...');

        // Get student data from visible table
        const studentData = getStudentDataFromTable(selectedClasses, selectedColumns);

        console.log('✓ Data extracted, length:', studentData.length);

        if (studentData.length === 0) {
            console.warn('No student data to export');
            alert('Tidak ada data siswa untuk diekspor. Pastikan Anda memilih setidaknya satu kelas dan data siswa sudah ditampilkan.');
            return;
        }

        console.log('Creating Excel workbook...');

        // Create Excel workbook
        const workbook = createExcelWorkbook(studentData, selectedColumns);

        console.log('✓ Workbook created');

        // Generate filename with current date
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const filename = `Data_Siswa_${day}-${month}-${year}.xlsx`;

        console.log('Triggering download:', filename);

        // Trigger download
        XLSX.writeFile(workbook, filename);

        console.log('✓ File download triggered');

        // Close modal
        closePrintSettingsModal();

        console.log(`✓ Excel file exported successfully: ${filename}`);
        console.log('=== Export Complete ===');

    } catch (error) {
        console.error('!!! ERROR during Excel export:', error);
        console.error('Error stack:', error.stack);
        alert('Terjadi kesalahan saat mengekspor data: ' + error.message);

    } finally {
        // Reset button
        console.log('Resetting button...');
        if (excelBtn) {
            excelBtn.disabled = false;
            excelBtn.innerHTML = '<i data-lucide="file-spreadsheet" class="w-4 h-4 inline mr-2"></i>Export Excel';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

/**
 * Extracts student data from visible table using data attributes
 */
function getStudentDataFromTable(selectedClasses, selectedColumns) {
    console.log('=== Extracting data from table ===');

    const studentRows = document.querySelectorAll('#student-table-body tr');
    const data = [];

    console.log('Total rows in table:', studentRows.length);

    studentRows.forEach((row, index) => {
        // Skip rows without enough cells
        if (!row.cells || row.cells.length < 2) {
            console.log(`Row ${index}: Skipped (not enough cells)`);
            return;
        }

        // Get student data from data attributes (most reliable method)
        let studentName = row.getAttribute('data-student-name') || '';
        let kelas = row.getAttribute('data-student-kelas') || row.getAttribute('data-student-class') || '';
        let guild = row.getAttribute('data-student-guild') || '';

        console.log(`Row ${index}: Data attrs - name="${studentName}", class="${kelas}"`);

        // If no data attributes, try parsing from cells (fallback)
        if (!studentName) {
            const firstCell = row.cells[0];
            if (firstCell) {
                // LOG: Show HTML structure for debugging
                console.log(`Row ${index}: First cell HTML:`, firstCell.innerHTML.substring(0, 300));

                // Try multiple selectors for name
                const nameSelectors = [
                    '.font-semibold',
                    '.text-sm.font-medium',
                    '[data-student-name]',
                    'p.font-semibold',
                    'div.font-semibold',
                    'span.font-semibold'
                ];

                for (const selector of nameSelectors) {
                    const nameEl = firstCell.querySelector(selector);
                    if (nameEl && nameEl.textContent.trim()) {
                        studentName = nameEl.textContent.trim();
                        console.log(`Row ${index}: Name found with "${selector}": "${studentName}"`);
                        break;
                    }
                }

                // If still no name, try finding first meaningful text
                if (!studentName) {
                    const allDivs = firstCell.querySelectorAll('div');
                    console.log(`Row ${index}: Trying ${allDivs.length} divs...`);
                    for (const div of allDivs) {
                        const text = div.textContent.trim();
                        // Skip if empty or looks like metadata
                        if (text && text.length > 2 && !text.includes('NIS:') && !text.match(/^\d{1,2}\/\d/)) {
                            studentName = text.split('\n')[0].trim(); // Get first line only
                            console.log(`Row ${index}: Name from div text: "${studentName}"`);
                            break;
                        }
                    }
                }

                // Get class if not from attribute
                if (!kelas) {
                    const classEl = firstCell.querySelector('.text-xs.text-gray-500, [data-student-class]');
                    if (classEl) {
                        const classText = classEl.textContent.trim();
                        // Extract just the class part (e.g., "XII RPL" from "NIS: 123 | XII RPL | Guild")
                        const match = classText.match(/(X{1,2}I{0,3}\s+\w+)/);
                        if (match) {
                            kelas = match[1];
                        }
                    }
                }

                // Get guild if not from attribute
                if (!guild) {
                    const guildEl = firstCell.querySelector('.inline-block.px-2, [data-student-guild]');
                    if (guildEl) {
                        guild = guildEl.textContent.trim();
                    }
                }
            }
        }

        console.log(`Row ${index}: Final - name="${studentName}", class="${kelas}", guild="${guild}"`);

        // If still no name, skip this row
        if (!studentName) {
            console.log(`Row ${index}: Skipped (no student name found)`);
            return;
        }

        // Filter by selected classes
        if (selectedClasses.length > 0 && kelas && !selectedClasses.includes(kelas)) {
            console.log(`Row ${index}: Skipped (class ${kelas} not in selection)`);
            return;
        }

        // Build student object
        const studentObj = {
            'Nama': studentName,
            'Kelas': kelas || '',
            'Guild': guild || ''
        };

        // Column index mapping
        const columnIndexMap = {
            'level': 1,
            'xp': 2,
            'hp': 3,
            'koin': 4,
            'catatan': 5
        };

        const columnNameMap = {
            'level': 'Level',
            'xp': 'XP',
            'hp': 'HP',
            'koin': 'Koin',
            'catatan': 'Catatan'
        };

        // Add selected columns
        selectedColumns.forEach(colKey => {
            const colIndex = columnIndexMap[colKey];
            const colName = columnNameMap[colKey];

            if (colIndex && row.cells[colIndex]) {
                const cell = row.cells[colIndex];
                let value = '';

                // Try data attribute first
                const dataAttr = `data-${colKey}`;
                if (cell.hasAttribute(dataAttr)) {
                    value = cell.getAttribute(dataAttr);
                } else {
                    value = cell.textContent.trim();
                }

                // Convert numeric values (except catatan)
                if (colKey !== 'catatan' && value) {
                    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
                    value = isNaN(numValue) ? 0 : numValue;
                }

                studentObj[colName] = value || (colKey === 'catatan' ? '' : 0);
            }
        });

        console.log(`Row ${index}: ✓ Added - ${studentName} (${kelas})`);
        data.push(studentObj);
    });

    console.log(`Total students extracted: ${data.length}`);
    console.log('=== Extraction complete ===');
    return data;
}

/**
 * Creates Excel workbook with formatted data
 */
function createExcelWorkbook(studentData, selectedColumns) {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare header row with title and date
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    // Create worksheet data
    const wsData = [
        ['DREAMY - Laporan Data Siswa'], // Row 1: Title
        [`Tanggal: ${dateStr}`],          // Row 2: Date
        []                                 // Row 3: Empty
    ];

    // Add data rows
    if (studentData.length > 0) {
        // Add to worksheet
        const ws = XLSX.utils.json_to_sheet(studentData, {
            origin: 'A4' // Start data from row 4
        });

        // Add title rows manually
        XLSX.utils.sheet_add_aoa(ws, wsData, { origin: 'A1' });

        // Apply column widths
        const colWidths = [];
        const headers = Object.keys(studentData[0]);

        headers.forEach(header => {
            let maxWidth = header.length;
            studentData.forEach(row => {
                const cellValue = String(row[header] || '');
                maxWidth = Math.max(maxWidth, cellValue.length);
            });
            colWidths.push({ wch: Math.min(maxWidth + 2, 50) }); // Max 50 chars
        });

        ws['!cols'] = colWidths;

        // Merge cells for title
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title row
            { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }  // Date row
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    }

    return wb;
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Export Excel button listener
    const exportExcelBtn = document.getElementById('export-excel-button');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            openExportSettingsModal();

            // Add Excel export button to modal if not exists
            setTimeout(() => {
                addExcelExportButtonToModal();
            }, 100);
        });
    }
});

/**
 * Adds Excel export button to print settings modal
 */
function addExcelExportButtonToModal() {
    const modal = document.getElementById('print-settings-modal');
    if (!modal) return;

    // Check if Excel button already exists
    if (document.getElementById('excel-export-btn')) return;

    // Find the modal footer with buttons
    const printBtn = document.getElementById('print-settings-print-btn');
    if (!printBtn) return;

    const footer = printBtn.parentElement;

    // Create Excel Export button
    const excelBtn = document.createElement('button');
    excelBtn.id = 'excel-export-btn';
    excelBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg';
    excelBtn.innerHTML = '<i data-lucide="file-spreadsheet" class="w-4 h-4 inline mr-2"></i>Export Excel';

    excelBtn.addEventListener('click', handleExcelExport);

    // Insert before print button
    footer.insertBefore(excelBtn, printBtn);

    // Re-initialize lucide icons for the new button
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
