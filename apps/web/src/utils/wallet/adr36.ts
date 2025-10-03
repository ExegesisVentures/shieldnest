// apps/web/src/utils/wallet/adr36.ts
import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { toBase64, fromBase64 } from '@cosmjs/encoding';

/**
 * ADR-036 signature verification utilities
 * Used for wallet-based authentication
 */

export interface SignDoc {
  account_number: string;
  chain_id: string;
  fee: {
    amount: Array<{ amount: string; denom: string }>;
    gas: string;
  };
  memo: string;
  msgs: Array<{
    type: string;
    value: {
      signer: string;
      data: string;
    };
  }>;
  sequence: string;
}

/**
 * Create ADR-036 compliant sign doc for authentication
 */
export function createAuthSignDoc(
  chainId: string,
  address: string,
  nonce: string
): SignDoc {
  return {
    account_number: '0',
    chain_id: chainId,
    fee: {
      amount: [],
      gas: '0',
    },
    memo: '',
    msgs: [
      {
        type: 'sign/MsgSignData',
        value: {
          signer: address,
          data: toBase64(new TextEncoder().encode(nonce)),
        },
      },
    ],
    sequence: '0',
  };
}

/**
 * Verify ADR-036 signature
 */
export async function verifySignature(
  signature: string,
  publicKey: string,
  signDoc: SignDoc
): Promise<boolean> {
  try {
    const signBytes = new TextEncoder().encode(JSON.stringify(signDoc));
    const hashedMessage = sha256(signBytes);
    
    const signatureBytes = fromBase64(signature);
    const publicKeyBytes = fromBase64(publicKey);
    
    return await Secp256k1.verifySignature(
      Secp256k1.uncompressedPublicKeyToRawSecp256k1PublicKey(publicKeyBytes),
      hashedMessage,
      signatureBytes
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate a secure nonce for authentication
 */
export function generateNonce(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `ShieldNest-Auth-${timestamp}-${random}`;
}

/**
 * Check if a nonce is still valid (not expired)
 */
export function isNonceValid(nonce: string, maxAgeMs = 5 * 60 * 1000): boolean {
  try {
    const parts = nonce.split('-');
    if (parts.length < 3 || parts[0] !== 'ShieldNest' || parts[1] !== 'Auth') {
      return false;
    }
    
    const timestamp = parseInt(parts[2]);
    const age = Date.now() - timestamp;
    
    return age <= maxAgeMs;
  } catch {
    return false;
  }
}
