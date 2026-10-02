export interface AgentToolCallResult {
  toolName: string;
  purpose: string;
  status: 'success' | 'warning' | 'error';
  observation: string;
  data: unknown;
  timestamp: string;
}

export interface AgentTool {
  name: string;
  description: string;
  execute(params?: Record<string, unknown>): Promise<AgentToolCallResult>;
}
