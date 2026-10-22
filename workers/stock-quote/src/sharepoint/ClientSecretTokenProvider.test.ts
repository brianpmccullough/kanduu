import { ClientSecretTokenProvider } from './ClientSecretTokenProvider';

describe('ClientSecretTokenProvider', () => {
  it('requests a Graph token and caches it until shortly before expiry', async () => {
    let now = 0;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 })
    });
    const provider = new ClientSecretTokenProvider('tenant', 'client', 'secret', fetchMock as unknown as typeof fetch, () => now);

    await expect(provider.getToken()).resolves.toBe('token');
    now = 3_000_000; // 50 minutes: still cached
    await provider.getToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now = 3_550_000; // inside the 60 second margin: refresh
    await provider.getToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://login.microsoftonline.com/tenant/oauth2/v2.0/token');
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.get('scope')).toBe('https://graph.microsoft.com/.default');
  });

  it('throws on a failed token request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'invalid_client' });
    const provider = new ClientSecretTokenProvider('t', 'c', 's', fetchMock as unknown as typeof fetch);
    await expect(provider.getToken()).rejects.toThrow('Token request failed: 401 invalid_client');
  });
});
