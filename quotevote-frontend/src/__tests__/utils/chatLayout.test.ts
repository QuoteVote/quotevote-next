import { routeHasPersistentChatPanel } from '@/lib/utils/chatLayout';

describe('routeHasPersistentChatPanel', () => {
  it('matches profile and settings routes', () => {
    expect(routeHasPersistentChatPanel('/profile')).toBe(true);
    expect(routeHasPersistentChatPanel('/settings')).toBe(true);
  });

  it('matches nested paths of those routes', () => {
    expect(routeHasPersistentChatPanel('/profile/someuser')).toBe(true);
    expect(routeHasPersistentChatPanel('/settings/privacy')).toBe(true);
  });

  it('does not match other routes (drawer stays available)', () => {
    expect(routeHasPersistentChatPanel('/post/g/t/123')).toBe(false);
    expect(routeHasPersistentChatPanel('/notifications')).toBe(false);
    expect(routeHasPersistentChatPanel('/control-panel')).toBe(false);
    expect(routeHasPersistentChatPanel('/manage-invites')).toBe(false);
  });

  it('does not match unrelated paths that merely share a prefix', () => {
    expect(routeHasPersistentChatPanel('/profiles')).toBe(false);
  });
});
