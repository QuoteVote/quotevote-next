import { parseTrustProxy } from '~/data/utils/trustProxy';

describe('parseTrustProxy', () => {
  it.each([
    ['1', 1],
    [' 2 ', 2],
  ])('trusts %p proxies', (value, hops) => {
    expect(parseTrustProxy(value)).toBe(hops);
  });

  it.each([undefined, '', '0', 'true', '-1', '1.5', 'loopback'])('stays off for %p', (value) => {
    expect(parseTrustProxy(value)).toBe(false);
  });
});
