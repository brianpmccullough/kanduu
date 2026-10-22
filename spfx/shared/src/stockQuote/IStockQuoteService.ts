import type { IStockQuote } from './IStockQuote';

export interface IStockQuoteService {
  /** The first quote in the list (lowest ID), or undefined when there is no usable quote. */
  getFirstQuote(): Promise<IStockQuote | undefined>;
}
