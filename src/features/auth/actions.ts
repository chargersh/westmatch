"use server";

import { fetchAction } from "convex/nextjs";
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
  try {
    const token = await getToken();
    await fetchAction(api.auth.signUp, { email, password, name }, { token });

    return { success: true, message: "Signed up successfully!" };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("User already exists")
        ? "User already exists. Use another email."
        : "An error occurred during signup";
    return { success: false, message };
  }
}
