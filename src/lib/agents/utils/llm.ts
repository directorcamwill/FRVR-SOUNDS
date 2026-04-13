import { LLMResponse } from "@/types/agent";

export async function callLLM(opts: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || "openai";

  if (provider === "anthropic") {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: read from file (dotenv can't handle -- in values)
      try {
        const fs = await import("fs");
        const path = await import("path");
        apiKey = fs.readFileSync(path.join(process.cwd(), ".anthropic_key"), "utf-8").trim();
      } catch { /* ignore */ }
    }
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local or .anthropic_key file.");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: opts.model || "claude-sonnet-4-20250514",
      max_tokens: opts.maxTokens || 2000,
      temperature: opts.temperature ?? 0.3,
      system: opts.systemPrompt,
      messages: [{ role: "user", content: opts.userMessage }],
    });
    let text =
      response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code fences — Claude often wraps JSON in ```json ... ```
    if (opts.jsonMode && text.includes("```")) {
      text = text.replace(/^[\s\S]*?```(?:json)?\s*\n?/, "").replace(/\n?```[\s\S]*$/, "");
    }
    return {
      content: text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  // Default: OpenAI
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: opts.model || "gpt-4o-mini",
    max_tokens: opts.maxTokens || 2000,
    temperature: opts.temperature ?? 0.3,
    response_format: opts.jsonMode ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userMessage },
    ],
  });
  return {
    content: response.choices[0].message.content || "",
    tokensUsed: response.usage?.total_tokens || 0,
  };
}
