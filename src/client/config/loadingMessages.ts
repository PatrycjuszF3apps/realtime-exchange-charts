export type LoadingKey =
    | 'FETCHING_EXCHANGES'
    | 'FETCHING_PAIRS'
    | 'FETCHING_MARKET_DATA';

export const LOADING_MESSAGES: Record<LoadingKey, (ctx?: string) => string> = {
    FETCHING_EXCHANGES:   ()    => 'Fetching exchanges…',
    FETCHING_PAIRS:       (ctx) => `Fetching pairs for ${ctx ?? ''}…`,
    FETCHING_MARKET_DATA: (ctx) => `Fetching market data for ${ctx ?? ''}…`,
};
