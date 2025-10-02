import express from 'express';
import { authRoute } from './authRoute';
import { userRoute } from './userRoute';
export const routes = express.Router();

routes.use('/auth', authRoute);
routes.use('/user', userRoute)

