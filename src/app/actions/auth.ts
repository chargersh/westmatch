"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getToken } from "@/features/auth/auth-server";

export async function signUp({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const token = await getToken();
  return await fetchMutation(
    api.auth.signUp,
    { email, password, name },
    { token }
  );
}
