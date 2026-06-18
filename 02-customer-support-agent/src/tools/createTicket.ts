/**
 * Ticket creation tool - creates support tickets for issues requiring human attention
 */

import type { ToolDefinition } from '../types.js';

/**
 * Tool definition for OpenAI function calling
 */
export const createTicketTool: ToolDefinition = {
  name: 'createTicket',
  description: 'Create a support ticket for issues that require human assistance (bugs, complex problems, escalations).',
  parameters: {
    type: 'object',
    properties: {
      issue: {
        type: 'string',
        description: 'Description of the issue or problem',
      },
      priority: {
        type: 'string',
        description: 'Priority level of the ticket',
        enum: ['low', 'medium', 'high'],
      },
    },
    required: ['issue'],
  },
};

/**
 * Execute ticket creation
 * In production, this would integrate with a real ticketing system (Zendesk, Jira, etc.)
 */
export function createTicket(
  issue: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): { ticketId: string; status: string } | { error: string } {
  // Validate input
  if (!issue || typeof issue !== 'string') {
    return { error: 'Invalid issue: must be a non-empty string' };
  }

  // Generate a ticket ID (in production, this would come from the ticketing system)
  const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Log the ticket (in production, this would be an API call)
  console.log(`[Ticket Created] ID: ${ticketId}, Priority: ${priority}, Issue: ${issue}`);

  return {
    ticketId,
    status: 'created',
  };
}
