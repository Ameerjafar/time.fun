import express from 'express';
import { authRoute } from './authRoute';
import { userRoute } from './userRoute';
import tokenRoute from './tokenRoute';

export const routes = express.Router();

routes.use('/auth', authRoute);
routes.use('/user', userRoute);
routes.use('/token', tokenRoute);

