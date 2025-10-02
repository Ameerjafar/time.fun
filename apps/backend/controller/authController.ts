import { Request, Response } from "express";
import z from "zod";
import { emailService } from "../services/emailService";
import { verifyOtp } from "../services/otpService";
import { prisma } from "@repo/db";
import { getUsersTwitterName } from "../services/twitterService";
import qs from "qs";

const emailSchema = z.object({
  email: z.email(),
});

export const emailController = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    const parseStatus = emailSchema.safeParse({ email });
    const emailResponse: any = await emailService(email as string);

    console.log("emailResponse", emailResponse);
    if (!parseStatus) {
      return res.status(400).json({ message: "please check your email" });
    }
    if (!emailResponse) {
      return res.status(411).json({ message: "error in the email response" });
    }
    return res.status(200).json({ message: "sucess" });
  } catch (error) {
    console.log("Error in authController:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const otpController = async (req: Request, res: Response) => {
  const { email, otp } = req.query;
  const verifyOtpResponse = await verifyOtp(email as string, otp as string);
  try {
    if (verifyOtpResponse) {
      const emailCheck = await prisma.user.findMany({
        where: { email: email as string },
      });
      if (emailCheck.length === 0) {
        await prisma.user.create({
          data: {
            name: "Ameer jafar",
            email: email as string,
            lastLoggedAt: new Date(),
          },
        });
      }
      console.log("user Data is stored");

      return res.status(200).json({ message: "sucess" });
    }
    return res.status(411).json({ message: verifyOtpResponse });
  } catch (error) {
    console.log(error);
    return res.status(411).json({ message: error });
  }
};

// TWITTER CONTROLLERS

export const getTwitterAccessToken = async (req: Request, res: Response) => {
  const { code } = req.query;
  const { codeVerifier } = req.body;
  console.log("code", code);
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Invalid authorization code" });
  }
  const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: qs.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: "http://localhost:3000/oauth/twitter",
      grant_type: "authorization_code",
    }),
  });
  const tokenData: any = await tokenResponse.json();

  const twitterUserName: any = await getUsersTwitterName(
    tokenData.access_token
  );
  if (!twitterUserName) {
    return res
      .status(200)
      .json({ message: "we are getting error when try to fetch the username" });
  }
  return res.status(200).json({ message: twitterUserName.data.name });
};
