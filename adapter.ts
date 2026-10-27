/**
 * Blockchain integration boundary. Nothing outside src/chain talks to Solana.
 * Rules enforced by every implementation:
 *  - a real `signature` is returned ONLY for a transaction that was confirmed by an RPC node
 *  - SIMULATED results never carry a signature; they carry a clearly-labelled simulatedRef
 */
export type ChainModeName = 'SIMULATED' | 'DEVNET';

export interface ChainResult {
  mode: ChainModeName;
  status: 'SIMULATED' | 'CONFIRMED' | 'FAILED';
  signature?: string;
  simulatedRef?: string;
  slot?: number;
  mintAddress?: string;
  error?: string;
}

export interface ChainAdapter {
  readonly mode: ChainModeName;
  describe(): { mode: ChainModeName; rpcUrl?: string; payer?: string; token2022: boolean; stateCompression: false };
  /** Writes a proof of the payload hash (Solana Memo program on Devnet). */
  anchorProof(args: { componentId: string; payloadHash: string }): Promise<ChainResult>;
  /** Creates a Token-2022 mint representing the component. */
  mintComponentToken(args: { componentId: string }): Promise<ChainResult>;
  /** Re-checks a signature against the RPC node. */
  verifySignature(signature: string): Promise<{ confirmed: boolean; slot?: number; error?: string }>;
}
