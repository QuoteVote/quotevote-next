import type { SolidErrorCode } from "@/types/solid";

export interface SolidErrorInfo {
  /** Friendly, plain-language message safe to show to members. */
  message: string;
  /** True when the member must reconnect their Pod before retrying. */
  needsReconnect: boolean;
}

interface GraphQLErrorLike {
  message?: string;
  extensions?: { code?: unknown };
}

interface ApolloErrorLike {
  graphQLErrors?: ReadonlyArray<GraphQLErrorLike>;
  networkError?: unknown;
}

const SOLID_ERROR_CODES: ReadonlyArray<SolidErrorCode> = [
  "UNAUTHENTICATED",
  "BAD_USER_INPUT",
  "SOLID_REAUTH_REQUIRED",
  "SOLID_UNAVAILABLE",
];

function isApolloErrorLike(error: unknown): error is ApolloErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    ("graphQLErrors" in error || "networkError" in error)
  );
}

function isSolidErrorCode(code: unknown): code is SolidErrorCode {
  return typeof code === "string" && (SOLID_ERROR_CODES as ReadonlyArray<string>).includes(code);
}

/** Returns the first backend error code, if the error came from GraphQL. */
export function getSolidErrorCode(error: unknown): SolidErrorCode | undefined {
  if (!isApolloErrorLike(error)) return undefined;
  const first = error.graphQLErrors?.[0];
  const code = first?.extensions?.code;
  return isSolidErrorCode(code) ? code : undefined;
}

/**
 * Maps a Solid API error to a member-facing message.
 * Never exposes raw backend text, tokens, codes or URLs.
 */
export function mapSolidError(error: unknown): SolidErrorInfo {
  switch (getSolidErrorCode(error)) {
    case "UNAUTHENTICATED":
      return { message: "Your session has expired. Please sign in again.", needsReconnect: false };
    case "BAD_USER_INPUT":
      return {
        message: "That doesn’t look right. Check the Pod provider address and try again.",
        needsReconnect: false,
      };
    case "SOLID_REAUTH_REQUIRED":
      return {
        message: "Your Pod connection needs to be refreshed. Reconnect to continue.",
        needsReconnect: true,
      };
    case "SOLID_UNAVAILABLE":
      return {
        message: "Your Pod is temporarily unavailable; Quote.Vote keeps working, try again later.",
        needsReconnect: false,
      };
    default:
      break;
  }

  if (isApolloErrorLike(error) && error.networkError) {
    return {
      message: "Couldn’t reach Quote.Vote. Check your connection and try again.",
      needsReconnect: false,
    };
  }

  return {
    message: "Something went wrong with your Pod connection. Please try again.",
    needsReconnect: false,
  };
}
