import type { ProfileCardRootProps } from "../types";

export function ProfileCardRoot({ children }: ProfileCardRootProps) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
