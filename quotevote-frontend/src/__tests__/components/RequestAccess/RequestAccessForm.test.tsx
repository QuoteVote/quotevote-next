/**
 * RequestAccessForm Component Tests
 * 
 * Tests for the RequestAccessForm component
 */

import { render, screen, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { RequestAccessForm } from '@/components/RequestAccess/RequestAccessForm';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast } from 'sonner';

// Mock Apollo Client hooks
const mockQuery = jest.fn();
const mockMutation = jest.fn();
const mockClient = {
  query: mockQuery,
};

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useApolloClient: () => mockClient,
    useMutation: () => [
      mockMutation,
      { loading: false },
    ],
  };
});

describe('RequestAccessForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default query response (no duplicate)
    mockQuery.mockResolvedValue({
      data: {
        checkDuplicateEmail: [],
      },
    });
    
    // Default mutation response
    mockMutation.mockResolvedValue({
      data: {
        requestUserAccess: {
          _id: '123',
          email: 'test@example.com',
        },
      },
    });
  });

  it('renders the form correctly', () => {
    render(<RequestAccessForm />);

    expect(screen.getByPlaceholderText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request invite/i })).toBeInTheDocument();
    expect(screen.getByText(/you need an account to contribute/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<RequestAccessForm />);

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const submitButton = screen.getByRole('button', { name: /request invite/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows error for duplicate email', async () => {
    const user = userEvent.setup();
    
    // Mock query to return duplicate email
    mockQuery.mockResolvedValue({
      data: {
        checkDuplicateEmail: [{ _id: '1', email: 'existing@example.com' }],
      },
    });

    render(<RequestAccessForm />);

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const submitButton = screen.getByRole('button', { name: /request invite/i });

    await user.type(emailInput, 'existing@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/this email address has already been used to request an invite/i)
      ).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid email', async () => {
    const user = userEvent.setup();

    render(<RequestAccessForm />);

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const submitButton = screen.getByRole('button', { name: /request invite/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Request submitted successfully!');
    });
  });

  it('calls onSuccess callback when provided', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(<RequestAccessForm onSuccess={onSuccess} />);

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const submitButton = screen.getByRole('button', { name: /request invite/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('submits on Enter key press', async () => {
    const user = userEvent.setup();

    render(<RequestAccessForm />);

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);

    await user.type(emailInput, 'test@example.com{Enter}');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Request submitted successfully!');
    });
  });
});

