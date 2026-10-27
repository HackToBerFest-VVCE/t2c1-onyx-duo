import { createHash } from 'node:crypto';

export const sha256 = (data: string | Uint8Array): string =>
  createHash('sha256').update(data).digest('hex');

export const isSha256Hex = (s: string): boolean => /^[a-f0-9]{64}$/i.test(s);

/** Deterministic JSON (sorted keys) so the same data always hashes identically. */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(o[k])).join(',') + '}';
  }
  return JSON.stringify(v ?? null);
}
