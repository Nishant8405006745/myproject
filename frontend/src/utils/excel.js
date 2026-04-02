import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export any array of objects to an Excel (.xlsx) file.
 * @param {Array}  data     - Array of plain objects
 * @param {string} sheetName - Name of the sheet tab
 * @param {string} fileName  - Download filename (without extension)
 */
export function exportToExcel(data, sheetName, fileName) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-width columns
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length)) + 2
  }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Read an Excel/CSV file from a file input and return parsed rows as objects.
 * @param {File}     file       - The File object from an input[type=file]
 * @param {Function} onSuccess  - Callback(rows: Array<Object>)
 * @param {Function} onError    - Callback(errorMessage: string)
 */
export function importFromExcel(file, onSuccess, onError) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data     = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      onSuccess(rows);
    } catch (err) {
      onError('Failed to parse file: ' + err.message);
    }
  };
  reader.onerror = () => onError('Failed to read file.');
  reader.readAsArrayBuffer(file);
}
