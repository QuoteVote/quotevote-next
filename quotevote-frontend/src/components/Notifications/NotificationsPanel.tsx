"use client";

import { useQuery } from "@apollo/client/react";
import { X } from "lucide-react";
import { useAppStore } from "@/store";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { NotificationsInbox } from "@/components/Notifications/NotificationsInbox";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Notification as NotificationType } from "@/types/notification";

/**
 * Notifications overlay (#532). Mirrors the Messages panel: it slides in from the
 * left on desktop (Messages uses the right) and opens as a bottom sheet above the
 * mobile tab bar. Selecting a notification closes it.
 */
export function NotificationsPanel() {
  const open = useAppStore((s) => s.ui.notificationsOpen);
  const setOpen = useAppStore((s) => s.setNotificationsOpen);
  const user = useAppStore((s) => s.user.data);
  const userId = (user?._id || user?.id) as string | undefined;
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Badge count for the header; the inbox owns its own list query/subscription.
  const { data } = useQuery<{ notifications?: NotificationType[] }>(GET_NOTIFICATIONS, {
    skip: !open || !userId,
    fetchPolicy: "cache-and-network",
  });

  if (!userId) return null;

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => n.status === "new").length;

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        className={cn(
          "w-full p-0 gap-0 overflow-hidden",
          isMobile
            ? "bottom-[56px] h-[calc(100dvh-6.5rem)] max-h-[85dvh] rounded-t-2xl sm:max-w-none"
            : "sm:w-[400px] sm:max-w-[400px] inset-y-0 h-full"
        )}
        data-testid="notifications-panel"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-to-br from-[#52b274] to-[#4a9e63] px-4 py-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-bold tracking-tight text-white">
                Notifications
              </SheetTitle>
              <SheetDescription className="text-xs text-white/85">
                {unread > 0 ? `${unread} new` : "Votes, comments, quotes and follows"}
              </SheetDescription>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="flex-shrink-0 border-white/40 bg-white/20 text-white hover:bg-white/30"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          <NotificationsInbox pageView onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
