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
