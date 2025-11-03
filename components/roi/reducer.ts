/**
 * ROI reducer – pure function (no hooks, no side effects)
 * Keeps ROISettingsPanel state updates predictable and testable.
 */

import type { ROIConfiguration, ROIAction } from './types';

export function roiReducer(state: ROIConfiguration, action: ROIAction): ROIConfiguration {
  switch (action.type) {
    case 'UPDATE_CORE':
      return {
        ...state,
        core: {
          ...state.core,
          [action.field]: action.value,
        },
      };

    case 'UPDATE_TASK_TYPE':
      return {
        ...state,
        core: {
          ...state.core,
          taskType: action.taskType,
          minutesPerRun: action.benchmarks.minutesPerRun,
          hourlyRate: action.benchmarks.hourlyRate,
          taskMultiplier: action.benchmarks.taskMultiplier,
        },
      };

    case 'UPDATE_COMPLIANCE':
      return {
        ...state,
        compliance: {
          ...state.compliance,
          [action.field]: action.value,
        },
      };

    case 'UPDATE_REVENUE':
      return {
        ...state,
        revenue: {
          ...state.revenue,
          [action.field]: action.value,
        },
      };

    case 'UPDATE_FACTOR_VALUE':
      return {
        ...state,
        factors: {
          ...state.factors,
          factorValues: {
            ...state.factors.factorValues,
            [action.factorId]: action.value,
          },
        },
      };

    case 'LOCK_FACTOR':
      return {
        ...state,
        factors: {
          ...state.factors,
          lockedFactors: {
            ...state.factors.lockedFactors,
            [action.factorId]: !state.factors.lockedFactors[action.factorId],
          },
        },
      };

    case 'TOGGLE_FACTOR':
      return {
        ...state,
        factors: {
          ...state.factors,
          enabledFactors: {
            ...state.factors.enabledFactors,
            [action.factorId]: action.enabled,
          },
        },
      };

    case 'SET_FACTORS': {
      const newValues = { ...state.factors.factorValues };
      action.positive.forEach(f => {
        if (newValues[f.id] === undefined) newValues[f.id] = f.suggestedValue;
      });
      action.negative.forEach(f => {
        if (newValues[f.id] === undefined) newValues[f.id] = f.suggestedValue;
      });

      const newEnabled = { ...state.factors.enabledFactors };
      action.positive.forEach(f => {
        if (newEnabled[f.id] === undefined) newEnabled[f.id] = true;
      });
      action.negative.forEach(f => {
        if (newEnabled[f.id] === undefined) newEnabled[f.id] = true;
      });

      return {
        ...state,
        factors: {
          ...state.factors,
          positive: action.positive,
          negative: action.negative,
          factorValues: newValues,
          enabledFactors: newEnabled,
          confidence: action.confidence,
          generated: true,
        },
      };
    }

    case 'SET_FACTORS_GENERATING':
      // No state changes here – generation spinner handled outside reducer
      return state;

    case 'LOAD_CONFIG':
      return action.config;

    case 'SYNC_FROM_PARENT':
      // Sync core settings from parent without touching factors
      return {
        ...state,
        core: action.core,
        compliance: action.compliance,
        revenue: action.revenue,
        // Preserve factors - they might be being edited in the panel
      };

    default:
      return state;
  }
}

export default roiReducer;


