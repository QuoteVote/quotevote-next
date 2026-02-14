import { render, screen } from '@testing-library/react';
import ControlPanelPage from '@/app/dashboard/control-panel/page';

// Mock the components used in ControlPanelPage
jest.mock('@/components/SubHeader', () => ({
  SubHeader: ({ headerName }: { headerName: string }) => (
    <header data-testid="subheader">{headerName}</header>
  ),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/Admin/BotListTab', () => ({
  __esModule: true,
  default: () => <div data-testid="bot-list-tab">Bot List Tab</div>,
}));

describe('ControlPanelPage', () => {
  it('should render the page with SubHeader', () => {
    render(<ControlPanelPage />);
    
    const subheader = screen.getByTestId('subheader');
    expect(subheader).toBeInTheDocument();
    expect(subheader).toHaveTextContent('Control Panel');
  });

  it('should render the Bot Reports section header', () => {
    render(<ControlPanelPage />);
    
    const sectionHeader = screen.getByRole('heading', { name: /bot reports/i });
    expect(sectionHeader).toBeInTheDocument();
    expect(sectionHeader).toHaveClass('text-xl', 'font-semibold');
  });

  it('should render BotListTab component', () => {
    render(<ControlPanelPage />);
    
    const botListTab = screen.getByTestId('bot-list-tab');
    expect(botListTab).toBeInTheDocument();
  });

  it('should have proper structure with space-y-4 and space-y-6 classes', () => {
    const { container } = render(<ControlPanelPage />);
    
    const mainDiv = container.querySelector('.space-y-4');
    expect(mainDiv).toBeInTheDocument();
    
    const sectionsDiv = container.querySelector('.space-y-6');
    expect(sectionsDiv).toBeInTheDocument();
  });

  it('should wrap BotListTab in a section element', () => {
    const { container } = render(<ControlPanelPage />);
    
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});
