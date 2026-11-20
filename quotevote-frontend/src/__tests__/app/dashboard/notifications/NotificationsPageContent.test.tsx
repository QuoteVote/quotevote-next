/**
 * /notifications shows the same inbox as the panel, with the page heading.
 */
import { render, screen, resetStore } from "@/__tests__/utils/test-utils";
import { NotificationsPageContent } from "@/app/(dashboard)/notifications/NotificationsPageContent";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { useAppStore } from "@/store";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useSubscription: jest.fn(),
}));
jest.mock("@/hooks/useGuestGuard", () => ({ __esModule: true, default: () => () => true }));

describe("NotificationsPageContent", () => {
  beforeEach(() => {
    resetStore();
    useAppStore.setState((s) => ({
      user: { ...s.user, data: { _id: "alice-id", username: "alice" } },
    }));
  });

  it("shows the Notifications heading, the filters and an empty inbox", async () => {
    render(<NotificationsPageContent />, {
      mocks: [{ request: { query: GET_NOTIFICATIONS }, result: { data: { notifications: [] } } }],
    });

    expect(screen.getByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Filter notifications" })).toBeInTheDocument();
    expect(await screen.findByText("You're all caught up!")).toBeInTheDocument();
    expect(screen.getByTestId("mark-all-notifications-read")).toBeDisabled();
  });
});
