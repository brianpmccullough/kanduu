import type { ITokenProvider } from './ClientSecretTokenProvider';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

/** The Microsoft Graph calls the worker needs. */
export interface IGraphClient {
  /** `path` is relative to /v1.0 (e.g. `/sites/...`) or an absolute @odata.nextLink. */
  request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T>;
}

/** Minimal Microsoft Graph client on fetch. */
export class GraphClient implements IGraphClient {
  public constructor(
    private readonly _tokenProvider: ITokenProvider,
    private readonly _fetch: typeof fetch = fetch
  ) {}

  public async request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
    const url = path.startsWith('https://') ? path : `${GRAPH_BASE_URL}${path}`;
    const response = await this._fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${await this._tokenProvider.getToken()}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`Graph ${method} ${path} failed: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as T;
  }
}
