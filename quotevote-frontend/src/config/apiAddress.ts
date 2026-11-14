import type { ApiAddress, ApiAddressInput } from "@/types/config";

/**
 * Resolves the API address from NEXT_PUBLIC_GRAPHQL_ENDPOINT or NEXT_PUBLIC_SERVER_URL.
 *
 * Every request the app makes (GraphQL over HTTP and WebSocket, REST login, page metadata)
 * and the Content-Security-Policy use this one result, so they can't point at different
 * servers. There is deliberately no default: a build without an address stops here instead
 * of quietly talking to some other deployment's API.
 *
 * Kept free of runtime imports so `next.config.ts` can use it too.
 */

const MISSING_MESSAGE =
  "The API address is not set. Set NEXT_PUBLIC_SERVER_URL (for example " +
  "http://localhost:4000), or NEXT_PUBLIC_GRAPHQL_ENDPOINT, in .env.local for local " +
  "development or in the deployment's environment variables.";

function parseHttpUrl(name: string, value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL: "${value}"`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must start with http:// or https://: "${value}"`);
  }
  return url;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function toWebSocket(value: string): string {
  return value.replace(/^http/i, "ws");
}

export function resolveApiAddress({ graphqlEndpoint, serverUrl }: ApiAddressInput): ApiAddress {
  const endpointSetting = graphqlEndpoint?.trim();
  const serverSetting = serverUrl?.trim();

  let endpoint: string;
  if (endpointSetting) {
    endpoint = withoutTrailingSlash(
      parseHttpUrl("NEXT_PUBLIC_GRAPHQL_ENDPOINT", endpointSetting).toString()
    );
  } else if (serverSetting) {
    const base = withoutTrailingSlash(
      parseHttpUrl("NEXT_PUBLIC_SERVER_URL", serverSetting).toString()
    );
    endpoint = `${base}/graphql`;
  } else {
    throw new Error(MISSING_MESSAGE);
  }

  const httpOrigin = new URL(endpoint).origin;
  return {
    graphqlEndpoint: endpoint,
    graphqlWsEndpoint: toWebSocket(endpoint),
    serverUrl: endpoint.replace(/\/graphql$/, ""),
    httpOrigin,
    wsOrigin: toWebSocket(httpOrigin),
  };
}
