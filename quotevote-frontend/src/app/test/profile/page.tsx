'use client';

import { ProfileController } from '../../../components/Profile/ProfileController';

/**
 * Test page for Profile components
 * 
 * This page renders the ProfileController component to test
 * all migrated profile components.
 */
export default function TestProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Components Test</h1>
      <ProfileController />
    </div>
  );
}

