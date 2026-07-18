import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CherryMark } from "@/components/CherryMark";

interface AppFrameProps {
  sidebar: ReactNode;
  /** Title shown in the mobile header next to the CherryAI mark. */
  mobileTitle: ReactNode;
  mobileNavOpen: boolean;
  onMobileNavOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Shared page shell: desktop sidebar rail + mobile header with a sheet-based
 * nav drawer. `sidebar` is rendered in both places so it stays in sync.
 * Mobile-nav open state is owned by the caller because chat needs to close
 * it on session switch (a same-route state change, not a navigation) while
 * wiki routes get it for free from unmounting on navigation.
 */
export function AppFrame({
  sidebar,
  mobileTitle,
  mobileNavOpen,
  onMobileNavOpenChange,
  children,
}: AppFrameProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-border md:flex">{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={onMobileNavOpenChange}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold tracking-tight">
            <span className="text-cherry">
              <CherryMark className="size-4" />
            </span>
            <span className="truncate">{mobileTitle}</span>
          </span>
        </header>

        {children}
      </div>
    </div>
  );
}
