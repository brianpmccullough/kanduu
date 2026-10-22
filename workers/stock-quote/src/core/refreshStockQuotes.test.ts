import type { ILogger, IMarketQuote, IQuoteProvider, IStockQuoteWriter } from './interfaces';
import { refreshStockQuotes } from './refreshStockQuotes';

const quote = (symbol: string): IMarketQuote => ({
  symbol,
  currentPrice: 10,
  previousClose: 9,
  asOf: new Date('2026-10-21T20:00:00Z')
});

describe('refreshStockQuotes', () => {
  const logger: ILogger = { info: jest.fn(), error: jest.fn() };

  it('writes each quote and keeps going after a failure', async () => {
    const provider: IQuoteProvider = {
      getQuote: jest.fn(async (symbol: string) => {
        if (symbol === 'BAD') {
          throw new Error('no quote');
        }
        return quote(symbol);
      })
    };
    const writer: IStockQuoteWriter = { upsert: jest.fn().mockResolvedValue('updated') };

    const result = await refreshStockQuotes(['MSFT', 'BAD', 'KNDU'], provider, writer, logger);

    expect(result).toEqual({ succeeded: ['MSFT', 'KNDU'], failed: [{ symbol: 'BAD', error: 'no quote' }] });
    expect(writer.upsert).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith('BAD: no quote');
  });

  it('reports writer failures', async () => {
    const provider: IQuoteProvider = { getQuote: async (symbol: string) => quote(symbol) };
    const writer: IStockQuoteWriter = { upsert: jest.fn().mockRejectedValue(new Error('403')) };

    const result = await refreshStockQuotes(['MSFT'], provider, writer, logger);

    expect(result.failed).toEqual([{ symbol: 'MSFT', error: '403' }]);
  });
});
