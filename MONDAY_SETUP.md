# Monday Board Setup

## Minimum Columns Needed

Your main item should hold the customer and job-level details, for example:

| Purpose | Example Monday Column |
| --- | --- |
| Client name | Client |
| Site address | Site Address |
| Job reference | Job Ref |
| Purchase order | PO Number |
| Works date | Date |
| Quote/invoice status | Status |
| Output file | Files |

Your subitems should hold the chargeable invoice lines, for example:

| Purpose | Example Subitem Column |
| --- | --- |
| Description | Item / TM Type / Description |
| Quantity | Quantity / Days / Shifts |
| Unit | Unit |
| Rate | Rate |
| Total | Total |

The API can still work if your column names are different, because it sends the full Monday item and subitem data to ChatGPT for extraction. For best reliability, keep the money columns clearly named.

## Monday Automation

Use a Monday automation/webhook that calls:

```text
https://your-api-domain.com/monday/invoice?secret=change_me
```

The payload needs to include the Monday item ID. Monday commonly sends:

```json
{
  "event": {
    "pulseId": 123456789
  }
}
```

## Files Column ID

The API needs the actual files column ID, not the visible title. In Monday, open the column settings or use the Monday API to confirm it. Common IDs look like:

```text
files
files__1
file
```

Set it in `.env`:

```text
MONDAY_FILES_COLUMN_ID=files
```

## Recommended Live Safeguards

- Only accept requests with the `WEBHOOK_SECRET`.
- Add a Monday status update after success or failure.
- Add a human approval status before sending invoice PDFs externally.
- Lock down the Monday API token to the least access needed.
- Use a fixed invoice numbering rule before going live.

