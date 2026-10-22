/** A quote from a market data provider. */
export interface IMarketQuote {
  symbol: string;
  currentPrice: number;
  /** Previous close; undefined when the provider has none. */
  previousClose: number | undefined;
  /** When the provider last updated the price. */
  asOf: Date;
}

/** A market data source (e.g. Finnhub). */
export interface IQuoteProvider {
  /** Throws when the symbol is unknown or the provider fails. */
  getQuote(symbol: string): Promise<IMarketQuote>;
}

export type StockQuoteWriteResult = 'created' | 'updated';

/** Destination for quotes (e.g. the Stock Ticker SharePoint list). */
export interface IStockQuoteWriter {
  /** Updates the entry for the quote's symbol, or creates one. */
  upsert(quote: IMarketQuote): Promise<StockQuoteWriteResult>;
}

/** Minimal logger so each host can supply its own (console, Azure Functions context, Lambda). */
export interface ILogger {
  info(message: string): void;
  error(message: string): void;
}
