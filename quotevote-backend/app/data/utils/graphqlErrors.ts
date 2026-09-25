import { GraphQLError } from 'graphql';
import { RoomAccessDeniedError, RoomNotFoundError } from '~/types/roomAccess';

export function toGraphQLError(error: unknown): GraphQLError {
  if (error instanceof RoomNotFoundError) {
    return new GraphQLError(error.message, { extensions: { code: 'NOT_FOUND' } });
  }

  if (error instanceof RoomAccessDeniedError) {
    return new GraphQLError(error.message, { extensions: { code: 'FORBIDDEN' } });
  }

  return new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
}