/**
 * Custom GraphQL scalar types used by the domain schema.
 *
 * - `DateScalar`  -> bridges JS Date/string/number values (serialised as ISO string)
 * - `JSONScalar`  -> passthrough for arbitrary JSON blobs (avatar, settings, etc.)
 */

import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';
import mongoose from 'mongoose';

function parseLiteralJSON(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.OBJECT: {
      const obj: Record<string, unknown> = {};
      ast.fields.forEach((f) => {
        obj[f.name.value] = parseLiteralJSON(f.value);
      });
      return obj;
    }
    case Kind.LIST:
      return ast.values.map(parseLiteralJSON);
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}

export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value (objects, arrays, primitives).',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral: (ast) => parseLiteralJSON(ast),
});

export const DateScalar = new GraphQLScalarType<Date | string | number | null, string | null>({
  name: 'Date',
  description: 'ISO-8601 date string (also accepts epoch ms on input).',
  serialize(value: unknown): string | null {
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    return String(value);
  },
  parseValue(value: unknown): Date | string | number | null {
    if (value == null) return null;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (value instanceof Date) return value;
    return null;
  },
  parseLiteral(ast): Date | string | number | null {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    if (ast.kind === Kind.INT) return new Date(Number(ast.value));
    return null;
  },
});

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    return null;
  },
  parseValue(value: any) {
    return value ? new Date(value as string) : null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const ObjectIdScalar = new GraphQLScalarType({
  name: 'ObjectId',
  description: 'Mongoose ObjectId scalar type',
  serialize(value: any) {
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toHexString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },
  parseValue(value: any) {
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING && mongoose.Types.ObjectId.isValid(ast.value)) {
      return new mongoose.Types.ObjectId(ast.value);
    }
    return null;
  },
});

