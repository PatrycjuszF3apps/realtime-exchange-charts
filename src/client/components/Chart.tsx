import { useEffect, useRef } from 'react';
import {
    createChart,
    ColorType,
    CrosshairMode,
    type IChartApi,
    type ISeriesApi,
    type CandlestickSeriesOptions,
    type DeepPartial,
} from 'lightweight-charts';
import type { OHLCVBar } from '../types';

interface Props {
    bars: OHLCVBar[];
}

const CANDLE_OPTIONS: DeepPartial<CandlestickSeriesOptions> = {
    upColor:        '#3fb950',
    downColor:      '#f85149',
    borderUpColor:  '#3fb950',
    borderDownColor:'#f85149',
    wickUpColor:    '#3fb950',
    wickDownColor:  '#f85149',
};

export function Chart({ bars }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef     = useRef<IChartApi | null>(null);
    const candleRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeRef    = useRef<ISeriesApi<'Histogram'> | null>(null);

    // Create chart once on mount
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#0d1117' },
                textColor: '#8b949e',
                fontFamily: "'JetBrains Mono', monospace",
            },
            grid: {
                vertLines: { color: '#21262d' },
                horzLines: { color: '#21262d' },
            },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: {
                borderColor: '#30363d',
                scaleMargins: { top: 0.05, bottom: 0.22 },
            },
            timeScale: {
                borderColor: '#30363d',
                timeVisible: true,
                secondsVisible: false,
            },
            width:  containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
        });

        const candleSeries = chart.addCandlestickSeries(CANDLE_OPTIONS);

        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
            lastValueVisible: false,
            priceLineVisible: false,
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.82, bottom: 0 },
        });

        chartRef.current  = chart;
        candleRef.current = candleSeries;
        volumeRef.current = volumeSeries;

        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            chart.remove();
        };
    }, []);

    // Update data when bars change
    useEffect(() => {
        if (!candleRef.current || !volumeRef.current || bars.length === 0) return;

        candleRef.current.setData(
            bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
        );

        volumeRef.current.setData(
            bars.map(({ time, volume, open, close }) => ({
                time,
                value: volume,
                color: close >= open ? '#26a69a55' : '#ef535055',
            }))
        );
    }, [bars]);

    return <div ref={containerRef} className="w-full h-full" />;
}
