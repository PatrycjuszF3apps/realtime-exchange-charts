import * as ccxt from 'ccxt';

export function createExchange(exchangeId: string): ccxt.Exchange {
    const ExchangeClass = (ccxt as unknown as Record<string, new (cfg: object) => ccxt.Exchange>)[exchangeId];
    if (!ExchangeClass) throw new Error(`Unknown exchange: ${exchangeId}`);

    const config: Record<string, string> = {};

    return new ExchangeClass(config);
}
