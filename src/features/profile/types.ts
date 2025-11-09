import type { ReactNode } from "react";
import type { Doc } from "@/convex/_generated/dataModel";

// Photo extends Doc with url field (added by getProfilePhotos helper)
export interface Photo extends Doc<"profilePhotos"> {
  url: string;
}

// Prompt is just the database doc (no extra fields)
export type Prompt = Doc<"profilePrompts">;

// Profile is just the database doc (no extra fields)
export type Profile = Doc<"profiles">;

export type ProfileCardRootProps = {
  children: ReactNode;
};

export type ProfileCardPhotoProps = {
  photo: Photo;
  onLike?: (photoId: string) => void; // photoId is photo.id (custom string ID, not _id)
};

export type ProfileCardPromptProps = {
  prompt: Prompt;
  onLike?: (promptId: string) => void; // promptId is prompt.id (custom string ID, not _id)
};

export type ProfileCardInfoProps = {
  profile: Profile;
};
