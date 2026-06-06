import { useState, useEffect, useCallback, useRef } from 'react';
import type { OHLCVBar, TickerInfo } from '../types';
import { useLoading } from '../context/LoadingContext';

const POLL_MS = 5_000;

export function useMarketData(exchange: string, symbol: string, interval: string) {
    const [bars,    setBars]    = useState<OHLCVBar[]>([]);
    const [ticker,  setTicker]  = useState<TickerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);
    const { push, pop } = useLoading();

    // Track whether the initial load for current params is done — polling skips the spinner.
    const initialDone = useRef(false);

    const fetchData = useCallback(async () => {
        const showSpinner = !initialDone.current;
        if (showSpinner) push({ key: 'FETCHING_MARKET_DATA', context: symbol });
        try {
            const ohlcvParams  = new URLSearchParams({ exchange, symbol, interval, limit: '300' });
            const tickerParams = new URLSearchParams({ exchange, symbol });

            const [ohlcvRes, tickerRes] = await Promise.all([
                fetch(`/api/market/ohlcv?${ohlcvParams}`),
                fetch(`/api/market/ticker?${tickerParams}`),
            ]);

            if (!ohlcvRes.ok) {
                const body = await ohlcvRes.json().catch(() => ({ error: ohlcvRes.statusText }));
                throw new Error(body.error ?? ohlcvRes.statusText);
            }

            const raw: number[][] = await ohlcvRes.json();
            setBars(raw.map(([ts, o, h, l, c, v]) => ({
                time: Math.floor(ts / 1000),
                open: o, high: h, low: l, close: c, volume: v,
            })));

            if (tickerRes.ok) {
                const t = await tickerRes.json();
                setTicker({
                    last:   t.last          ?? null,
                    change: t.percentage    ?? null,
                    high:   t.high         ?? null,
                    low:    t.low          ?? null,
                    volume: t.quoteVolume  ?? null,
                });
            }

            setError(null);
            initialDone.current = true;
        } catch (e: unknown) {
            setError((e as Error).message ?? 'Failed to fetch market data');
        } finally {
            if (showSpinner) pop('FETCHING_MARKET_DATA');
            setLoading(false);
        }
    }, [exchange, symbol, interval, push, pop]);

    useEffect(() => {
        if (!symbol) {
            setLoading(false);
            setBars([]);
            setTicker(null);
            setError(null);
            return;
        }
        initialDone.current = false;
        setLoading(true);
        setBars([]);
        setTicker(null);
        fetchData();
        const timer = setInterval(fetchData, POLL_MS);
        return () => clearInterval(timer);
    }, [fetchData, symbol]);

    return { bars, ticker, loading, error };
}
