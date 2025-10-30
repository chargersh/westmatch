"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { type ReactNode, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAuthActions, useUserStatus } from "./store";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser);
  const { setAuthState, setUser, setUserStatus, setInitialized } =
    useAuthActions();
  const userStatus = useUserStatus();

  useEffect(() => {
    const isDataLoading = isLoading || user === undefined;
    setAuthState(isAuthenticated, isDataLoading);

    if (user !== undefined) {
      setUser(user);
    }

    if (isDataLoading) {
      return;
    }

    if (isAuthenticated && userStatus !== "authenticated") {
      setUserStatus("authenticated");
    } else if (
      !isAuthenticated &&
      userStatus !== "returning" &&
      userStatus !== "new"
    ) {
      setUserStatus("returning");
    }

    setInitialized(true);
  }, [
    isAuthenticated,
    isLoading,
    user,
    userStatus,
    setAuthState,
    setUser,
    setUserStatus,
    setInitialized,
  ]);

  return <>{children}</>;
}
