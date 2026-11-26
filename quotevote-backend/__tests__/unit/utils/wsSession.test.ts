/**
 * Live updates follow the session (#793): a signed-in WebSocket connection is closed when
 * its token expires or the account stops being usable.
 */
jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { EventEmitter } from 'events';
import * as jwt from 'jsonwebtoken';
import {
  ACCOUNT_UNAVAILABLE_REASON,
  SESSION_CHECK_INTERVAL_MS,
  SESSION_CLOSE_CODE,
  SESSION_EXPIRED_REASON,
  tokenExpiresAt,
  watchSession,
} from '~/data/utils/wsSession';
import { logger } from '~/data/utils/logger';

class FakeSocket extends EventEmitter {
  close = jest.fn((code?: number, reason?: string) => {
    this.emit('close', code, reason);
  });
}

const tokenExpiringIn = (seconds: number): string =>
  jwt.sign({ userId: 'user-1' }, 'test-secret', { expiresIn: seconds });

const active = (value: boolean) => jest.fn().mockResolvedValue(value);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('tokenExpiresAt', () => {
  it("reads the token's expiry", () => {
    const token = jwt.sign({ userId: 'u' }, 's', { expiresIn: 900 });
    const exp = (jwt.decode(token) as { exp: number }).exp;
    expect(tokenExpiresAt(token)).toBe(exp * 1000);
  });

  it('is null for a token without expiry or something that is not a token', () => {
    expect(tokenExpiresAt(jwt.sign({ userId: 'u' }, 's'))).toBeNull();
    expect(tokenExpiresAt('not-a-token')).toBeNull();
  });
});

describe('watchSession', () => {
  it('closes the connection when the token expires, with a code the client retries', async () => {
    const socket = new FakeSocket();
    watchSession(socket, {
      token: tokenExpiringIn(120),
      userId: 'user-1',
      accountStillActive: active(true),
    });

    await jest.advanceTimersByTimeAsync(119_000);
    expect(socket.close).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(2_000);
    expect(socket.close).toHaveBeenCalledWith(SESSION_CLOSE_CODE, SESSION_EXPIRED_REASON);
    expect(SESSION_CLOSE_CODE).toBe(4403);
  });

  it('closes a connection whose token has already expired straight away', async () => {
    const socket = new FakeSocket();
    watchSession(socket, {
      token: tokenExpiringIn(-10),
      userId: 'user-1',
      accountStillActive: active(true),
    });

    await jest.advanceTimersByTimeAsync(0);
    expect(socket.close).toHaveBeenCalledWith(SESSION_CLOSE_CODE, SESSION_EXPIRED_REASON);
  });

  it('closes the connection when the account is disabled or gone', async () => {
    const socket = new FakeSocket();
    const accountStillActive = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    watchSession(socket, { token: tokenExpiringIn(3600), userId: 'user-1', accountStillActive });

    await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
    expect(socket.close).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
    expect(accountStillActive).toHaveBeenCalledWith('user-1');
    expect(socket.close).toHaveBeenCalledWith(SESSION_CLOSE_CODE, ACCOUNT_UNAVAILABLE_REASON);
  });

  it('keeps the connection open when an account lookup fails, and tries again', async () => {
    const socket = new FakeSocket();
    const accountStillActive = jest
      .fn()
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce(true);
    watchSession(socket, { token: tokenExpiringIn(3600), userId: 'user-1', accountStillActive });

    await jest.advanceTimersByTimeAsync(2 * SESSION_CHECK_INTERVAL_MS);

    expect(socket.close).not.toHaveBeenCalled();
    expect(accountStillActive).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('sets the guard up once per connection, however many subscriptions it has', async () => {
    const socket = new FakeSocket();
    const accountStillActive = active(true);
    const options = { token: tokenExpiringIn(3600), userId: 'user-1', accountStillActive };
    watchSession(socket, options);
    watchSession(socket, options);
    watchSession(socket, options);

    await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
    expect(accountStillActive).toHaveBeenCalledTimes(1);
  });

  it('stops watching once the connection closes on its own', async () => {
    const socket = new FakeSocket();
    const accountStillActive = active(false);
    watchSession(socket, { token: tokenExpiringIn(120), userId: 'user-1', accountStillActive });

    socket.emit('close');
    await jest.advanceTimersByTimeAsync(10 * SESSION_CHECK_INTERVAL_MS);

    expect(accountStillActive).not.toHaveBeenCalled();
    expect(socket.close).not.toHaveBeenCalled();
  });

  it('still checks the account for a token without expiry', async () => {
    const socket = new FakeSocket();
    watchSession(socket, {
      token: jwt.sign({ userId: 'user-1' }, 's'),
      userId: 'user-1',
      accountStillActive: active(false),
    });

    await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
    expect(socket.close).toHaveBeenCalledWith(SESSION_CLOSE_CODE, ACCOUNT_UNAVAILABLE_REASON);
  });
});
