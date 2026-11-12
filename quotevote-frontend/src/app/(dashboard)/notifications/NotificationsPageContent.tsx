"use client";

import { Bell } from "lucide-react";
import { NotificationsInbox } from "@/components/Notifications/NotificationsInbox";

export function NotificationsPageContent() {
  return (
    <div className="px-4 md:px-0 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Bell className="h-6 w-6 text-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      </div>

      <NotificationsInbox pageView />
    </div>
  );
}
