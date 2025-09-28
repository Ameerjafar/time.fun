import { Request, Response } from "express";
import * as z from "zod";
import Redis from "ioredis";
import { emailService } from "../services/emailService";

// const redis = new Redis(process.env.REDIS_URL as string);
// redis.connect();
const emailSchema = z.object({
  email: z.email()
});

export const authController = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    const parseStatus = emailSchema.safeParse({email});
    const emailResponse: any = await emailService(email as string);
    console.log("emailResponse", emailResponse);
    if (!parseStatus) {
      return res.status(400).json({ message: "please check your email" });
    }
    if (!emailResponse) {
      return res.status(411).json({ message: "error in the email response" });
    }
    return res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    console.log("Error in authController:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
