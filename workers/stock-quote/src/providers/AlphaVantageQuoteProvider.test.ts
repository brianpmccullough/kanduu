import { AlphaVantageQuoteProvider } from './AlphaVantageQuoteProvider';

const respond = (body: unknown, status = 200): jest.Mock =>
  jest.fn().mockResolvedValue({ ok: status < 400, status, statusText: 'status', json: async () => body });

/** Shape returned by GLOBAL_QUOTE (captured 2026-10-21). */
const globalQuote = {
  'Global Quote': {
    '01. symbol': 'MSFT',
    '05. price': '532.9500',
    '07. latest trading day': '2026-10-21',
    '08. previous close': '531.8700',
    '10. change percent': '0.2031%'
  }
};

const retrievedAt = new Date('2026-10-21T20:15:00Z');

const create = (fetchMock: jest.Mock): AlphaVantageQuoteProvider =>
  new AlphaVantageQuoteProvider('secret-key', fetchMock as unknown as typeof fetch, () => retrievedAt);

describe('AlphaVantageQuoteProvider', () => {
  it('maps GLOBAL_QUOTE to a quote stamped with the retrieval time', async () => {
    const fetchMock = respond(globalQuote);

    await expect(create(fetchMock).getQuote('MSFT')).resolves.toEqual({
      symbol: 'MSFT',
      currentPrice: 532.95,
      previousClose: 531.87,
      asOf: retrievedAt
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=secret-key'
    );
  });

  it('treats a missing previous close as undefined', async () => {
    const body = { 'Global Quote': { ...globalQuote['Global Quote'], '08. previous close': '0.0000' } };
    await expect(create(respond(body)).getQuote('MSFT')).resolves.toMatchObject({ previousClose: undefined });
  });

  it('rejects unknown symbols (empty Global Quote)', async () => {
    await expect(create(respond({ 'Global Quote': {} })).getQuote('NOPE'))
      .rejects.toThrow("Alpha Vantage has no quote for 'NOPE'");
  });

  it.each([
    ['rate limits', { Information: 'Our standard API rate limit is 25 requests per day.' }],
    ['notes', { Note: 'Thank you for using Alpha Vantage!' }],
    ['errors', { 'Error Message': 'Invalid API call.' }]
  ])('surfaces %s returned with HTTP 200', async (_label: string, body: object) => {
    await expect(create(respond(body)).getQuote('MSFT')).rejects.toThrow(`Alpha Vantage: ${Object.values(body)[0]}`);
  });

  it('rejects HTTP errors without exposing the key', async () => {
    const result = create(respond({}, 503)).getQuote('MSFT');
    await expect(result).rejects.toThrow(/^Alpha Vantage returned 503 status$/);
    await expect(result).rejects.not.toThrow('secret-key');
  });
});
