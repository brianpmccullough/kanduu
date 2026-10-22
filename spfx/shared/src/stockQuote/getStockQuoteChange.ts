import type { IStockQuote, IStockQuoteChange } from './IStockQuote';

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
