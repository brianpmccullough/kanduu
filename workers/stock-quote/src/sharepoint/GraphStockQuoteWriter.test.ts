import type { IMarketQuote } from '../core/interfaces';
import type { IGraphClient } from './GraphClient';
import { GraphStockQuoteWriter } from './GraphStockQuoteWriter';

const quote: IMarketQuote = {
  symbol: 'MSFT',
  currentPrice: 101.5,
  previousClose: undefined,
  asOf: new Date('2026-10-21T20:00:00Z')
};

const LIST = '/sites/site-1/lists/list-1';

/** Fake Graph: responds to GETs by path; records writes. */
function fakeGraph(items: unknown[], lists: unknown[] = [{ id: 'list-1', displayName: 'Stock Ticker' }]): IGraphClient & { request: jest.Mock } {
  return {
    request: jest.fn(async (method: string, path: string): Promise<any> => {
      if (method !== 'GET') {
        return {};
      }
      if (path.startsWith('/sites/contoso.sharepoint.com')) {
        return { id: 'site-1' };
      }
      if (path.startsWith('/sites/site-1/lists?')) {
        return { value: lists };
      }
      if (path.startsWith(`${LIST}/items?`)) {
        return { value: items, '@odata.nextLink': items.length ? 'https://graph.microsoft.com/v1.0/next' : undefined };
      }
      if (path === 'https://graph.microsoft.com/v1.0/next') {
        return { value: [{ id: '9', fields: { Title: 'msft' } }] };
      }
      throw new Error(`Unexpected ${method} ${path}`);
    })
  };
}

describe('GraphStockQuoteWriter', () => {
  it('resolves a site by path and updates the matching item across pages', async () => {
    const graph = fakeGraph([{ id: '1', fields: { Title: 'KNDU' } }]);
    const writer = new GraphStockQuoteWriter(graph, 'https://contoso.sharepoint.com/sites/home/', 'Stock Ticker');

    await expect(writer.upsert(quote)).resolves.toBe('updated');

    expect(graph.request).toHaveBeenCalledWith('GET', '/sites/contoso.sharepoint.com:/sites/home');
    expect(graph.request).toHaveBeenCalledWith('PATCH', `${LIST}/items/9/fields`, {
      LastClosePrice: null,
      CurrentPrice: 101.5,
      CurrentPriceAsOfDate: '2026-10-21T20:00:00.000Z'
    });
  });

  it('creates an item for a new symbol on the root site, resolving the list once', async () => {
    const graph = fakeGraph([]);
    const writer = new GraphStockQuoteWriter(graph, 'https://contoso.sharepoint.com', 'Stock Ticker');

    await expect(writer.upsert(quote)).resolves.toBe('created');
    await writer.upsert(quote);

    expect(graph.request).toHaveBeenCalledWith('GET', '/sites/contoso.sharepoint.com');
    expect(graph.request).toHaveBeenCalledWith('POST', `${LIST}/items`, {
      fields: { Title: 'MSFT', LastClosePrice: null, CurrentPrice: 101.5, CurrentPriceAsOfDate: '2026-10-21T20:00:00.000Z' }
    });
    const siteLookups = graph.request.mock.calls.filter(([, path]) => path === '/sites/contoso.sharepoint.com');
    expect(siteLookups).toHaveLength(1);
  });

  it('explains a missing list', async () => {
    const writer = new GraphStockQuoteWriter(fakeGraph([], []), 'https://contoso.sharepoint.com', 'Stock Ticker');
    await expect(writer.upsert(quote)).rejects.toThrow("List 'Stock Ticker' not found");
  });
});
