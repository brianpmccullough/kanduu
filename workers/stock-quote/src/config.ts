export interface IStockQuoteConfig {
  symbols: string[];
  alphaVantageApiKey: string;
  siteUrl: string;
  listTitle: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  refreshIntervalMinutes: number;
}

const REQUIRED = [
  'STOCK_SYMBOLS',
  'ALPHA_VANTAGE_API_KEY',
  'SHAREPOINT_SITE_URL',
  'TENANT_ID',
  'CLIENT_ID',
  'CLIENT_SECRET'
] as const;

/** Reads configuration from environment variables (see .env.example).  Throws naming every missing one. */
export function loadConfig(env: Record<string, string | undefined>): IStockQuoteConfig {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const symbols = env.STOCK_SYMBOLS!.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (symbols.length === 0) {
    throw new Error('STOCK_SYMBOLS has no symbols');
  }

  const interval = Number(env.REFRESH_INTERVAL_MINUTES ?? 60);
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('REFRESH_INTERVAL_MINUTES must be a positive number');
  }

  return {
    symbols,
    alphaVantageApiKey: env.ALPHA_VANTAGE_API_KEY!.trim(),
    siteUrl: env.SHAREPOINT_SITE_URL!.trim(),
    listTitle: env.STOCK_TICKER_LIST_TITLE?.trim() || 'Stock Ticker',
    tenantId: env.TENANT_ID!.trim(),
    clientId: env.CLIENT_ID!.trim(),
    clientSecret: env.CLIENT_SECRET!.trim(),
    refreshIntervalMinutes: interval
  };
}
