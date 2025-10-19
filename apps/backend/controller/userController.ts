import { prisma } from "@repo/db";
import { Request, Response } from "express";

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
