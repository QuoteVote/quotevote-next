/**
 * Error tracking types (#183).
 */

/** Settings read from the environment. Error tracking is off unless `dsn` is set. */
export interface ErrorTrackingSettings {
  dsn?: string;
  environment?: string;
  release?: string;
}

/** What a report carries besides the error itself. Never request bodies or variables. */
export interface ErrorReportContext {
  /** Where the error happened: `graphql`, `subscription`, `http`. */
  source: 'graphql' | 'subscription' | 'http';
  /** GraphQL operation name, when there is one. */
  operationName?: string;
  /** GraphQL field path, such as `posts.0.user`. */
  path?: string;
  /** HTTP route path without the query string. */
  route?: string;
}
