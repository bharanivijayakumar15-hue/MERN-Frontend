import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.API_PORT || 3001);
const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json');
const products = [
  { id: 1, name: 'Cuddly Teddy Bear', category: 'Soft Toys', price: 499, oldPrice: 599, discount: 17, image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600' },
  { id: 2, name: 'Remote Control Car', category: 'Cars & Vehicles', price: 799, oldPrice: 999, discount: 20, image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600' },
  { id: 3, name: 'Colourful Building Blocks', category: 'Building Toys', price: 599, oldPrice: 749, discount: 20, image: 'https://images.unsplash.com/photo-1599623560574-39d485900c95?w=600' },
  { id: 4, name: 'Kids Play Set', category: 'Learning Toys', price: 399, oldPrice: 499, discount: 20, image: 'https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=600' },
  { id: 5, name: 'Cute Plush Bunny', category: 'Soft Toys', price: 549, oldPrice: 649, discount: 15, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600' },
  { id: 6, name: 'Racing Toy Car', category: 'Cars & Vehicles', price: 349, oldPrice: 449, discount: 22, image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600' },
  { id: 7, name: 'Creative Building Kit', category: 'Building Toys', price: 899, oldPrice: 1099, discount: 18, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600' },
  { id: 8, name: 'Rainbow Learning Toy', category: 'Learning Toys', price: 699, oldPrice: 799, discount: 12, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600' },
  { id: 9, name: 'Teddy Gift Set', category: 'Soft Toys', price: 999, oldPrice: 1299, discount: 23, image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600' },
  { id: 10, name: 'Mini Truck Toy', category: 'Cars & Vehicles', price: 299, oldPrice: 399, discount: 25, image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600' },
  { id: 11, name: 'Stacking Blocks Set', category: 'Building Toys', price: 449, oldPrice: 549, discount: 18, image: 'https://images.unsplash.com/photo-1599623560574-39d485900c95?w=600' },
  { id: 12, name: 'Fun Activity Toy', category: 'Learning Toys', price: 599, oldPrice: 699, discount: 14, image: 'https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=600' }
];

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let database;
let writeQueue = Promise.resolve();

async function loadDatabase() {
  try {
    database = JSON.parse(await readFile(dataPath, 'utf8'));
    if (!Array.isArray(database.contacts) || !Array.isArray(database.orders)) {
      throw new Error('The local API data file has an invalid format.');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    database = { contacts: [], orders: [] };
    await writeFile(dataPath, JSON.stringify(database, null, 2));
  }
}

function saveRecord(collection, record) {
  const operation = writeQueue.then(async () => {
    const updated = { ...database, [collection]: [...database[collection], record] };
    await writeFile(dataPath, JSON.stringify(updated, null, 2));
    database = updated;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new ApiError(413, 'Request body is too large.');
  }
  let value;
  try {
    value = JSON.parse(body);
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }
  return value;
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(400, `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/products') {
      sendJson(response, 200, products);
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/contact') {
      const body = await readJson(request);
      const email = requiredText(body.email, 'Email', 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
      const contact = {
        id: randomUUID(),
        name: requiredText(body.name, 'Name', 100),
        email,
        subject: requiredText(body.subject, 'Subject', 150),
        message: requiredText(body.message, 'Message', 5000),
        createdAt: new Date().toISOString()
      };
      await saveRecord('contacts', contact);
      sendJson(response, 201, { message: 'Your message has been received.' });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readJson(request);
      if (!Array.isArray(body.items) || !body.items.length) throw new ApiError(400, 'An order must contain at least one item.');
      const items = body.items.map(item => {
        if (!item || typeof item !== 'object') throw new ApiError(400, 'Order contains an invalid item.');
        const product = products.find(candidate => candidate.id === item.productId);
        if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
          throw new ApiError(400, 'Order contains an invalid product or quantity.');
        }
        return { productId: product.id, name: product.name, quantity: item.quantity, unitPrice: product.price };
      });
      const order = {
        id: randomUUID(),
        items,
        total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        createdAt: new Date().toISOString()
      };
      await saveRecord('orders', order);
      sendJson(response, 201, { message: 'Order created.', order });
      return;
    }
    sendJson(response, 404, { error: 'API route not found.' });
  } catch (error) {
    if (error instanceof ApiError) {
      sendJson(response, error.status, { error: error.message });
      return;
    }
    console.error('API request failed:', error);
    sendJson(response, 500, { error: 'The server could not complete the request.' });
  }
});

await loadDatabase();
server.listen(port, () => console.log(`PlayPop API listening on http://localhost:${port}`));
