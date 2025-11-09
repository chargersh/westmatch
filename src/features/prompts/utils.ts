import { availablePrompts } from "./prompts";

export function getPromptById(promptId: string): string {
  const prompt = availablePrompts.find((p) => p.id === promptId);
  return prompt?.text ?? "";
}
