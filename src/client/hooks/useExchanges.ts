import { useState, useEffect } from 'react';

export function useExchanges() {
    const [exchanges, setExchanges] = useState<string[]>([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        fetch('/api/market/exchanges')
            .then(r => r.json())
            .then((data: string[]) => { setExchanges(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return { exchanges, loading };
}
