/** Supplies Microsoft Graph access tokens. */
export interface ITokenProvider {
  getToken(): Promise<string>;
}

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
/** Refresh this long before the token expires. */
const EXPIRY_MARGIN_MS = 60_000;

/**
 * App-only Microsoft Graph tokens with the OAuth client credentials flow and a client secret.
 * Suited to local runs; in the cloud prefer a managed identity or certificate (see docs/workers.md).
 */
export class ClientSecretTokenProvider implements ITokenProvider {
  private _token: string | undefined;
  private _expiresAt = 0;

  public constructor(
    private readonly _tenantId: string,
    private readonly _clientId: string,
    private readonly _clientSecret: string,
    private readonly _fetch: typeof fetch = fetch,
    private readonly _now: () => number = Date.now
  ) {}

  public async getToken(): Promise<string> {
    if (this._token && this._now() < this._expiresAt) {
      return this._token;
    }

    const response = await this._fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(this._tenantId)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this._clientId,
          client_secret: this._clientSecret,
          scope: GRAPH_SCOPE,
          grant_type: 'client_credentials'
        })
      }
    );
    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this._token = data.access_token;
    this._expiresAt = this._now() + data.expires_in * 1000 - EXPIRY_MARGIN_MS;
    return this._token;
  }
}
