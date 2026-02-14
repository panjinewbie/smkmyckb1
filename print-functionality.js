// ========================================
// PRINT SETTINGS MODAL FUNCTIONALITY
// ========================================

/**
 * Opens the print settings modal and populates class checkboxes
 */
function openPrintSettingsModal() {
    const modal = document.getElementById('print-settings-modal');
    const classCheckboxesContainer = document.getElementById('print-class-checkboxes');

    if (!modal || !classCheckboxesContainer) return;

    // Get all unique classes from student table
    const studentRows = document.querySelectorAll('#student-table-body tr');
    const uniqueClasses = new Set();

    studentRows.forEach(row => {
        // Try to find class from data attribute first
        let kelasCell = row.querySelector('[data-kelas]');
        let kelas = kelasCell ? kelasCell.getAttribute('data-kelas') : null;

        // If no data attribute, try to extract from the student info cell
        if (!kelas) {
            const studentInfoCell = row.querySelector('td:first-child');
            if (studentInfoCell) {
                // Look for text that matches class patterns (X RPL, XI RPL, XII RPL, X DPB, XI DPB, XII DPB)
                const text = studentInfoCell.textContent;
                const classMatch = text.match(/(X{1,2}I{0,2})\s+(RPL|DPB)/);
                if (classMatch) {
                    kelas = classMatch[0];
                }
            }
        }

        if (kelas) {
            uniqueClasses.add(kelas);
            // Store class on the row for later filtering
            row.setAttribute('data-student-kelas', kelas);
        }
    });

    // Generate class checkboxes
    if (uniqueClasses.size > 0) {
        classCheckboxesContainer.innerHTML = '';
        Array.from(uniqueClasses).sort().forEach(kelas => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-2 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" class="print-class-checkbox rounded" value="${kelas}" checked>
                <span class="text-sm">${kelas}</span>
            `;
            classCheckboxesContainer.appendChild(label);
        });
    } else {
        classCheckboxesContainer.innerHTML = '<p class="text-sm text-gray-400 col-span-full">Tidak ada data siswa</p>';
    }

    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
}

/**
 * Closes the print settings modal
 */
function closePrintSettingsModal() {
    const modal = document.getElementById('print-settings-modal');
    if (!modal) return;

    modal.classList.add('opacity-0');
    modal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

/**
 * Handles the custom print functionality with selected filters
 */
function handleCustomPrint() {
    // Get selected classes
    const classCheckboxes = document.querySelectorAll('.print-class-checkbox:checked');
    const selectedClasses = Array.from(classCheckboxes).map(cb => cb.value);

    // Get selected columns
    const columnCheckboxes = document.querySelectorAll('.print-column-checkbox:checked');
    const selectedColumns = Array.from(columnCheckboxes).map(cb => cb.value);

    // Hide rows that don't match selected classes
    const studentRows = document.querySelectorAll('#student-table-body tr');
    studentRows.forEach(row => {
        const kelas = row.getAttribute('data-student-kelas');
        if (kelas) {
            if (selectedClasses.length > 0 && !selectedClasses.includes(kelas)) {
                row.classList.add('print-hide-row');
            } else {
                row.classList.remove('print-hide-row');
            }
        }
    });

    // Hide columns that are not selected
    const table = document.querySelector('#student-table-body').closest('table');
    const allRows = table.querySelectorAll('tr');

    console.log('Selected columns:', selectedColumns);

    // Column index mapping (based on table structure)
    // 0: Siswa, 1: Level, 2: XP, 3: HP, 4: Koin, 5: Catatan, 6: Aksi
    const columnIndexMap = {
        'level': 1,
        'xp': 2,
        'hp': 3,
        'koin': 4,
        'catatan': 5
    };

    // First, reset all columns - remove print-hide-column from all cells
    allRows.forEach(row => {
        for (let i = 0; i < row.children.length; i++) {
            const cell = row.children[i];
            if (cell) {
                cell.classList.remove('print-hide-column');
            }
        }
    });

    // Process each column based on selection
    Object.keys(columnIndexMap).forEach(columnName => {
        const columnIndex = columnIndexMap[columnName];
        const isSelected = selectedColumns.includes(columnName);

        console.log(`Column ${columnName} (index ${columnIndex}): ${isSelected ? 'SELECTED' : 'NOT SELECTED'}`);

        allRows.forEach(row => {
            const cell = row.children[columnIndex];
            if (cell) {
                if (isSelected) {
                    // Column IS selected - make sure it's visible
                    cell.classList.remove('print-hide-column');
                    cell.classList.remove('no-print');
                } else {
                    // Column is NOT selected - hide it
                    cell.classList.add('print-hide-column');
                }
            }
        });
    });

    // Always hide the "Aksi" column (index 6)
    allRows.forEach(row => {
        const aksiCell = row.children[6];
        if (aksiCell) {
            aksiCell.classList.add('print-hide-column');
        }
    });

    // Set print date
    const printDateDisplay = document.getElementById('print-date-display');
    if (printDateDisplay) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        printDateDisplay.textContent = `Tanggal Cetak: ${day}/${month}/${year}`;
    }

    // Close modal
    closePrintSettingsModal();

    // Trigger print dialog
    setTimeout(() => {
        window.print();

        // Restore table state after print dialog closes
        setTimeout(() => {
            // Remove all print-hide classes
            document.querySelectorAll('.print-hide-row').forEach(el => {
                el.classList.remove('print-hide-row');
            });
            document.querySelectorAll('.print-hide-column').forEach(el => {
                el.classList.remove('print-hide-column');
            });

            // Restore no-print classes to column headers (except Siswa which is always visible)
            const table = document.querySelector('#student-table-body').closest('table');
            const headerRow = table.querySelector('thead tr');
            if (headerRow) {
                // Add back no-print to columns 1-6 (Level, XP, HP, Koin, Catatan, Aksi)
                for (let i = 1; i <= 6; i++) {
                    const headerCell = headerRow.children[i];
                    if (headerCell && !headerCell.classList.contains('no-print')) {
                        headerCell.classList.add('no-print');
                    }
                }
            }
        }, 500);
    }, 100);
}

// ========================================
// PRINT MODAL EVENT LISTENERS
// ========================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrintFunctionality);
} else {
    initPrintFunctionality();
}

function initPrintFunctionality() {
    // Print button opens modal
    const printButton = document.getElementById('print-student-button');
    if (printButton) {
        printButton.addEventListener('click', openPrintSettingsModal);
    }

    // Close button
    const closeButton = document.getElementById('close-print-settings-modal-button');
    if (closeButton) {
        closeButton.addEventListener('click', closePrintSettingsModal);
    }

    // Cancel button
    const cancelButton = document.getElementById('print-settings-cancel-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', closePrintSettingsModal);
    }

    // Print Now button
    const printNowButton = document.getElementById('print-settings-print-btn');
    if (printNowButton) {
        printNowButton.addEventListener('click', handleCustomPrint);
    }

    // Select All Classes checkbox
    const selectAllClasses = document.getElementById('select-all-classes');
    if (selectAllClasses) {
        selectAllClasses.addEventListener('change', (e) => {
            const classCheckboxes = document.querySelectorAll('.print-class-checkbox');
            classCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }

    // Select All Columns checkbox
    const selectAllColumns = document.getElementById('select-all-columns');
    if (selectAllColumns) {
        selectAllColumns.addEventListener('change', (e) => {
            const columnCheckboxes = document.querySelectorAll('.print-column-checkbox');
            columnCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }

    // Close modal when clicking backdrop
    const modal = document.getElementById('print-settings-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePrintSettingsModal();
            }
        });
    }
}
