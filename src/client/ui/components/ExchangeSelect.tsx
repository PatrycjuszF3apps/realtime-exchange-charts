const SELECT_CLS =
    'bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-sm rounded-md px-3 py-1.5 ' +
    'focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] cursor-pointer ' +
    'hover:border-[#484f58] transition-colors';

interface Props {
    exchange: string;
    exchanges: string[];
    loading: boolean;
    onChange: (exchange: string) => void;
}

export function ExchangeSelect({ exchange, exchanges, loading, onChange }: Props) {
    return (
        <select
            value={exchange}
            onChange={e => onChange(e.target.value)}
            disabled={loading}
            className={SELECT_CLS}
        >
            {exchanges.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
            ))}
        </select>
    );
}
