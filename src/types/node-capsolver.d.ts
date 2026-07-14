// node-capsolver ships no TypeScript declarations (verified against v1.2.0 source).
// Minimal shim covering only what we actually call.
declare module 'node-capsolver' {
  interface CapSolverOptions {
    appId?: string;
    verbose?: boolean;
    verboseIdentifier?: string;
    apiUrl?: string;
    delay?: number;
  }

  interface CapSolverTaskResult {
    errorId: 0 | 1;
    errorCode?: string;
    errorDescription?: string;
    status: 'ready' | null;
    solution?: Record<string, unknown>;
    taskId?: string;
  }

  class CapSolver {
    constructor(clientKey: string, options?: CapSolverOptions);
    solve(task: Record<string, unknown>): Promise<CapSolverTaskResult>;
  }

  export default CapSolver;
}
