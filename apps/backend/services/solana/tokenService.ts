import {
  burn,
  createAssociatedTokenAccount,
  createMint,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

interface BurnTokenParams {
  amountToBurn: number;
  decimals: number;
  mintAddress: string;
}

const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || "6");
const TOKEN_SUPPLY = parseInt(process.env.TOKEN_SUPPLY!);

export const createToken = async () => {
  const connection = new Connection(RPC_URL, "confirmed");

  const privateKey = bs58.decode(PRIVATE_KEY);
  const payer = Keypair.fromSecretKey(Uint8Array.from(privateKey));

  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const mintAuthority = payer.publicKey;
  const freezeAuthority = null;

  const tokenMint = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    TOKEN_DECIMALS,
    undefined,
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`Token mint created: ${tokenMint.toBase58()}`);

  const tokenAccount = await createAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey,
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`Associated Token Account created: ${tokenAccount.toBase58()}`);

  const amountToMint = 10_000_00 * Math.pow(10, TOKEN_DECIMALS);
  await mintTo(
    connection,
    payer,
    tokenMint,
    tokenAccount,
    mintAuthority,
    amountToMint,
    [],
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`Minted ${amountToMint / Math.pow(10, TOKEN_DECIMALS)} tokens.`);

  return {
    mint: tokenMint.toBase58(),
    tokenAccount: tokenAccount.toBase58(),
  };
};

export const burnToken = async ({
  amountToBurn,
  decimals,
  mintAddress,
}: BurnTokenParams) => {
  const connection = new Connection(RPC_URL, "confirmed");
  const privateKey = bs58.decode(PRIVATE_KEY);

  const payer = Keypair.fromSecretKey(Uint8Array.from(privateKey));
  const tokenMint = new PublicKey(mintAddress);

  const tokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Token ATA:", tokenAccount.toBase58());

  const burnAmount = BigInt(amountToBurn) * BigInt(10 ** decimals);

  const txSig = await burn(
    connection,
    payer,
    tokenAccount,
    tokenMint,
    payer,
    burnAmount,
    [],
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Burned tokens successfully! Tx signature:", txSig);

  return txSig;
};

export const getTokenAccountDetails = async (ataAddress: string) => {
  const connection = new Connection(RPC_URL, "confirmed");

  const tokenAccountPubkey = new PublicKey(ataAddress);

  try {
    const accountInfo = await getAccount(
      connection,
      tokenAccountPubkey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("=== Token Account Details ===");
    console.log("Address:", accountInfo.address.toBase58());
    console.log("Mint:", accountInfo.mint.toBase58());
    console.log("Owner:", accountInfo.owner.toBase58());
    console.log("Amount (raw):", accountInfo.amount.toString());
    console.log("Is Frozen:", accountInfo.isFrozen);
    console.log(
      "Close Authority:",
      accountInfo.closeAuthority?.toBase58() || "None"
    );

    return accountInfo;
  } catch (err) {
    console.error("Error fetching token account:", err);
    throw err;
  }
};
