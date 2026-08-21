import { Kind } from 'graphql';
import mongoose from 'mongoose';
import { ObjectIdScalar } from '~/data/types/scalars';

const OBJECT_ID = '60d5ec49ad414d7a8d5464b1';

describe('ObjectIdScalar', () => {
  describe('serialize', () => {
    it('returns a plain string ID unchanged', () => {
      expect(ObjectIdScalar.serialize(OBJECT_ID)).toBe(OBJECT_ID);
    });

    it('serializes a Mongoose ObjectId as a hexadecimal string', () => {
      const objectId = new mongoose.Types.ObjectId(OBJECT_ID);

      expect(ObjectIdScalar.serialize(objectId)).toBe(OBJECT_ID);
    });

    it('returns null for an unsupported non-string input', () => {
      expect(ObjectIdScalar.serialize(123)).toBeNull();
    });
  });

  describe('parseValue', () => {
    it('parses a valid string as a Mongoose ObjectId', () => {
      const parsed = ObjectIdScalar.parseValue(OBJECT_ID) as mongoose.Types.ObjectId;

      expect(parsed).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(parsed.toHexString()).toBe(OBJECT_ID);
    });

    it.each(['not-an-object-id', 123])('returns null for invalid input %p', (value) => {
      expect(ObjectIdScalar.parseValue(value)).toBeNull();
    });
  });

  describe('parseLiteral', () => {
    it('parses a valid string literal as a Mongoose ObjectId', () => {
      const parsed = ObjectIdScalar.parseLiteral(
        { kind: Kind.STRING, value: OBJECT_ID },
        {}
      ) as mongoose.Types.ObjectId;

      expect(parsed).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(parsed.toHexString()).toBe(OBJECT_ID);
    });

    it('returns null for an invalid string literal', () => {
      expect(
        ObjectIdScalar.parseLiteral({ kind: Kind.STRING, value: 'not-an-object-id' }, {})
      ).toBeNull();
    });

    it('returns null for a non-string literal', () => {
      expect(ObjectIdScalar.parseLiteral({ kind: Kind.INT, value: '123' }, {})).toBeNull();
    });
  });

  describe('round trips', () => {
    it('round-trips a string through parseValue and serialize', () => {
      const parsed = ObjectIdScalar.parseValue(OBJECT_ID);

      expect(ObjectIdScalar.serialize(parsed)).toBe(OBJECT_ID);
    });

    it('round-trips a Mongoose ObjectId through serialize and parseValue', () => {
      const objectId = new mongoose.Types.ObjectId(OBJECT_ID);
      const serialized = ObjectIdScalar.serialize(objectId);
      const parsed = ObjectIdScalar.parseValue(serialized) as mongoose.Types.ObjectId;

      expect(parsed).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(parsed.toHexString()).toBe(objectId.toHexString());
    });
  });
});
