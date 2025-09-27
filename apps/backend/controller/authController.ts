
import { Request, Response } from 'express';
import z from 'zod';
import { prisma } from '@repo/db'
const emailSchema = z.object({
    email: z.email()
})

export const authController = async (req: Request, res: Response) => {

    const allUser = await prisma.user.findMany({});
    console.log("allUser", allUser);
    const { email } = req.query;

    try {
        const parseStatus = emailSchema.safeParse(email);
        if(!parseStatus) {
            return res.status(400).json({message: "please check your email"});
        }
    }catch(error) {
        return res.status(400).json({error});
        console.log(error)
    }
}