import { Heart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { ProfileCardPhotoProps } from "../types";

export function ProfileCardPhoto({
  photo,
  onLike,
  alt = "Profile photo",
  priority = false,
}: ProfileCardPhotoProps) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      <Image
        alt={alt}
        className="object-cover"
        fill
        priority={priority}
        src={photo.url}
      />
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
