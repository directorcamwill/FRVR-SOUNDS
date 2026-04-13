export interface AgentResult {
  agent: string;
  action: string;
  summary: string;
  data: Record<string, unknown>;
  alerts?: { title: string; message: string; severity: string }[];
  tokensUsed: number;
  durationMs: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
}
