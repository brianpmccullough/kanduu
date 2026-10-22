import { FinnhubQuoteProvider } from './FinnhubQuoteProvider';

const respond = (body: unknown, status = 200): jest.Mock =>
  jest.fn().mockResolvedValue({ ok: status < 400, status, statusText: 'status', json: async () => body });

describe('FinnhubQuoteProvider', () => {
  it('maps a quote and sends the key as a header', async () => {
    const fetchMock = respond({ c: 101.5, pc: 100, t: 1792612800 });
    const provider = new FinnhubQuoteProvider('secret-key', fetchMock as unknown as typeof fetch);

    await expect(provider.getQuote('MSFT')).resolves.toEqual({
      symbol: 'MSFT',
      currentPrice: 101.5,
      previousClose: 100,
      asOf: new Date(1792612800 * 1000)
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://finnhub.io/api/v1/quote?symbol=MSFT');
    expect(init.headers).toEqual({ 'X-Finnhub-Token': 'secret-key' });
  });

  it('treats a missing previous close as undefined', async () => {
    const provider = new FinnhubQuoteProvider('k', respond({ c: 5, pc: 0, t: 1 }) as unknown as typeof fetch);
    await expect(provider.getQuote('X')).resolves.toMatchObject({ previousClose: undefined });
  });

  it('rejects unknown symbols (all zeros)', async () => {
    const provider = new FinnhubQuoteProvider('k', respond({ c: 0, pc: 0, t: 0 }) as unknown as typeof fetch);
    await expect(provider.getQuote('NOPE')).rejects.toThrow("Finnhub has no quote for 'NOPE'");
  });

  it('rejects HTTP errors', async () => {
    const provider = new FinnhubQuoteProvider('k', respond({}, 429) as unknown as typeof fetch);
    await expect(provider.getQuote('MSFT')).rejects.toThrow('Finnhub returned 429');
  });
});
