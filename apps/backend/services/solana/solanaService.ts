import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S');
const DEVNET_RPC = 'https://api.devnet.solana.com';

// Persistent payer keypair to avoid airdrop rate limits
// In production, load this from environment variable
let cachedPayer: Keypair | null = null;

function getOrCreatePayer(): Keypair {
  if (!cachedPayer) {
    // Generate once and reuse
    // TODO: In production, load from process.env.PAYER_PRIVATE_KEY
    cachedPayer = Keypair.generate();
    console.log(cachedPayer.publicKey);
    console.log('Generated payer wallet:', cachedPayer.publicKey.toBase58());
    console.log('⚠️  Fund this wallet with devnet SOL: https://faucet.solana.com');
  }
  return cachedPayer;
}

export interface TokenCreationParams {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  imageUrl: string;
  description: string;
  publicKey: string;
}

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

export interface PoolInitParams {
  tokenMint: PublicKey;
  solMint: PublicKey;
  initialSol: number;
  initialToken: number;
  creatorKeypair: Keypair;
}

/**
 * Create transaction data for SPL token creation (to be signed by user wallet)
 */
export async function createTokenTransaction(params: TokenCreationParams): Promise<TransactionData> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const userPublicKey = new PublicKey(params.publicKey);
    
    // Generate a new mint keypair
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey;
    
    // Get associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintAddress,
      userPublicKey
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create transaction
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
    // Create instructions
    const instructions: TransactionInstruction[] = [];
    
    // 1. Create mint account
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mintAddress,
      space: 82, // Mint account space
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    });
    instructions.push(createMintAccountIx);
    
    // 2. Initialize mint
    const initializeMintIx = createInitializeMintInstruction(
      mintAddress,
      params.decimals,
      userPublicKey, // mint authority
      userPublicKey  // freeze authority
    );
    instructions.push(initializeMintIx);
    
    // 3. Create associated token account
    const createTokenAccountIx = createAssociatedTokenAccountInstruction(
      userPublicKey, // payer
      tokenAccountAddress, // associated token account
      userPublicKey, // owner
      mintAddress // mint
    );
    instructions.push(createTokenAccountIx);
    
    // 4. Mint tokens to user's account
    const mintToIx = createMintToInstruction(
      mintAddress, // mint
      tokenAccountAddress, // destination
      userPublicKey, // authority
      params.totalSupply * Math.pow(10, params.decimals) // amount
    );
    instructions.push(mintToIx);
    
    // Add all instructions to transaction
    transaction.add(...instructions);

    // Add mint keypair as a signer AFTER instructions are added so it's a known signer
    transaction.partialSign(mintKeypair);
    
    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    
    const transactionBase64 = serializedTransaction.toString('base64');
    
    // Convert instructions to serializable format
    const serializableInstructions = instructions.map(ix => ({
      programId: ix.programId.toBase58(),
      keys: ix.keys.map(key => ({
        pubkey: key.pubkey.toBase58(),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(ix.data).toString('base64')
    }));
    
    console.log('Token creation transaction prepared:', {
      mintAddress: mintAddress.toBase58(),
      tokenAccountAddress: tokenAccountAddress.toBase58(),
      instructionCount: instructions.length
    });

    return {
      transaction: transactionBase64,
      mintAddress: mintAddress.toBase58(),
      tokenAccountAddress: tokenAccountAddress.toBase58(),
      instructions: serializableInstructions
    };
  } catch (error) {
    console.error('Error creating token transaction:', error);
    throw new Error('Failed to create token transaction');
  }
}

/**
 * Submit a signed transaction to the Solana network
 */
export async function submitSignedTransaction(signedTransactionBase64: string): Promise<{
  signature: string;
  success: boolean;
}> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    
    // Deserialize the signed transaction
    const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64');
    const transaction = Transaction.from(transactionBuffer);
    
    try {
      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(transactionBuffer, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log('Transaction confirmed:', signature);
      
      return {
        signature,
        success: true
      };
    } catch (error: any) {
      // If the transaction was already processed, derive and return the txid
      const message = String(error?.message || '');
      if (message.includes('already been processed')) {
        const firstSignature = transaction.signatures[0]?.signature;
        const derivedSignature = firstSignature ? bs58.encode(firstSignature) : '';
        console.warn('Transaction already processed. Returning derived signature:', derivedSignature);
        return {
          signature: derivedSignature,
          success: true
        };
      }
      console.error('Error submitting transaction:', error);
      throw new Error('Failed to submit transaction');
    }
  } catch (outerError) {
    console.error('Error preparing transaction submission:', outerError);
    throw new Error('Failed to submit transaction');
  }
}

export async function initializePool(params: PoolInitParams): Promise<{
  poolAddress: string;
  signature: string;
  tokenPrice: number;
}> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    
    // Derive pool PDA (deterministic address based on token mints)
    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('pool'),
        params.solMint.toBuffer(),
        params.tokenMint.toBuffer()
      ],
      PROGRAM_ID
    );

    
    const tokenPrice = params.initialSol / params.initialToken;

    console.log('Pool PDA derived:', poolPDA.toBase58());
    console.log('Initial token price:', tokenPrice, 'SOL');
    console.log('Note: Pool initialization will be done via frontend wallet interaction');

    return {
      poolAddress: poolPDA.toBase58(),
      signature: 'mock-signature-' + Date.now(), 
      tokenPrice
    };
  } catch (error) {
    console.error('Error deriving pool address:', error);
    throw new Error('Failed to derive pool address');
  }
}

export async function getTokenPrice(
  tokenMint: PublicKey,
  solMint: PublicKey
): Promise<number> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    
    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('pool'),
        solMint.toBuffer(),
        tokenMint.toBuffer()
      ],
      PROGRAM_ID
    );

    // Try to fetch pool account
    const poolAccount = await connection.getAccountInfo(poolPDA);
    
    if (!poolAccount) {
      console.log('Pool not yet initialized on-chain, returning default price');
      // Return default price if pool doesn't exist yet
      return 0.000001; // 1 token = 0.000001 SOL
    }

    // If pool exists, try to decode (simplified)
    try {
      const data = poolAccount.data;
      if (data.length >= 24) {
        const reserveX = Number(data.readBigUInt64LE(8));
        const reserveY = Number(data.readBigUInt64LE(16));
        
        if (reserveY > 0) {
          const price = reserveX / reserveY / LAMPORTS_PER_SOL;
          return price;
        }
      }
    } catch (decodeError) {
      console.error('Error decoding pool data:', decodeError);
    }

    // Fallback to default price
    return 0.000001;
  } catch (error) {
    console.error('Error getting token price:', error);
    return 0.000001; // Default price
  }
}

/**
 * Create token transaction and derive pool address
 * Returns transaction data for frontend signing
 */
export async function createTokenWithPoolTransaction(
  tokenParams: TokenCreationParams,
  initialSol: number = 1,
  initialTokenSupply: number = 1000000
): Promise<{
  transactionData: TransactionData;
  poolAddress: string;
  tokenPrice: number;
}> {
  try {
    console.log('Creating token transaction with params:', tokenParams);
    
    // Step 1: Create token transaction
    const transactionData = await createTokenTransaction(tokenParams);
    console.log('Token transaction prepared successfully:', transactionData.mintAddress);
    
    // Step 2: Derive pool address (actual initialization will be done via frontend)
    const creatorKeypair = Keypair.generate(); // Temporary keypair for address derivation
    const solMint = new PublicKey('So11111111111111111111111111111111111111112'); // Native SOL mint
    
    const { poolAddress, signature: poolSig, tokenPrice } = await initializePool({
      tokenMint: new PublicKey(transactionData.mintAddress),
      solMint,
      initialSol,
      initialToken: initialTokenSupply,
      creatorKeypair
    });

    console.log('Pool address derived:', poolAddress);
    console.log('Initial token price:', tokenPrice, 'SOL');

    return {
      transactionData,
      poolAddress,
      tokenPrice
    };
  } catch (error) {
    console.error('Error in createTokenWithPoolTransaction:', error);
    throw error;
  }
}