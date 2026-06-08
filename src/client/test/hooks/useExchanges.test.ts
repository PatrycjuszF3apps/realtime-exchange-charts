import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { MOCK_EXCHANGES } from '../mocks/handlers';
import { useExchanges } from '../../hooks/useExchanges';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useExchanges', () => {
    it('starts with loading=true and empty exchanges', () => {
        const { result } = renderHook(() => useExchanges());
        expect(result.current.loading).toBe(true);
        expect(result.current.exchanges).toEqual([]);
    });

    it('returns exchanges list and sets loading=false after successful fetch', async () => {
        const { result } = renderHook(() => useExchanges());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.exchanges).toEqual(MOCK_EXCHANGES);
    });

    it('sets loading=false even when fetch fails', async () => {
        const { http, HttpResponse } = await import('msw');
        server.use(
            http.get('/api/market/exchanges', () => HttpResponse.error()),
        );
        const { result } = renderHook(() => useExchanges());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.exchanges).toEqual([]);
    });
});
