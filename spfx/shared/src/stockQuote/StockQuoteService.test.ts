import { spfi } from '@pnp/sp';
import type { ISPFXContext } from '@pnp/sp';

import { DEFAULT_STOCK_TICKER_LIST_TITLE, StockQuoteService } from './StockQuoteService';

jest.mock('@pnp/sp', () => ({ spfi: jest.fn(), SPFx: jest.fn() }));
jest.mock('@pnp/sp/webs', () => ({}));
jest.mock('@pnp/sp/lists', () => ({}));
jest.mock('@pnp/sp/items', () => ({}));

const context = { pageContext: { web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/team' } } } as ISPFXContext;

/** Mocks the PnPJS chain: sp.web.lists.getByTitle(...).items.select(...).orderBy(...).top(1)(). */
function mockItems(items: unknown[]): { getByTitle: jest.Mock; query: jest.Mock } {
  const query = jest.fn().mockResolvedValue(items);
  const itemsQuery = {
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnValue(query)
  };
  const getByTitle = jest.fn().mockReturnValue({ items: itemsQuery });
  (spfi as jest.Mock).mockReturnValue({ using: () => ({ web: { lists: { getByTitle } } }) });
  return { getByTitle, query };
}

describe('StockQuoteService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the default list on the current site', async () => {
    const { getByTitle } = mockItems([]);
    await new StockQuoteService(context).getFirstQuote();
    expect(spfi).toHaveBeenCalledWith('https://contoso.sharepoint.com/sites/team');
    expect(getByTitle).toHaveBeenCalledWith(DEFAULT_STOCK_TICKER_LIST_TITLE);
  });

  it('reads the configured list and site', async () => {
    const { getByTitle } = mockItems([]);
    await new StockQuoteService(context, { siteUrl: 'https://contoso.sharepoint.com', listTitle: 'Quotes' }).getFirstQuote();
    expect(spfi).toHaveBeenCalledWith('https://contoso.sharepoint.com');
    expect(getByTitle).toHaveBeenCalledWith('Quotes');
  });

  it('maps the first item to a quote', async () => {
    mockItems([{ Title: 'KNDU', LastClosePrice: 100, CurrentPrice: 101.5, CurrentPriceAsOfDate: '2026-10-21T20:00:00Z' }]);
    await expect(new StockQuoteService(context).getFirstQuote()).resolves.toEqual({
      ticker: 'KNDU',
      currentPrice: 101.5,
      lastClosePrice: 100,
      currentPriceAsOf: '2026-10-21T20:00:00Z'
    });
  });

  it('maps empty optional fields to undefined', async () => {
    mockItems([{ Title: 'KNDU', LastClosePrice: null, CurrentPrice: 0, CurrentPriceAsOfDate: '' }]);
    await expect(new StockQuoteService(context).getFirstQuote()).resolves.toEqual({
      ticker: 'KNDU',
      currentPrice: 0,
      lastClosePrice: undefined,
      currentPriceAsOf: undefined
    });
  });

  it.each([
    ['no items', []],
    ['no ticker', [{ Title: null, LastClosePrice: 1, CurrentPrice: 1, CurrentPriceAsOfDate: null }]],
    ['no current price', [{ Title: 'KNDU', LastClosePrice: 1, CurrentPrice: null, CurrentPriceAsOfDate: null }]]
  ])('returns undefined with %s', async (_label: string, items: unknown[]) => {
    mockItems(items);
    await expect(new StockQuoteService(context).getFirstQuote()).resolves.toBeUndefined();
  });
});
