import type { IStockQuote } from './IStockQuote';
import { getStockQuoteChange } from './getStockQuoteChange';

const quote = (currentPrice: number, lastClosePrice: number | undefined): IStockQuote => ({
  ticker: 'KNDU',
  currentPrice,
  lastClosePrice,
  currentPriceAsOf: undefined
});

describe('getStockQuoteChange', () => {
  it('is up when the price rose', () => {
    expect(getStockQuoteChange(quote(110, 100))).toEqual({ direction: 'up', percentChange: 0.1 });
  });

  it('is down when the price fell', () => {
    expect(getStockQuoteChange(quote(90, 100))).toEqual({ direction: 'down', percentChange: -0.1 });
  });

  it('is unchanged when the price is the same', () => {
    expect(getStockQuoteChange(quote(100, 100))).toEqual({ direction: 'unchanged', percentChange: 0 });
  });

  it('has no percent without a usable last close', () => {
    expect(getStockQuoteChange(quote(100, undefined))).toEqual({ direction: 'unchanged', percentChange: undefined });
    expect(getStockQuoteChange(quote(100, 0))).toEqual({ direction: 'unchanged', percentChange: undefined });
  });
});
