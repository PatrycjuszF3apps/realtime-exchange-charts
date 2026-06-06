import type { Interval } from '../types';

export const DEFAULT_PAIRS = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT',
    'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT',
    'MATIC/USDT', 'DOT/USDT', 'LINK/USDT', 'UNI/USDT',
    'ATOM/USDT', 'LTC/USDT', 'FIL/USDT',  'NEAR/USDT', 'BABY/USDT'
];

export const INTERVALS: { value: Interval; label: string }[] = [
    { value: '1m',  label: '1m'  },
    { value: '5m',  label: '5m'  },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h',  label: '1h'  },
    { value: '4h',  label: '4h'  },
    { value: '1d',  label: '1D'  },
];
