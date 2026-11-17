import mongoose from 'mongoose';
import { mongooseConnectOptions } from '~/data/utils/databaseConnection';
import Typing from '~/data/models/Typing';

describe('mongooseConnectOptions (#716)', () => {
  it('never builds indexes or creates collections at startup in production', () => {
    expect(mongooseConnectOptions('production')).toEqual({ autoIndex: false, autoCreate: false });
  });

  it('keeps the defaults in development and tests', () => {
    expect(mongooseConnectOptions('development')).toEqual({});
    expect(mongooseConnectOptions('test')).toEqual({});
    expect(mongooseConnectOptions(undefined)).toEqual({});
  });
});

describe('Typing indexes (#714)', () => {
  it('declares expiresAt once, as the TTL index', () => {
    const onExpiresAt = Typing.schema
      .indexes()
      .filter(([fields]) => Object.keys(fields).join() === 'expiresAt');
    expect(onExpiresAt).toEqual([
      [{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })],
    ]);
    expect(mongoose.modelNames()).toContain('Typing');
  });
});
