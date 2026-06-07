import { useLoading } from '../../context/LoadingContext';
import { LOADING_MESSAGES, type LoadingKey } from '../../config/loadingMessages';

export function Spinner() {
    const { current } = useLoading();
    if (!current) return null;

    const resolve = LOADING_MESSAGES[current.key as LoadingKey];
    const message = resolve ? resolve(current.context) : 'Loading…';

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#484f58]">
            <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{message}</span>
        </div>
    );
}
