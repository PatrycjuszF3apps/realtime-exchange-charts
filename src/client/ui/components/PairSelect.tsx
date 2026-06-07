const SELECT_CLS =
    'bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-sm rounded-md px-3 py-1.5 ' +
    'focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] cursor-pointer ' +
    'hover:border-[#484f58] transition-colors';

interface Props {
    symbol: string;
    pairs: string[];
    loading: boolean;
    onChange: (symbol: string) => void;
}

export function PairSelect({ symbol, pairs, loading, onChange }: Props) {
    return (
        <select
            value={loading ? '' : symbol}
            onChange={e => onChange(e.target.value)}
            disabled={loading}
            className={SELECT_CLS}
        >
            {loading
                ? <option value="">Loading pairs…</option>
                : pairs.map(p => <option key={p} value={p}>{p}</option>)
            }
        </select>
    );
}
