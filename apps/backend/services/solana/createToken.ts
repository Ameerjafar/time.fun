import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

export const createTokenonChain = async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const privateKey = process.env.SOLANA_PRIVATE_KEY!;
  console.log(privateKey);
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(process.env.SOLANA_PRIVATE_KEY! as string)
  );
  const mintAuthority = payer.publicKey;
  const freezeAuthority = null;
  const decimal = 6;
  const tokenMint = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimal
  );
  console.log(`Token mint created: ${tokenMint.toBase58()}`);
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintAuthority,
    payer.publicKey
  );
  console.log(
    `Associated Token Account created: ${tokenAccount.address.toBase58()}`
  );
  const amountToMint = 10000 * Math.pow(10, decimal);
  await mintTo(
    connection,
    payer,
    tokenMint,
    tokenAccount.address,
    mintAuthority,
    amountToMint
  );
  console.log(`Minted ${amountToMint / Math.pow(10, decimal)} tokens.`);
};

createTokenonChain();
