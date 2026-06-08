import { http, HttpResponse } from 'msw';

export const MOCK_EXCHANGES = ['binance', 'kraken', 'coinbase'];

export const MOCK_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

// [timestamp_ms, open, high, low, close, volume]
export const MOCK_OHLCV_RAW: number[][] = [
    [1700000000000, 35000, 35500, 34800, 35200, 100.5],
    [1700000060000, 35200, 35600, 35100, 35400, 90.3],
];

export const MOCK_TICKER = {
    last: 35400,
    percentage: 1.23,
    high: 36000,
    low: 34500,
    quoteVolume: 1234567,
};

export const handlers = [
    http.get('/api/market/exchanges', () =>
        HttpResponse.json(MOCK_EXCHANGES),
    ),

    http.get('/api/market/pairs', () =>
        HttpResponse.json(MOCK_PAIRS),
    ),

    http.get('/api/market/ohlcv', () =>
        HttpResponse.json(MOCK_OHLCV_RAW),
    ),

    http.get('/api/market/ticker', () =>
        HttpResponse.json(MOCK_TICKER),
    ),
];
