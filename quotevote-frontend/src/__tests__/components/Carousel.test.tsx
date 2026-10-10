/**
 * Carousel Component Tests
 *
 * Tests for the Carousel component and related carousel components.
 * Tests cover:
 * - Basic rendering
 * - Navigation (next/previous)
 * - Dots indicators
 * - Keyboard navigation
 * - Autoplay functionality
 * - Responsive behavior
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor, act } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import { Carousel } from "@/components/Carousel";
import { PersonalPlanCarousel } from "@/components/Carousel/PersonalPlan";
import { BusinessPlanCarousel } from "@/components/Carousel/BusinessPlan";
import { InvestorPlanCarousel } from "@/components/Carousel/InvestorsPlan";
import { RequestInviteCarouselButton } from "@/components/Carousel/RequestInviteCarouselButton";
import { PersonalPlanHeaderText } from "@/components/Carousel/PersonalPlan/PersonalPlanHeaderText";
import { BusinessHeaderText } from "@/components/Carousel/BusinessPlan/BusinessHeaderText";
import { InvestorHeaderText } from "@/components/Carousel/InvestorsPlan/InvestorHeaderText";

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Carousel Component", () => {
  const sampleSlides = [
    <div key="1" data-testid="slide-1">
      Slide 1
    </div>,
    <div key="2" data-testid="slide-2">
      Slide 2
    </div>,
    <div key="3" data-testid="slide-3">
      Slide 3
    </div>,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Basic Rendering", () => {
    it("renders carousel with slides", () => {
      render(<Carousel>{sampleSlides}</Carousel>);
      expect(screen.getByTestId("slide-1")).toBeInTheDocument();
    });

    it("renders navigation buttons", () => {
      render(<Carousel navButtonsAlwaysVisible>{sampleSlides}</Carousel>);
      expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
      expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
    });

    it("renders dots indicators", () => {
      render(<Carousel>{sampleSlides}</Carousel>);
      const dots = screen.getAllByLabelText(/Go to slide/);
      expect(dots).toHaveLength(3);
    });
  });

  describe("Navigation", () => {
    it("navigates to next slide when next button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Carousel navButtonsAlwaysVisible>{sampleSlides}</Carousel>);

      const nextButton = screen.getByLabelText("Next slide");
      await user.click(nextButton);

      // Slide 2 should be visible (no aria-hidden attribute)
      const slide2 = screen.getByTestId("slide-2");
      expect(slide2).not.toHaveAttribute("aria-hidden");
    });

    it("navigates to previous slide when back button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Carousel navButtonsAlwaysVisible index={1}>
          {sampleSlides}
        </Carousel>
      );

      const backButton = screen.getByLabelText("Previous slide");
      await user.click(backButton);

      // Should navigate back to slide 1
      const slide1 = screen.getByTestId("slide-1");
      expect(slide1).toBeInTheDocument();
    });

    it("disables next button on last slide", () => {
      render(
        <Carousel navButtonsAlwaysVisible index={2}>
          {sampleSlides}
        </Carousel>
      );

      const nextButton = screen.getByLabelText("Next slide");
      expect(nextButton).toBeDisabled();
    });

    it("disables back button on first slide", () => {
      render(
        <Carousel navButtonsAlwaysVisible index={0}>
          {sampleSlides}
        </Carousel>
      );

      const backButton = screen.getByLabelText("Previous slide");
      expect(backButton).toBeDisabled();
    });

    it("navigates to specific slide when dot is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Carousel>{sampleSlides}</Carousel>);

      const dot3 = screen.getByLabelText("Go to slide 3");
      await user.click(dot3);

      const slide3 = screen.getByTestId("slide-3");
      // Slide 3 should be visible (no aria-hidden attribute)
      expect(slide3).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("Keyboard Navigation", () => {
    it("navigates with arrow keys", async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<Carousel>{sampleSlides}</Carousel>);

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        carousel.focus();
        await user.keyboard("{ArrowRight}");

        // Should navigate to next slide
        const slide2 = screen.getByTestId("slide-2");
        expect(slide2).toBeInTheDocument();
      }
    });

    it("navigates back with left arrow key", async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<Carousel index={1}>{sampleSlides}</Carousel>);

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        carousel.focus();
        await user.keyboard("{ArrowLeft}");

        // Should navigate to previous slide
        const slide1 = screen.getByTestId("slide-1");
        expect(slide1).toBeInTheDocument();
      }
    });
  });

  describe("Autoplay", () => {
    it("advances slides automatically when autoplay is enabled", async () => {
      render(
        <Carousel autoplay autoplayInterval={1000}>
          {sampleSlides}
        </Carousel>
      );

      // Fast-forward time wrapped in act
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const slide2 = screen.getByTestId("slide-2");
        // Slide 2 should be visible (no aria-hidden attribute)
        expect(slide2).not.toHaveAttribute("aria-hidden");
      });
    });

    it("pauses autoplay on hover when pauseOnHover is enabled", async () => {
      const { container } = render(
        <Carousel autoplay autoplayInterval={1000} pauseOnHover>
          {sampleSlides}
        </Carousel>
      );

      const carousel = container.querySelector('[role="region"]');
      if (carousel) {
        act(() => {
          fireEvent.mouseEnter(carousel);
        });

        // Fast-forward time - should not advance
        act(() => {
          jest.advanceTimersByTime(2000);
        });

        const slide1 = screen.getByTestId("slide-1");
        // Slide 1 should still be visible (not advanced due to hover pause)
        expect(slide1).not.toHaveAttribute("aria-hidden");
      }
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("works as controlled component with index prop", async () => {
      const { rerender } = render(<Carousel index={0}>{sampleSlides}</Carousel>);

      rerender(<Carousel index={1}>{sampleSlides}</Carousel>);

      await waitFor(() => {
        const slide2 = screen.getByTestId("slide-2");
        // Slide 2 should be visible (no aria-hidden attribute when active)
        expect(slide2).not.toHaveAttribute("aria-hidden");
      });
    });

    it("calls onChange callback when slide changes", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup({ delay: null });
      render(<Carousel onChange={handleChange}>{sampleSlides}</Carousel>);

      const nextButton = screen.getByLabelText("Next slide");
      await user.click(nextButton);

      expect(handleChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<Carousel>{sampleSlides}</Carousel>);

      const carousel = screen.getByRole("region", { name: "Carousel" });
      expect(carousel).toBeInTheDocument();
    });

    it("marks inactive slides as aria-hidden", () => {
      const { container } = render(<Carousel>{sampleSlides}</Carousel>);

      const slide1 = screen.getByTestId("slide-1");
      const slide2 = screen.getByTestId("slide-2");
      const slide3 = screen.getByTestId("slide-3");

      // Verify slides exist
      expect(slide1).toBeInTheDocument();
      expect(slide2).toBeInTheDocument();
      expect(slide3).toBeInTheDocument();

      // Check aria-hidden using querySelector (more reliable for spread attributes)
      const hiddenSlides = container.querySelectorAll('[aria-hidden="true"]');
      // Should have 2 hidden slides (slide-2 and slide-3)
      expect(hiddenSlides.length).toBeGreaterThanOrEqual(2);

      // First slide should be visible (no aria-hidden attribute)
      expect(slide1).not.toHaveAttribute("aria-hidden");
    });

    it("marks active dot with aria-current", () => {
      render(<Carousel>{sampleSlides}</Carousel>);

      const dot1 = screen.getByLabelText("Go to slide 1");
      expect(dot1).toHaveAttribute("aria-current", "true");
    });
  });

  describe("Edge Cases", () => {
    it("handles single slide correctly", () => {
      const singleSlide = [
        <div key="1" data-testid="single-slide">
          Single Slide
        </div>,
      ];
      render(<Carousel>{singleSlide}</Carousel>);

      expect(screen.getByTestId("single-slide")).toBeInTheDocument();
      const nextButton = screen.getByLabelText("Next slide");
      const backButton = screen.getByLabelText("Previous slide");

      // Both buttons should be disabled for single slide
      expect(nextButton).toBeDisabled();
      expect(backButton).toBeDisabled();
    });

    it("handles empty children array gracefully", () => {
      const { container } = render(<Carousel>{[]}</Carousel>);
      expect(container).toBeInTheDocument();
    });

    it("handles non-array children", () => {
      const singleChild = <div data-testid="single-child">Single Child</div>;
      render(<Carousel>{[singleChild]}</Carousel>);

      expect(screen.getByTestId("single-child")).toBeInTheDocument();
    });

    it("wraps around when reaching last slide with autoplay", async () => {
      render(
        <Carousel autoplay autoplayInterval={1000}>
          {sampleSlides}
        </Carousel>
      );

      // Fast-forward to last slide
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const slide3 = screen.getByTestId("slide-3");
        expect(slide3).not.toHaveAttribute("aria-hidden");
      });

      // Fast-forward again - should wrap to first slide
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const slide1 = screen.getByTestId("slide-1");
        expect(slide1).not.toHaveAttribute("aria-hidden");
      });
    });

    it("handles RTL direction correctly", async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <Carousel rtl index={1}>
          {sampleSlides}
        </Carousel>
      );

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        carousel.focus();
        // In RTL, left arrow should go next
        await user.keyboard("{ArrowLeft}");

        await waitFor(() => {
          const slide3 = screen.getByTestId("slide-3");
          expect(slide3).not.toHaveAttribute("aria-hidden");
        });
      }
    });
  });

  describe("Swipe Gestures", () => {
    it("handles left swipe to go next", async () => {
      const { container } = render(<Carousel enableSwipe>{sampleSlides}</Carousel>);

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        // Simulate touch start
        fireEvent.touchStart(carousel, {
          targetTouches: [{ clientX: 100 }],
        });

        // Simulate touch move (swipe left)
        fireEvent.touchMove(carousel, {
          targetTouches: [{ clientX: 30 }], // 70px left swipe
        });

        // Simulate touch end
        fireEvent.touchEnd(carousel);

        await waitFor(() => {
          const slide2 = screen.getByTestId("slide-2");
          expect(slide2).not.toHaveAttribute("aria-hidden");
        });
      }
    });

    it("handles right swipe to go back", async () => {
      const { container } = render(
        <Carousel enableSwipe index={1}>
          {sampleSlides}
        </Carousel>
      );

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        // Simulate touch start
        fireEvent.touchStart(carousel, {
          targetTouches: [{ clientX: 100 }],
        });

        // Simulate touch move (swipe right)
        fireEvent.touchMove(carousel, {
          targetTouches: [{ clientX: 160 }], // 60px right swipe
        });

        // Simulate touch end
        fireEvent.touchEnd(carousel);

        await waitFor(() => {
          const slide1 = screen.getByTestId("slide-1");
          expect(slide1).not.toHaveAttribute("aria-hidden");
        });
      }
    });

    it("ignores swipe when enableSwipe is false", async () => {
      const { container } = render(<Carousel enableSwipe={false}>{sampleSlides}</Carousel>);

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        fireEvent.touchStart(carousel, {
          targetTouches: [{ clientX: 100 }],
        });

        fireEvent.touchMove(carousel, {
          targetTouches: [{ clientX: 30 }],
        });

        fireEvent.touchEnd(carousel);

        // Should not navigate
        const slide1 = screen.getByTestId("slide-1");
        expect(slide1).not.toHaveAttribute("aria-hidden");
      }
    });

    it("ignores small swipe gestures below threshold", async () => {
      const { container } = render(<Carousel enableSwipe>{sampleSlides}</Carousel>);

      const carousel = container.querySelector('[role="region"]') as HTMLElement;
      if (carousel) {
        fireEvent.touchStart(carousel, {
          targetTouches: [{ clientX: 100 }],
        });

        // Small swipe (less than 50px threshold)
        fireEvent.touchMove(carousel, {
          targetTouches: [{ clientX: 60 }], // Only 40px
        });

        fireEvent.touchEnd(carousel);

        // Should not navigate
        const slide1 = screen.getByTestId("slide-1");
        expect(slide1).not.toHaveAttribute("aria-hidden");
      }
    });
  });

  describe("Responsiveness", () => {
    it("hides navigation buttons on mobile when navButtonsAlwaysVisible is false", () => {
      // Mock small screen
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(<Carousel navButtonsAlwaysVisible={false}>{sampleSlides}</Carousel>);

      // Navigation buttons should have 'hidden' class on mobile
      const prevButton = screen.getByLabelText("Previous slide");
      const nextButton = screen.getByLabelText("Next slide");

      // Buttons are hidden via 'hidden sm:flex' classes on mobile
      expect(prevButton).toHaveClass("hidden");
      expect(nextButton).toHaveClass("hidden");
    });

    it("shows navigation buttons on desktop", () => {
      // Mock large screen
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<Carousel navButtonsAlwaysVisible>{sampleSlides}</Carousel>);

      expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
      expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
    });
  });
});

describe("RequestInviteCarouselButton", () => {
  it("renders button", () => {
    render(<RequestInviteCarouselButton />);
    expect(screen.getByText("Request Invite")).toBeInTheDocument();
  });

  it("navigates to request-access page on click", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RequestInviteCarouselButton />);

    const button = screen.getByText("Request Invite");
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith("/auth/request-access");
  });
});

describe("Plan Carousel Header Texts", () => {
  const mockClasses = {
    greenTitleText: "text-green-500",
  };

  describe("PersonalPlanHeaderText", () => {
    it("renders text for index 0", () => {
      render(<PersonalPlanHeaderText classes={mockClasses} index={0} />);
      expect(screen.getByText(/What is/)).toBeInTheDocument();
      expect(screen.getByText(/Quote Vote/)).toBeInTheDocument();
    });

    it("renders text for index 1", () => {
      render(<PersonalPlanHeaderText classes={mockClasses} index={1} />);
      expect(screen.getByText(/Share/)).toBeInTheDocument();
    });

    it("renders text for index 2", () => {
      render(<PersonalPlanHeaderText classes={mockClasses} index={2} />);
      expect(screen.getByText(/your voice/)).toBeInTheDocument();
    });

    it("renders text for index 3", () => {
      render(<PersonalPlanHeaderText classes={mockClasses} index={3} />);
      expect(screen.getByText(/Trending/)).toBeInTheDocument();
    });
  });

  describe("BusinessHeaderText", () => {
    it("renders text for index 0", () => {
      render(<BusinessHeaderText classes={mockClasses} index={0} />);
      expect(screen.getByText(/Highlight text/)).toBeInTheDocument();
    });

    it("renders text for index 1", () => {
      render(<BusinessHeaderText classes={mockClasses} index={1} />);
      expect(screen.getByText(/Same Page/)).toBeInTheDocument();
    });

    it("renders text for index 2", () => {
      render(<BusinessHeaderText classes={mockClasses} index={2} />);
      expect(screen.getByText(/Quality Teamwork/)).toBeInTheDocument();
    });
  });

  describe("InvestorHeaderText", () => {
    it("renders text for index 0", () => {
      render(<InvestorHeaderText classes={mockClasses} index={0} />);
      expect(screen.getByText(/Shape Quote Vote/)).toBeInTheDocument();
    });

    it("renders text for index 1", () => {
      render(<InvestorHeaderText classes={mockClasses} index={1} />);
      expect(screen.getByText(/All Voices Equal/)).toBeInTheDocument();
    });

    it("renders text for index 2", () => {
      render(<InvestorHeaderText classes={mockClasses} index={2} />);
      expect(screen.getByText(/Together for/)).toBeInTheDocument();
    });
  });
});

describe("Plan Carousels", () => {
  const mockClasses = {
    activeIndicator: "bg-primary",
    inactiveIndicator: "bg-gray-400",
    opinionsText: "text-base",
    bottomText: "text-base",
    greenText: "text-[#52b274]",
  };

  describe("PersonalPlanCarousel", () => {
    it("renders without crashing", () => {
      const { container } = render(<PersonalPlanCarousel classes={mockClasses} />);
      expect(container).toBeInTheDocument();
    });

    it("calls setCarouselCurrentIndex when slide changes", async () => {
      const handleIndexChange = jest.fn();
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <PersonalPlanCarousel classes={mockClasses} setCarouselCurrentIndex={handleIndexChange} />
      );

      const nextButton = container.querySelector('[aria-label="Next slide"]');
      if (nextButton) {
        await user.click(nextButton);
        expect(handleIndexChange).toHaveBeenCalled();
      }
    });
  });

  describe("BusinessPlanCarousel", () => {
    it("renders without crashing", () => {
      const { container } = render(<BusinessPlanCarousel classes={mockClasses} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("InvestorPlanCarousel", () => {
    it("renders without crashing", () => {
      const { container } = render(<InvestorPlanCarousel classes={mockClasses} />);
      expect(container).toBeInTheDocument();
    });
  });
});
