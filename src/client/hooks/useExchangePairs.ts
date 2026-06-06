import { useState, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';

export function useExchangePairs(exchange: string) {
    const [pairs,   setPairs]   = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);
    const { push, pop } = useLoading();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setPairs([]);
        push({ key: 'FETCHING_PAIRS', context: exchange });

        fetch(`/api/market/pairs?exchange=${exchange}`)
            .then(r => r.ok ? r.json() : r.json().then((b: { error?: string }) => Promise.reject(new Error(b.error ?? r.statusText))))
            .then((data: string[]) => {
                if (!cancelled) { setPairs(data); setLoading(false); pop('FETCHING_PAIRS'); }
            })
            .catch((e: unknown) => {
                if (!cancelled) { setError((e as Error).message); setLoading(false); pop('FETCHING_PAIRS'); }
            });

        return () => { cancelled = true; pop('FETCHING_PAIRS'); };
    }, [exchange, push, pop]);

    return { pairs, loading, error };
}
