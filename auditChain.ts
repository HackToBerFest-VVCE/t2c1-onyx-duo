import { sha256, canonicalJson } from './hash';

export interface AuditCore {
  seq: number; timestamp: string; componentId: string | null; actor: string;
  action: string; outcome: string; txSignature: string | null; prevHash: string;
}
export const GENESIS = 'GENESIS';
export const computeEntryHash = (e: AuditCore): string => sha256(canonicalJson(e));

export function buildEntry(
  prev: { seq: number; entryHash: string } | null,
  input: Omit<AuditCore, 'seq' | 'prevHash'>,
): AuditCore & { entryHash: string } {
  const core: AuditCore = { ...input, seq: (prev?.seq ?? 0) + 1, prevHash: prev?.entryHash ?? GENESIS };
  return { ...core, entryHash: computeEntryHash(core) };
}

export interface ChainVerdict { intact: boolean; checked: number; brokenAtSeq?: number; reason?: string }

/** Recompute every hash and link. Entries must be ordered by seq ascending. */
export function verifyChain(entries: (AuditCore & { entryHash: string })[]): ChainVerdict {
  let prev = GENESIS;
  let expectedSeq = 1;
  for (const e of entries) {
    if (e.seq !== expectedSeq) return { intact: false, checked: expectedSeq - 1, brokenAtSeq: e.seq, reason: 'sequence gap' };
    if (e.prevHash !== prev) return { intact: false, checked: expectedSeq - 1, brokenAtSeq: e.seq, reason: 'prevHash mismatch' };
    const { entryHash, ...core } = e;
    if (computeEntryHash(core) !== entryHash) return { intact: false, checked: expectedSeq - 1, brokenAtSeq: e.seq, reason: 'entry content altered' };
    prev = entryHash;
    expectedSeq++;
  }
  return { intact: true, checked: entries.length };
}
