/**
 * Error tracking for the backend (#183).
 *
 * Off unless `SENTRY_DSN` is set, so local runs and tests send nothing. Reports carry the
 * error, its stack and where it happened (operation name, field path, route), never request
 * bodies, GraphQL variables, cookies, headers, the visitor's IP or the signed-in user.
 */
import * as Sentry from '@sentry/node';
import type { Breadcrumb, ErrorEvent } from '@sentry/node';
import { GraphQLError } from 'graphql';
import type { ApolloServerPlugin } from '@apollo/server';
import type { ErrorReportContext, ErrorTrackingSettings } from '~/types/errorTracking';

let enabled = false;

/** Sentry collects all of these by default. Every one is turned off. */
export const ERROR_TRACKING_DATA_COLLECTION: NonNullable<
  Parameters<typeof Sentry.init>[0]
>['dataCollection'] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
};

/** Reads the settings from the environment. Blank values count as unset. */
export function readErrorTrackingSettings(env: NodeJS.ProcessEnv): ErrorTrackingSettings {
  const value = (raw: string | undefined): string | undefined => raw?.trim() || undefined;
  return {
    dsn: value(env.SENTRY_DSN),
    environment: value(env.SENTRY_ENVIRONMENT) ?? value(env.NODE_ENV),
    release: value(env.SENTRY_RELEASE),
  };
}

/**
 * Prisma puts the call, with its arguments, in the middle of its error messages
 * ("Invalid `prisma.user.findUnique()` invocation: ... where: { email: ... }"). Keep the
 * first line and the reason on the last line, and drop the arguments in between.
 */
export function trimPrismaMessage(message: string): string {
  if (!/invocation/.test(message)) return message;
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 2) return lines.join(' ');
  return `${lines[0]} ${lines[lines.length - 1]}`;
}

function stripQuery(url: string): string {
  const index = url.search(/[?#]/);
  return index === -1 ? url : url.slice(0, index);
}

/** Removes anything that could identify a person or hold what they wrote. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.extra;

  if (event.request) {
    const { method, url } = event.request;
    event.request = { method, url: url ? stripQuery(url) : undefined };
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = trimPrismaMessage(exception.value);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((crumb) => scrubBreadcrumb(crumb))
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }

  return event;
}

/** Console output can hold emails and message text, so it never goes along. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category === 'console') return null;
  if (crumb.data && typeof crumb.data.url === 'string') {
    return { ...crumb, data: { ...crumb.data, url: stripQuery(crumb.data.url) } };
  }
  return crumb;
}

/**
 * Starts error tracking when a DSN is set. Returns whether it is on.
 * Call it once, before the server starts handling requests.
 */
export function initErrorTracking(settings: ErrorTrackingSettings): boolean {
  if (!settings.dsn || enabled) return enabled;

  Sentry.init({
    dsn: settings.dsn,
    environment: settings.environment,
    release: settings.release,
    // Collect nothing about people or what they sent: no user fields, cookies, headers,
    // bodies, query parameters, GraphQL documents or variables, query data or local variables.
    dataCollection: ERROR_TRACKING_DATA_COLLECTION,
    // Errors only. Performance tracing stays off.
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  });
  enabled = true;
  return enabled;
}

export function isErrorTrackingEnabled(): boolean {
  return enabled;
}

/**
 * Whether a GraphQL error is a fault worth reporting rather than an answer to the client.
 *
 * Errors with a code other than INTERNAL_SERVER_ERROR (BAD_USER_INPUT, FORBIDDEN, NOT_FOUND,
 * TOO_MANY_REQUESTS, validation and parse failures) are expected. So is a GraphQLError a
 * resolver threw on purpose without a code. What's left is anything a resolver threw that
 * wasn't a GraphQLError, and anything marked INTERNAL_SERVER_ERROR.
 */
export function shouldReportGraphQLError(error: GraphQLError): boolean {
  const code = error.extensions?.code;
  if (code === 'INTERNAL_SERVER_ERROR') return true;
  if (code !== undefined) return false;
  const original = error.originalError;
  return original !== undefined && original !== null && !(original instanceof GraphQLError);
}

/** Sends one error with its context. Does nothing when error tracking is off. */
export function reportError(error: unknown, context: ErrorReportContext): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    scope.setTag('source', context.source);
    if (context.operationName) scope.setTag('operation', context.operationName);
    if (context.path) scope.setTag('graphql.path', context.path);
    if (context.route) scope.setTag('route', context.route);
    Sentry.captureException(error);
  });
}

/** Reports the reportable errors from one GraphQL result. */
export function reportGraphQLErrors(
  errors: readonly GraphQLError[],
  context: Omit<ErrorReportContext, 'path'>
): void {
  if (!enabled) return;
  for (const error of errors) {
    if (!shouldReportGraphQLError(error)) continue;
    const original = error.originalError;
    const reported = original && !(original instanceof GraphQLError) ? original : error;
    reportError(reported, { ...context, path: error.path?.join('.') });
  }
}

/** Apollo plugin that reports unexpected errors from HTTP GraphQL requests. */
export function createErrorTrackingPlugin<TContext extends object>(): ApolloServerPlugin<TContext> {
  return {
    async requestDidStart() {
      return {
        async didEncounterErrors(requestContext) {
          reportGraphQLErrors(requestContext.errors, {
            source: 'graphql',
            operationName: requestContext.operationName ?? undefined,
          });
        },
      };
    },
  };
}

/**
 * Whether an error that reached Express's error handler is a server fault. Errors that carry
 * a 4xx status, such as a malformed JSON body, are the client's and aren't reported.
 */
export function shouldReportHttpError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return true;
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const code = typeof status === 'number' ? status : statusCode;
  return typeof code !== 'number' || code >= 500;
}

/** Sends anything still queued, for use during shutdown. */
export async function flushErrorTracking(timeoutMs = 2000): Promise<void> {
  if (!enabled) return;
  await Sentry.flush(timeoutMs);
}

/** Test helper: forget the started state. */
export function resetErrorTrackingForTests(): void {
  enabled = false;
}
