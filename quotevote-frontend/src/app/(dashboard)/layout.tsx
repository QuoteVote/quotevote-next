'use client';

import { DashboardShell } from '@/components/DashboardShell';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <DashboardShell>{children}</DashboardShell>;
}
