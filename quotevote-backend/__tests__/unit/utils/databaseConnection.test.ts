import mongoose from 'mongoose';
import { buildsIndexesAtStartup, mongooseConnectOptions } from '~/data/utils/databaseConnection';
import Typing from '~/data/models/Typing';

describe('mongooseConnectOptions (#716)', () => {
  it('never builds indexes or creates collections at startup in production', () => {
    expect(mongooseConnectOptions('production')).toEqual({ autoIndex: false, autoCreate: false });
  });

  it('keeps the defaults in development and tests', () => {
    expect(mongooseConnectOptions('development')).toEqual({});
    expect(mongooseConnectOptions('test')).toEqual({});
  });

  it('builds nothing when NODE_ENV is missing or anything else (#747)', () => {
    const off = { autoIndex: false, autoCreate: false };
    expect(mongooseConnectOptions(undefined)).toEqual(off);
    expect(mongooseConnectOptions('')).toEqual(off);
    expect(mongooseConnectOptions('prod')).toEqual(off);
    expect(mongooseConnectOptions('staging')).toEqual(off);
  });
});

describe('buildsIndexesAtStartup (#716, #694, #747)', () => {
  it('lets the backend build indexes at startup only in development and tests', () => {
    expect(buildsIndexesAtStartup('development')).toBe(true);
    expect(buildsIndexesAtStartup('test')).toBe(true);
  });

  it('builds nothing in production, or when NODE_ENV is missing or misspelled', () => {
    expect(buildsIndexesAtStartup('production')).toBe(false);
    expect(buildsIndexesAtStartup(undefined)).toBe(false);
    expect(buildsIndexesAtStartup('')).toBe(false);
    expect(buildsIndexesAtStartup('prod')).toBe(false);
    expect(buildsIndexesAtStartup('Development')).toBe(false);
    expect(buildsIndexesAtStartup('staging')).toBe(false);
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
