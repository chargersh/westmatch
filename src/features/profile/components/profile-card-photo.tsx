import { Heart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { ProfileCardPhotoProps } from "../types";

export function ProfileCardPhoto({ photo, onLike }: ProfileCardPhotoProps) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      <Image alt="Profile" className="object-cover" fill src={photo.url} />
      {onLike && (
        <Button
          className="absolute right-4 bottom-4"
          onClick={() => onLike(photo.id)}
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
