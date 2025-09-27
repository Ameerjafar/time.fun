
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const response = req.headers['authorization'];
    const token = response?.split(' ')[1];
    if(!token) {
        return res.status(401).json({message: "we cannot find your token"});
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET!);
        next();
    }catch(error) {
        console.log("error you got", error);
        return res.status(401).json({message: "your token is invalid"});
    }
}