import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createTokenAndPoolFrontend } from "../lib/solanaUtils";

export const CreateToken = () => {
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageUrl, setImagUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ mint: string; pool: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useConnection();
  const wallet = useWallet();

  const onSubmit = async () => {
    setError(null);
    setResult(null);
    try {
      if (!wallet?.publicKey || !wallet?.signTransaction) {
        throw new Error("Connect a wallet that supports signTransaction");
      }
      setLoading(true);
      const { mintAddress, poolAddress } = await createTokenAndPoolFrontend(
        connection,
        { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction! },
        { totalSupply: 10000, decimals: 9 },
        { programId: process.env.NEXT_PUBLIC_BONDING_CURVE_PROGRAM_ID as string, initialSol: 1, initialToken: 10000 }
      );
      setResult({ mint: mintAddress, pool: poolAddress });
    } catch (e: any) {
      setError(e?.message || "Failed to create token");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div> 
      <div>name</div>
      <input
        placeholder="name"
        type="text"
        onChange={(e) => setName(e.target.value)}
      ></input>
      <div>symbol</div>
      <input
        placeholder="eg.BTC"
        type="text"
        onChange={(e) => setSymbol(e.target.value)}
      ></input>
      <div>description optional</div>
      <input
        placeholder="name"
        type="text"
        onChange={(e) => setDescription(e.target.value)}
      ></input>
      <div>imageUrl</div>
      <input
        placeholder="Enter your image url of your coin"
        type="text"
        onChange={(e) => setImagUrl(e.target.value)}
      ></input>
      <button type="button" onClick={onSubmit} disabled={loading}>
        {loading ? "Creating..." : "Create Token"}
      </button>
      {result && (
        <div>
          <div>Mint: {result.mint}</div>
          <div>Pool: {result.pool}</div>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};
