import express from "express";
import { getUser, getUserHoldToken, updateUserPublicKey } from "../controller/userController";

export const userRoute = express.Router();

userRoute.get('/getuser', getUser)
userRoute.get('/holdtoken', getUserHoldToken)
userRoute.put('/:id/public-key', updateUserPublicKey)