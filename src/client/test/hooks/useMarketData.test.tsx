import { describe, it, expect, beforeAll, afterAll, afterEach, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../mocks/server';
import { MOCK_OHLCV_RAW, MOCK_TICKER } from '../mocks/handlers';
import { useMarketData } from '../../hooks/useMarketData';
import { LoadingProvider } from '../../context/LoadingContext';

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
});
afterAll(() => server.close());

const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(LoadingProvider, null, children);

describe('useMarketData — OHLCV mapping', () => {
    it('maps raw [ts_ms, o, h, l, c, v] arrays to OHLCVBar with time in seconds', async () => {
        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.bars).toHaveLength(MOCK_OHLCV_RAW.length);
        const first = result.current.bars[0];
        const [ts, o, h, l, c, v] = MOCK_OHLCV_RAW[0];
        expect(first.time).toBe(Math.floor(ts / 1000));
        expect(first.open).toBe(o);
        expect(first.high).toBe(h);
        expect(first.low).toBe(l);
        expect(first.close).toBe(c);
        expect(first.volume).toBe(v);
    });
});

describe('useMarketData — ticker mapping', () => {
    it('maps ticker fields correctly', async () => {
        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.ticker).toEqual({
            last:   MOCK_TICKER.last,
            change: MOCK_TICKER.percentage,
            high:   MOCK_TICKER.high,
            low:    MOCK_TICKER.low,
            volume: MOCK_TICKER.quoteVolume,
        });
    });

    it('tolerates missing ticker fields by setting them to null', async () => {
        server.use(
            http.get('/api/market/ticker', () => HttpResponse.json({})),
        );
        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.ticker).toEqual({
            last: null, change: null, high: null, low: null, volume: null,
        });
    });
});

describe('useMarketData — loading/spinner behaviour', () => {
    it('starts with loading=true', () => {
        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );
        expect(result.current.loading).toBe(true);
    });

    it('sets loading=false and clears bars/ticker when symbol is empty', () => {
        const { result } = renderHook(
            () => useMarketData('binance', '', '1m'),
            { wrapper },
        );
        expect(result.current.loading).toBe(false);
        expect(result.current.bars).toEqual([]);
        expect(result.current.ticker).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('resets bars and ticker immediately when params change', async () => {
        const { result, rerender } = renderHook(
            ({ symbol }: { symbol: string }) => useMarketData('binance', symbol, '1m'),
            { wrapper, initialProps: { symbol: 'BTC/USDT' } },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.bars.length).toBeGreaterThan(0);

        rerender({ symbol: 'ETH/USDT' });
        expect(result.current.bars).toEqual([]);
        expect(result.current.ticker).toBeNull();
    });
});

describe('useMarketData — polling', () => {
    beforeEach(() => {
        // shouldAdvanceTime: true — real time still passes so waitFor works;
        // vi.advanceTimersByTimeAsync jumps ahead to fire the interval.
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    it('polls again after POLL_MS (5 000 ms)', async () => {
        let callCount = 0;
        server.use(
            http.get('/api/market/ohlcv', () => {
                callCount++;
                return HttpResponse.json(MOCK_OHLCV_RAW);
            }),
        );

        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        const afterFirst = callCount;

        // Advance exactly POLL_MS to fire one interval tick
        await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
        expect(callCount).toBeGreaterThan(afterFirst);
    });

    it('does not set loading=true during background poll (initialDone guard)', async () => {
        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        // loading must stay false during subsequent poll
        await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
        expect(result.current.loading).toBe(false);
    });
});

describe('useMarketData — error handling', () => {
    it('sets error on OHLCV API error', async () => {
        server.use(
            http.get('/api/market/ohlcv', () =>
                HttpResponse.json({ error: 'Symbol not found' }, { status: 400 }),
            ),
        );
        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Symbol not found');
    });

    it('preserves existing bars on subsequent poll error', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let callCount = 0;
        server.use(
            http.get('/api/market/ohlcv', () => {
                callCount++;
                if (callCount === 1) return HttpResponse.json(MOCK_OHLCV_RAW);
                return HttpResponse.json({ error: 'Temporary failure' }, { status: 503 });
            }),
        );

        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );

        await waitFor(() => expect(result.current.bars.length).toBeGreaterThan(0));
        const barsAfterFirst = result.current.bars;

        await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
        await waitFor(() => expect(result.current.error).not.toBeNull());

        // bars from first fetch must survive a poll error
        expect(result.current.bars).toEqual(barsAfterFirst);
    });

    it('clears error on recovery after failed fetch', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let callCount = 0;
        server.use(
            http.get('/api/market/ohlcv', () => {
                callCount++;
                if (callCount === 1) return HttpResponse.json({ error: 'Boom' }, { status: 500 });
                return HttpResponse.json(MOCK_OHLCV_RAW);
            }),
        );

        const { result } = renderHook(
            () => useMarketData('binance', 'BTC/USDT', '1m'),
            { wrapper },
        );

        await waitFor(() => expect(result.current.error).not.toBeNull());

        await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
        await waitFor(() => expect(result.current.error).toBeNull());
        expect(result.current.bars.length).toBeGreaterThan(0);
    });
});
