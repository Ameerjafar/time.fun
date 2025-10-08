import { Request, Response } from "express";
import { prisma } from "@repo/db";
export const getCreatorwithId = async (req: Request, res: Response) => {
  const { creatorId } = req.query;
  try {
    const creator = await prisma.user.findUnique({
      where: {
        id: creatorId as string,
      },
    });
    if (creator?.role !== "CREATOR") {
      return res
        .status(400)
        .json({ message: "This is not the creator userId" });
    }
    return res.status(200).json({ creator });
  } catch (error: unknown) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

export const getAllCreator = async (req: Request, res: Response) => {
  try {
    const allCreators = await prisma.user.findMany({
      where: {
        role: "CREATOR",
      },
    });
    if (!allCreators) {
      return res.status(400).json({ message: "cannot find the user" });
    }
    return res.status(200).json({ allCreators });
  } catch (error: unknown) {
    return res.status(500).json({ error });
  }
};

export const getCreatorByName = async (req: Request, res: Response) => {
  const { name } = req.query;
  try {
    const creator = await prisma.user.findUnique({
      where: {
        name: name as string,
      },
    });
    if (!creator) {
      return res.status(400).json({ message: "cannot find the user" });
    }
  } catch (error: unknown) {
    return res.status(500).json(error);
  }
};



