import express from 'express';
import { authRoute } from './authRoute';

export const routes = express.Router();

routes.use('/auth', authRoute);

