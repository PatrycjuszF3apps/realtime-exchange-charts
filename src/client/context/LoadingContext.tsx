import { createContext, useCallback, useContext, useReducer, useRef, type ReactNode } from 'react';

export type LoadingEntry = { key: string; context?: string };

type State  = { stack: LoadingEntry[] };
type Action = { type: 'PUSH'; entry: LoadingEntry } | { type: 'POP'; key: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'PUSH':
            return { stack: [...state.stack, action.entry] };
        case 'POP': {
            const idx = state.stack.map(e => e.key).lastIndexOf(action.key);
            if (idx === -1) return state;
            return { stack: state.stack.filter((_, i) => i !== idx) };
        }
        default:
            return state;
    }
}

type ContextValue = {
    current: LoadingEntry | null;
    push: (entry: LoadingEntry) => void;
    pop:  (key: string) => void;
};

const LoadingContext = createContext<ContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, { stack: [] });

    const push = useCallback((entry: LoadingEntry) => dispatch({ type: 'PUSH', entry }), []);
    const pop  = useCallback((key: string)         => dispatch({ type: 'POP', key }),   []);

    const current = state.stack[state.stack.length - 1] ?? null;

    return (
        <LoadingContext.Provider value={{ current, push, pop }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error('useLoading must be used within <LoadingProvider>');
    return ctx;
}

/** Convenience: push on mount / exchange change, pop on cleanup */
export function useLoadingEntry(key: string, context?: string) {
    const { push, pop } = useLoading();
    // stable ref so the effect only re-runs when key/context change
    const entryRef = useRef<LoadingEntry>({ key, context });
    entryRef.current = { key, context };
    return { push, pop };
}
