import express from 'express'

import cors from 'cors'

import dotenv from 'dotenv';
import { routes } from './routes/routes';
dotenv.config();
const app = express();


app.use(cors());

app.use(express.json());


app.use('/', routes);

const port = process.env.BACKEND_PORT;
app.listen(port, () => {
    console.log("backend is running on port number", port);
})
