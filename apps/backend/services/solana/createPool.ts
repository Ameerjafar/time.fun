import dotenv from "dotenv";
dotenv.config();

import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";
import bs58 from "bs58";
import BN from "bn.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const privateKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY!);
const owner = Keypair.fromSecretKey(Uint8Array.from(privateKey));
const raydium = await Raydium.load({
  connection,
  owner,
});

const getTokenInfo = async (mintAddress: PublicKey, programId: PublicKey) => {
  try {
    const mintInfo = await getMint(
      connection,
      mintAddress,
      undefined,
      programId
    );
    return {
      address: mintAddress.toBase58(),
      decimals: mintInfo.decimals,
      programId: programId.toBase58(),
    };
  } catch (error) {
    console.warn(
      `Failed to fetch token info for ${mintAddress.toBase58()}`,
      error
    );
    return null;
  }
};

const baseMint = new PublicKey(process.env.BASE_MINT!);
const quoteMint = new PublicKey(process.env.QUOTE_MINT!);
const baseAmount = new BN(process.env.BASE_AMOUNT!);
const quoteAmount = new BN(process.env.QUOTE_AMOUNT!);

export const createCPMMPool = async () => {
  const mintAInfo = await getTokenInfo(baseMint, TOKEN_PROGRAM_ID);
  const mintBInfo = await getTokenInfo(quoteMint, TOKEN_2022_PROGRAM_ID);

  if (!mintAInfo || !mintBInfo) {
    throw new Error("Failed to fetch token info");
  }

  const cpmmConfigs = await raydium.api.getCpmmConfigs();
  if (!cpmmConfigs || cpmmConfigs.length === 0) {
    throw new Error("No CPMM configs available");
  }

  const selectedConfig: any = cpmmConfigs[0];

  const { execute, extInfo } = await raydium.cpmm.createPool({
    mintA: mintAInfo,
    mintB: mintBInfo,
    mintAAmount: baseAmount,
    mintBAmount: quoteAmount,
    startTime: new BN(0),
    poolFeeAccount: owner.publicKey,
    feeConfig: selectedConfig,
    associatedOnly: false,
    ownerInfo: {
      feePayer: owner.publicKey,
      useSOLBalance: true,
    },
    programId: TOKEN_2022_PROGRAM_ID,
    txVersion: TxVersion.V0,
  });

  const { txId } = await execute();

  console.log("CPMM Pool created successfully!");
  console.log("Transaction ID:", txId);
  console.log("Pool ID:", extInfo.address.poolId.toBase58());

  return { txId, poolId: extInfo.address.poolId.toBase58(), poolInfo: extInfo };
};
export const swap = async () => {
  try {
    const poolId = new PublicKey(process.env.POOL_ID!);

    // const poolKeys = await raydium.cpmm.getCpmmPoolKeys(poolId);

    // console.log("Pool Keys:", {
    //   poolId: poolKeys.poolId.toBase58(),
    //   baseMint: poolKeys.mintA.toBase58(),
    //   quoteMint: poolKeys.mintB.toBase58(),
    //   baseVault: poolKeys.tokenA.toBase58(),
    //   quoteVault: poolKeys.tokenB.toBase58(),
    //   lpMint: poolKeys.lpMint.toBase58(),
    //   feeAccount: poolKeys.feeAccount.toBase58(),
    // });
  } catch (error) {
    console.error("Error fetching pool keys:", error);
  }
};
(async () => {
  await swap();
})();
