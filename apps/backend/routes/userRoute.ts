import express from "express";
import { getUser, getUserHoldToken } from "../controller/userController";

export const userRoute = express.Router();

userRoute.get('/getuser', getUser)
userRoute.get('/holdtoken', getUserHoldToken)