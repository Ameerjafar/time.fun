import express from 'express';
import { emailController, getTwitterAccessToken, otpController } from '../controller/authController';

export const authRoute = express.Router();

authRoute.get('/email', emailController);
authRoute.get('/verifyotp', otpController);
authRoute.post('/twitter/callback', getTwitterAccessToken)

