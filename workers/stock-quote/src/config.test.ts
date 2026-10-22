import { loadConfig } from './config';

const env = {
  STOCK_SYMBOLS: ' msft, kndu ,',
  ALPHA_VANTAGE_API_KEY: 'key',
  SHAREPOINT_SITE_URL: 'https://contoso.sharepoint.com',
  TENANT_ID: 'tenant',
  CLIENT_ID: 'client',
  CLIENT_SECRET: 'secret'
};

describe('loadConfig', () => {
  it('reads and normalizes settings, with defaults', () => {
    expect(loadConfig(env)).toEqual({
      symbols: ['MSFT', 'KNDU'],
      alphaVantageApiKey: 'key',
      siteUrl: 'https://contoso.sharepoint.com',
      listTitle: 'Stock Ticker',
      tenantId: 'tenant',
      clientId: 'client',
      clientSecret: 'secret',
      refreshIntervalMinutes: 60
    });
  });

  it('names every missing variable', () => {
    expect(() => loadConfig({ ...env, TENANT_ID: '', CLIENT_SECRET: undefined }))
      .toThrow('Missing environment variables: TENANT_ID, CLIENT_SECRET');
  });

  it('rejects an empty symbol list and a bad interval', () => {
    expect(() => loadConfig({ ...env, STOCK_SYMBOLS: ' , ' })).toThrow('STOCK_SYMBOLS has no symbols');
    expect(() => loadConfig({ ...env, REFRESH_INTERVAL_MINUTES: '0' })).toThrow('REFRESH_INTERVAL_MINUTES');
  });
});
