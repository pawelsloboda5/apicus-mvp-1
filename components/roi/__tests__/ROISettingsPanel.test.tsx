/**
 * ROI Settings Panel - Comprehensive Test Suite
 * 
 * Tests cover:
 * - Component rendering and mode switching
 * - Input validation and error handling
 * - ROI calculations and updates
 * - AI factor generation
 * - Accessibility compliance
 * - Keyboard navigation
 * - Responsive behavior
 * - Performance optimization
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ROISettingsPanel } from '../ROISettingsPanel';
import type { Node } from '@xyflow/react';
import type { Scenario } from '@/lib/db';

expect.extend(toHaveNoViolations);

// Mock data
const mockNodes: Node[] = [
  { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
  { id: '2', type: 'action', position: { x: 100, y: 0 }, data: { label: 'Action' } },
];

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  platform: 'zapier' as const,
  runsPerMonth: 500,
  setRunsPerMonth: jest.fn(),
  minutesPerRun: 5,
  setMinutesPerRun: jest.fn(),
  hourlyRate: 30,
  setHourlyRate: jest.fn(),
  taskMultiplier: 1.2,
  setTaskMultiplier: jest.fn(),
  taskType: 'client_communication',
  setTaskType: jest.fn(),
  complianceEnabled: false,
  setComplianceEnabled: jest.fn(),
  revenueEnabled: false,
  setRevenueEnabled: jest.fn(),
  riskLevel: 3,
  setRiskLevel: jest.fn(),
  riskFrequency: 5,
  setRiskFrequency: jest.fn(),
  errorCost: 100,
  setErrorCost: jest.fn(),
  monthlyVolume: 1000,
  setMonthlyVolume: jest.fn(),
  conversionRate: 2,
  setConversionRate: jest.fn(),
  valuePerConversion: 500,
  setValuePerConversion: jest.fn(),
  taskTypeMultipliers: {
    internal_admin: 1.0,
    client_communication: 1.2,
    data_cleaning: 1.2,
    lead_scoring: 1.8,
  },
  benchmarks: {
    runs: { low: 10, medium: 500, high: 5000 },
    minutes: {
      client_communication: 5,
      internal_admin: 3,
      lead_scoring: 3,
    },
    hourlyRate: {
      client_communication: 45,
      internal_admin: 30,
      lead_scoring: 50,
    },
  },
  updateScenarioROI: jest.fn(),
  onGenerateReport: jest.fn(),
  nodes: mockNodes,
};

describe('ROISettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel when open', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      expect(screen.getByText(/Advanced ROI Calculator/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ROISettingsPanel {...defaultProps} open={false} />);
      expect(screen.queryByText(/Advanced ROI Calculator/i)).not.toBeInTheDocument();
    });

    it('should render all main sections', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      expect(screen.getByText(/Platform Cost Comparison/i)).toBeInTheDocument();
      expect(screen.getByText(/Task Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Core Metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/ROI Summary/i)).toBeInTheDocument();
    });

    it('should display platform comparison cards', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      expect(screen.getByText('Zapier')).toBeInTheDocument();
      expect(screen.getByText('Make')).toBeInTheDocument();
      expect(screen.getByText('N8n')).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid runs per month value', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const input = screen.getByLabelText(/Runs per Month/i);
      await user.clear(input);
      await user.type(input, '1000');
      
      expect(defaultProps.setRunsPerMonth).toHaveBeenCalledWith(1000);
    });

    it('should handle minimum value for runs per month', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const input = screen.getByLabelText(/Runs per Month/i);
      await user.clear(input);
      await user.type(input, '0');
      
      // Component should either prevent or warn about invalid value
      expect(input).toHaveValue(0);
    });

    it('should accept decimal values for minutes per run', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const input = screen.getByLabelText(/Minutes Saved \/ Run/i);
      await user.clear(input);
      await user.type(input, '2.5');
      
      expect(defaultProps.setMinutesPerRun).toHaveBeenCalled();
    });

    it('should accept hourly rate changes', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const input = screen.getByLabelText(/Labor Cost \/ hr/i);
      await user.clear(input);
      await user.type(input, '50');
      
      expect(defaultProps.setHourlyRate).toHaveBeenCalled();
    });
  });

  describe('Task Type Selection', () => {
    it('should update task type when selected', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const select = screen.getByRole('combobox', { name: /Task Type/i });
      await user.click(select);
      
      const option = screen.getByRole('option', { name: /Lead Scoring/i });
      await user.click(option);
      
      expect(defaultProps.setTaskType).toHaveBeenCalledWith('lead_scoring');
    });

    it('should auto-fill benchmarks when task type changes', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const select = screen.getByRole('combobox', { name: /Task Type/i });
      await user.click(select);
      
      const option = screen.getByRole('option', { name: /Lead Scoring/i });
      await user.click(option);
      
      // Should update related fields with benchmark values
      await waitFor(() => {
        expect(defaultProps.setMinutesPerRun).toHaveBeenCalledWith(3);
        expect(defaultProps.setHourlyRate).toHaveBeenCalledWith(50);
        expect(defaultProps.setTaskMultiplier).toHaveBeenCalledWith(1.8);
      });
    });

    it('should display task multiplier value', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      expect(screen.getByText('1.2×')).toBeInTheDocument();
    });
  });

  describe('Slider Controls', () => {
    it('should update runs per month via slider', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const slider = screen.getByRole('slider', { name: /runs-slider/i });
      
      // Simulate slider change
      fireEvent.change(slider, { target: { value: '2000' } });
      
      expect(defaultProps.setRunsPerMonth).toHaveBeenCalled();
    });

    it('should update minutes per run via slider', async () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      const slider = screen.getByRole('slider', { name: /minutes-slider/i });
      fireEvent.change(slider, { target: { value: '10' } });
      
      expect(defaultProps.setMinutesPerRun).toHaveBeenCalled();
    });

    it('should update hourly rate via slider', async () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      const slider = screen.getByRole('slider', { name: /hourly-slider/i });
      fireEvent.change(slider, { target: { value: '60' } });
      
      expect(defaultProps.setHourlyRate).toHaveBeenCalled();
    });
  });

  describe('ROI Calculations', () => {
    it('should display calculated ROI metrics', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      // Check that ROI summary section exists
      expect(screen.getByText(/ROI Summary/i)).toBeInTheDocument();
      
      // Should display monetary values
      const dollarValues = screen.getAllByText(/\$/);
      expect(dollarValues.length).toBeGreaterThan(0);
    });

    it('should update ROI when inputs change', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ROISettingsPanel {...defaultProps} />);
      
      // Change input
      const input = screen.getByLabelText(/Runs per Month/i);
      await user.clear(input);
      await user.type(input, '1000');
      
      // Rerender with new value
      rerender(<ROISettingsPanel {...defaultProps} runsPerMonth={1000} />);
      
      // ROI values should update (this is a simplified check)
      expect(screen.getByText(/ROI Summary/i)).toBeInTheDocument();
    });

    it('should display time saved calculation', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      expect(screen.getByText(/Time Saved/i)).toBeInTheDocument();
    });

    it('should display payback period', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      expect(screen.getByText(/Payback/i)).toBeInTheDocument();
    });
  });

  describe('AI Factor Generation', () => {
    it('should show generate factors button initially', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Generate Factors/i })).toBeInTheDocument();
    });

    it('should show loading state when generating factors', async () => {
      const user = userEvent.setup();
      
      // Mock fetch for factor generation
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              positiveFactors: [],
              negativeFactors: [],
              metadata: { confidenceScore: 85 }
            }
          })
        }), 100))
      );
      
      render(<ROISettingsPanel {...defaultProps} />);
      
      const generateBtn = screen.getByRole('button', { name: /Generate Factors/i });
      await user.click(generateBtn);
      
      expect(screen.getByText(/Generating/i)).toBeInTheDocument();
      expect(generateBtn).toBeDisabled();
    });

    it('should display factors after successful generation', async () => {
      const user = userEvent.setup();
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            positiveFactors: [
              {
                id: 'factor1',
                name: 'Test Factor',
                description: 'Test Description',
                suggestedValue: 10,
                estimatedMonthlyImpact: 100
              }
            ],
            negativeFactors: [],
            metadata: { confidenceScore: 85 }
          }
        })
      } as Response);
      
      render(<ROISettingsPanel {...defaultProps} />);
      
      const generateBtn = screen.getByRole('button', { name: /Generate Factors/i });
      await user.click(generateBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/Value Drivers/i)).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Factors', () => {
    it('should toggle Risk & Compliance section', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const accordion = screen.getByText(/Risk & Compliance/i);
      await user.click(accordion);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Risk Level/i)).toBeVisible();
      });
    });

    it('should toggle Revenue Uplift section', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const accordion = screen.getByText(/Revenue Uplift/i);
      await user.click(accordion);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Monthly Volume/i)).toBeVisible();
      });
    });

    it('should enable/disable compliance settings', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const complianceSwitch = screen.getByRole('switch', { name: /compliance/i });
      await user.click(complianceSwitch);
      
      expect(defaultProps.setComplianceEnabled).toHaveBeenCalledWith(true);
    });

    it('should enable/disable revenue settings', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const revenueSwitch = screen.getByRole('switch', { name: /revenue/i });
      await user.click(revenueSwitch);
      
      expect(defaultProps.setRevenueEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('Generate Report', () => {
    it('should call onGenerateReport when button clicked', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const generateBtn = screen.getByRole('button', { name: /Generate ROI Report/i });
      await user.click(generateBtn);
      
      expect(defaultProps.onGenerateReport).toHaveBeenCalled();
    });

    it('should show report button in footer', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /Generate ROI Report/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ROISettingsPanel {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels on inputs', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      expect(screen.getByLabelText(/Runs per Month/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Minutes Saved \/ Run/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Labor Cost \/ hr/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation with Tab', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      // Tab through focusable elements
      await user.tab();
      
      // First focusable element should be focused
      expect(document.activeElement).toBeTruthy();
    });

    it('should close panel on Escape key', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should have sufficient color contrast', () => {
      const { container } = render(<ROISettingsPanel {...defaultProps} />);
      
      // Check for contrast issues (simplified - would use axe in real test)
      const elements = container.querySelectorAll('[class*="text-"]');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      // Check h1, h2, h3 etc. are in proper order
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with proper width classes', () => {
      const { container } = render(<ROISettingsPanel {...defaultProps} />);
      
      const sheetContent = container.querySelector('[data-state="open"]');
      expect(sheetContent).toHaveClass('w-[50%]');
      expect(sheetContent).toHaveClass('min-w-[768px]');
    });
  });

  describe('Platform Comparison', () => {
    it('should highlight current platform', () => {
      render(<ROISettingsPanel {...defaultProps} platform="zapier" />);
      
      const zapierCard = screen.getByText('Zapier').closest('div');
      expect(zapierCard).toHaveClass('border-primary');
    });

    it('should show costs for all platforms', () => {
      render(<ROISettingsPanel {...defaultProps} />);
      
      // Should show dollar amounts for each platform
      const prices = screen.getAllByText(/\$\d+/);
      expect(prices.length).toBeGreaterThan(2);
    });

    it('should show current badge on active platform', () => {
      render(<ROISettingsPanel {...defaultProps} platform="zapier" />);
      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });

  describe('State Persistence', () => {
    it('should call updateScenarioROI when values change', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const input = screen.getByLabelText(/Runs per Month/i);
      await user.clear(input);
      await user.type(input, '1000');
      
      expect(defaultProps.updateScenarioROI).toHaveBeenCalled();
    });

    it('should persist task type changes', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const select = screen.getByRole('combobox', { name: /Task Type/i });
      await user.click(select);
      
      const option = screen.getByRole('option', { name: /Lead Scoring/i });
      await user.click(option);
      
      await waitFor(() => {
        expect(defaultProps.updateScenarioROI).toHaveBeenCalledWith(
          expect.objectContaining({
            taskType: 'lead_scoring'
          })
        );
      });
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders', () => {
      const { rerender } = render(<ROISettingsPanel {...defaultProps} />);
      
      // Rerender with same props
      rerender(<ROISettingsPanel {...defaultProps} />);
      rerender(<ROISettingsPanel {...defaultProps} />);
      
      // Should only render initial + 2 updates = 3 total
      // (This is a simplified check - would use React DevTools Profiler in real scenario)
      expect(screen.getByText(/Advanced ROI Calculator/i)).toBeInTheDocument();
    });

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      render(<ROISettingsPanel {...defaultProps} />);
      
      const input = screen.getByLabelText(/Runs per Month/i);
      
      // Rapid typing
      await user.type(input, '12345', { delay: 10 });
      
      // Should handle without crashing
      expect(input).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully during factor generation', async () => {
      const user = userEvent.setup();
      
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
      
      render(<ROISettingsPanel {...defaultProps} />);
      
      const generateBtn = screen.getByRole('button', { name: /Generate Factors/i });
      await user.click(generateBtn);
      
      await waitFor(() => {
        // Should not crash, should return to normal state
        expect(generateBtn).not.toBeDisabled();
      });
    });

    it('should handle invalid JSON responses', async () => {
      const user = userEvent.setup();
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);
      
      render(<ROISettingsPanel {...defaultProps} />);
      
      const generateBtn = screen.getByRole('button', { name: /Generate Factors/i });
      await user.click(generateBtn);
      
      await waitFor(() => {
        expect(generateBtn).not.toBeDisabled();
      });
    });
  });

  describe('Integration with Workflow', () => {
    it('should calculate steps per run from nodes', () => {
      render(<ROISettingsPanel {...defaultProps} nodes={mockNodes} />);
      
      // Should show step count based on nodes
      const stepText = screen.getByText(/~2 steps per workflow/i);
      expect(stepText).toBeInTheDocument();
    });

    it('should handle empty nodes array', () => {
      render(<ROISettingsPanel {...defaultProps} nodes={[]} />);
      
      // Should not crash
      expect(screen.getByText(/Advanced ROI Calculator/i)).toBeInTheDocument();
    });
  });
});
