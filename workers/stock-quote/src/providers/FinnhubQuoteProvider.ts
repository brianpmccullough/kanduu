import type { IMarketQuote, IQuoteProvider } from '../core/interfaces';

const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';

/** Finnhub /quote response: c = current price, pc = previous close, t = UNIX time (seconds). */
interface IFinnhubQuote {
  c?: number;
  pc?: number;
  t?: number;
}

/** Reads quotes from Finnhub (https://finnhub.io/docs/api/quote). */
export class FinnhubQuoteProvider implements IQuoteProvider {
  public constructor(
    private readonly _apiKey: string,
    private readonly _fetch: typeof fetch = fetch
  ) {}

  public async getQuote(symbol: string): Promise<IMarketQuote> {
    const url = `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(symbol)}`;
    // The key goes in a header, not the URL, so it does not end up in logs.
    const response = await this._fetch(url, { headers: { 'X-Finnhub-Token': this._apiKey } });
    if (!response.ok) {
      throw new Error(`Finnhub returned ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as IFinnhubQuote;
    // Finnhub answers unknown symbols with zeros rather than an error.
    if (!data.c || data.c <= 0 || !data.t) {
      throw new Error(`Finnhub has no quote for '${symbol}'`);
    }

    return {
      symbol,
      currentPrice: data.c,
      previousClose: data.pc && data.pc > 0 ? data.pc : undefined,
      asOf: new Date(data.t * 1000)
    };
  }
}
