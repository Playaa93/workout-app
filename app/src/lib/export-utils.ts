/** Shared export utilities for CSV, Excel, JSON, PDF exports */

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fmtDateFR(d: Date | string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtTimeFR(d: Date | string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(mins: number): string {
  if (mins >= 60) return `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')}`;
  return `${mins}min`;
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function writeExcelFile(
  headers: string[],
  rows: (string | number | null)[][],
  sheetName: string,
  fileName: string,
) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Auto-size columns
  const colWidths = new Array(headers.length).fill(0);
  for (let i = 0; i < headers.length; i++) colWidths[i] = headers[i].length;
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const len = String(row[i] ?? '').length;
      if (len > colWidths[i]) colWidths[i] = len;
    }
  }
  ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w + 2, 30) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export function openPrintableHtml(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
