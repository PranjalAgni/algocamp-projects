/**
 * Mock planner - keyword-based tool selection for offline mode
 * Demonstrates the agent loop pattern without requiring an API key
 */

import type { ToolCall, ToolResult, AgentIteration } from '../types.js';

/**
 * Mock planner using keyword matching to select tools
 * This is deterministic - same query always produces same tool calls
 */
export async function mockPlanner(
  query: string,
  previousIterations: AgentIteration[]
): Promise<AgentIteration> {
  const queryLower = query.toLowerCase();
  const toolCalls: ToolCall[] = [];

  // If we already called tools once, we're done (simple mock - no multi-step reasoning)
  if (previousIterations.length > 0) {
    return {
      toolCalls: [],
      toolResults: [],
      shouldContinue: false,
    };
  }

  // Pattern matching for order lookup
  // Matches: "order ORD-001", "status of ORD-002", "check order"
  const orderMatch = queryLower.match(/ord-\d+/i);
  if (orderMatch || queryLower.includes('order') || queryLower.includes('status')) {
    const orderId = orderMatch ? orderMatch[0].toUpperCase() : 'ORD-001'; // Default for generic queries
    toolCalls.push({
      name: 'lookupOrder',
      arguments: { orderId },
    });
  }

  // Pattern matching for FAQ search
  // Matches: "refund", "policy", "shipping", "how do I", "what is", etc.
  const faqKeywords = [
    'refund', 'policy', 'shipping', 'cancel', 'payment', 'trial',
    'support', 'contact', 'help', 'hours', 'domain', 'secure',
    'export', 'discount', 'password', 'how', 'what', 'can i',
    'upgrade', 'limits', 'commercial'
  ];

  if (faqKeywords.some(keyword => queryLower.includes(keyword))) {
    // Extract the main topic for search
    let searchQuery = query;

    // Try to extract specific topic
    if (queryLower.includes('refund')) searchQuery = 'refund';
    else if (queryLower.includes('shipping')) searchQuery = 'shipping';
    else if (queryLower.includes('policy')) searchQuery = 'policy';
    else if (queryLower.includes('cancel')) searchQuery = 'cancel subscription';
    else if (queryLower.includes('upgrade')) searchQuery = 'upgrade plan';
    else if (queryLower.includes('payment')) searchQuery = 'payment methods';

    toolCalls.push({
      name: 'searchFAQ',
      arguments: { query: searchQuery },
    });
  }

  // Pattern matching for ticket creation
  // Matches: "bug", "error", "broken", "problem", "issue", "doesn't work"
  const issueKeywords = ['bug', 'error', 'broken', 'problem', 'issue', "doesn't work", 'not working', 'crash'];
  if (issueKeywords.some(keyword => queryLower.includes(keyword))) {
    toolCalls.push({
      name: 'createTicket',
      arguments: {
        issue: query,
        priority: queryLower.includes('urgent') || queryLower.includes('critical') ? 'high' : 'medium',
      },
    });
  }

  return {
    toolCalls,
    toolResults: [], // Will be filled by agent executor
    shouldContinue: toolCalls.length > 0,
  };
}

/**
 * Generate final response from tool results (mock mode)
 */
export function mockGenerateResponse(
  query: string,
  iterations: AgentIteration[]
): string {
  if (iterations.length === 0 || iterations[0].toolResults.length === 0) {
    return "I'm not sure how to help with that. Could you please rephrase your question?";
  }

  const results = iterations[0].toolResults;
  let response = '';

  for (const result of results) {
    if (result.error) {
      response += `${result.error}\n\n`;
      continue;
    }

    switch (result.name) {
      case 'lookupOrder': {
        const order = result.result;
        if (order.error) {
          response += `${order.error}\n\n`;
        } else {
          response += `I found order ${order.orderId} for ${order.customerName}.\n`;
          response += `Status: ${order.status}\n`;
          response += `Items: ${order.items.join(', ')}\n`;
          response += `Total: $${order.total}\n`;
          response += `Order date: ${order.orderDate}\n`;
          if (order.trackingNumber) {
            response += `Tracking: ${order.trackingNumber}\n`;
          }
          response += '\n';
        }
        break;
      }

      case 'searchFAQ': {
        const faqs = result.result;
        if (Array.isArray(faqs) && faqs.length > 0) {
          response += `Here's what I found:\n\n`;
          faqs.forEach((faq, index) => {
            response += `${index + 1}. ${faq.question}\n${faq.answer}\n\n`;
          });
        } else {
          response += `I couldn't find any relevant help articles for that topic.\n\n`;
        }
        break;
      }

      case 'createTicket': {
        const ticket = result.result;
        if (ticket.error) {
          response += `${ticket.error}\n\n`;
        } else {
          response += `I've created a support ticket for you: ${ticket.ticketId}\n`;
          response += `Our support team will get back to you shortly.\n\n`;
        }
        break;
      }
    }
  }

  return response.trim() || 'I was unable to process your request.';
}
