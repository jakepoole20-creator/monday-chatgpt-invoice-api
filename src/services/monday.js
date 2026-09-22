import fs from 'node:fs';
import FormData from 'form-data';

const mondayApiUrl = 'https://api.monday.com/v2';

export async function fetchItemWithSubitems(itemId) {
  const query = `
    query GetItem($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        board { id name }
        column_values {
          id
          text
          value
          column { title type }
        }
        subitems {
          id
          name
          column_values {
            id
            text
            value
            column { title type }
          }
        }
      }
    }
  `;

  const data = await mondayGraphql(query, { itemId: [String(itemId)] });
  const item = data.items?.[0];

  if (!item) {
    throw new Error(`Monday item ${itemId} was not found.`);
  }

  return item;
}

export async function uploadFileToItem({ itemId, columnId, filePath }) {
  if (!columnId) {
    throw new Error('MONDAY_FILES_COLUMN_ID is not set.');
  }

  const mutation = `
    mutation AddFile($file: File!) {
      add_file_to_column(item_id: ${Number(itemId)}, column_id: "${escapeGraphql(columnId)}", file: $file) {
        id
      }
    }
  `;

  const form = new FormData();
  form.append('query', mutation);
  form.append('variables[file]', fs.createReadStream(filePath));

  const response = await fetch(mondayApiUrl, {
    method: 'POST',
    headers: {
      Authorization: process.env.MONDAY_API_TOKEN,
      ...form.getHeaders(),
    },
    body: form,
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(`Monday file upload failed: ${JSON.stringify(json.errors || json)}`);
  }

  return json.data.add_file_to_column;
}

async function mondayGraphql(query, variables = {}) {
  const response = await fetch(mondayApiUrl, {
    method: 'POST',
    headers: {
      Authorization: process.env.MONDAY_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(`Monday GraphQL failed: ${JSON.stringify(json.errors || json)}`);
  }

  return json.data;
}

function escapeGraphql(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
