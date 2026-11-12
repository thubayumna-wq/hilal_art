import { jsPDF } from 'jspdf';
import { StoreSettings, Transaction } from '../types';

export const formatCurrency = (amount: number): string => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const formatDateIndonesian = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Generate and download a PDF receipt with thermal printer dimensions (58mm or 80mm).
 */
export const downloadReceiptPDF = (
  transaction: Transaction,
  settings: StoreSettings,
  paperWidth: '58mm' | '80mm' = '80mm'
) => {
  const is58 = paperWidth === '58mm';
  const widthMm = is58 ? 58 : 80;
  
  // Estimate height based on item count: base height + items
  const estimatedHeightMm = Math.max(140, 95 + transaction.items.length * 11 + (transaction.notes ? 15 : 0));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, estimatedHeightMm],
  });

  const margin = 4;
  const contentWidth = widthMm - margin * 2;
  const centerX = widthMm / 2;
  let y = 7;

  // Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(is58 ? 10 : 12);
  doc.text(settings.storeName.toUpperCase(), centerX, y, { align: 'center' });
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(is58 ? 6.5 : 7.5);
  doc.text('HILALPOS — SATU SISTEM, SEMUA USAHA', centerX, y, { align: 'center' });
  y += 3.5;

  // Store Address (split into wrapped text)
  doc.setFontSize(is58 ? 6 : 7);
  const addressLines = doc.splitTextToSize(settings.address, contentWidth);
  doc.text(addressLines, centerX, y, { align: 'center' });
  y += addressLines.length * 3 + 1;

  if (settings.phone) {
    doc.text(`Telp: ${settings.phone}`, centerX, y, { align: 'center' });
    y += 3.5;
  }

  // Divider
  doc.setFontSize(is58 ? 6 : 7);
  doc.text('-'.repeat(is58 ? 36 : 48), centerX, y, { align: 'center' });
  y += 3.5;

  // Transaction Meta
  doc.setFontSize(is58 ? 6.5 : 7.5);
  doc.text(`No. Trx : ${transaction.invoiceNumber}`, margin, y);
  y += 3.2;
  doc.text(`Tanggal : ${formatDateIndonesian(transaction.date)}`, margin, y);
  y += 3.2;
  doc.text(`Kasir   : ${transaction.cashierName || settings.activeCashier}`, margin, y);
  doc.text(`Admin : ${transaction.adminName || settings.adminName}`, widthMm - margin, y, { align: 'right' });
  y += 3.2;

  if (transaction.customerName) {
    doc.text(`Pelanggan: ${transaction.customerName}`, margin, y);
    y += 3.2;
  }

  // Divider
  doc.text('-'.repeat(is58 ? 36 : 48), centerX, y, { align: 'center' });
  y += 3.5;

  // Items
  doc.setFont('courier', 'bold');
  doc.setFontSize(is58 ? 6.5 : 7.5);
  doc.text('ITEM', margin, y);
  doc.text('TOTAL', widthMm - margin, y, { align: 'right' });
  y += 3.5;
  doc.setFont('courier', 'normal');

  transaction.items.forEach((item) => {
    const itemName = item.variantName && item.variantName !== item.name
      ? `${item.name} (${item.variantName})`
      : item.name;

    const wrappedName = doc.splitTextToSize(itemName, contentWidth - 4);
    doc.text(wrappedName, margin, y);
    y += wrappedName.length * 3;

    const qtyPriceStr = `  ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)}`;
    const subtotalStr = formatCurrency(item.subtotal);

    doc.text(qtyPriceStr, margin, y);
    doc.text(subtotalStr, widthMm - margin, y, { align: 'right' });
    y += 3.5;
  });

  // Divider
  doc.text('-'.repeat(is58 ? 36 : 48), centerX, y, { align: 'center' });
  y += 3.5;

  // Subtotal & Calculations
  const printRow = (label: string, value: string, bold = false) => {
    if (bold) doc.setFont('courier', 'bold');
    else doc.setFont('courier', 'normal');
    doc.text(label, margin, y);
    doc.text(value, widthMm - margin, y, { align: 'right' });
    y += 3.5;
  };

  printRow('Subtotal', formatCurrency(transaction.subtotal));

  if (transaction.discountAmount > 0) {
    printRow('Diskon', `-${formatCurrency(transaction.discountAmount)}`);
  }

  if (transaction.taxAmount > 0) {
    printRow(`Pajak PPN (${(transaction.taxRate * 100).toFixed(0)}%)`, formatCurrency(transaction.taxAmount));
  }

  // Grand Total in bold
  doc.setFontSize(is58 ? 7.5 : 8.5);
  printRow('TOTAL BELANJA', formatCurrency(transaction.totalAmount), true);
  doc.setFontSize(is58 ? 6.5 : 7.5);

  // Payment Breakdown
  const methodLabel = transaction.paymentMethod.toUpperCase();
  printRow(`Bayar (${methodLabel})`, formatCurrency(transaction.amountPaid));
  printRow('Kembalian', formatCurrency(transaction.changeAmount));

  // Double divider
  doc.text('='.repeat(is58 ? 36 : 48), centerX, y, { align: 'center' });
  y += 4;

  // Footer Message
  doc.setFont('courier', 'normal');
  doc.setFontSize(is58 ? 6 : 7);
  const footerLines = settings.footerReceiptMsg.split('\n');
  footerLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    doc.text(wrapped, centerX, y, { align: 'center' });
    y += wrapped.length * 3;
  });

  y += 2;
  doc.setFontSize(is58 ? 5.5 : 6.5);
  doc.text(`[ ${transaction.invoiceNumber} ]`, centerX, y, { align: 'center' });

  // Save PDF
  doc.save(`Struk-${transaction.invoiceNumber}.pdf`);
};

/**
 * Export sales transaction report to CSV
 */
export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const headers = [
    'No. Invoice',
    'Tanggal',
    'Kasir',
    'Admin',
    'Pelanggan',
    'Metode Bayar',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Pajak (Rp)',
    'Total (Rp)',
    'Status'
  ];

  const rows = transactions.map((t) => [
    `"${t.invoiceNumber}"`,
    `"${t.date}"`,
    `"${t.cashierName}"`,
    `"${t.adminName}"`,
    `"${t.customerName || 'Umum'}"`,
    `"${t.paymentMethod}"`,
    t.subtotal,
    t.discountAmount,
    t.taxAmount,
    t.totalAmount,
    `"${t.status}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Laporan-Penjualan-HILALPOS-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
