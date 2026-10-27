import { config } from '../config';
import type { ChainAdapter } from './adapter';
import { SimulatedChainAdapter } from './simulated';
import { SolanaDevnetAdapter } from './solana';

let adapter: ChainAdapter | null = null;
export let chainFallbackReason: string | null = null;

export function getChain(): ChainAdapter {
  if (adapter) return adapter;
  if (config.SOLANA_MODE === 'devnet') {
    if (!config.SOLANA_PAYER_SECRET_KEY) {
      chainFallbackReason = 'SOLANA_MODE=devnet but SOLANA_PAYER_SECRET_KEY is empty - running SIMULATED';
    } else {
      try { adapter = new SolanaDevnetAdapter(config.SOLANA_RPC_URL, config.SOLANA_PAYER_SECRET_KEY); return adapter; }
      catch { chainFallbackReason = 'Could not load SOLANA_PAYER_SECRET_KEY - running SIMULATED'; }
    }
  }
  adapter = new SimulatedChainAdapter();
  return adapter;
}
