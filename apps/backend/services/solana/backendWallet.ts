import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

const DEVNET_RPC = 'https://api.devnet.solana.com';

// Backend wallet for handling creator payments
let backendWallet: Keypair | null = null;

function getBackendWallet(): Keypair {
  if (!backendWallet) {
    // In production, load from environment variable
    const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
    
    if (privateKey) {
      try {
        const privateKeyBytes = bs58.decode(privateKey);
        backendWallet = Keypair.fromSecretKey(privateKeyBytes);
        console.log('Backend wallet loaded:', backendWallet.publicKey.toBase58());
      } catch (error) {
        console.error('Error loading backend wallet from env:', error);
        // Fallback to generated wallet
        backendWallet = Keypair.generate();
        console.log('Generated new backend wallet:', backendWallet.publicKey.toBase58());
        console.log('⚠️  Fund this wallet with devnet SOL: https://faucet.solana.com');
      }
    } else {
      // Generate a new wallet if no env var is set
      backendWallet = Keypair.generate();
      console.log('Generated new backend wallet:', backendWallet.publicKey.toBase58());
      console.log('⚠️  Fund this wallet with devnet SOL: https://faucet.solana.com');
    }
  }
  
  return backendWallet;
}

export async function transferSolToCreator(
  creatorPublicKey: string,
  amountLamports: number
): Promise<{ signature: string; success: boolean }> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const backendWallet = getBackendWallet();
    const creatorPubkey = new PublicKey(creatorPublicKey);
    
    // Check backend wallet balance
    const balance = await connection.getBalance(backendWallet.publicKey);
    if (balance < amountLamports) {
      throw new Error(`Insufficient balance. Backend wallet has ${balance / LAMPORTS_PER_SOL} SOL, needs ${amountLamports / LAMPORTS_PER_SOL} SOL`);
    }
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: backendWallet.publicKey,
        toPubkey: creatorPubkey,
        lamports: amountLamports,
      })
    );

    const signature = await connection.sendTransaction(transaction, [backendWallet]);
    await connection.confirmTransaction(signature);

    console.log('SOL transferred to creator:', {
      creator: creatorPublicKey,
      amount: amountLamports / LAMPORTS_PER_SOL,
      signature,
      backendWallet: backendWallet.publicKey.toBase58()
    });

    return { signature, success: true };
  } catch (error) {
    console.error('Error transferring SOL to creator:', error);
    throw new Error(`Failed to transfer SOL to creator: ${error}`);
  }
}

export async function getBackendWalletBalance(): Promise<number> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const backendWallet = getBackendWallet();
    const balance = await connection.getBalance(backendWallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting backend wallet balance:', error);
    return 0;
  }
}

export function getBackendWalletPublicKey(): string {
  const backendWallet = getBackendWallet();
  return backendWallet.publicKey.toBase58();
}
