import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Verifies an Ed25519 signature (Solana wallet style) over a message.
 * Returns true ONLY if cryptographically valid. Never throws on bad input.
 */
export function verifyEd25519(message: string, signatureB58: string, publicKeyB58: string): boolean {
  try {
    const sig = bs58.decode(signatureB58);
    const pk = bs58.decode(publicKeyB58);
    if (sig.length !== 64 || pk.length !== 32) return false;
    return nacl.sign.detached.verify(new TextEncoder().encode(message), sig, pk);
  } catch { return false; }
}
