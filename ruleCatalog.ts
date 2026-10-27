export const RULE_CATALOG = [
  { code: 'R01_NOT_TERMINAL', severity: 'BLOCK', description: 'Component must not be quarantined or decommissioned' },
  { code: 'R02_CERTIFICATE_HASH', severity: 'BLOCK', description: 'Manufacturer certificate hash on file' },
  { code: 'R03_LATEST_NOT_REJECTED', severity: 'BLOCK', description: 'Latest maintenance evidence not rejected/quarantined' },
  { code: 'R04_EVIDENCE_PRESENT', severity: 'BLOCK', description: 'Every maintenance record has a hashed document' },
  { code: 'R05_SIGNATURES_NOT_INVALID', severity: 'BLOCK', description: 'No record has an invalid signature' },
  { code: 'R06_AGENT_AUTHORIZED', severity: 'BLOCK', description: 'All submitting agents still authorized' },
  { code: 'R07_ANCHOR_CURRENT', severity: 'BLOCK', description: 'On-chain proof covers the current records' },
  { code: 'R08_ANCHOR_CONFIRMED', severity: 'BLOCK', description: 'Anchor is a confirmed tx (Devnet mode only)' },
  { code: 'R09_NO_PENDING_INSPECTION', severity: 'REVIEW', description: 'No evidence awaiting inspection' },
  { code: 'R10_INSPECTOR_APPROVAL', severity: 'REVIEW', description: 'At least one inspector-approved record' },
  { code: 'R11_FLIGHT_HOURS_MONOTONIC', severity: 'REVIEW', description: 'Flight hours never decrease (anomaly detection)' },
] as const;
