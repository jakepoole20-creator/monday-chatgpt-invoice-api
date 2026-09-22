import OpenAI from 'openai';

export async function buildInvoiceData(mondayItem) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content: [
          'You convert Monday.com item and subitem data into accurate invoice JSON.',
          'Use subitems as invoice line items where possible.',
          'Extract numerical quantities, rates, VAT, totals, dates, purchase order numbers, client names and addresses from the provided data.',
          'Do not invent missing financial values. Use 0 or null when a value is genuinely missing.',
          'Return JSON only.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          companyDefaults: {
            companyName: process.env.COMPANY_NAME,
            companyEmail: process.env.COMPANY_EMAIL,
            companyPhone: process.env.COMPANY_PHONE,
            companyNumber: process.env.COMPANY_NUMBER,
            vatNumber: process.env.VAT_NUMBER,
            paymentTerms: process.env.PAYMENT_TERMS,
            bankDetails: process.env.BANK_DETAILS,
          },
          mondayItem,
        }),
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'invoice',
        schema: invoiceSchema,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text);
}

const invoiceSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'invoiceNumber',
    'invoiceDate',
    'dueDate',
    'supplier',
    'client',
    'job',
    'lineItems',
    'subtotal',
    'vatRate',
    'vatTotal',
    'grandTotal',
    'notes',
  ],
  properties: {
    invoiceNumber: { type: 'string' },
    invoiceDate: { type: 'string' },
    dueDate: { type: 'string' },
    supplier: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'email', 'phone', 'companyNumber', 'vatNumber', 'bankDetails'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        companyNumber: { type: 'string' },
        vatNumber: { type: 'string' },
        bankDetails: { type: 'string' },
      },
    },
    client: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'address', 'email', 'purchaseOrder'],
      properties: {
        name: { type: 'string' },
        address: { type: 'string' },
        email: { type: 'string' },
        purchaseOrder: { type: 'string' },
      },
    },
    job: {
      type: 'object',
      additionalProperties: false,
      required: ['reference', 'description', 'siteAddress', 'worksDate'],
      properties: {
        reference: { type: 'string' },
        description: { type: 'string' },
        siteAddress: { type: 'string' },
        worksDate: { type: 'string' },
      },
    },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['description', 'quantity', 'unit', 'unitRate', 'lineTotal'],
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          unitRate: { type: 'number' },
          lineTotal: { type: 'number' },
        },
      },
    },
    subtotal: { type: 'number' },
    vatRate: { type: 'number' },
    vatTotal: { type: 'number' },
    grandTotal: { type: 'number' },
    notes: { type: 'string' },
  },
};
