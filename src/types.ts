/**
 * Workers are declared as a const-tuple so the union type drives:
 *   - The supervisor's `next` enum (Zod)
 *   - Exhaustive switch checks
 *   - Graph node names (compile-time validation)
 */

export const WORKERS = ["researcher", "analyst", "writer"] as const;
export type WorkerName = (typeof WORKERS)[number];

export const SUPERVISOR_DECISIONS = [...WORKERS, "FINISH"] as const;
export type SupervisorDecision = (typeof SUPERVISOR_DECISIONS)[number];
