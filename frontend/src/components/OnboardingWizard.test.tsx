import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingWizard } from './OnboardingWizard';

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('OnboardingWizard', () => {
  it('advances to the network step after selecting a camera type', () => {
    renderWithProviders(<OnboardingWizard />);
    fireEvent.click(screen.getByText(/IP Camera/i));
    fireEvent.click(screen.getByText(/Continue/i));
    expect(screen.getByLabelText(/Camera IP or hostname/i)).toBeInTheDocument();
  });
});
