import { Request, Response } from "express";
import { prisma } from "@repo/db";
interface QueryObject {
  name: string;
  tokenTicker: string;
  description: string;
  imageUrl: string;
  userId: string;
}

export const createToken = async (req: Request, res: Response) => {
  const { name, tokenTicker, description, imageUrl, userId } =
    req.query as unknown as QueryObject;
  try {
    if (!name && !tokenTicker && !imageUrl) {
      return res
        .status(411)
        .json({ message: "object is missing in the query" });
    }
    const userExist = await prisma.tokens.findFirst({
      where: {
        userId,
      },
    });
    if (userExist) {
      return res
        .status(411)
        .json({ message: "you have already created the token" });
    }
    const response = await prisma.tokens.create({
      data: {
        name: name as string,
        userId,
        ticker: tokenTicker,
        ...(description ? { description } : {}),
        imageUrl,
      },
    });
    if (!response) {
      return res
        .status(403)
        .json({ message: "we could not store the token in db" });
    }
    return res.status(200).json({ message: "created the token successfully" });
  } catch (error: unknown) {
    return res.status(400).json({ error });
  }
};
