/**
 * PopoverMenu Component Tests
 *
 * Comprehensive tests for the PopoverMenu component migrated from MUI to shadcn/ui.
 * Tests cover:
 * - Component rendering (mobile-only display)
 * - Popover open/close functionality
 * - Menu item clicks and navigation
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Selected state highlighting
 * - Accessibility (ARIA roles and labels)
 */

import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { PopoverMenu } from "@/components/PopoverMenu";
import type { AppRoute } from "@/types/components";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} onClick={onClick} {...props}>
        {children}
      </a>
    );
  };
});

const mockAppRoutes: AppRoute[] = [
  {
    path: "search",
    name: "Search",
    layout: "/",
  },
  {
    path: "post",
    name: "Posts",
    layout: "/",
  },
  {
    path: "Profile",
    name: "My Profile",
    layout: "/",
  },
  {
    path: "/logout",
    name: "Logout",
    layout: "/logout",
  },
];

const mockAppRoutesWithIcons: AppRoute[] = [
  {
    path: "search",
    name: "Search",
    layout: "/",
    icon: () => <span data-testid="search-icon">🔍</span>,
  },
  {
    path: "post",
    name: "Posts",
    layout: "/",
    icon: () => <span data-testid="post-icon">📝</span>,
  },
];

describe("PopoverMenu Component", () => {
  const defaultProps = {
    appRoutes: mockAppRoutes,
    handleClick: jest.fn(),
    handleClose: jest.fn(),
    open: false,
    page: "Search",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the menu trigger button", () => {
      render(<PopoverMenu {...defaultProps} />);

      const triggerButton = screen.getByLabelText("Open menu");
      expect(triggerButton).toBeInTheDocument();
    });

    it("should render the page title", () => {
      render(<PopoverMenu {...defaultProps} />);

      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("should be hidden on desktop (md and above)", () => {
      const { container } = render(<PopoverMenu {...defaultProps} />);

      // Check for md:hidden class
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("md:hidden");
    });

    it("should render menu items when popover is open", async () => {
      render(<PopoverMenu {...defaultProps} open={true} />);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /search/i })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: /posts/i })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: /my profile/i })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: /logout/i })).toBeInTheDocument();
      });
    });

    it("should render icons when provided", async () => {
      render(<PopoverMenu {...defaultProps} appRoutes={mockAppRoutesWithIcons} open={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("search-icon")).toBeInTheDocument();
        expect(screen.getByTestId("post-icon")).toBeInTheDocument();
      });
    });
  });

  describe("Open/Close Functionality", () => {
    it("should call handleClick when trigger button is clicked", async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<PopoverMenu {...defaultProps} handleClick={handleClick} />);

      const triggerButton = screen.getByLabelText("Open menu");
      await user.click(triggerButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should call handleClose when popover is closed", async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<PopoverMenu {...defaultProps} open={true} handleClose={handleClose} />);

      // Click outside or press Escape to close
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it("should close popover when menu item is clicked", async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<PopoverMenu {...defaultProps} open={true} handleClose={handleClose} />);

      const searchLink = screen.getByRole("menuitem", { name: /search/i });
      await user.click(searchLink);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Navigation", () => {
    it("should generate correct href for menu items", async () => {
      render(<PopoverMenu {...defaultProps} open={true} />);

      await waitFor(() => {
        const searchLink = screen.getByRole("menuitem", { name: /search/i });
        expect(searchLink).toHaveAttribute("href", "/search");

        const logoutLink = screen.getByRole("menuitem", { name: /logout/i });
        expect(logoutLink).toHaveAttribute("href", "/logout/logout");
      });
    });

    it("should navigate to correct route when menu item is clicked", async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<PopoverMenu {...defaultProps} open={true} handleClose={handleClose} />);

      const postsLink = screen.getByRole("menuitem", { name: /posts/i });
      await user.click(postsLink);

      expect(postsLink).toHaveAttribute("href", "/post");
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("Selected State", () => {
    it("should highlight the selected menu item", async () => {
      render(<PopoverMenu {...defaultProps} open={true} page="Search" />);

      await waitFor(() => {
        const searchItem = screen.getByRole("menuitem", { name: /search/i });
        expect(searchItem).toHaveClass("bg-accent", "text-accent-foreground", "font-medium");
        expect(searchItem).toHaveAttribute("aria-current", "page");
      });
    });

    it("should not highlight non-selected menu items", async () => {
      render(<PopoverMenu {...defaultProps} open={true} page="Search" />);

      await waitFor(() => {
        const postsItem = screen.getByRole("menuitem", { name: /posts/i });
        expect(postsItem).not.toHaveClass("bg-accent", "font-medium");
        expect(postsItem).not.toHaveAttribute("aria-current");
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support Tab navigation", async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} open={true} />);

      // Focus should be on the trigger initially
      const triggerButton = screen.getByLabelText("Open menu");
      triggerButton.focus();

      // Tab to first menu item
      await user.tab();

      await waitFor(() => {
        const firstMenuItem = screen.getByRole("menuitem", { name: /search/i });
        expect(firstMenuItem).toHaveFocus();
      });
    });

    it("should support Enter key to activate menu item", async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<PopoverMenu {...defaultProps} open={true} handleClose={handleClose} />);

      const searchItem = screen.getByRole("menuitem", { name: /search/i });
      searchItem.focus();

      await user.keyboard("{Enter}");

      expect(handleClose).toHaveBeenCalled();
    });

    it("should support Escape key to close popover", async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<PopoverMenu {...defaultProps} open={true} handleClose={handleClose} />);

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<PopoverMenu {...defaultProps} />);

      const triggerButton = screen.getByLabelText("Open menu");
      expect(triggerButton).toHaveAttribute("aria-label", "Open menu");
    });

    it("should have proper ARIA roles for navigation menu", async () => {
      render(<PopoverMenu {...defaultProps} open={true} />);

      await waitFor(() => {
        const nav = screen.getByRole("menu", { name: /navigation menu/i });
        expect(nav).toBeInTheDocument();

        const menuItems = screen.getAllByRole("menuitem");
        expect(menuItems.length).toBeGreaterThan(0);
      });
    });

    it("should mark selected item with aria-current", async () => {
      render(<PopoverMenu {...defaultProps} open={true} page="Search" />);

      await waitFor(() => {
        const searchItem = screen.getByRole("menuitem", { name: /search/i });
        expect(searchItem).toHaveAttribute("aria-current", "page");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty routes array", () => {
      render(<PopoverMenu {...defaultProps} appRoutes={[]} open={true} />);

      const nav = screen.getByRole("menu", { name: /navigation menu/i });
      expect(nav).toBeInTheDocument();
      expect(nav.children.length).toBe(0);
    });

    it("should handle routes with special characters in path", async () => {
      const specialRoutes: AppRoute[] = [
        {
          path: "path-with-dashes",
          name: "Path With Dashes",
          layout: "/",
        },
      ];

      render(<PopoverMenu {...defaultProps} appRoutes={specialRoutes} open={true} />);

      await waitFor(() => {
        const link = screen.getByRole("menuitem", { name: /path with dashes/i });
        expect(link).toHaveAttribute("href", "/path-with-dashes");
      });
    });

    it("should apply custom className", () => {
      const { container } = render(<PopoverMenu {...defaultProps} className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });
});
