/**
 * Component lifecycle state machine.
 * Mandated sequence:
 *   Manufacture -> Service/Inspection -> On-Chain Update -> Compliance Check
 *   -> Installation (Allow/Block) -> Decommission
 */
export const STATES = [
  'REGISTERED', 'IN_SERVICE', 'AWAITING_INSPECTION', 'INSPECTED', 'ON_CHAIN_UPDATED',
  'INSTALLATION_ELIGIBLE', 'INSTALLATION_BLOCKED', 'INSTALLED', 'QUARANTINED', 'DECOMMISSIONED',
] as const;
export type State = (typeof STATES)[number];

export const TRANSITIONS: Record<State, readonly State[]> = {
  REGISTERED: ['IN_SERVICE', 'QUARANTINED', 'DECOMMISSIONED'],
  IN_SERVICE: ['AWAITING_INSPECTION', 'QUARANTINED', 'DECOMMISSIONED'],
  AWAITING_INSPECTION: ['INSPECTED', 'IN_SERVICE', 'QUARANTINED'],
  INSPECTED: ['ON_CHAIN_UPDATED', 'IN_SERVICE', 'QUARANTINED'],
  ON_CHAIN_UPDATED: ['INSTALLATION_ELIGIBLE', 'INSTALLATION_BLOCKED', 'IN_SERVICE', 'QUARANTINED'],
  INSTALLATION_ELIGIBLE: ['INSTALLED', 'IN_SERVICE', 'QUARANTINED', 'DECOMMISSIONED'],
  INSTALLATION_BLOCKED: ['IN_SERVICE', 'QUARANTINED', 'DECOMMISSIONED'],
  INSTALLED: ['IN_SERVICE', 'QUARANTINED', 'DECOMMISSIONED'],
  QUARANTINED: ['DECOMMISSIONED'],
  DECOMMISSIONED: [],
};

export const canTransition = (from: State, to: State): boolean => TRANSITIONS[from].includes(to);

export class IllegalTransitionError extends Error {
  constructor(public from: State, public to: State) {
    super(`Illegal transition ${from} -> ${to}`);
  }
}
export function assertTransition(from: State, to: State): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

export const STAGES = ['Manufacture', 'Service / Inspection', 'On-Chain Update', 'Compliance Check', 'Installation', 'Decommission'] as const;

/** Index (0-5) of the furthest lifecycle stage reached; QUARANTINED has no linear position (-1). */
export function stageIndex(s: State): number {
  switch (s) {
    case 'REGISTERED': return 0;
    case 'IN_SERVICE': case 'AWAITING_INSPECTION': case 'INSPECTED': return 1;
    case 'ON_CHAIN_UPDATED': return 2;
    case 'INSTALLATION_ELIGIBLE': case 'INSTALLATION_BLOCKED': return 3;
    case 'INSTALLED': return 4;
    case 'DECOMMISSIONED': return 5;
    case 'QUARANTINED': return -1;
  }
}
