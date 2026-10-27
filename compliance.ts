import { sha256, canonicalJson } from './hash';
import type { State } from './lifecycle';

export type Decision = 'ALLOW' | 'BLOCK' | 'REVIEW_REQUIRED';
export type Severity = 'BLOCK' | 'REVIEW';

export interface EvidenceRecord {
  id: string;
  status: 'AWAITING_INSPECTION' | 'APPROVED' | 'REJECTED' | 'QUARANTINED';
  signatureStatus: 'UNSIGNED' | 'VERIFIED' | 'INVALID';
  flightHours: number;
  agentAuthorized: boolean;
  documentHashes: string[];
  createdAt: string; // ISO, used for ordering
}
export interface AnchorRef {
  mode: 'SIMULATED' | 'DEVNET';
  status: 'SIMULATED' | 'CONFIRMED' | 'FAILED';
  payloadHash: string;
}
export interface ComplianceInput {
  componentId: string; serialNumber: string; state: State; certificateHash: string | null;
  records: EvidenceRecord[];
  latestAnchor: AnchorRef | null;
  requireConfirmedAnchor: boolean; // true when running against real Devnet
  disabledRules?: string[];
}
export interface Finding { rule: string; severity: Severity; message: string }
export interface ComplianceOutcome {
  decision: Decision; failed: Finding[]; passed: string[]; simulatedAnchor: boolean; ruleVersion: string;
}
export const RULE_VERSION = '2026.10.1';

/** Hash of everything an on-chain proof is supposed to cover (state excluded on purpose). */
export function computeProofPayload(i: Pick<ComplianceInput, 'componentId' | 'serialNumber' | 'certificateHash' | 'records'>): string {
  return sha256(canonicalJson({
    componentId: i.componentId, serialNumber: i.serialNumber, certificateHash: i.certificateHash,
    records: [...i.records].sort((a, b) => a.id.localeCompare(b.id))
      .map((r) => ({ id: r.id, status: r.status, docs: [...r.documentHashes].sort() })),
  }));
}

export function evaluateCompliance(i: ComplianceInput): ComplianceOutcome {
  const off = new Set(i.disabledRules ?? []);
  const failed: Finding[] = [];
  const passed: string[] = [];
  const check = (rule: string, severity: Severity, ok: boolean, message: string) => {
    if (off.has(rule)) return;
    if (ok) passed.push(rule); else failed.push({ rule, severity, message });
  };
  const ordered = [...i.records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = ordered[ordered.length - 1];

  check('R01_NOT_TERMINAL', 'BLOCK', i.state !== 'QUARANTINED' && i.state !== 'DECOMMISSIONED', `Component is ${i.state}`);
  check('R02_CERTIFICATE_HASH', 'BLOCK', !!i.certificateHash, 'Missing certificate hash');
  check('R03_LATEST_NOT_REJECTED', 'BLOCK', !latest || (latest.status !== 'REJECTED' && latest.status !== 'QUARANTINED'),
    `Latest maintenance evidence was ${latest?.status}`);
  check('R04_EVIDENCE_PRESENT', 'BLOCK', ordered.every((r) => r.documentHashes.length > 0), 'A maintenance record has no hashed document');
  check('R05_SIGNATURES_NOT_INVALID', 'BLOCK', ordered.every((r) => r.signatureStatus !== 'INVALID'), 'A maintenance record has an INVALID signature');
  check('R06_AGENT_AUTHORIZED', 'BLOCK', ordered.every((r) => r.agentAuthorized), 'A submitting agent is revoked');
  check('R07_ANCHOR_CURRENT', 'BLOCK',
    !!i.latestAnchor && i.latestAnchor.status !== 'FAILED' && i.latestAnchor.payloadHash === computeProofPayload(i),
    'No current proof anchor (records changed since last anchor, or never anchored)');
  if (i.requireConfirmedAnchor)
    check('R08_ANCHOR_CONFIRMED', 'BLOCK', i.latestAnchor?.status === 'CONFIRMED', 'Anchor is not a confirmed on-chain transaction');
  check('R09_NO_PENDING_INSPECTION', 'REVIEW', !ordered.some((r) => r.status === 'AWAITING_INSPECTION'), 'Maintenance evidence is awaiting inspection');
  check('R10_INSPECTOR_APPROVAL', 'REVIEW', ordered.some((r) => r.status === 'APPROVED'), 'No inspector-approved maintenance record');
  check('R11_FLIGHT_HOURS_MONOTONIC', 'REVIEW', ordered.every((r, k) => k === 0 || r.flightHours >= ordered[k - 1].flightHours),
    'Flight hours decrease between records (possible inconsistency)');

  const decision: Decision = failed.some((f) => f.severity === 'BLOCK') ? 'BLOCK'
    : failed.length ? 'REVIEW_REQUIRED' : 'ALLOW';
  return { decision, failed, passed, simulatedAnchor: i.latestAnchor?.mode === 'SIMULATED', ruleVersion: RULE_VERSION };
}
