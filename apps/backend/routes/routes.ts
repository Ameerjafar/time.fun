import express from 'express';
import { authController } from '../controller/authController';

export const routes = express.Router();

routes.get('/auth', authController);

