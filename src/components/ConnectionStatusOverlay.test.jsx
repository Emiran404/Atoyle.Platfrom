import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectionStatusOverlay from './ConnectionStatusOverlay';
import { useAuthStore } from '../store/authStore';

// Mock the auth store
vi.mock('../store/authStore');

describe('ConnectionStatusOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when online', () => {
    // Return true for isServerOnline
    useAuthStore.mockImplementation((selector) => {
      const state = { isServerOnline: true, setServerOnline: vi.fn() };
      return selector(state);
    });
    
    const { container } = render(<ConnectionStatusOverlay />);
    // When online, the component returns null
    expect(container.firstChild).toBeNull();
  });

  it('renders warning when offline', () => {
    // Return false for isServerOnline
    useAuthStore.mockImplementation((selector) => {
      const state = { isServerOnline: false, setServerOnline: vi.fn() };
      return selector(state);
    });
    
    render(<ConnectionStatusOverlay />);
    
    // Check for offline messages
    expect(screen.getByText('Sunucu bağlantısı koptu')).toBeInTheDocument();
    expect(screen.getByText('Sizi tekrar bağlamaya çalışıyoruz...')).toBeInTheDocument();
  });
});
