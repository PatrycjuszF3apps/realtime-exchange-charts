import { useState, useEffect, useRef } from 'react';
import { Chart } from './components/Chart';
import { PriceDisplay } from './components/PriceDisplay';
import { Spinner } from './components/Spinner';
import { useMarketData } from './hooks/useMarketData';
import { useExchangePairs } from './hooks/useExchangePairs';
import { useExchanges } from './hooks/useExchanges';
import { INTERVALS } from './config/markets';
import type { Interval } from './types';
import '../style.css';

const SELECT_CLS =
    'bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-sm rounded-md px-3 py-1.5 ' +
    'focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] cursor-pointer ' +
    'hover:border-[#484f58] transition-colors';

export default function App() {
    const [exchange, setExchange] = useState('binance');
    const [symbol,   setSymbol]   = useState('BTC/USDT');
    const [interval, setInterval] = useState<Interval>('1h');
    const lastSymbolRef = useRef('BTC/USDT');

    const { exchanges, loading: exchangesLoading } = useExchanges();
    const { pairs, loading: pairsLoading, error: pairsError } = useExchangePairs(exchange);

    useEffect(() => {
        if (pairs.length === 0) return;
        const preferred = lastSymbolRef.current;
        setSymbol(pairs.includes(preferred) ? preferred : pairs[0]);
    }, [pairs]);

    const handleExchangeChange = (newExchange: string) => {
        lastSymbolRef.current = symbol;
        setExchange(newExchange);
        setSymbol('');
    };

    const { bars, ticker, loading, error } = useMarketData(exchange, symbol, interval);

    return (
        <div className="flex flex-col h-full bg-[#0d1117]">

            {/* ── Header ── */}
            <header className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] flex-shrink-0">

                {/* Logo */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#58a6ff] text-xl">◈</span>
                    <span className="font-bold text-sm tracking-widest text-[#e6edf3] hidden sm:block">
                        Realtime Exchange Charts
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap">

                    {/* Exchange */}
                    <select
                        value={exchange}
                        onChange={e => handleExchangeChange(e.target.value)}
                        disabled={exchangesLoading}
                        className={SELECT_CLS}
                    >
                        {exchanges.map(ex => (
                            <option key={ex} value={ex}>{ex}</option>
                        ))}
                    </select>

                    {/* Pair */}
                    <select
                        value={pairsLoading ? '' : symbol}
                        onChange={e => setSymbol(e.target.value)}
                        disabled={pairsLoading}
                        className={SELECT_CLS}
                    >
                        {pairsLoading
                            ? <option value="">Loading pairs…</option>
                            : pairs.map(p => <option key={p} value={p}>{p}</option>)
                        }
                    </select>

                    {/* Interval */}
                    <div className="flex items-center gap-0.5 bg-[#0d1117] rounded-md border border-[#30363d] p-0.5">
                        {INTERVALS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setInterval(value)}
                                className={
                                    `px-2.5 py-1 text-xs font-medium rounded transition-colors ` +
                                    (interval === value
                                        ? 'bg-[#1f6feb] text-white'
                                        : 'text-[#8b949e] hover:text-[#e6edf3]')
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price info */}
                <PriceDisplay symbol={symbol} ticker={ticker} loading={loading} />
            </header>

            {/* ── Error Banner ── */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#3d1a1a] border-b border-[#f85149] text-[#f85149] text-xs flex-shrink-0">
                    <span>⚠</span>
                    <span className="font-mono">{error}</span>
                </div>
            )}

            {/* ── Chart ── */}
            <main className="flex-1 min-h-0 relative">
                {!pairsLoading && !pairsError && pairs.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#484f58]">
                        <span className="text-sm">No USDT spot pairs available on <span className="text-[#8b949e]">{exchange}</span></span>
                    </div>
                ) : bars.length > 0 ? (
                    <Chart bars={bars} />
                ) : null}
                <Spinner />
            </main>

            {/* ── Status Bar ── */}
            <footer className="flex items-center justify-between px-4 py-1 bg-[#161b22] border-t border-[#30363d] text-[#484f58] text-xs flex-shrink-0 font-mono">
                <span>{exchange.toUpperCase()} · {symbol} · {interval}</span>
                <span>{bars.length > 0 ? `${bars.length} bars` : '—'}</span>
            </footer>
        </div>
    );
}
