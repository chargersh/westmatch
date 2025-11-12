import { ProfileCardInfo } from "./components/profile-card-info";
import { ProfileCardPhoto } from "./components/profile-card-photo";
import { ProfileCardPrompt } from "./components/profile-card-prompt";
import { ProfileCardRoot } from "./components/profile-card-root";

export const ProfileCard = {
  Root: ProfileCardRoot,
  Photo: ProfileCardPhoto,
  Prompt: ProfileCardPrompt,
  Info: ProfileCardInfo,
};

export type * from "./types";
