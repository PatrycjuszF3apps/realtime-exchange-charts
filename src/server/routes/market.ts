import { Router, Request, Response } from 'express';
import { createRequire } from 'node:module';
import { createExchange } from '../services/exchange';

const require = createRequire(import.meta.url);
const ccxtExchanges: string[] = (require('ccxt') as { exchanges: string[] }).exchanges;

export const marketRouter = Router();

marketRouter.get('/exchanges', (_req: Request, res: Response) => {
    res.json(ccxtExchanges);
});

marketRouter.get('/ohlcv', async (req: Request, res: Response) => {
    try {
        const {
            exchange = 'binance',
            symbol   = 'BTC/USDT',
            interval = '1h',
            limit    = '300',
        } = req.query as Record<string, string>;

        const ex = createExchange(exchange);
        const data = await ex.fetchOHLCV(symbol, interval, undefined, Number(limit));
        res.json(data);
    } catch (err: unknown) {
        res.status(500).json({ error: (err as Error).message });
    }
});

marketRouter.get('/ticker', async (req: Request, res: Response) => {
    try {
        const { exchange = 'binance', symbol = 'BTC/USDT' } = req.query as Record<string, string>;
        const ex = createExchange(exchange);
        const ticker = await ex.fetchTicker(symbol);
        res.json(ticker);
    } catch (err: unknown) {
        res.status(500).json({ error: (err as Error).message });
    }
});

marketRouter.get('/pairs', async (req: Request, res: Response) => {
    try {
        const { exchange = 'binance' } = req.query as Record<string, string>;
        const ex = createExchange(exchange);
        const markets = await ex.loadMarkets();
        const pairs = Object.keys(markets)
            .filter(s => s.endsWith('/USDT') && !s.includes(':'))
            .sort();
        res.json(pairs);
    } catch (err: unknown) {
        res.status(500).json({ error: (err as Error).message });
    }
});
