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

const PROGRAM_ID = new PublicKey('EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S');
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

export interface PoolInitTransactionParams {
  tokenMint: string;
  solMint: string;
  initialSol: number;
  initialToken: number;
  userPublicKey: string;
}

export interface PoolInitTransactionData {
  transaction: string;
  poolAddress: string;
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
    
    // Get recent blockhash with longer commitment for better reliability
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
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
      
      // For blockhash errors, we need to handle this differently
      if (message.includes('Blockhash not found')) {
        console.error('Blockhash expired. Transaction needs to be recreated with fresh blockhash.');
        throw new Error('Transaction blockhash expired. Please try again.');
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
    
    // Derive pool PDA using your program's seed structure
    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('pool'),
        params.solMint.toBuffer(), // token_x_mint (SOL)
        params.tokenMint.toBuffer() // token_y_mint (creator token)
      ],
      PROGRAM_ID
    );

    const tokenPrice = params.initialSol / params.initialToken;

    console.log('Pool PDA derived for your program:', poolPDA.toBase58());
    console.log('Program ID:', PROGRAM_ID.toBase58());
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

    // If pool exists, try to decode your program's PoolState structure
    try {
      const data = poolAccount.data;
      // PoolState structure: reserve_x (8 bytes) + reserve_y (8 bytes) + token_x_mint (32 bytes) + token_y_mint (32 bytes) + constant_k (16 bytes)
      if (data.length >= 96) { // 8 + 8 + 32 + 32 + 16 = 96 bytes
        const reserveX = Number(data.readBigUInt64LE(0)); // reserve_x at offset 0
        const reserveY = Number(data.readBigUInt64LE(8)); // reserve_y at offset 8
        
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

export interface BuyTokenParams {
  tokenMint: string;
  amountOutToken: number;
  userPublicKey: string;
  creatorPublicKey: string;
}

export interface SellTokenParams {
  tokenMint: string;
  amountInToken: number;
  userPublicKey: string;
  creatorPublicKey: string;
}

export interface BuySellTransactionData {
  transaction: string; // Base64 encoded transaction
  instructions: Array<{
    programId: string;
    keys: Array<{
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }>;
    data: string;
  }>;
  estimatedSolAmount?: number;
  estimatedTokenAmount?: number;
  poolInitialized?: boolean;
}

/**
 * Create buy token transaction with automatic pool initialization
 */
export async function createBuyTokenTransaction(params: BuyTokenParams): Promise<BuySellTransactionData> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const userPublicKey = new PublicKey(params.userPublicKey);
    const tokenMint = new PublicKey(params.tokenMint);
    const solMint = new PublicKey('So11111111111111111111111111111111111111112');
    
    // Derive pool PDA
    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('pool'),
        solMint.toBuffer(),
        tokenMint.toBuffer()
      ],
      PROGRAM_ID
    );

    // Check if pool exists
    const poolAccount = await connection.getAccountInfo(poolPDA);
    const poolExists = poolAccount !== null;

    console.log('Pool exists:', poolExists, 'Pool address:', poolPDA.toBase58());

    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      userPublicKey
    );

    // Get pool's token account
    const poolTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      poolPDA,
      true
    );

    // Get recent blockhash with longer commitment for better reliability
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Create transaction
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // If pool doesn't exist, we need to initialize it first
    if (!poolExists) {
      console.log('Pool does not exist, creating pool initialization transaction');
      
      // Get user's SOL account (native SOL)
      const userSolAccount = await getAssociatedTokenAddress(solMint, userPublicKey);
      
      // Get pool's SOL account
      const poolSolAccount = await getAssociatedTokenAddress(solMint, poolPDA, true);

      // Create pool initialization instruction
      const initialSolAmount = 1 * LAMPORTS_PER_SOL; // 1 SOL initial liquidity
      const initialTokenAmount = params.amountOutToken * 1000; // 1000x the buy amount for initial liquidity

      const initializeInstruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: solMint, isSigner: false, isWritable: true }, // token_x_mint (SOL)
          { pubkey: tokenMint, isSigner: false, isWritable: true }, // token_y_mint (creator token)
          { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool PDA
          { pubkey: userPublicKey, isSigner: true, isWritable: true }, // user (signer)
          { pubkey: userSolAccount, isSigner: false, isWritable: true }, // user_token_x_account
          { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // user_token_y_account
          { pubkey: poolSolAccount, isSigner: false, isWritable: true }, // pool_token_x_account
          { pubkey: poolTokenAccount, isSigner: false, isWritable: true }, // pool_token_y_account
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }, // rent
        ],
        data: Buffer.concat([
          Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // initialize discriminator
          Buffer.alloc(8), // initial_sol placeholder
          Buffer.alloc(8), // initial_token placeholder
        ])
      });

      // Set the amounts in the instruction data
      const initialSolBuffer = Buffer.alloc(8);
      initialSolBuffer.writeBigUInt64LE(BigInt(initialSolAmount), 0);
      const initialTokenBuffer = Buffer.alloc(8);
      initialTokenBuffer.writeBigUInt64LE(BigInt(initialTokenAmount), 0);
      
      initializeInstruction.data = Buffer.concat([
        Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
        initialSolBuffer,
        initialTokenBuffer
      ]);

      transaction.add(initializeInstruction);
      console.log('Added pool initialization instruction');
    }
    
    // Create buy instruction with proper account structure
    const buyInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool account
        { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool_sol_account (same as pool PDA)
        { pubkey: poolTokenAccount, isSigner: false, isWritable: true }, // pool_token_account
        { pubkey: userPublicKey, isSigner: true, isWritable: true }, // user (signer)
        { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // user_token_account
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      data: Buffer.concat([
        Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]), // buy discriminator from IDL
        Buffer.alloc(8), // amount_out_token placeholder
      ])
    });

    // Set the amount in the instruction data
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(params.amountOutToken), 0);
    buyInstruction.data = Buffer.concat([
      Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]),
      amountBuffer
    ]);

    transaction.add(buyInstruction);

    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    
    const transactionBase64 = serializedTransaction.toString('base64');
    
    // Convert instructions to serializable format
    const serializableInstructions = transaction.instructions.map(ix => ({
      programId: ix.programId.toBase58(),
      keys: ix.keys.map(key => ({
        pubkey: key.pubkey.toBase58(),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(ix.data).toString('base64')
    }));

    console.log('Buy token transaction prepared:', {
      tokenMint: params.tokenMint,
      amountOutToken: params.amountOutToken,
      poolAddress: poolPDA.toBase58(),
      poolInitialized: !poolExists
    });

    return {
      transaction: transactionBase64,
      instructions: serializableInstructions,
      estimatedTokenAmount: params.amountOutToken,
      poolInitialized: !poolExists
    };
  } catch (error) {
    console.error('Error creating buy token transaction:', error);
    throw new Error('Failed to create buy token transaction');
  }
}

/**
 * Create sell token transaction
 */
export async function createSellTokenTransaction(params: SellTokenParams): Promise<BuySellTransactionData> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const userPublicKey = new PublicKey(params.userPublicKey);
    const tokenMint = new PublicKey(params.tokenMint);
    const solMint = new PublicKey('So11111111111111111111111111111111111111112');
    
    // Derive pool PDA
    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('pool'),
        solMint.toBuffer(),
        tokenMint.toBuffer()
      ],
      PROGRAM_ID
    );

    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      userPublicKey
    );

    // Get pool's token account
    const poolTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      poolPDA,
      true
    );

    // Get recent blockhash with longer commitment for better reliability
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Create transaction
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
    // Create sell instruction with proper account structure
    const sellInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool account
        { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool_sol_account (same as pool PDA)
        { pubkey: poolTokenAccount, isSigner: false, isWritable: true }, // pool_token_account
        { pubkey: userPublicKey, isSigner: true, isWritable: true }, // user (signer)
        { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // user_token_account
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      data: Buffer.concat([
        Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]), // sell discriminator from IDL
        Buffer.alloc(8), // amount_in_token placeholder
      ])
    });

    // Set the amount in the instruction data
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(params.amountInToken), 0);
    sellInstruction.data = Buffer.concat([
      Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]),
      amountBuffer
    ]);

    transaction.add(sellInstruction);

    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    
    const transactionBase64 = serializedTransaction.toString('base64');
    
    // Convert instructions to serializable format
    const serializableInstructions = transaction.instructions.map(ix => ({
      programId: ix.programId.toBase58(),
      keys: ix.keys.map(key => ({
        pubkey: key.pubkey.toBase58(),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(ix.data).toString('base64')
    }));

    console.log('Sell token transaction prepared:', {
      tokenMint: params.tokenMint,
      amountInToken: params.amountInToken,
      poolAddress: poolPDA.toBase58()
    });

    return {
      transaction: transactionBase64,
      instructions: serializableInstructions,
      estimatedTokenAmount: params.amountInToken
    };
  } catch (error) {
    console.error('Error creating sell token transaction:', error);
    throw new Error('Failed to create sell token transaction');
  }
}

/**
 * Transfer SOL to creator after successful buy/sell
 */
export async function transferSolToCreator(
  creatorPublicKey: string,
  amountLamports: number,
  payerKeypair: Keypair
): Promise<{ signature: string; success: boolean }> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const creatorPubkey = new PublicKey(creatorPublicKey);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payerKeypair.publicKey,
        toPubkey: creatorPubkey,
        lamports: amountLamports,
      })
    );

    const signature = await connection.sendTransaction(transaction, [payerKeypair]);
    await connection.confirmTransaction(signature);

    console.log('SOL transferred to creator:', {
      creator: creatorPublicKey,
      amount: amountLamports / LAMPORTS_PER_SOL,
      signature
    });

    return { signature, success: true };
  } catch (error) {
    console.error('Error transferring SOL to creator:', error);
    throw new Error('Failed to transfer SOL to creator');
  }
}

/**
 * Create pool initialization transaction for your bonding curve program
 */
export async function createPoolInitTransaction(params: PoolInitTransactionParams): Promise<PoolInitTransactionData> {
  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const userPublicKey = new PublicKey(params.userPublicKey);
    const tokenMint = new PublicKey(params.tokenMint);
    const solMint = new PublicKey(params.solMint);
    
    // Derive pool PDA
    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('pool'),
        solMint.toBuffer(),
        tokenMint.toBuffer()
      ],
      PROGRAM_ID
    );

    // Get user's token accounts
    const userTokenXAccount = await getAssociatedTokenAddress(solMint, userPublicKey); // SOL account
    const userTokenYAccount = await getAssociatedTokenAddress(tokenMint, userPublicKey); // Creator token account

    // Get pool's token accounts
    const poolTokenXAccount = await getAssociatedTokenAddress(solMint, poolPDA, true);
    const poolTokenYAccount = await getAssociatedTokenAddress(tokenMint, poolPDA, true);

    // Get recent blockhash with longer commitment for better reliability
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Create transaction
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;
    
    // Create initialize instruction based on your program's IDL
    const initializeInstruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: solMint, isSigner: false, isWritable: true }, // token_x_mint (SOL)
        { pubkey: tokenMint, isSigner: false, isWritable: true }, // token_y_mint (creator token)
        { pubkey: poolPDA, isSigner: false, isWritable: true }, // pool PDA
        { pubkey: userPublicKey, isSigner: true, isWritable: true }, // user (signer)
        { pubkey: userTokenXAccount, isSigner: false, isWritable: true }, // user_token_x_account
        { pubkey: userTokenYAccount, isSigner: false, isWritable: true }, // user_token_y_account
        { pubkey: poolTokenXAccount, isSigner: false, isWritable: true }, // pool_token_x_account
        { pubkey: poolTokenYAccount, isSigner: false, isWritable: true }, // pool_token_y_account
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
        { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }, // rent
      ],
      data: Buffer.concat([
        Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // initialize discriminator from IDL
        Buffer.alloc(8), // initial_sol placeholder
        Buffer.alloc(8), // initial_token placeholder
      ])
    });

    // Set the amounts in the instruction data
    const initialSolBuffer = Buffer.alloc(8);
    initialSolBuffer.writeBigUInt64LE(BigInt(params.initialSol), 0);
    const initialTokenBuffer = Buffer.alloc(8);
    initialTokenBuffer.writeBigUInt64LE(BigInt(params.initialToken), 0);
    
    initializeInstruction.data = Buffer.concat([
      Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
      initialSolBuffer,
      initialTokenBuffer
    ]);

    transaction.add(initializeInstruction);

    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    
    const transactionBase64 = serializedTransaction.toString('base64');
    
    // Convert instructions to serializable format
    const serializableInstructions = transaction.instructions.map(ix => ({
      programId: ix.programId.toBase58(),
      keys: ix.keys.map(key => ({
        pubkey: key.pubkey.toBase58(),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(ix.data).toString('base64')
    }));

    console.log('Pool initialization transaction prepared for your program:', {
      poolAddress: poolPDA.toBase58(),
      programId: PROGRAM_ID.toBase58(),
      initialSol: params.initialSol,
      initialToken: params.initialToken
    });

    return {
      transaction: transactionBase64,
      poolAddress: poolPDA.toBase58(),
      instructions: serializableInstructions
    };
  } catch (error) {
    console.error('Error creating pool initialization transaction:', error);
    throw new Error('Failed to create pool initialization transaction');
  }
}