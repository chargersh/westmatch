import { AuthProvider } from "@/features/auth/auth-provider";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { ThemeProvider } from "@/providers/theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </ConvexClientProvider>
  );
}
