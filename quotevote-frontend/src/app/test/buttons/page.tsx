'use client';

import { useState } from 'react';
import {
  AdminIconButton,
  DoubleArrowIconButton,
  BookmarkIconButton,
  ApproveButton,
  RejectButton,
  ManageInviteButton,
  InvestButton,
  SignOutButton,
  GetAccessButton,
  SettingsSaveButton,
  FollowButton,
  SettingsIconButton,
  SelectPlansButton,
} from '../../../components/CustomButtons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Test Page for CustomButtons Components
 * 
 * This page showcases all button variants with different states:
 * - Default state
 * - Hover state (test manually)
 * - Focus state (test manually)
 * - Disabled state
 * - Active/Selected state (where applicable)
 */
export default function ButtonsTestPage() {
  const [approveSelected, setApproveSelected] = useState(false);
  const [rejectSelected, setRejectSelected] = useState(false);
  const [approveCount, setApproveCount] = useState(5);
  const [rejectCount, setRejectCount] = useState(3);
  const [isFollowing] = useState(false);

  // Mock user and post data for testing
  const mockUser = {
    _id: 'test-user-id',
  };

  const mockPost = {
    _id: 'test-post-id',
    bookmarkedBy: [],
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">CustomButtons Components Test Page</h1>
        <p className="text-muted-foreground">
          Test all button variants, states, and interactions
        </p>
      </div>

      {/* Icon Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Icon Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium mb-2">AdminIconButton</p>
              <AdminIconButton />
              <p className="text-xs text-muted-foreground mt-1">
                (Only visible if user is admin)
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">DoubleArrowIconButton</p>
              <DoubleArrowIconButton onClick={() => console.log('Double arrow clicked')} />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">SettingsIconButton</p>
              <SettingsIconButton />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Action Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium mb-2">ApproveButton (Unselected)</p>
              <ApproveButton
                selected={approveSelected}
                count={approveCount}
                onClick={() => {
                  setApproveSelected(!approveSelected);
                  setApproveCount(approveCount + 1);
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">ApproveButton (Selected)</p>
              <ApproveButton
                selected={true}
                count={10}
                onClick={() => {}}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">RejectButton (Unselected)</p>
              <RejectButton
                selected={rejectSelected}
                count={rejectCount}
                onClick={() => {
                  setRejectSelected(!rejectSelected);
                  setRejectCount(rejectCount + 1);
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">RejectButton (Selected)</p>
              <RejectButton
                selected={true}
                count={7}
                onClick={() => {}}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow Button */}
      <Card>
        <CardHeader>
          <CardTitle>Follow Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium mb-2">FollowButton (Not Following)</p>
              <FollowButton
                isFollowing={isFollowing}
                profileUserId="test-profile-id"
                username="testuser"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">FollowButton (Following)</p>
              <FollowButton
                isFollowing={true}
                profileUserId="test-profile-id"
                username="testuser"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">FollowButton (Icon Only)</p>
              <FollowButton
                isFollowing={isFollowing}
                profileUserId="test-profile-id"
                showIcon={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookmark Button */}
      <Card>
        <CardHeader>
          <CardTitle>Bookmark Button</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium mb-2">BookmarkIconButton</p>
            <BookmarkIconButton post={mockPost} user={mockUser} />
            <p className="text-xs text-muted-foreground mt-1">
              (Requires authentication - click to bookmark/unbookmark)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium mb-2">ManageInviteButton</p>
              <ManageInviteButton />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">SignOutButton</p>
              <SignOutButton />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">GetAccessButton</p>
              <GetAccessButton />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">SelectPlansButton</p>
              <SelectPlansButton>Select Plan</SelectPlansButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Form Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium mb-2">SettingsSaveButton</p>
              <SettingsSaveButton />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">SettingsSaveButton (Disabled)</p>
              <SettingsSaveButton disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invest Button */}
      <Card>
        <CardHeader>
          <CardTitle>Invest Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium mb-2">InvestButton (Small)</p>
              <InvestButton handleClick={() => console.log('Invest clicked')} width="sm" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">InvestButton (Large)</p>
              <InvestButton handleClick={() => console.log('Invest clicked')} width="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button States */}
      <Card>
        <CardHeader>
          <CardTitle>Button States Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Hover States</p>
              <p className="text-xs text-muted-foreground">
                Hover over buttons to test hover effects
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Focus States</p>
              <p className="text-xs text-muted-foreground">
                Tab through buttons to test focus states
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Disabled States</p>
              <div className="flex gap-4">
                <ApproveButton selected={false} count={0} disabled />
                <RejectButton selected={false} count={0} disabled />
                <SignOutButton disabled />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

