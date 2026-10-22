import { loadConfig, type IStockQuoteConfig } from './config';
import type { ILogger } from './core/interfaces';
import { refreshStockQuotes, type IRefreshResult } from './core/refreshStockQuotes';
import { AlphaVantageQuoteProvider } from './providers/AlphaVantageQuoteProvider';
import { ClientSecretTokenProvider } from './sharepoint/ClientSecretTokenProvider';
import { GraphClient } from './sharepoint/GraphClient';
import { GraphStockQuoteWriter } from './sharepoint/GraphStockQuoteWriter';

export * from './config';
export * from './core/interfaces';
export * from './core/refreshStockQuotes';

/** Builds the refresh from configuration.  The returned function can be called repeatedly. */
export function createStockQuoteRefresh(config: IStockQuoteConfig, logger: ILogger): () => Promise<IRefreshResult> {
  const provider = new AlphaVantageQuoteProvider(config.alphaVantageApiKey);
  const graph = new GraphClient(new ClientSecretTokenProvider(config.tenantId, config.clientId, config.clientSecret));
  const writer = new GraphStockQuoteWriter(graph, config.siteUrl, config.listTitle);
  return () => refreshStockQuotes(config.symbols, provider, writer, logger);
}

/**
 * Host-agnostic entry point: one refresh using environment variables.  A CLI, an Azure
 * Functions timer trigger or an AWS Lambda handler only needs to call this.
 */
export function runStockQuoteRefresh(
  env: Record<string, string | undefined> = process.env,
  logger: ILogger = console
): Promise<IRefreshResult> {
  return createStockQuoteRefresh(loadConfig(env), logger)();
}
