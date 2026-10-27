import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, createMint, getMint } from '@solana/spl-token';
import bs58 from 'bs58';
import type { ChainAdapter, ChainResult } from './adapter';

const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export function loadKeypair(secret: string): Keypair {
  const s = secret.trim();
  if (s.startsWith('[')) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(s)));
  return Keypair.fromSecretKey(bs58.decode(s));
}

/** Real Solana Devnet adapter. Requires a funded THROWAWAY devnet keypair in env. */
export class SolanaDevnetAdapter implements ChainAdapter {
  readonly mode = 'DEVNET' as const;
  private conn: Connection;
  private payer: Keypair;

  constructor(private rpcUrl: string, payerSecret: string) {
    this.conn = new Connection(rpcUrl, 'confirmed');
    this.payer = loadKeypair(payerSecret);
  }

  describe() {
    return { mode: this.mode, rpcUrl: this.rpcUrl, payer: this.payer.publicKey.toBase58(), token2022: true, stateCompression: false as const };
  }

  async anchorProof({ componentId, payloadHash }: { componentId: string; payloadHash: string }): Promise<ChainResult> {
    try {
      const memo = JSON.stringify({ app: 'onyx-duo', v: 1, c: componentId, h: payloadHash });
      const ix = new TransactionInstruction({
        programId: MEMO_PROGRAM,
        keys: [{ pubkey: this.payer.publicKey, isSigner: true, isWritable: false }],
        data: Buffer.from(memo, 'utf8'),
      });
      const signature = await sendAndConfirmTransaction(this.conn, new Transaction().add(ix), [this.payer], { commitment: 'confirmed' });
      const v = await this.verifySignature(signature);
      if (!v.confirmed) return { mode: 'DEVNET', status: 'FAILED', error: v.error ?? 'Transaction not confirmed' };
      return { mode: 'DEVNET', status: 'CONFIRMED', signature, slot: v.slot };
    } catch (e) {
      return { mode: 'DEVNET', status: 'FAILED', error: (e as Error).message };
    }
  }

  async mintComponentToken(_: { componentId: string }): Promise<ChainResult> {
    try {
      const mint = await createMint(this.conn, this.payer, this.payer.publicKey, null, 0, undefined, { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
      const info = await getMint(this.conn, mint, 'confirmed', TOKEN_2022_PROGRAM_ID); // proves the account exists
      if (!info.isInitialized) return { mode: 'DEVNET', status: 'FAILED', error: 'Mint not initialized' };
      return { mode: 'DEVNET', status: 'CONFIRMED', mintAddress: mint.toBase58() };
    } catch (e) {
      return { mode: 'DEVNET', status: 'FAILED', error: (e as Error).message };
    }
  }

  async verifySignature(signature: string) {
    try {
      const tx = await this.conn.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
      if (!tx) return { confirmed: false, error: 'Transaction not found on this cluster' };
      if (tx.meta?.err) return { confirmed: false, slot: tx.slot, error: 'Transaction failed on-chain' };
      return { confirmed: true, slot: tx.slot };
    } catch (e) { return { confirmed: false, error: (e as Error).message }; }
  }
}
