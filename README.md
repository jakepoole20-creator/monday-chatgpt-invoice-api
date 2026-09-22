# Monday.com to ChatGPT Invoice API

This is a starter API for the workflow:

1. Click a button in Monday.com.
2. Monday sends the item ID to this API.
3. The API fetches the Monday item and all subitems.
4. ChatGPT converts the board data into structured invoice values.
5. The API creates a PDF invoice.
6. The PDF is uploaded back to the Monday item files column.

## Monday Setup

Create a button or automation in Monday that calls:

```text
POST https://your-api-domain.com/monday/invoice?secret=change_me
```

The request body should include the item ID. Common Monday webhook payloads already include this as `event.pulseId`.

Supported body shapes:

```json
{ "event": { "pulseId": 123456789 } }
```

or:

```json
{ "itemId": 123456789 }
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```text
MONDAY_API_TOKEN=
MONDAY_FILES_COLUMN_ID=
OPENAI_API_KEY=
WEBHOOK_SECRET=
```

`MONDAY_FILES_COLUMN_ID` must be the column ID of the files column on the board, not the column title.

## Run Locally

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

## Important Notes

- Monday's button must send an item ID. If your current button cannot do that directly, use a Monday automation webhook.
- The API currently creates a PDF invoice. It can be adapted to create `.docx`, `.xlsx`, or use your branded Vanguard/Quantum templates.
- For live use, host this behind HTTPS, for example Render, Railway, Azure App Service, AWS, or a small VPS.
- Keep `MONDAY_API_TOKEN`, `OPENAI_API_KEY`, and `WEBHOOK_SECRET` private.

