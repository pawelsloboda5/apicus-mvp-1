"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge, Viewport } from '@xyflow/react';
import { toast } from 'sonner';
import { Scenario, AlternativeTemplate, TemplateData } from '@/lib/types';
import { db, createScenario as dbCreateScenario } from '@/lib/db';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  API_CONFIG,
  STORAGE_KEYS,
  LIMITS,
  ANIMATION_CONFIG
} from '@/lib/utils/constants';

export interface UseScenarioManagerOptions {
  /** Initial scenario ID to load */
  initialScenarioId?: string;
  /** Callback fired when scenario changes */
  onScenarioChange?: (scenario: Scenario | null) => void;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
}

export interface ScenarioState {
  currentScenario: Scenario | null;
  scenarios: Scenario[];
  alternativeTemplates: AlternativeTemplate[];
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export function useScenarioManager({
  initialScenarioId,
  onScenarioChange,
  autoSaveInterval = ANIMATION_CONFIG.autoSaveInterval,
}: UseScenarioManagerOptions = {}) {
  
  const [state, setState] = useState<ScenarioState>({
    currentScenario: null,
    scenarios: [],
    alternativeTemplates: [],
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load scenario by ID
  const loadScenario = useCallback(async (scenarioId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Convert string ID to number for database query
      const numericId = parseInt(scenarioId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid scenario ID');
      }

      // Load from Dexie database
      const scenario = await db.scenarios.get(numericId);
      
      if (scenario) {
        setState(prev => ({
          ...prev,
          currentScenario: scenario,
          isLoading: false,
          hasUnsavedChanges: false,
        }));

        if (onScenarioChange) {
          onScenarioChange(scenario);
        }

        return scenario;
      } else {
        throw new Error(ERROR_MESSAGES.scenario.notFound);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.scenario.loadFailed;
      toast.error(errorMessage);
      throw error;
    }
  }, [onScenarioChange]);

  // Save current scenario
  const saveScenario = useCallback(async (scenario?: Partial<Scenario>) => {
    if (!state.currentScenario && !scenario) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const scenarioToSave = scenario ? 
        { ...state.currentScenario, ...scenario } : 
        state.currentScenario;

      if (!scenarioToSave) throw new Error('No scenario to save');

      // Update in database
      if (scenarioToSave.id) {
        await db.scenarios.update(scenarioToSave.id, {
          ...scenarioToSave,
          updatedAt: Date.now(),
        });
      } else {
        // Create new scenario
        const newId = await dbCreateScenario(scenarioToSave.name || 'Untitled Scenario');
        scenarioToSave.id = newId;
      }

      setState(prev => ({
        ...prev,
        currentScenario: scenarioToSave as Scenario,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
      }));

      return scenarioToSave;
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.scenario.saveFailed;
      toast.error(errorMessage);
      throw error;
    }
  }, [state.currentScenario]);

  // Create new scenario
  const createScenario = useCallback(async (name: string, templateData?: TemplateData) => {
    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // Use the database helper to create scenario
      const newScenarioId = await dbCreateScenario(name);
      
      // Load the newly created scenario
      const newScenario = await db.scenarios.get(newScenarioId);
      
      if (!newScenario) {
        throw new Error('Failed to create scenario');
      }

      // Update with template data if provided
      if (templateData) {
        await db.scenarios.update(newScenarioId, {
          ...templateData,
          updatedAt: Date.now(),
        });
        
        // Reload with updated data
        const updatedScenario = await db.scenarios.get(newScenarioId);
        
        setState(prev => ({
          ...prev,
          currentScenario: updatedScenario || newScenario,
          isSaving: false,
        }));

        if (onScenarioChange) {
          onScenarioChange(updatedScenario || newScenario);
        }

        toast.success(SUCCESS_MESSAGES.scenario.created);
        return updatedScenario || newScenario;
      }
      
      setState(prev => ({
        ...prev,
        currentScenario: newScenario,
        isSaving: false,
      }));

      if (onScenarioChange) {
        onScenarioChange(newScenario);
      }

      toast.success(SUCCESS_MESSAGES.scenario.created);
      return newScenario;
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.scenario.saveFailed;
      toast.error(errorMessage);
      throw error;
    }
  }, [onScenarioChange]);

  // Update scenario
  const updateScenario = useCallback((updates: Partial<Scenario>) => {
    if (!state.currentScenario || !state.currentScenario.id) return;

    const updatedScenario = { ...state.currentScenario, ...updates };
    
    setState(prev => ({
      ...prev,
      currentScenario: updatedScenario,
      hasUnsavedChanges: true,
    }));

    // Schedule auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveScenario(updatedScenario);
    }, autoSaveInterval);

    // Don't call onScenarioChange here to prevent circular updates
    // onScenarioChange should only be called when loading/creating scenarios
  }, [state.currentScenario, saveScenario, autoSaveInterval]);

  // Delete scenario
  const deleteScenario = useCallback(async (scenarioId: string) => {
    try {
      const numericId = parseInt(scenarioId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid scenario ID');
      }

      await db.scenarios.delete(numericId);

      setState(prev => ({
        ...prev,
        currentScenario: prev.currentScenario?.id === numericId ? null : prev.currentScenario,
      }));

      // Reload all scenarios
      await loadAllScenarios();

      toast.success(SUCCESS_MESSAGES.scenario.deleted);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.scenario.deleteFailed;
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Load all scenarios
  const loadAllScenarios = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const scenarios = await db.scenarios.orderBy('updatedAt').reverse().toArray();
      
      setState(prev => ({
        ...prev,
        scenarios,
        isLoading: false,
      }));

      return scenarios;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error(ERROR_MESSAGES.scenario.loadFailed);
      throw error;
    }
  }, []);

  // Search alternative templates
  const searchAlternativeTemplates = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_CONFIG.endpoints.templateSearch}?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        alternativeTemplates: result.templates || [],
        isLoading: false,
      }));

      return result.templates || [];
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.template.searchFailed;
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Load initial scenario
  useEffect(() => {
    let mounted = true;
    
    const loadInitialScenario = async () => {
      if (!mounted) return;
      
      if (initialScenarioId) {
        try {
          await loadScenario(initialScenarioId);
        } catch (error) {
          console.error('Failed to load initial scenario:', error);
        }
      } else {
        await loadAllScenarios();
      }
    };
    
    loadInitialScenario();
    
    return () => {
      mounted = false;
    };
  }, [initialScenarioId]); // Only depend on initialScenarioId

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    scenario: state.currentScenario,
    scenarios: state.scenarios,
    alternativeTemplates: state.alternativeTemplates,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved,

    // Actions
    loadScenario,
    saveScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    loadAllScenarios,
    searchAlternativeTemplates,

    // Utilities
    get canSave() { return !!state.currentScenario && state.hasUnsavedChanges; },
    get hasScenarios() { return state.scenarios.length > 0; },
  };
} 