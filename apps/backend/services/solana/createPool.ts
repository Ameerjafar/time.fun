import dotenv from "dotenv";
dotenv.config();

import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Raydium,
  TxVersion,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import bs58 from "bs58"; 
import BN from "bn.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
const connection = new Connection(RPC_URL, "confirmed");

const privateKey = bs58.decode(process.env.PRIVATE_KEY!);
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

const baseProgramId =
  process.env.BASE_PROGRAM_ID === "TOKEN_2022"
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;

const quoteProgramId =
  process.env.QUOTE_PROGRAM_ID === "TOKEN_2022"
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;

export const createCPMMPool = async () => {
  const mintAInfo = await getTokenInfo(baseMint, baseProgramId);
  const mintBInfo = await getTokenInfo(quoteMint, quoteProgramId);

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
    programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
    txVersion: TxVersion.V0,
  });

  const { txId } = await execute();

  console.log("CPMM Pool created successfully!");
  console.log("Transaction ID:", txId);
  console.log("Pool ID:", extInfo.address.poolId.toBase58());

  return { txId, poolId: extInfo.address.poolId, poolInfo: extInfo };
};
