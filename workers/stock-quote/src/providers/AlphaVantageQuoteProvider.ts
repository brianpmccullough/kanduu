import type { IMarketQuote, IQuoteProvider } from '../core/interfaces';

const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

/** Requests per day allowed by a free Alpha Vantage key. */
export const ALPHA_VANTAGE_FREE_DAILY_LIMIT = 25;

/** GLOBAL_QUOTE response; numbers arrive as strings.  Limits and errors come back as 200 with a message. */
interface IAlphaVantageResponse {
  'Global Quote'?: {
    '05. price'?: string;
    '08. previous close'?: string;
  };
  'Error Message'?: string;
  Information?: string;
  Note?: string;
}

/** Reads quotes from Alpha Vantage GLOBAL_QUOTE (https://www.alphavantage.co/documentation/#latestprice). */
export class AlphaVantageQuoteProvider implements IQuoteProvider {
  public constructor(
    private readonly _apiKey: string,
    private readonly _fetch: typeof fetch = fetch,
    private readonly _now: () => Date = () => new Date()
  ) {}

  public async getQuote(symbol: string): Promise<IMarketQuote> {
    const query = new URLSearchParams({ function: 'GLOBAL_QUOTE', symbol, apikey: this._apiKey });
    // The API only accepts the key in the URL, so never include the URL in errors or logs.
    const response = await this._fetch(`${ALPHA_VANTAGE_URL}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Alpha Vantage returned ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as IAlphaVantageResponse;
    const message = data['Error Message'] ?? data.Information ?? data.Note;
    if (message) {
      throw new Error(`Alpha Vantage: ${message}`);
    }

    const quote = data['Global Quote'];
    const price = Number(quote?.['05. price']);
    // Unknown symbols return an empty "Global Quote" object.
    if (!quote || !(price > 0)) {
      throw new Error(`Alpha Vantage has no quote for '${symbol}'`);
    }

    const previousClose = Number(quote['08. previous close']);
    return {
      symbol,
      currentPrice: price,
      previousClose: previousClose > 0 ? previousClose : undefined,
      asOf: this._now()
    };
  }
}
