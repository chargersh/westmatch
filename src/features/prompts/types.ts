import type { PromptId } from "@/convex/constants";

export type PromptOption = {
  id: PromptId;
  text: string;
};

type PromptsRecord = {
  [K in PromptId]: { text: string };
};

type ExactPromptsRecord<T> = T extends PromptsRecord
  ? Exclude<keyof T, PromptId> extends never
    ? T
    : {
        ERROR: "Extra keys not allowed";
        EXTRA_KEYS: Exclude<keyof T, PromptId>;
      }
  : never;

export function definePrompts<const T extends PromptsRecord>(
  prompts: ExactPromptsRecord<T>
): PromptOption[] {
  return Object.entries(prompts).map(([id, { text }]) => ({
    id: id as PromptId,
    text,
  }));
}
