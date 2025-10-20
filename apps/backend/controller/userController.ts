import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { PublicKey } from "@solana/web3.js";

export const getUser = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });
    return res.status(200).json({ message: "got the user info successfully" });
  } catch (error: unknown) {
    return res
      .status(411)
      .json({ message: "facing some problem in the stroing the user" });
  }
};

export const getUserHoldToken = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    await prisma.userHoldToken.findMany({
      where: {
        userId: userId as string,
      },
    });
    return res.status(200).json({ message: "get token request sucess" });
  } catch (error: unknown) {
    return res.status(411).json({ message: "cannot get the token" });
  }
};

export const updateUserPublicKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { publicKey } = req.body;

    // Validate public key format
    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ error: "Public key is required" });
    }

    // Validate that it's a valid Solana public key
    try {
      new PublicKey(publicKey);
    } catch (error) {
      return res.status(400).json({ error: "Invalid public key format" });
    }

    // Update user's public key
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { publicKey }
    });

    return res.status(200).json({
      success: true,
      message: "Public key updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user public key:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
