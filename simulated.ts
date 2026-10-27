import { sha256 } from '../core/hash';
import type { ChainAdapter, ChainResult } from './adapter';

export class SimulatedChainAdapter implements ChainAdapter {
  readonly mode = 'SIMULATED' as const;
  describe() { return { mode: this.mode, token2022: false, stateCompression: false as const }; }

  async anchorProof({ componentId, payloadHash }: { componentId: string; payloadHash: string }): Promise<ChainResult> {
    return { mode: 'SIMULATED', status: 'SIMULATED', simulatedRef: 'SIM-' + sha256(componentId + payloadHash).slice(0, 16) };
  }
  async mintComponentToken({ componentId }: { componentId: string }): Promise<ChainResult> {
    return { mode: 'SIMULATED', status: 'SIMULATED', simulatedRef: 'SIM-MINT-' + sha256(componentId).slice(0, 12) };
  }
  async verifySignature(): Promise<{ confirmed: boolean; error?: string }> {
    return { confirmed: false, error: 'Simulated mode: nothing exists on-chain' };
  }
}
