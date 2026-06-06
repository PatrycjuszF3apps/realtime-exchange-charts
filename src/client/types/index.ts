export interface OHLCVBar {
    time: number;   // Unix seconds (lightweight-charts UTCTimestamp)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TickerInfo {
    last: number | null;
    change: number | null;  // 24h % change
    high: number | null;
    low: number | null;
    volume: number | null;  // quote volume
}

export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

