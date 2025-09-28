import express from 'express';
import { emailController } from '../controller/auth/emailController';
import { otpController } from '../controller/auth/otpController';

export const authRoute = express.Router();

authRoute.get('/email', emailController);
authRoute.get('/verifyotp', otpController);

