"use client";

import { NotificationsInbox } from "@/components/Notifications/NotificationsInbox";

/** /notifications: the same inbox as the panel, as a page. */
export function NotificationsPageContent() {
  return (
    <div className="qv-notif-page font-redesign">
      <NotificationsInbox />
    </div>
  );
}
