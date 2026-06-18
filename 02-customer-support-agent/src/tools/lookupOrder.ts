/**
 * Order lookup tool - retrieves order details from the order database
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Order, ToolDefinition } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load orders data (in-memory database)
const ordersPath = join(__dirname, '../data/orders.json');
const orders: Order[] = JSON.parse(readFileSync(ordersPath, 'utf-8'));

/**
 * Tool definition for OpenAI function calling
 */
export const lookupOrderTool: ToolDefinition = {
  name: 'lookupOrder',
  description: 'Look up order details by order ID. Returns status, items, total, and tracking information.',
  parameters: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'The order ID to look up (e.g., ORD-001)',
      },
    },
    required: ['orderId'],
  },
};

/**
 * Execute the order lookup
 */
export function lookupOrder(orderId: string): Order | { error: string } {
  // Validate input
  if (!orderId || typeof orderId !== 'string') {
    return { error: 'Invalid orderId: must be a non-empty string' };
  }

  // Search for the order
  const order = orders.find(o => o.orderId === orderId);

  if (!order) {
    return { error: `Order ${orderId} not found` };
  }

  return order;
}
