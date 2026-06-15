"use client";

import { CommandPalette } from "@/components/ui/overlay/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMigration } from "@/hooks/useMigration";
import { PropsWithChildren, Suspense, useCallback, useState } from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { usePathname, useRouter } from "next/navigation";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";

export const queryClient = new QueryClient();

export default function Providers({ children }: PropsWithChildren) {
  const { push } = useRouter();
  const pathName = usePathname();
  const { content } = useDiscoverFilters();
  const tv = pathName.includes("/tv/") || content === "tv";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const togglePalette = useCallback(() => setPaletteOpen((prev) => !prev), []);

  useKeyboardShortcuts({
    onTogglePalette: togglePalette,
  });

  // Trigger migration after authentication (client-side only)
  useMigration();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={push}>
        <ToastProvider
          placement="top-right"
          maxVisibleToasts={1}
          toastOffset={10}
          toastProps={{
            shouldShowTimeoutProgress: true,
            timeout: 5000,
            classNames: {
              content: "mr-7",
              closeButton:
                "opacity-100 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto",
            },
          }}
        />
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* https://github.com/vercel/next.js/discussions/61654#discussioncomment-8480088 */}
          <Suspense>
            <ProgressProvider
              options={{ showSpinner: false }}
              color={`hsl(var(--heroui-${tv ? "warning" : "primary"}))`}
            >
              {children}
            </ProgressProvider>
          </Suspense>
          <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </NextThemesProvider>
      </HeroUIProvider>
      <div className="hidden md:block">
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </QueryClientProvider>
  );
}
