import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
type User = {
  userId: string | null | undefined;
  username?: string | null;
  name: string;
  displayUsername?: string | null;
  email: string;
  image?: string | null;
};

type UserStatus = "new" | "returning" | "authenticated";

type AuthStore = {
  // User data
  user: User | null;

  // Auth state from Convex
  isAuthenticated: boolean;
  isLoading: boolean;

  // User status tracking
  userStatus: UserStatus;
  isInitialized: boolean;

  // Actions
  actions: {
    // User data actions
    setUser: (user: User | null) => void;

    // Auth state actions
    setAuthState: (isAuthenticated: boolean, isLoading: boolean) => void;

    // User status actions
    setUserStatus: (status: UserStatus) => void;
    markAsVisited: () => void;
    setInitialized: (initialized: boolean) => void;
  };
};

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      userStatus: "new",
      isInitialized: false,

      // Actions
      actions: {
        setUser: (user: User | null) => set({ user }),

        setAuthState: (isAuthenticated: boolean, isLoading: boolean) =>
          set({ isAuthenticated, isLoading }),

        setUserStatus: (userStatus: UserStatus) => set({ userStatus }),

        markAsVisited: () => {
          const currentStatus = get().userStatus;
          if (
            currentStatus !== "authenticated" &&
            currentStatus !== "returning"
          ) {
            set({ userStatus: "returning" });
          }
        },

        setInitialized: (isInitialized: boolean) => set({ isInitialized }),
      },
    }),
    {
      name: `${process.env.NEXT_PUBLIC_LOCALSTORAGE_PREFIX}-auth-store`,
      partialize: (state) => ({
        userStatus: state.userStatus,
        isInitialized: state.isInitialized,
        user: state.user,
      }),
    }
  )
);

// Hook for reading user data
export const useUser = () => useAuthStore((state) => state.user);

// Individual hooks for auth state
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

// Hook for reading user status
export const useUserStatus = () => useAuthStore((state) => state.userStatus);

// Hook for reading initialization status (internal use)
export const useIsInitialized = () =>
  useAuthStore((state) => state.isInitialized);

// Individual hooks for auth helpers
export const useUnAuthedNewUser = () =>
  useAuthStore((state) => state.userStatus === "new" && !state.isAuthenticated);
export const useUnAuthedReturningUser = () =>
  useAuthStore(
    (state) => state.userStatus === "returning" && !state.isAuthenticated
  );

// Hook for all actions
export const useAuthActions = () => useAuthStore((state) => state.actions);
