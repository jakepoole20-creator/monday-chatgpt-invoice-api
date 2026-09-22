import 'dotenv/config';
import express from 'express';
import { fetchItemWithSubitems, uploadFileToItem } from './services/monday.js';
import { buildInvoiceData } from './services/openaiInvoice.js';
import { createInvoicePdf } from './services/pdfInvoice.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

const port = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/monday/invoice', async (req, res) => {
  try {
    if (process.env.WEBHOOK_SECRET && req.query.secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorised webhook request.' });
    }

    const itemId = extractMondayItemId(req.body);
    if (!itemId) {
      return res.status(400).json({ error: 'Missing Monday item ID.' });
    }

    const mondayItem = await fetchItemWithSubitems(itemId);
    const invoice = await buildInvoiceData(mondayItem);
    const pdf = await createInvoicePdf(invoice);

    const uploadResult = await uploadFileToItem({
      itemId,
      columnId: process.env.MONDAY_FILES_COLUMN_ID,
      filePath: pdf.path,
    });

    res.json({
      ok: true,
      itemId,
      invoiceNumber: invoice.invoiceNumber,
      uploadedFile: uploadResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Invoice generation failed.',
      detail: error.message,
    });
  }
});

function extractMondayItemId(body) {
  return body?.event?.pulseId || body?.event?.itemId || body?.pulseId || body?.itemId;
}

app.listen(port, () => {
  console.log(`Monday invoice API listening on port ${port}`);
});
