import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPromptById } from "@/features/prompts/utils";
import { cn } from "@/lib/utils";
import type { ProfileCardPromptProps } from "../types";

export function ProfileCardPrompt({ prompt, onLike }: ProfileCardPromptProps) {
  const promptQuestion = getPromptById(prompt.promptId);
  const hasLike = !!onLike;

  return (
    <div className="relative rounded-lg border bg-card px-4 py-8">
      <div className="mb-2 font-medium text-sm tracking-wide">
        {promptQuestion}
      </div>
      <div
        className={cn(
          "wrap-break-word overflow-hidden font-medium font-serif text-xl leading-relaxed min-[380px]:text-2xl",
          hasLike && "pr-12"
        )}
      >
        {prompt.answer}
      </div>
      {hasLike && (
        <Button
          className="absolute right-4 bottom-4"
          onClick={() => onLike(prompt.id)}
          size="icon"
          type="button"
          variant="secondary"
        >
          <Heart className="size-5" />
        </Button>
      )}
    </div>
  );
}
