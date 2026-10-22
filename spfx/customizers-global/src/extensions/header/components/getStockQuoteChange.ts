import type { IStockQuote } from '@kanduu/spfx-shared';

export type StockQuoteDirection = 'up' | 'down' | 'unchanged';

export interface IStockQuoteChange {
  direction: StockQuoteDirection;
  /** Change since the last close as a fraction (0.0123 = 1.23%); undefined without a usable last close. */
  percentChange: number | undefined;
}

/** Direction and percent change of the current price relative to the last close. */
export function getStockQuoteChange(quote: IStockQuote): IStockQuoteChange {
  const { currentPrice, lastClosePrice } = quote;

  if (lastClosePrice === undefined || lastClosePrice <= 0) {
    return { direction: 'unchanged', percentChange: undefined };
  }

  const difference = currentPrice - lastClosePrice;
  return {
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'unchanged',
    percentChange: difference / lastClosePrice
  };
}
