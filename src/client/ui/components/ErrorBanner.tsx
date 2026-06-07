interface Props {
    message: string;
}

export function ErrorBanner({ message }: Props) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#3d1a1a] border-b border-[#f85149] text-[#f85149] text-xs flex-shrink-0">
            <span>⚠</span>
            <span className="font-mono">{message}</span>
        </div>
    );
}
