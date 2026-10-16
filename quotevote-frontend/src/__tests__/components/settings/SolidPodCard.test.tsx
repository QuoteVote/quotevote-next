import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@apollo/client/react", () => {
  const actual = jest.requireActual("@apollo/client/react");
  return {
    ...actual,
    __esModule: true,
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    useApolloClient: jest.fn(),
  };
});

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import SolidPodCard from "@/components/settings/SolidPodCard";
import {
  SOLID_DISCONNECT,
  SOLID_PUSH_PORTABLE_STATE,
  SOLID_START_CONNECT,
} from "@/graphql/mutations";
import { GET_SOLID_CONNECTION_STATUS } from "@/graphql/queries";

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;
const mockUseApolloClient = useApolloClient as unknown as jest.Mock;

const WEB_ID = "https://pod.example/profile/card#me";

const connectedStatus = {
  solidConnectionStatus: {
    connected: true,
    webId: WEB_ID,
    issuer: "https://solidcommunity.net",
    lastSyncAt: null,
  },
};

const disconnectedStatus = {
  solidConnectionStatus: { connected: false, webId: null, issuer: null, lastSyncAt: null },
};

let statusResult: { data: unknown; loading: boolean; error: unknown; refetch: jest.Mock };
let startConnectMock: jest.Mock;
let pushMock: jest.Mock;
let disconnectMock: jest.Mock;
let pullQueryMock: jest.Mock;
let assignMock: jest.Mock;
const originalLocation = window.location;

function mockMutations() {
  mockUseMutation.mockImplementation((doc: unknown) => {
    if (doc === SOLID_START_CONNECT) return [startConnectMock, { loading: false }];
    if (doc === SOLID_PUSH_PORTABLE_STATE) return [pushMock, { loading: false }];
    if (doc === SOLID_DISCONNECT) return [disconnectMock, { loading: false }];
    return [jest.fn(), { loading: false }];
  });
}

function renderCard(overrides: Partial<React.ComponentProps<typeof SolidPodCard>> = {}): void {
  render(
    <SolidPodCard
      displayName="Ada"
      bio="Hello there"
      avatarUrl="https://cdn.example/a.png"
      theme="light"
      {...overrides}
    />
  );
}

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { assign: (assignMock = jest.fn()), origin: "http://localhost" },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

beforeEach(() => {
  statusResult = { data: disconnectedStatus, loading: false, error: undefined, refetch: jest.fn() };
  mockUseQuery.mockImplementation((doc: unknown) => {
    if (doc === GET_SOLID_CONNECTION_STATUS) return statusResult;
    return { data: undefined, loading: false, error: undefined, refetch: jest.fn() };
  });
  startConnectMock = jest.fn().mockResolvedValue({
    data: { solidStartConnect: { authorizationUrl: "https://solidcommunity.net/auth?x=1" } },
  });
  pushMock = jest.fn().mockResolvedValue({ data: { solidPushPortableState: true } });
  disconnectMock = jest.fn().mockResolvedValue({ data: { solidDisconnect: true } });
  pullQueryMock = jest.fn();
  mockUseApolloClient.mockReturnValue({ query: pullQueryMock });
  mockMutations();
});

function gqlError(code: string, message = "backend text") {
  return { graphQLErrors: [{ message, extensions: { code } }] };
}

describe("SolidPodCard", () => {
  it("shows the disconnected state with a prefilled provider address and Connect button", () => {
    renderCard();

    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByLabelText("Pod provider address")).toHaveValue("https://solidcommunity.net");
    expect(screen.getByRole("button", { name: "Connect Pod" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
  });

  it("shows WebID, provider and last sync when connected", () => {
    statusResult.data = connectedStatus;

    renderCard();

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText(WEB_ID)).toBeInTheDocument();
    expect(screen.getByText("https://solidcommunity.net")).toBeInTheDocument();
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync profile & preferences to Pod" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check Pod data" })).toBeInTheDocument();
  });

  it("calls the start-connect mutation and redirects to the authorization URL", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "Connect Pod" }));

    expect(startConnectMock).toHaveBeenCalledWith({
      variables: { issuer: "https://solidcommunity.net" },
    });
    await waitFor(() =>
      expect(assignMock).toHaveBeenCalledWith("https://solidcommunity.net/auth?x=1")
    );
  });

  it("rejects an invalid provider address without calling the API", async () => {
    const user = userEvent.setup();
    renderCard();

    const input = screen.getByLabelText("Pod provider address");
    await user.clear(input);
    await user.type(input, "not a url");
    await user.click(screen.getByRole("button", { name: "Connect Pod" }));

    expect(startConnectMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a full web address");
  });

  it("pushes the current profile and theme to the Pod when syncing", async () => {
    const user = userEvent.setup();
    statusResult.data = connectedStatus;
    renderCard();

    await user.click(screen.getByRole("button", { name: "Sync profile & preferences to Pod" }));

    expect(pushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            profile: {
              displayName: "Ada",
              bio: "Hello there",
              avatarUrl: "https://cdn.example/a.png",
            },
            preferences: { theme: "light" },
          },
        },
      })
    );
    expect(
      await screen.findByText("Your profile and preferences were saved to your Pod.")
    ).toBeInTheDocument();
  });

  it("shows pulled Pod values read-only when checking Pod data", async () => {
    const user = userEvent.setup();
    statusResult.data = connectedStatus;
    pullQueryMock.mockResolvedValue({
      data: {
        solidPullPortableState: {
          portableSchemaVersion: "1",
          profile: { displayName: "Pod Ada", avatarUrl: null, bio: "From the Pod" },
          preferences: {
            theme: "dark",
            notifications: { email: true, push: false, inApp: true },
            accessibility: { reduceMotion: false, fontScale: "medium" },
          },
          updatedAt: "2026-01-02T03:04:05.000Z",
        },
      },
    });
    renderCard();

    await user.click(screen.getByRole("button", { name: "Check Pod data" }));

    expect(await screen.findByText("What your Pod has (read-only)")).toBeInTheDocument();
    expect(screen.getByText("Pod Ada")).toBeInTheDocument();
    expect(screen.getByText("From the Pod")).toBeInTheDocument();
    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(pullQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ fetchPolicy: "network-only" })
    );
  });

  it("disconnects only after confirmation", async () => {
    const user = userEvent.setup();
    statusResult.data = connectedStatus;
    renderCard();

    await user.click(screen.getByRole("button", { name: "Disconnect" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(disconnectMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Disconnect" }));

    expect(disconnectMock).toHaveBeenCalledWith(
      expect.objectContaining({ refetchQueries: [{ query: GET_SOLID_CONNECTION_STATUS }] })
    );
    expect(
      await screen.findByText("Your Pod is disconnected. Quote.Vote works as usual.")
    ).toBeInTheDocument();
  });

  it("maps SOLID_UNAVAILABLE to the friendly temporary-outage message", async () => {
    const user = userEvent.setup();
    statusResult.data = connectedStatus;
    pushMock.mockRejectedValue(gqlError("SOLID_UNAVAILABLE"));
    renderCard();

    await user.click(screen.getByRole("button", { name: "Sync profile & preferences to Pod" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your Pod is temporarily unavailable; Quote.Vote keeps working, try again later."
    );
    expect(screen.queryByRole("button", { name: "Reconnect" })).not.toBeInTheDocument();
  });

  it("maps SOLID_REAUTH_REQUIRED to a message with a Reconnect button", async () => {
    const user = userEvent.setup();
    statusResult.data = connectedStatus;
    pullQueryMock.mockRejectedValue(gqlError("SOLID_REAUTH_REQUIRED"));
    renderCard();

    await user.click(screen.getByRole("button", { name: "Check Pod data" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your Pod connection needs to be refreshed. Reconnect to continue."
    );
    await user.click(screen.getByRole("button", { name: "Reconnect" }));
    expect(startConnectMock).toHaveBeenCalledWith({
      variables: { issuer: "https://solidcommunity.net" },
    });
  });

  it("never shows raw backend error text", async () => {
    const user = userEvent.setup();
    statusResult.data = connectedStatus;
    pullQueryMock.mockRejectedValue(gqlError("INTERNAL", "stack trace detail"));
    renderCard();

    await user.click(screen.getByRole("button", { name: "Check Pod data" }));

    const alert = await screen.findByRole("alert");
    expect(alert).not.toHaveTextContent("stack trace detail");
    expect(alert).toHaveTextContent("Something went wrong with your Pod connection.");
  });

  it("shows a loading state while the status is being checked", () => {
    statusResult = { data: undefined, loading: true, error: undefined, refetch: jest.fn() };
    renderCard();

    expect(screen.getByText("Checking your Pod connection…")).toBeInTheDocument();
  });

  it("shows a retryable error when the status cannot be loaded", async () => {
    const user = userEvent.setup();
    statusResult = {
      data: undefined,
      loading: false,
      error: gqlError("SOLID_UNAVAILABLE"),
      refetch: jest.fn(),
    };
    renderCard();

    expect(screen.getByRole("alert")).toHaveTextContent("temporarily unavailable");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(statusResult.refetch).toHaveBeenCalled();
  });
});
