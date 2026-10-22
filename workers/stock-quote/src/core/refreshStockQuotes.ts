import type { ILogger, IQuoteProvider, IStockQuoteWriter } from './interfaces';

export interface IRefreshResult {
  succeeded: string[];
  failed: { symbol: string; error: string }[];
}

/**
 * Fetches a quote for each symbol and writes it.  A failure for one symbol is logged and
 * does not stop the others.
 */
export async function refreshStockQuotes(
  symbols: string[],
  provider: IQuoteProvider,
  writer: IStockQuoteWriter,
  logger: ILogger
): Promise<IRefreshResult> {
  const result: IRefreshResult = { succeeded: [], failed: [] };

  for (const symbol of symbols) {
    try {
      const quote = await provider.getQuote(symbol);
      const outcome = await writer.upsert(quote);
      logger.info(`${symbol}: ${outcome} (${quote.currentPrice} as of ${quote.asOf.toISOString()})`);
      result.succeeded.push(symbol);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`${symbol}: ${message}`);
      result.failed.push({ symbol, error: message });
    }
  }

  return result;
}
