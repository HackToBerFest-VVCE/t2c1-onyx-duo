import { config } from '../config';
import { HttpError } from '../errors';

/**
 * Solana Agent Registry boundary.
 * LIVE registration is intentionally NOT implemented: it needs the official registry SDK / program id,
 * which must be verified against current docs before use. This adapter never reports REGISTERED_ONCHAIN
 * without evidence. Replace `LiveAgentRegistry.register` once you have the SDK and a funded devnet payer.
 */
export interface RegistryResult { status: 'SIMULATED' | 'REGISTERED_ONCHAIN'; ref?: string }
export interface AgentRegistryAdapter {
  readonly mode: 'SIMULATED' | 'LIVE';
  register(agent: { agentCode: string; name: string; walletAddress?: string | null }): Promise<RegistryResult>;
}

class SimulatedRegistry implements AgentRegistryAdapter {
  readonly mode = 'SIMULATED' as const;
  async register(): Promise<RegistryResult> { return { status: 'SIMULATED' }; }
}
class LiveAgentRegistry implements AgentRegistryAdapter {
  readonly mode = 'LIVE' as const;
  async register(): Promise<RegistryResult> {
    throw new HttpError(501, 'Live Solana Agent Registry integration is not implemented in this build. See docs/security.md.', 'NOT_IMPLEMENTED');
  }
}
export const getAgentRegistry = (): AgentRegistryAdapter =>
  config.SOLANA_MODE === 'devnet' ? new LiveAgentRegistry() : new SimulatedRegistry();
