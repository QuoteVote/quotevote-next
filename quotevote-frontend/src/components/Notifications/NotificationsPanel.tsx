"use client";

import { useAppStore } from "@/store";
import { NotificationsInbox } from "@/components/Notifications/NotificationsInbox";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/**
 * Notifications panel (updated design): slides in from the left under the top bar on
 * desktop, 600px wide, over a dimmed page (Messages comes from the right). On phones it
 * fills the screen above the tab bar. Opening a notification closes it.
 */
export function NotificationsPanel() {
  const open = useAppStore((s) => s.ui.notificationsOpen);
  const setOpen = useAppStore((s) => s.setNotificationsOpen);
  const user = useAppStore((s) => s.user.data);
  const userId = (user?._id || user?.id) as string | undefined;

  if (!userId) return null;

  return (
    <>
      {open && (
        <div
          className="qv-panel-scrim"
          aria-hidden="true"
          data-testid="notifications-scrim"
          onClick={() => setOpen(false)}
        />
      )}
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent
          side="left"
          className="qv-notif-panel font-redesign"
          data-testid="notifications-panel"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <NotificationsInbox
            TitleAs={SheetTitle}
            DescriptionAs={SheetDescription}
            onNavigate={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
