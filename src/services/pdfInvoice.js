import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import PDFDocument from 'pdfkit';

export async function createInvoicePdf(invoice) {
  const safeInvoiceNumber = invoice.invoiceNumber.replace(/[^a-z0-9-_]/gi, '_');
  const filePath = path.join(os.tmpdir(), `${safeInvoiceNumber || 'invoice'}.pdf`);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 44 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    drawInvoice(doc, invoice);
    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { path: filePath };
}

function drawInvoice(doc, invoice) {
  const pageWidth = doc.page.width;
  const rightX = pageWidth - 250;

  doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', 44, 44);
  doc.fontSize(10).font('Helvetica').text(invoice.supplier.name, 44, 78);
  doc.text(invoice.supplier.email || '');
  doc.text(invoice.supplier.phone || '');
  doc.text(invoice.supplier.companyNumber ? `Company No: ${invoice.supplier.companyNumber}` : '');
  doc.text(invoice.supplier.vatNumber ? `VAT No: ${invoice.supplier.vatNumber}` : '');

  doc.fontSize(10).font('Helvetica-Bold').text(`Invoice No: ${invoice.invoiceNumber}`, rightX, 44);
  doc.font('Helvetica').text(`Invoice Date: ${invoice.invoiceDate}`, rightX);
  doc.text(`Due Date: ${invoice.dueDate}`, rightX);
  doc.text(`PO: ${invoice.client.purchaseOrder || 'N/A'}`, rightX);

  doc.moveDown(3);
  doc.font('Helvetica-Bold').text('Bill To', 44);
  doc.font('Helvetica').text(invoice.client.name || '');
  doc.text(invoice.client.address || '');
  doc.text(invoice.client.email || '');

  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Job Details');
  doc.font('Helvetica').text(`Reference: ${invoice.job.reference || 'N/A'}`);
  doc.text(`Site: ${invoice.job.siteAddress || 'N/A'}`);
  doc.text(`Works Date: ${invoice.job.worksDate || 'N/A'}`);
  doc.text(invoice.job.description || '');

  const tableTop = doc.y + 24;
  drawTableHeader(doc, tableTop);

  let y = tableTop + 24;
  for (const item of invoice.lineItems) {
    if (y > 700) {
      doc.addPage();
      y = 44;
      drawTableHeader(doc, y);
      y += 24;
    }

    doc.font('Helvetica').fontSize(9);
    doc.text(item.description, 44, y, { width: 230 });
    doc.text(formatNumber(item.quantity), 290, y, { width: 55, align: 'right' });
    doc.text(item.unit || '', 350, y, { width: 50 });
    doc.text(formatMoney(item.unitRate), 405, y, { width: 70, align: 'right' });
    doc.text(formatMoney(item.lineTotal), 485, y, { width: 70, align: 'right' });
    y += Math.max(24, doc.heightOfString(item.description, { width: 230 }) + 8);
  }

  y += 16;
  drawTotals(doc, y, invoice);

  doc.moveDown(4);
  doc.font('Helvetica-Bold').text('Payment Terms');
  doc.font('Helvetica').text(invoice.supplier.bankDetails || '');
  doc.text(process.env.PAYMENT_TERMS || '');

  if (invoice.notes) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Notes');
    doc.font('Helvetica').text(invoice.notes);
  }
}

function drawTableHeader(doc, y) {
  doc.rect(44, y - 6, 512, 22).fill('#111111');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('Description', 50, y);
  doc.text('Qty', 290, y, { width: 55, align: 'right' });
  doc.text('Unit', 350, y, { width: 50 });
  doc.text('Rate', 405, y, { width: 70, align: 'right' });
  doc.text('Total', 485, y, { width: 70, align: 'right' });
  doc.fillColor('#000000');
}

function drawTotals(doc, y, invoice) {
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal', 405, y, { width: 70 });
  doc.text(formatMoney(invoice.subtotal), 485, y, { width: 70, align: 'right' });
  doc.text(`VAT (${invoice.vatRate}%)`, 405, y + 18, { width: 70 });
  doc.text(formatMoney(invoice.vatTotal), 485, y + 18, { width: 70, align: 'right' });
  doc.font('Helvetica-Bold');
  doc.text('Total', 405, y + 40, { width: 70 });
  doc.text(formatMoney(invoice.grandTotal), 485, y + 40, { width: 70, align: 'right' });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(Number(value || 0));
}
