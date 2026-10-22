/** A stock quote read from the Stock Ticker list. */
export interface IStockQuote {
  /** Ticker symbol (the list's Title field, displayed as "Ticker"). */
  ticker: string;
  currentPrice: number;
  /** Previous close; undefined when the list item has no value. */
  lastClosePrice: number | undefined;
  /** ISO 8601 string as entered in the list; not validated. */
  currentPriceAsOf: string | undefined;
}

export type StockQuoteDirection = 'up' | 'down' | 'unchanged';

export interface IStockQuoteChange {
  direction: StockQuoteDirection;
  /** Change since the last close as a fraction (0.0123 = 1.23%); undefined without a usable last close. */
  percentChange: number | undefined;
}
