import { INTERVALS } from '../../config/markets';
import type { Interval } from '../../types';

interface Props {
    interval: Interval;
    onChange: (interval: Interval) => void;
}

export function IntervalSelector({ interval, onChange }: Props) {
    return (
        <div className="flex items-center gap-0.5 bg-[#0d1117] rounded-md border border-[#30363d] p-0.5">
            {INTERVALS.map(({ value, label }) => (
                <button
                    key={value}
                    onClick={() => onChange(value)}
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
    );
}
