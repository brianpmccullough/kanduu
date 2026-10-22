/**
 * Local host.  `--once` refreshes once and exits (exit code 1 if any symbol failed);
 * otherwise it refreshes every REFRESH_INTERVAL_MINUTES until stopped with Ctrl+C.
 */
import { createStockQuoteRefresh, loadConfig } from '../index';
import { ALPHA_VANTAGE_FREE_DAILY_LIMIT } from '../providers/AlphaVantageQuoteProvider';

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const refresh = createStockQuoteRefresh(config, console);

  if (process.argv.includes('--once')) {
    const result = await refresh();
    process.exitCode = result.failed.length > 0 ? 1 : 0;
    return;
  }

  const intervalMs = config.refreshIntervalMinutes * 60_000;
  console.info(`Refreshing ${config.symbols.join(', ')} every ${config.refreshIntervalMinutes} minute(s). Ctrl+C to stop.`);
  const requestsPerDay = config.symbols.length * Math.ceil((24 * 60) / config.refreshIntervalMinutes);
  if (requestsPerDay > ALPHA_VANTAGE_FREE_DAILY_LIMIT) {
    console.warn(
      `This makes ${requestsPerDay} Alpha Vantage requests a day; a free key allows ${ALPHA_VANTAGE_FREE_DAILY_LIMIT}. ` +
      'Raise REFRESH_INTERVAL_MINUTES or use fewer symbols.'
    );
  }

  let timer: NodeJS.Timeout | undefined;
  const tick = async (): Promise<void> => {
    await refresh();
    timer = setTimeout(() => void tick(), intervalMs);
  };
  process.once('SIGINT', () => {
    clearTimeout(timer);
    console.info('Stopped.');
  });
  await tick();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
