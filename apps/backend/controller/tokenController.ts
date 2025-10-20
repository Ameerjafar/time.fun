import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { createTokenWithPoolTransaction, submitSignedTransaction, getTokenPrice } from "../services/solana/solanaService";
import { PublicKey } from "@solana/web3.js";
import { Decimal } from "@prisma/client/runtime/library";
import z from "zod";

const createTokenSchema = z.object({
  name: z.string().min(1, "Token name is required"),
  symbol: z.string().min(1, "Token symbol is required").max(6, "Symbol must be 6 characters or less"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  totalSupply: z.number().positive("Total supply must be positive").default(1000000),
  decimals: z.number().min(0).max(9).default(9),
  userId: z.string().min(1, "Invalid user ID"),
  initialSol: z.number().positive("Initial SOL must be positive").default(1),
  pricingModel: z.enum(["market", "fixed"]).default("market"),
  fixedPrice: z.number().optional(),
  features: z.object({
    chat: z.boolean().default(false),
    groupChat: z.boolean().default(false),
    videoCall: z.boolean().default(false),
  }).optional(),
  publicKey: z.string().min(1, "User public key is required")
});

const submitTransactionSchema = z.object({
  signedTransaction: z.string().min(1, "Signed transaction is required"),
  mintAddress: z.string().min(1, "Mint address is required"),
  userId: z.string().min(1, "Invalid user ID")
});

export const createToken = async (req: Request, res: Response) => {
  try {
    console.log("Creating token transaction with data:", req.body);

    // Validate request body
    const parseResult = createTokenSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parseResult.error.issues 
      });
    }

    const validatedData = parseResult.data;

    // Note: We do not validate user existence or token uniqueness here.
    // Transaction preparation should not be blocked by backend user state.

    console.log("Creating token transaction on Solana devnet...");
    const blockchainResult = await createTokenWithPoolTransaction(
      {
        name: validatedData.name,
        symbol: validatedData.symbol,
        decimals: validatedData.decimals,
        totalSupply: validatedData.totalSupply,
        imageUrl: validatedData.imageUrl || '',
        description: validatedData.description || '',
        publicKey: validatedData.publicKey
      },
      validatedData.initialSol,
      validatedData.totalSupply
    );

    console.log("Token transaction prepared:", blockchainResult.transactionData.mintAddress);

    return res.status(200).json({
      message: "Token transaction prepared successfully",
      transactionData: blockchainResult.transactionData,
      poolAddress: blockchainResult.poolAddress,
      tokenPrice: blockchainResult.tokenPrice,
      tokenParams: {
        name: validatedData.name,
        symbol: validatedData.symbol,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        totalSupply: validatedData.totalSupply,
        decimals: validatedData.decimals,
        pricingModel: validatedData.pricingModel,
        fixedPrice: validatedData.fixedPrice,
        features: validatedData.features
      }
    });

  } catch (error: any) {
    console.error("Error creating token transaction:", error);
    return res.status(500).json({ 
      error: "Failed to create token transaction",
      message: error.message 
    });
  }
};

export const submitTokenTransaction = async (req: Request, res: Response) => {
  try {
    console.log("Submitting signed token transaction:", req.body);

    // Validate request body
    const parseResult = submitTransactionSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parseResult.error.issues 
      });
    }

    const { signedTransaction, mintAddress, userId } = parseResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Submit the signed transaction to Solana
    console.log("Submitting transaction to Solana...");
    const result = await submitSignedTransaction(signedTransaction);

    if (!result.success) {
      return res.status(400).json({ 
        error: "Transaction failed",
        message: "Transaction was not confirmed on the blockchain"
      });
    }

    // Get the token parameters from the request (they should be passed from frontend)
    const { tokenParams } = req.body;
    
    if (!tokenParams) {
      return res.status(400).json({ 
        error: "Token parameters missing",
        message: "Token parameters must be provided to create database record"
      });
    }

    // Create token record in database
    const token = await prisma.token.create({
      data: {
        name: tokenParams.name,
        symbol: tokenParams.symbol,
        totalSupply: tokenParams.totalSupply,
        description: tokenParams.description,
        imageUrl: tokenParams.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tokenParams.name)}&size=200&background=00FF88&color=000`,
        userId: userId,
        mintAddress: mintAddress,
        poolAddress: req.body.poolAddress || '', // Should be passed from frontend
        currentPrice: new Decimal(req.body.tokenPrice || 0.000001),
        initialPrice: new Decimal(req.body.tokenPrice || 0.000001),
      }
    });

    // Create pricing model if fixed pricing is used
    if (tokenParams.pricingModel === "fixed" && tokenParams.fixedPrice) {
      await prisma.pricingModel.create({
        data: {
          userId: userId,
          fixedDmPrice: tokenParams.features?.chat ? tokenParams.fixedPrice : null,
          fixedGroupChatPrice: tokenParams.features?.groupChat ? tokenParams.fixedPrice : null,
          fixedVideoCallPrice: tokenParams.features?.videoCall ? tokenParams.fixedPrice : null,
        }
      });
    }

    // Update user role to creator
    await prisma.user.update({
      where: { id: userId },
      data: { role: "CREATOR" }
    });

    console.log("Token created successfully:", token.id);

    return res.status(201).json({
      message: "Token created successfully",
      token: {
        ...token,
        signature: result.signature,
        explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
      }
    });

  } catch (error: any) {
    console.error("Error submitting token transaction:", error);
    return res.status(500).json({ 
      error: "Failed to submit token transaction",
      message: error.message 
    });
  }
};

export const getToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const token = await prisma.token.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profilePicture: true,
            verified: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    // Get current price from blockchain
    if (token.mintAddress && token.poolAddress) {
      try {
        const currentPrice = await getTokenPrice(
          new PublicKey(token.mintAddress),
          new PublicKey('So11111111111111111111111111111111111111112') // SOL mint
        );
        
        // Update price in database
        await prisma.token.update({
          where: { id },
          data: { currentPrice: new Decimal(currentPrice) }
        });

        (token as any).currentPrice = currentPrice;
      } catch (error) {
        console.error("Error fetching current price:", error);
      }
    }

    return res.status(200).json({ token });

  } catch (error: any) {
    console.error("Error getting token:", error);
    return res.status(500).json({ 
      error: "Failed to get token",
      message: error.message 
    });
  }
};

export const getTokenByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const token = await prisma.token.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profilePicture: true,
            verified: true,
            role: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({ error: "Token not found for this user" });
    }
    if (token.mintAddress && token.poolAddress) {
      try {
        const currentPrice = await getTokenPrice(
          new PublicKey(token.mintAddress),
          new PublicKey('So11111111111111111111111111111111111111112')
        );
        
        await prisma.token.update({
          where: { userId },
          data: { currentPrice: new Decimal(currentPrice) }
        });

        (token as any).currentPrice = currentPrice;
      } catch (error) {
        console.error("Error fetching current price:", error);
      }
    }

    return res.status(200).json({ token });

  } catch (error: any) {
    console.error("Error getting token by user ID:", error);
    return res.status(500).json({ 
      error: "Failed to get token",
      message: error.message 
    });
  }
};

export const getAllTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profilePicture: true,
            verified: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ tokens });

  } catch (error: any) {
    console.error("Error getting tokens:", error);
    return res.status(500).json({ 
      error: "Failed to get tokens",
      message: error.message 
    });
  }
};

export const updateTokenPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const token = await prisma.token.findUnique({
      where: { id }
    });

    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    if (!token.mintAddress || !token.poolAddress) {
      return res.status(400).json({ error: "Token not deployed on blockchain" });
    }

    const currentPrice = await getTokenPrice(
      new PublicKey(token.mintAddress),
      new PublicKey('So11111111111111111111111111111111111111112')
    );

    const updatedToken = await prisma.token.update({
      where: { id },
      data: { currentPrice: new Decimal(currentPrice) }
    });

    return res.status(200).json({ 
      message: "Token price updated",
      token: updatedToken 
    });

  } catch (error: any) {
    console.error("Error updating token price:", error);
    return res.status(500).json({ 
      error: "Failed to update token price",
      message: error.message 
    });
  }
};
