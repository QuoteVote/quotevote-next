/**
 * Tests for useNotifications hook
 */

import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide notification methods', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifySuccess).toBeDefined();
    expect(result.current.notifyError).toBeDefined();
    expect(result.current.notifyInfo).toBeDefined();
    expect(result.current.notifyWarning).toBeDefined();
  });

  it('should call toast.success when notifySuccess is called', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifySuccess('Test success message');
    });

    expect(toast.success).toHaveBeenCalledWith('Test success message', {
      duration: 4000,
    });
  });

  it('should call toast.error when notifyError is called', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyError('Test error message');
    });

    expect(toast.error).toHaveBeenCalledWith('Test error message', {
      duration: 5000,
    });
  });

  it('should call toast.info when notifyInfo is called', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyInfo('Test info message');
    });

    expect(toast.info).toHaveBeenCalledWith('Test info message', {
      duration: 4000,
    });
  });

  it('should call toast.warning when notifyWarning is called', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyWarning('Test warning message');
    });

    expect(toast.warning).toHaveBeenCalledWith('Test warning message', {
      duration: 4000,
    });
  });

  it('should accept custom duration options', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifySuccess('Test message', { duration: 6000 });
    });

    expect(toast.success).toHaveBeenCalledWith('Test message', {
      duration: 6000,
    });
  });
});

