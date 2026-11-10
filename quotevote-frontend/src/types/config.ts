/** The two environment variables the API address can come from. */
export interface ApiAddressInput {
  graphqlEndpoint?: string;
  serverUrl?: string;
}

/** Every form of the API address the app needs, all derived from one setting. */
export interface ApiAddress {
  /** GraphQL over HTTP, e.g. `https://api.example.com/graphql`. */
  graphqlEndpoint: string;
  /** GraphQL over WebSocket for subscriptions, e.g. `wss://api.example.com/graphql`. */
  graphqlWsEndpoint: string;
  /** Base URL for the REST routes such as `/auth/login`, e.g. `https://api.example.com`. */
  serverUrl: string;
  /** HTTP origin, for the Content-Security-Policy `connect-src`. */
  httpOrigin: string;
  /** WebSocket origin, for the Content-Security-Policy `connect-src`. */
  wsOrigin: string;
}
