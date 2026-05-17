import { routeHasPersistentChatPanel } from '@/lib/utils/chatLayout';

describe('routeHasPersistentChatPanel', () => {
  it('matches profile, settings and explore routes', () => {
    expect(routeHasPersistentChatPanel('/dashboard/profile')).toBe(true);
    expect(routeHasPersistentChatPanel('/dashboard/settings')).toBe(true);
    expect(routeHasPersistentChatPanel('/dashboard/explore')).toBe(true);
  });

  it('matches nested paths of those routes', () => {
    expect(routeHasPersistentChatPanel('/dashboard/profile/someuser')).toBe(true);
    expect(routeHasPersistentChatPanel('/dashboard/settings/privacy')).toBe(true);
    expect(routeHasPersistentChatPanel('/dashboard/explore/abc')).toBe(true);
  });

  it('does not match other dashboard routes (drawer stays available)', () => {
    expect(routeHasPersistentChatPanel('/dashboard/post/g/t/123')).toBe(false);
    expect(routeHasPersistentChatPanel('/dashboard/notifications')).toBe(false);
    expect(routeHasPersistentChatPanel('/dashboard/control-panel')).toBe(false);
    expect(routeHasPersistentChatPanel('/dashboard/manage-invites')).toBe(false);
  });

  it('does not match unrelated paths that merely share a prefix', () => {
    // e.g. a hypothetical "/dashboard/profiles" must not be treated as profile
    expect(routeHasPersistentChatPanel('/dashboard/profiles')).toBe(false);
    expect(routeHasPersistentChatPanel('/dashboard/exploremore')).toBe(false);
  });
});
