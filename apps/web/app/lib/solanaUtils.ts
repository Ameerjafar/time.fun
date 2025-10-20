import { Transaction, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export interface TransactionData {
  transaction: string; // Base64 encoded transaction
  mintAddress: string;
  tokenAccountAddress: string;
  instructions: Array<{
    programId: string;
    keys: Array<{
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }>;
    data: string;
  }>;
}

export interface TokenCreationParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  totalSupply: number;
  decimals: number;
  pricingModel: 'market' | 'fixed';
  fixedPrice?: number;
  features: {
    chat: boolean;
    groupChat: boolean;
    videoCall: boolean;
  };
  publicKey: string;
}

/**
 * Sign and submit a Solana transaction using the connected wallet
 */
export async function signAndSubmitTransaction(
  transactionData: TransactionData,
  wallet: any
): Promise<{ signature: string; success: boolean }> {
  try {
    if (!wallet || !wallet.signTransaction) {
      throw new Error('Wallet not connected or does not support transaction signing');
    }

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(transactionData.transaction, 'base64');
    const transaction = Transaction.from(transactionBuffer);

    // Sign the transaction with the wallet
    const signedTransaction = await wallet.signTransaction(transaction);

    // Serialize the signed transaction
    const signedTransactionBuffer = signedTransaction.serialize();
    const signedTransactionBase64 = signedTransactionBuffer.toString('base64');

    return {
      signature: signedTransactionBase64,
      success: true
    };
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw new Error('Failed to sign transaction');
  }
}

/**
 * Create token by preparing transaction, signing it, and submitting to backend
 */
export async function createTokenWithWallet(
  tokenParams: TokenCreationParams,
  userId: string,
  wallet: any,
  signTransaction: any
): Promise<{ success: boolean; token?: any; error?: string }> {
  try {
    console.log('Creating token with params:', { ...tokenParams, userId });
    
    // Step 1: Get transaction data from backend
    const response = await fetch('http://localhost:5000/token/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...tokenParams,
        userId,
        publicKey: tokenParams.publicKey // Use the publicKey from tokenParams
      }),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      throw new Error(errorData.message || errorData.error || 'Failed to create token transaction');
    }

    const { transactionData, poolAddress, tokenPrice } = await response.json();
    console.log('Transaction data received:', { 
      mintAddress: transactionData.mintAddress, 
      poolAddress, 
      tokenPrice 
    });

    // Step 2: Sign the transaction
    console.log('Signing transaction...');
    const { signature } = await signAndSubmitTransaction(transactionData, { signTransaction });
    console.log('Transaction signed successfully');

    // Step 3: Submit signed transaction to backend
    const submitResponse = await fetch('http://localhost:5000/token/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signedTransaction: signature,
        mintAddress: transactionData.mintAddress,
        userId,
        poolAddress,
        tokenPrice,
        tokenParams
      }),
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json();
      throw new Error(errorData.message || 'Failed to submit token transaction');
    }

    const result = await submitResponse.json();
    return {
      success: true,
      token: result.token
    };

  } catch (error: any) {
    console.error('Error creating token:', error);
    return {
      success: false,
      error: error.message || 'Failed to create token'
    };
  }
}

/**
 * Check if wallet is connected and ready for transactions
 */
export function isWalletReady(wallet: any): boolean {
  return !!(wallet && wallet.connected && wallet.publicKey && wallet.signTransaction);
}

/**
 * Check if wallet is connected and ready for transactions using useWallet hook properties
 */
export function isWalletConnected(connected: boolean, publicKey: any, signTransaction: any): boolean {
  return !!(connected && publicKey && signTransaction);
}

/**
 * Get wallet public key as string
 */
export function getWalletPublicKey(wallet: any): string | null {
  return wallet?.publicKey?.toBase58() || null;
}
