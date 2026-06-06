import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { marketRouter } from './routes/market';

config(); // load .env

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.use('/api/market', marketRouter);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ts: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] API listening on http://0.0.0.0:${PORT}`);
});
