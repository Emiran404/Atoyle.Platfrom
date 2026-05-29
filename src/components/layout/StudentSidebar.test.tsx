import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';

// Mock stores
vi.mock('../../store/authStore');
vi.mock('../../store/examStore');

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('StudentSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student sidebar correctly', () => {
    // Setup mock data
    useAuthStore.mockReturnValue({
      user: { fullName: 'Ali Yılmaz', studentNumber: '12345' },
      logout: vi.fn(),
    });
    
    useExamStore.mockReturnValue({
      exams: [],
      loadExams: vi.fn()
    });

    renderWithRouter(<StudentSidebar />);
    
    // Check if sidebar title is rendered
    expect(screen.getByText('Atölye')).toBeInTheDocument();
    expect(screen.getByText('Student Platform')).toBeInTheDocument();
  });

  it('calls logout when exit button is clicked', () => {
    const mockLogout = vi.fn();
    useAuthStore.mockReturnValue({
      user: { fullName: 'Ali Yılmaz', studentNumber: '12345' },
      logout: mockLogout,
    });
    
    useExamStore.mockReturnValue({
      exams: [],
      loadExams: vi.fn()
    });

    renderWithRouter(<StudentSidebar />);
    
    // Find the logout button and click it
    const logoutBtn = screen.getByText('Çıkış Yap').closest('button');
    fireEvent.click(logoutBtn);
    
    // Verify logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
