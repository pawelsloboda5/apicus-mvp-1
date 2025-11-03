import React from 'react';
import { render } from '@testing-library/react';

// Mock next/navigation hooks used inside component
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Mock next-themes
jest.mock('next-themes', () => ({ useTheme: () => ({ setTheme: jest.fn() }) }));

// Mock hooks that would touch IndexedDB or network
jest.mock('../../hooks/useScenarioManager', () => ({
  useScenarioManager: () => ({
    scenario: null,
    isLoading: false,
    isSaving: false,
    updateScenario: jest.fn(),
    loadScenario: jest.fn(),
  }),
}));

jest.mock('../../hooks/useEmailGeneration', () => ({
  useEmailGeneration: () => ({
    isGenerating: false,
    isGeneratingSection: false,
    extractContextFromNodes: () => ({}),
    generateFullEmail: jest.fn(),
    generateEmailSection: jest.fn().mockResolvedValue('New content'),
  }),
}));

jest.mock('../../hooks/useScenarioInitialization', () => ({
  useScenarioInitialization: () => ({ isLoading: false }),
}));

jest.mock('../../hooks/useInitialViewport', () => ({
  useInitialViewport: () => ({}),
}));

jest.mock('../../hooks/useROI', () => ({
  useROI: () => ({
    settings: {
      platform: 'zapier',
      runsPerMonth: 100,
      minutesPerRun: 5,
      hourlyRate: 30,
      taskMultiplier: 1.5,
      taskType: 'internal_admin',
      complianceEnabled: false,
      riskLevel: 3,
      riskFrequency: 5,
      errorCost: 100,
      revenueEnabled: false,
      monthlyVolume: 100,
      conversionRate: 5,
      valuePerConversion: 200,
    },
    metrics: {
      totalValue: 1000,
      netROI: 800,
      roiRatio: 2,
      paybackDays: 10,
      timeSavedHours: 12,
      platformCost: 200,
      totalCost: 200,
    },
    setRunsPerMonth: jest.fn(),
    setMinutesPerRun: jest.fn(),
    setPlatform: jest.fn(),
    setHourlyRate: jest.fn(),
    setTaskMultiplier: jest.fn(),
    setTaskType: jest.fn(),
    setComplianceEnabled: jest.fn(),
    setRiskLevel: jest.fn(),
    setRiskFrequency: jest.fn(),
    setErrorCost: jest.fn(),
    setRevenueEnabled: jest.fn(),
    setMonthlyVolume: jest.fn(),
    setConversionRate: jest.fn(),
    setValuePerConversion: jest.fn(),
    loadFromScenario: jest.fn(),
  }),
}));

// Mock dynamic Toolbox import to a simple stub component
jest.mock('@/components/flow/Toolbox', () => ({
  Toolbox: () => <div data-testid="toolbox" />,
}));

// Mock FlowCanvas to avoid React Flow internals during test
jest.mock('@/components/flow/FlowCanvas', () => ({
  FlowCanvas: () => <div data-testid="flow-canvas" />,
}));

import { BuildPageContent } from '../BuildPageContent';

describe('BuildPageContent', () => {
  it('renders without crashing (smoke test)', () => {
    render(<BuildPageContent />);
  });
});
