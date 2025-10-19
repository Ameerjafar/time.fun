import { Request, Response } from "express";
import z, { email } from "zod";
import { emailService } from "../services/emailService";
import { verifyOtp } from "../services/otpService";
import { prisma } from "@repo/db";
import { getUsersTwitterName } from "../services/twitterService";
import qs from "qs";
import bcrypt from "bcrypt";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  password: z.string().min(6),
});

const signinSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

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
    if (!emailResponse.success) {
      return res.status(411).json({ message: "error in the email response" });
    }
    return res.status(200).json({ message: "sucess" });
  } catch (error) {
    console.log("Error in authController:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const otpController = async (req: Request, res: Response) => {
  console.log("hello from the otp controller");
  const { email, otp } = req.query;
  console.log(email, otp);
  const verifyOtpResponse = await verifyOtp(email as string, otp as string);
  console.log(verifyOtpResponse);
  try {
    if (verifyOtpResponse?.success) {
      return res.status(200).json({ message:  "otp successfull"});
    }
  } catch (error) {
    console.log(error);
    return res.status(411).json({ message: error });
  }
};

// TWITTER CONTROLLERS

export const getTwitterAccessToken = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    const { codeVerifier } = req.body;
    
    console.log("Twitter callback - code:", code);
    
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Invalid authorization code" });
    }

    if (!codeVerifier) {
      return res.status(400).json({ error: "Code verifier is required" });
    }

    // Exchange code for access token
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
    
    if (!tokenResponse.ok || tokenData.error) {
      console.error("Twitter token error:", tokenData);
      return res.status(400).json({ 
        error: "Failed to get access token",
        details: tokenData.error_description || tokenData.error 
      });
    }

    // Get Twitter user information
    const twitterUserData: any = await getUsersTwitterName(tokenData.access_token);
    
    if (!twitterUserData || !twitterUserData.data) {
      return res.status(400).json({ 
        error: "Failed to fetch Twitter user information" 
      });
    }

    const twitterUsername = twitterUserData.data.username;
    const twitterName = twitterUserData.data.name;
    const twitterId = twitterUserData.data.id;

    // Check if user exists with this Twitter ID
    let user = await prisma.user.findFirst({
      where: { twitterId: twitterId },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          lastLoggedAt: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: twitterName,
          twitterId: twitterId,
          twitterHandle: twitterUsername,
          verified: true,
          role: "USER",
          lastLoggedAt: new Date(),
        },
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ 
      message: "Twitter login successful",
      user: userWithoutPassword,
      twitterName: twitterName,
      twitterHandle: twitterUsername
    });
  } catch (error) {
    console.error("Twitter callback error:", error);
    return res.status(500).json({ 
      error: "Internal server error during Twitter authentication" 
    });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    console.log("hello");
    const { email } = req.body;
    const parseResult = signupSchema.safeParse(req.body);
    console.log("it is passed here");
    if (!parseResult.success) {
      console.log("getting error over here");
      return res.status(400).json({ errors: parseResult.error });
    }

    const validatedData = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (existingUser) {
      console.log("existing email error");
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const date = new Date();
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "USER",
        lastLoggedAt: date,
      },
    });
    // const { password, ...userWithoutPassword } = user;
    const reponse = await emailService(email);
    console.log("email service passe");
    if (!reponse) {
      return res.status(403).json({ message: "errror in sending the otp" });
    }
    return res.status(200).json({ message: "check your email" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const parseResult = signinSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ errors: parseResult.error });
    }

    const { email, password } = parseResult.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoggedAt: new Date() },
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ 
      message: "Login successful",
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
