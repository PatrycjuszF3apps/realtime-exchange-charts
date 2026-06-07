import type { TickerInfo } from '../../types';

interface Props {
    symbol:  string;
    ticker:  TickerInfo | null;
    loading: boolean;
}

function fmt(n: number | null, decimals = 2): string {
    if (n === null) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function PriceDisplay({ symbol, ticker, loading }: Props) {
    const change  = ticker?.change ?? null;
    const isUp    = change !== null && change >= 0;
    const color   = change === null ? 'text-[#8b949e]' : isUp ? 'text-[#3fb950]' : 'text-[#f85149]';
    const arrow   = change === null ? '' : isUp ? '▲' : '▼';

    return (
        <div className="flex items-center gap-4 min-w-0">
            <div className="hidden sm:block text-[#58a6ff] font-semibold text-sm tracking-wide">
                {symbol}
            </div>

            {loading ? (
                <span className="text-[#484f58] text-sm animate-pulse">Loading…</span>
            ) : (
                <>
                    <span className="font-mono font-semibold text-lg text-[#e6edf3] tabular-nums">
                        ${fmt(ticker?.last ?? null)}
                    </span>
                    <span className={`font-mono text-sm tabular-nums ${color}`}>
                        {arrow} {change !== null ? `${Math.abs(change).toFixed(2)}%` : '—'}
                    </span>
                    <span className="hidden lg:flex gap-3 text-xs text-[#484f58] font-mono tabular-nums">
                        <span>H: {fmt(ticker?.high ?? null)}</span>
                        <span>L: {fmt(ticker?.low ?? null)}</span>
                        <span>Vol: {ticker?.volume ? (ticker.volume / 1e6).toFixed(1) + 'M' : '—'}</span>
                    </span>
                </>
            )}
        </div>
    );
}
