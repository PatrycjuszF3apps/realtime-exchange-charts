import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../mocks/server';
import { MOCK_PAIRS } from '../mocks/handlers';
import { useExchangePairs } from '../../hooks/useExchangePairs';
import { LoadingProvider } from '../../context/LoadingContext';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(LoadingProvider, null, children);

describe('useExchangePairs', () => {
    it('starts with loading=true, empty pairs, no error', () => {
        const { result } = renderHook(() => useExchangePairs('binance'), { wrapper });
        expect(result.current.loading).toBe(true);
        expect(result.current.pairs).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('returns pairs and sets loading=false after successful fetch', async () => {
        const { result } = renderHook(() => useExchangePairs('binance'), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.pairs).toEqual(MOCK_PAIRS);
        expect(result.current.error).toBeNull();
    });

    it('re-fetches when exchange changes', async () => {
        const { result, rerender } = renderHook(
            ({ exchange }: { exchange: string }) => useExchangePairs(exchange),
            { wrapper, initialProps: { exchange: 'binance' } },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.pairs).toEqual(MOCK_PAIRS);

        const KRAKEN_PAIRS = ['XBT/EUR', 'ETH/EUR'];
        server.use(
            http.get('/api/market/pairs', () => HttpResponse.json(KRAKEN_PAIRS)),
        );

        rerender({ exchange: 'kraken' });
        // State resets immediately on exchange change
        expect(result.current.pairs).toEqual([]);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.pairs).toEqual(KRAKEN_PAIRS);
    });

    it('sets error and clears pairs on API error response', async () => {
        server.use(
            http.get('/api/market/pairs', () =>
                HttpResponse.json({ error: 'Exchange unavailable' }, { status: 500 }),
            ),
        );
        const { result } = renderHook(() => useExchangePairs('binance'), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.pairs).toEqual([]);
        expect(result.current.error).toBe('Exchange unavailable');
    });

    it('sets error on network failure', async () => {
        server.use(
            http.get('/api/market/pairs', () => HttpResponse.error()),
        );
        const { result } = renderHook(() => useExchangePairs('binance'), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.pairs).toEqual([]);
        expect(result.current.error).not.toBeNull();
    });

    it('does not apply stale response after exchange changes (cancelled flag)', async () => {
        // First exchange fetch is slow; before it resolves, exchange changes.
        // The stale response must NOT overwrite the new exchange's state.
        let releaseBinance!: () => void;
        const binancePending = new Promise<void>(res => { releaseBinance = res; });
        let handlerHit = false;

        const KRAKEN_PAIRS = ['XBT/EUR', 'ETH/EUR'];

        server.use(
            http.get('/api/market/pairs', async ({ request }) => {
                const url = new URL(request.url);
                if (url.searchParams.get('exchange') === 'binance') {
                    handlerHit = true;
                    await binancePending;
                    return HttpResponse.json(MOCK_PAIRS);
                }
                return HttpResponse.json(KRAKEN_PAIRS);
            }),
        );

        const { result, rerender } = renderHook(
            ({ exchange }: { exchange: string }) => useExchangePairs(exchange),
            { wrapper, initialProps: { exchange: 'binance' } },
        );

        // Wait for the binance handler to be called (request is in-flight)
        await waitFor(() => expect(handlerHit).toBe(true));

        // Change exchange before binance response arrives → cancels binance effect
        rerender({ exchange: 'kraken' });

        // Kraken fetch completes
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Release the stale binance response — must NOT overwrite kraken state
        await act(async () => {
            releaseBinance();
            await new Promise(res => setTimeout(res, 50));
        });

        expect(result.current.pairs).toEqual(KRAKEN_PAIRS);
        expect(result.current.error).toBeNull();
    });
});
