import React from 'react';
import { render, screen } from '@testing-library/react';
import { useInitialViewport } from '../useInitialViewport';

function TestComponent() {
  const { isInitialized, initializeViewport, resetViewport, fitToNodes } = useInitialViewport({
    rfInstance: null,
    nodes: [],
    enabled: true,
  });

  // Call the functions to ensure they are callable without crashing when rfInstance is null
  // They should no-op safely
  React.useEffect(() => {
    initializeViewport();
    resetViewport();
    fitToNodes([]);
  }, [initializeViewport, resetViewport, fitToNodes]);

  return <div data-testid="initialized">{String(isInitialized)}</div>;
}

describe('useInitialViewport', () => {
  it('should render without crashing and default to not initialized', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('initialized').textContent).toBe('false');
  });
});
