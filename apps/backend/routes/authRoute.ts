import express from 'express';
import { emailController, getTwitterAccessToken, otpController, signin, signup } from '../controller/authController';

export const authRoute = express.Router();

authRoute.get('/sendemail', emailController);
authRoute.post('/signup', signup);
authRoute.post('/signin', signin);
authRoute.get('/verifyotp', otpController);
authRoute.post('/twitter/callback', getTwitterAccessToken)

