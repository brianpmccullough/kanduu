import type { IMarketQuote, IStockQuoteWriter, StockQuoteWriteResult } from '../core/interfaces';
import type { IGraphClient } from './GraphClient';

interface IListItem {
  id: string;
  fields?: { Title?: string };
}

interface IPage<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

/**
 * Writes quotes to the Stock Ticker list (created by scripts/Set-StockTickerList.ps1) with
 * Microsoft Graph.  Items are matched by Ticker (the Title field), case-insensitively; a new
 * symbol becomes a new item.
 */
export class GraphStockQuoteWriter implements IStockQuoteWriter {
  private _listPath: Promise<string> | undefined;

  public constructor(
    private readonly _graph: IGraphClient,
    private readonly _siteUrl: string,
    private readonly _listTitle: string
  ) {}

  public async upsert(quote: IMarketQuote): Promise<StockQuoteWriteResult> {
    const listPath = await this._getListPath();
    const fields = {
      LastClosePrice: quote.previousClose ?? null,
      CurrentPrice: quote.currentPrice,
      CurrentPriceAsOfDate: quote.asOf.toISOString()
    };

    const item = await this._findItem(listPath, quote.symbol);
    if (item) {
      await this._graph.request('PATCH', `${listPath}/items/${item.id}/fields`, fields);
      return 'updated';
    }

    await this._graph.request('POST', `${listPath}/items`, { fields: { Title: quote.symbol, ...fields } });
    return 'created';
  }

  /** `/sites/{siteId}/lists/{listId}`, resolved once and reused. */
  private _getListPath(): Promise<string> {
    if (!this._listPath) {
      this._listPath = this._resolveListPath().catch((error: unknown) => {
        this._listPath = undefined;
        throw error;
      });
    }
    return this._listPath;
  }

  private async _resolveListPath(): Promise<string> {
    const { hostname, pathname } = new URL(this._siteUrl);
    const sitePath = pathname.replace(/\/+$/, '');
    const site = await this._graph.request<{ id: string }>(
      'GET',
      sitePath ? `/sites/${hostname}:${sitePath}` : `/sites/${hostname}`
    );

    const list = await this._find<{ id: string; displayName?: string }>(
      `/sites/${site.id}/lists?$select=id,displayName`,
      (candidate) => candidate.displayName === this._listTitle
    );
    if (!list) {
      throw new Error(`List '${this._listTitle}' not found on ${this._siteUrl}. Run scripts/Set-StockTickerList.ps1.`);
    }

    return `/sites/${site.id}/lists/${list.id}`;
  }

  private _findItem(listPath: string, symbol: string): Promise<IListItem | undefined> {
    const wanted = symbol.toUpperCase();
    return this._find<IListItem>(
      `${listPath}/items?$select=id&$expand=fields($select=Title)&$top=200`,
      (item) => item.fields?.Title?.toUpperCase() === wanted
    );
  }

  /** First match across all pages of a collection.  Lists and the ticker list are small. */
  private async _find<T>(path: string, predicate: (value: T) => boolean): Promise<T | undefined> {
    let next: string | undefined = path;
    while (next) {
      const page: IPage<T> = await this._graph.request<IPage<T>>('GET', next);
      const match = page.value.find(predicate);
      if (match) {
        return match;
      }
      next = page['@odata.nextLink'];
    }
    return undefined;
  }
}
