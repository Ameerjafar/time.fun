import { Transaction, PublicKey, SystemProgram, Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction } from '@solana/spl-token';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import idl from './bonding_curve.json';

export interface TransactionData {
  transaction: string;
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

    const transactionBuffer = Buffer.from(transactionData.transaction, 'base64');
    const transaction = Transaction.from(transactionBuffer);
    const signedTransaction = await wallet.signTransaction(transaction);
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
 * Build a mint creation transaction on the client and partially sign with the generated mint keypair.
 */
export async function buildMintCreationTransaction(
  connection: Connection,
  userPublicKey: PublicKey,
  params: { totalSupply: number; decimals: number }
): Promise<{ transaction: Transaction; mintKeypair: Keypair; mintAddress: PublicKey; tokenAccountAddress: PublicKey }>
{
  const mintKeypair = Keypair.generate();
  const mintAddress = mintKeypair.publicKey;
  const tokenAccountAddress = await getAssociatedTokenAddress(mintAddress, userPublicKey);

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userPublicKey;

  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: userPublicKey,
    newAccountPubkey: mintAddress,
    space: 82,
    lamports: await connection.getMinimumBalanceForRentExemption(82),
    programId: TOKEN_PROGRAM_ID,
  });

  const initializeMintIx = createInitializeMintInstruction(
    mintAddress,
    params.decimals,
    userPublicKey,
    userPublicKey
  );

  const createTokenAccountIx = createAssociatedTokenAccountInstruction(
    userPublicKey,
    tokenAccountAddress,
    userPublicKey,
    mintAddress
  );

  const mintToIx = createMintToInstruction(
    mintAddress,
    tokenAccountAddress,
    userPublicKey,
    params.totalSupply * Math.pow(10, params.decimals)
  );

  transaction.add(
    createMintAccountIx,
    initializeMintIx,
    createTokenAccountIx,
    mintToIx
  );

  transaction.partialSign(mintKeypair);

  return { transaction, mintKeypair, mintAddress, tokenAccountAddress };
}

/**
 * Create the SPL token mint fully client-side and send to network.
 */
export async function createMintOnFrontend(
  connection: Connection,
  wallet: { signTransaction: (tx: Transaction) => Promise<Transaction>; publicKey: PublicKey },
  params: { totalSupply: number; decimals: number }
): Promise<{ signature: string; mintAddress: string; tokenAccountAddress: string }>
{
  if (!wallet?.signTransaction || !wallet?.publicKey) {
    throw new Error('Wallet not connected');
  }

  const { transaction, mintAddress, tokenAccountAddress } = await buildMintCreationTransaction(
    connection,
    wallet.publicKey,
    params
  );

  const signed = await wallet.signTransaction(transaction);
  const raw = signed.serialize();
  const signature = await connection.sendRawTransaction(raw, { skipPreflight: false });
  await connection.confirmTransaction(signature, 'confirmed');
  console.log("✅ Mint created successfully");
  return { signature, mintAddress: mintAddress.toBase58(), tokenAccountAddress: tokenAccountAddress.toBase58() };
}

/**
 * Initialize pool with NATIVE SOL (no wrapped SOL needed!)
 */
export async function initializePoolOnFrontend(
  connection: Connection,
  wallet: { signTransaction: (tx: Transaction) => Promise<Transaction>; publicKey: PublicKey },
  params: { tokenMint: string; initialSol: number; initialToken: number; programId: string },
): Promise<{ poolAddress: string; signature: string; tokenPrice: number }> {
  console.log("🚀 Initializing pool with native SOL...");

  if (!wallet?.signTransaction || !wallet?.publicKey) {
    throw new Error('Wallet not connected');
  }

  const userPublicKey = wallet.publicKey;
  const tokenMint = new PublicKey(params.tokenMint);
  const PROGRAM_ID = new PublicKey(params.programId);

  // Create Anchor provider and program
  const provider = new AnchorProvider(connection, wallet as Wallet, { preflightCommitment: 'confirmed' });
  const program = new Program(idl as any, provider);
  
  console.log("Program ID:", PROGRAM_ID.toBase58());
  
  if (!program.methods || !program.methods.initialize) {
    throw new Error('Program not properly initialized or initialize method not found in IDL');
  }

  // Derive pool PDA - NOW ONLY USES TOKEN MINT (no SOL mint needed!)
  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), tokenMint.toBuffer()],
    PROGRAM_ID
  );

  console.log("Pool PDA:", poolPDA.toBase58());

  // Get user's token account
  const userTokenAccount = await getAssociatedTokenAddress(tokenMint, userPublicKey);
  
  // Get pool's token account (owned by pool PDA)
  const poolTokenAccount = await getAssociatedTokenAddress(tokenMint, poolPDA, true);

  console.log("User token account:", userTokenAccount.toBase58());
  console.log("Pool token account:", poolTokenAccount.toBase58());

  const instructions: TransactionInstruction[] = [];

  // Check and create user token account if needed
  const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
  if (!userTokenAccountInfo) {
    console.log("Creating user token account...");
    instructions.push(createAssociatedTokenAccountInstruction(
      userPublicKey,
      userTokenAccount,
      userPublicKey,
      tokenMint
    ));
  }

  // Check and create pool token account if needed
  const poolTokenAccountInfo = await connection.getAccountInfo(poolTokenAccount);
  if (!poolTokenAccountInfo) {
    console.log("Creating pool token account...");
    instructions.push(createAssociatedTokenAccountInstruction(
      userPublicKey, // payer
      poolTokenAccount,
      poolPDA, // owner = PDA
      tokenMint
    ));
  }

  // Send all account creation instructions if needed
  if (instructions.length > 0) {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: userPublicKey });
    tx.add(...instructions);
    const signedTx = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), { 
      skipPreflight: false,
      maxRetries: 3 
    });
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    console.log("✅ Token accounts created, tx:", signature);
    
    // Wait a bit for accounts to be fully available
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Check if pool already exists
  const poolInfo = await connection.getAccountInfo(poolPDA);
  if (poolInfo) {
    console.log("⚠️ Pool already exists at:", poolPDA.toBase58());
    throw new Error(`Pool already exists for this token. Pool address: ${poolPDA.toBase58()}`);
  }

  // Call Anchor initialize method with NATIVE SOL
  try {
    console.log("Initializing pool on-chain...");
    console.log("Initial SOL:", params.initialSol);
    console.log("Initial Token:", params.initialToken);
    console.log("Pool PDA:", poolPDA.toBase58());
    
    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    const tx = await program.methods
      .initialize(
        new BN(params.initialSol), 
        new BN(params.initialToken)
      )
      .accounts({
        tokenMint: tokenMint,              // Only one mint (your custom token)
        pool: poolPDA,                     // Pool PDA (holds native SOL)
        user: userPublicKey,               // Your wallet
        userTokenAccount: userTokenAccount, // Your token account
        poolTokenAccount: poolTokenAccount, // Pool's token account
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .preInstructions([
        // Add compute budget to avoid issues
        {
          programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
          keys: [],
          data: Buffer.from([0x00, 0x00, 0x40, 0x0d, 0x03, 0x00, 0x00, 0x00, 0x00])
        }
      ])
      .rpc({ skipPreflight: false });
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature: tx,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    
    const tokenPrice = params.initialSol / params.initialToken;
    console.log("✅ Pool initialized:", poolPDA.toBase58());
    console.log("✅ Token price:", tokenPrice, "lamports per token");
    console.log("✅ Transaction:", tx);
    
    return { poolAddress: poolPDA.toBase58(), signature: tx, tokenPrice };
  } catch (error: any) {
    console.error("❌ Pool initialization error:", error);
    if (error.logs) console.error("Transaction logs:", error.logs);
    
    // Check if it's a duplicate transaction error
    if (error.message?.includes('already been processed')) {
      throw new Error('Transaction already processed. The pool may have been created. Please refresh and check.');
    }
    
    throw error;
  }
}

/**
 * High-level helper to create mint and then initialize pool on the client.
 */
export async function createTokenAndPoolFrontend(
  connection: Connection,
  wallet: { signTransaction: (tx: Transaction) => Promise<Transaction>; publicKey: PublicKey },
  tokenParams: { totalSupply: number; decimals: number },
  poolParams: { programId: string; initialSol: number; initialToken: number }
): Promise<{ mintAddress: string; poolAddress: string; tokenPrice: number; txSignatures: { mint: string; pool: string } }>
{
  console.log("Creating mint address...");
  const mintResult = await createMintOnFrontend(connection, wallet, tokenParams);
  
  // Wait a bit for the mint transaction to fully settle
  console.log("Waiting for mint confirmation...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("Creating pool with native SOL...");
  const poolResult = await initializePoolOnFrontend(connection, wallet, {
    tokenMint: mintResult.mintAddress,
    initialSol: poolParams.initialSol,
    initialToken: poolParams.initialToken,
    programId: poolParams.programId,
  });
  
  console.log("✅ Mint and pool created successfully!");
  return {
    mintAddress: mintResult.mintAddress,
    poolAddress: poolResult.poolAddress,
    tokenPrice: poolResult.tokenPrice,
    txSignatures: { mint: mintResult.signature, pool: poolResult.signature },
  };
}

/**
 * Create token by handling blockchain operations on frontend and storing info in backend
 */
export async function createTokenWithWallet(
  tokenParams: TokenCreationParams,
  userId: string,
  wallet: any,
  signTransaction: any,
  connection: Connection
): Promise<{ success: boolean; token?: any; error?: string }> {
  try {
    console.log('Creating token with params:', { ...tokenParams, userId });
    
    if (!signTransaction) {
      throw new Error('Wallet signTransaction function not available');
    }

    const walletPublicKey = wallet?.publicKey || tokenParams.publicKey;
    console.log('Using public key:', walletPublicKey);
    
    if (!walletPublicKey) {
      throw new Error('Wallet public key not available');
    }

    const walletForAnchor = {
      publicKey: new PublicKey(walletPublicKey),
      signTransaction: signTransaction
    };

    console.log('Creating mint and pool on frontend with native SOL...');
    
    // Calculate initial SOL amount in lamports
    const initialSolLamports = tokenParams.pricingModel === 'fixed' 
      ? (tokenParams.fixedPrice || 0.001) * tokenParams.totalSupply * 1_000_000_000 // Convert SOL to lamports
      : 1_000_000; // 0.001 SOL default
    
    const result = await createTokenAndPoolFrontend(
      connection,
      walletForAnchor,
      {
        totalSupply: tokenParams.totalSupply,
        decimals: tokenParams.decimals
      },
      {
        programId: 'EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S',
        initialSol: initialSolLamports,
        initialToken: tokenParams.totalSupply * Math.pow(10, tokenParams.decimals) // In base units
      }
    );

    console.log('✅ Blockchain operations completed:', {
      mintAddress: result.mintAddress,
      poolAddress: result.poolAddress,
      tokenPrice: result.tokenPrice
    });

    // Store token information in backend database
    const storeResponse = await fetch('http://localhost:5000/token/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...tokenParams,
        userId,
        publicKey: walletPublicKey,
        mintAddress: result.mintAddress,
        poolAddress: result.poolAddress,
        tokenPrice: result.tokenPrice,
        txSignatures: result.txSignatures
      }),
    });

    if (!storeResponse.ok) {
      const errorData = await storeResponse.json();
      throw new Error(errorData.message || 'Failed to store token information');
    }

    const storedToken = await storeResponse.json();
    return {
      success: true,
      token: storedToken.token
    };

  } catch (error: any) {
    console.error('❌ Error creating token:', error);
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