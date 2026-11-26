/**
 * Live updates follow the session (#793): the server signs a WebSocket connection in once,
 * so a renewed token, a different member or signing out reconnects it with the current token.
 */

// Each test creates its own Apollo client; these always point at the newest one.
let terminate: jest.Mock = jest.fn();
let connectionParams: (() => Record<string, unknown>) | undefined;

jest.mock("graphql-ws", () => ({
  createClient: jest.fn((options: { connectionParams: () => Record<string, unknown> }) => {
    connectionParams = options.connectionParams;
    terminate = jest.fn();
    return { subscribe: jest.fn(() => () => undefined), terminate, dispose: jest.fn() };
  }),
}));

import { createApolloClient } from "@/lib/apollo/apollo-client";
import { removeToken, setToken } from "@/lib/auth";
import { installMemoryStorage, restoreStorage } from "../utils/memoryStorage";

beforeAll(() => installMemoryStorage());
afterAll(() => restoreStorage());

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("live update connection and the sign-in (#793)", () => {
  it("reconnects when the token changes, and not when it stays the same", () => {
    setToken("token-a");
    createApolloClient();
    // The client reads the token when it connects.
    expect(connectionParams?.()).toEqual({ authToken: "Bearer token-a" });

    setToken("token-a");
    expect(terminate).not.toHaveBeenCalled();

    setToken("token-b");
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it("reconnects without a token when the member signs out", () => {
    setToken("token-a");
    createApolloClient();
    connectionParams?.();

    removeToken();

    expect(terminate).toHaveBeenCalledTimes(1);
    expect(connectionParams?.()).toEqual({ authToken: undefined });
  });

  it("reconnects when another tab changes the token", () => {
    setToken("token-a");
    createApolloClient();
    connectionParams?.();

    localStorage.setItem("token", "token-from-another-tab");
    window.dispatchEvent(new StorageEvent("storage", { key: "token" }));

    expect(terminate).toHaveBeenCalledTimes(1);
  });
});
