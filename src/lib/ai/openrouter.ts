import "server-only";
export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
export function hasOpenRouter() {
  return Boolean(
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL,
  );
}
// Server-only foundation. No UI or endpoint incurs AI usage until a workflow is selected.
export async function completeWithOpenRouter(messages: AIMessage[]) {
  if (!hasOpenRouter())
    throw new Error("Configure OPENROUTER_API_KEY and OPENROUTER_MODEL first.");
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Recall",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new Error("The AI provider could not complete this request.");
  const result = await response.json();
  const text = result.choices?.[0]?.message?.content;
  if (typeof text !== "string")
    throw new Error("The AI provider returned an invalid response.");
  return text;
}
