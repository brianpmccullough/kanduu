import { spfi, SPFx, type ISPFXContext, type SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

import type { IStockQuote } from './IStockQuote';
import type { IStockQuoteService } from './IStockQuoteService';

export const DEFAULT_STOCK_TICKER_LIST_TITLE = 'Stock Ticker';

export interface IStockQuoteServiceOptions {
  /** Site that hosts the list; defaults to the current site. */
  siteUrl?: string;
  /** List title; defaults to DEFAULT_STOCK_TICKER_LIST_TITLE. */
  listTitle?: string;
}

/** List item fields, by internal name.  Title is displayed as "Ticker". */
interface IStockQuoteItem {
  Title: string | null;
  LastClosePrice: number | null;
  CurrentPrice: number | null;
  CurrentPriceAsOfDate: string | null;
}

/** Reads stock quotes from a SharePoint list with PnPJS. */
export class StockQuoteService implements IStockQuoteService {
  private readonly _sp: SPFI;
  private readonly _listTitle: string;

  public constructor(context: ISPFXContext, options: IStockQuoteServiceOptions = {}) {
    const siteUrl = options.siteUrl || context.pageContext.web.absoluteUrl;
    this._sp = spfi(siteUrl).using(SPFx(context));
    this._listTitle = options.listTitle || DEFAULT_STOCK_TICKER_LIST_TITLE;
  }

  public async getFirstQuote(): Promise<IStockQuote | undefined> {
    const items: IStockQuoteItem[] = await this._sp.web.lists
      .getByTitle(this._listTitle)
      .items.select('Title', 'LastClosePrice', 'CurrentPrice', 'CurrentPriceAsOfDate')
      .orderBy('ID', true)
      .top(1)();

    const item = items[0];
    if (!item || !item.Title || item.CurrentPrice === null) {
      return undefined;
    }

    return {
      ticker: item.Title,
      currentPrice: item.CurrentPrice,
      lastClosePrice: item.LastClosePrice ?? undefined,
      currentPriceAsOf: item.CurrentPriceAsOfDate || undefined
    };
  }
}
