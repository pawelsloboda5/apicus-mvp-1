import { useLiveQuery } from "dexie-react-hooks";
import { db, getRecentMetrics, type Scenario, type MetricSnapshot } from "./db";

/**
 * Convenience hook to subscribe to a scenario record using dexie-react-hooks.
 * Usage: const scenario = useScenario(id);
 */
export function useScenario(id?: number) {
  return useLiveQuery(() => (id ? db.scenarios.get(id) : undefined), [id]);
}

/**
 * Hook to subscribe to metrics for a scenario
 */
export function useScenarioMetrics(scenarioId?: number, limit: number = 30) {
  return useLiveQuery(
    () => (scenarioId ? getRecentMetrics(scenarioId, limit) : undefined),
    [scenarioId, limit]
  );
} 