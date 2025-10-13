import { roiReducer } from '../reducer';
import type { ROIConfiguration, ROIAction } from '../types';

const baseState: ROIConfiguration = {
  core: {
    runsPerMonth: 1000,
    minutesPerRun: 5,
    hourlyRate: 30,
    taskType: 'internal_admin',
    taskMultiplier: 1.0,
  },
  compliance: {
    enabled: false,
    riskLevel: 3,
    riskFrequency: 5,
    errorCost: 100,
  },
  revenue: {
    enabled: false,
    monthlyVolume: 0,
    conversionRate: 0,
    valuePerConversion: 0,
  },
  factors: {
    positive: [],
    negative: [],
    factorValues: {},
    lockedFactors: {},
    enabledFactors: {},
    confidence: 0,
    generated: false,
  },
};

describe('roiReducer', () => {
  it('updates core fields immutably', () => {
    const action: ROIAction = { type: 'UPDATE_CORE', field: 'runsPerMonth', value: 2000 };
    const next = roiReducer(baseState, action);
    expect(next.core.runsPerMonth).toBe(2000);
    expect(baseState.core.runsPerMonth).toBe(1000);
  });

  it('updates task type and benchmarks', () => {
    const action: ROIAction = {
      type: 'UPDATE_TASK_TYPE',
      taskType: 'client_communication',
      benchmarks: { minutesPerRun: 7.5, hourlyRate: 45, taskMultiplier: 1.2 },
    };
    const next = roiReducer(baseState, action);
    expect(next.core.taskType).toBe('client_communication');
    expect(next.core.minutesPerRun).toBe(7.5);
    expect(next.core.hourlyRate).toBe(45);
    expect(next.core.taskMultiplier).toBe(1.2);
  });

  it('toggles factor enabled flag', () => {
    const withFactor = {
      ...baseState,
      factors: {
        ...baseState.factors,
        enabledFactors: { f1: true },
      },
    } satisfies ROIConfiguration;
    const next = roiReducer(withFactor, { type: 'TOGGLE_FACTOR', factorId: 'f1', enabled: false });
    expect(next.factors.enabledFactors.f1).toBe(false);
  });

  it('loads full config', () => {
    const other = { ...baseState, core: { ...baseState.core, runsPerMonth: 321 } };
    const next = roiReducer(baseState, { type: 'LOAD_CONFIG', config: other });
    expect(next).toBe(other);
  });
});


