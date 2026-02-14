/**
 * Notifications Page
 * 
 * Dashboard notifications page for viewing user notifications.
 * This page will be populated with the NotificationMobileView component migration.
 */

// Mark as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

export default function NotificationsPage(): React.ReactNode {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <p className="text-muted-foreground">
        Notifications page content will be migrated from NotificationMobileView component.
      </p>
    </div>
  );
}
