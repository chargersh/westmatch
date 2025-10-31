"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "./store";

export function LoginButton() {
  const user = useUser();

  if (user) {
    return <Button disabled>Logged in as {user.name || user.email}</Button>;
  }

  return (
    <Button asChild>
      <Link href="/auth/login">Sign In</Link>
    </Button>
  );
}
