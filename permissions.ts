export const ROLES = ['MANUFACTURER', 'MRO', 'AIRLINE', 'INSPECTOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

/** Server-side RBAC matrix. Every mutating route is bound to exactly one action. */
export const PERMISSIONS = {
  REGISTER_COMPONENT: ['MANUFACTURER'],
  MINT_TOKEN: ['MANUFACTURER', 'ADMIN'],
  SUBMIT_MAINTENANCE: ['MRO'],
  INSPECTOR_DECISION: ['INSPECTOR'],
  ANCHOR_PROOF: ['MRO', 'INSPECTOR', 'ADMIN'],
  COMPLIANCE_CHECK: ['AIRLINE', 'ADMIN'],
  INSTALL_OR_DECOMMISSION: ['AIRLINE', 'ADMIN'],
  QUARANTINE: ['INSPECTOR', 'AIRLINE', 'ADMIN'],
  TOGGLE_AGENT: ['ADMIN'],
  REGISTER_AGENT_REGISTRY: ['ADMIN'],
  RESET_DEMO: ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>;
export type Action = keyof typeof PERMISSIONS;

export const isAllowed = (role: Role, action: Action): boolean =>
  (PERMISSIONS[action] as readonly Role[]).includes(role);
