import { verifyADR36Amino } from '@cosmjs/amino';
import { fromBech32 } from '@cosmjs/encoding';
import { SecureLogger, SecurityValidator } from './security';

export interface ADR36SignDoc {
  chain_id: string;
  account_number: string;
  sequence: string;
  fee: {
    gas: string;
    amount: any[];
  };
  msgs: any[];
  memo: string;
}

class WalletVerifier {
  /**
   * Verify Coreum ADR-036 signature
   */
  static async verifyADR36Signature(
    address: string,
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Decode the address to get the address bytes
      const { data: addressBytes } = fromBech32(address);
      
      // Create the sign doc for ADR-036
      const signDoc: ADR36SignDoc = {
        chain_id: 'coreum-mainnet-1',
        account_number: '0',
        sequence: '0',
        fee: {
          gas: '0',
          amount: []
        },
        msgs: [],
        memo: message
      };

      // Handle different signature formats
      let signatureBuffer: Buffer;
      try {
        // Try base64 first (most common format)
        signatureBuffer = Buffer.from(signature, 'base64');
      } catch (e) {
        try {
          // Try hex format as fallback
          signatureBuffer = Buffer.from(signature, 'hex');
        } catch (e2) {
          throw new Error('Invalid signature format - must be base64 or hex');
        }
      }

      // Verify the signature
      const isValid = await verifyADR36Amino(
        'core', // Coreum prefix
        address,
        message,
        Buffer.from(publicKey, 'base64'),
        signatureBuffer,
        'secp256k1'
      );

      SecureLogger.logSecure('info', 'ADR-036 signature verification successful', {
        address,
        messageLength: message.length
      });
      return isValid;
    } catch (error) {
      SecureLogger.logSecure('error', 'ADR-036 signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        address
      });
      return false;
    }
  }

  /**
   * Create a standardized message for wallet verification
   */
  static createVerificationMessage(
    address: string,
    timestamp: number,
    nonce: string
  ): string {
    return JSON.stringify({
      purpose: 'Roll NFT Dashboard - Wallet Verification',
      address,
      timestamp,
      nonce,
      message: 'Please sign this message to verify your wallet ownership.'
    });
  }

  /**
   * Create a TMA signing message
   */
  static createTMAMessage(
    address: string,
    tmaVersion: string,
    tmaHash: string,
    timestamp: number
  ): string {
    return JSON.stringify({
      purpose: 'Roll NFT Dashboard - TMA Signature',
      address,
      tmaVersion,
      tmaHash,
      timestamp,
      message: `I agree to the Terms & Membership Agreement version ${tmaVersion}`
    });
  }

  /**
   * Validate Coreum address format
   */
  static isValidCoreumAddress(address: string): boolean {
    return SecurityValidator.isValidCoreumAddress(address);
  }

  /**
   * Get address from public key
   */
  static getAddressFromPublicKey(publicKey: string, prefix: string = 'core'): string {
    try {
      // This is a simplified version - in production you'd use proper crypto libraries
      const pubKeyBytes = Buffer.from(publicKey, 'base64');
      // Implementation would depend on the specific key type and derivation method
      // For now, this is a placeholder that would need proper implementation
      return `${prefix}1placeholder...`;
    } catch (error) {
      throw new Error('Invalid public key format');
    }
  }

  /**
   * Verify wallet signature with proper security checks
   * SECURITY CRITICAL: Validates wallet ownership
   */
  static async verifySignature(params: {
    address: string;
    message: string;
    signature: string;
    publicKey?: string;
    chain: string;
  }): Promise<boolean> {
    const { address, message, signature, publicKey, chain } = params;
    
    try {
      // Basic validation
      if (!address || !message || !signature) {
        SecureLogger.logSecure('error', 'Missing required signature verification parameters', params);
        return false;
      }

      if (chain !== 'coreum') {
        SecureLogger.logSecure('error', 'Unsupported chain for signature verification', { chain });
        return false;
      }

      // For development environment, add extensive debugging
      console.log('🔐 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
      console.log('🔐 [DEBUG] Checking if should bypass signature verification...');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 [DEBUG] Wallet signature verification details:', {
          address,
          messageLength: message.length,
          signatureLength: signature.length,
          hasSignature: !!signature,
          hasPublicKey: !!publicKey,
          signaturePreview: signature.substring(0, 50) + '...',
          messagePreview: message.substring(0, 100) + '...',
          publicKeyPreview: publicKey ? publicKey.substring(0, 20) + '...' : 'none'
        });
        
        // TEMPORARY: Skip signature verification in development mode to isolate the issue
        console.log('🔐 [DEBUG] TEMPORARILY BYPASSING SIGNATURE VERIFICATION IN DEVELOPMENT');
        SecureLogger.logSecure('warn', 'Development Mode: BYPASSING signature verification for debugging', { address });
        
        // Just validate basic format requirements (relaxed for debugging)
        const isValidAddress = this.isValidCoreumAddress(address);
        const isValidMessage = message.length > 0;
        const isValidSignature = signature.length > 0;
        const hasPublicKey = !!publicKey;
        
        const isValid = isValidAddress && isValidMessage && isValidSignature;
        
        console.log('🔐 [DEBUG] Detailed validation results:', {
          isValidAddress,
          isValidMessage,
          isValidSignature,
          hasPublicKey,
          overallValid: isValid
        });
        
        return isValid;
      }

      // Production signature verification
      if (publicKey) {
        // Use proper ADR-036 verification when public key is available
        try {
          return await this.verifyADR36Signature(address, message, signature, publicKey);
        } catch (error) {
          SecureLogger.logSecure('error', 'ADR-036 verification failed', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            address 
          });
          return false;
        }
      } else {
        SecureLogger.logSecure('error', 'Production signature verification requires public key', { address });
        return false;
      }
      
    } catch (error) {
      SecureLogger.logSecure('error', 'Signature verification error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        address 
      });
      return false;
    }
  }
}

export default WalletVerifier;

