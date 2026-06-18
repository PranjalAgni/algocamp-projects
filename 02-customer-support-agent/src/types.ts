/**
 * Shared TypeScript types for the customer support agent
 */

// Order data structure
export interface Order {
  orderId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: string[];
  total: number;
  orderDate: string;
  trackingNumber: string | null;
}

// FAQ entry structure
export interface FAQ {
  question: string;
  answer: string;
  tags: string[];
}

// Tool definition schema (compatible with OpenAI function calling)
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// Tool call request
export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

// Tool execution result
export interface ToolResult {
  name: string;
  result: any;
  error?: string;
}

// Agent iteration state
export interface AgentIteration {
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  shouldContinue: boolean;
}

// Final agent response
export interface AgentResponse {
  answer: string;
  iterations: AgentIteration[];
  mode: 'live' | 'mock';
}
