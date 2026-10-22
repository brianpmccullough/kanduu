/**
 * Local host.  `--once` refreshes once and exits (exit code 1 if any symbol failed);
 * otherwise it refreshes every REFRESH_INTERVAL_MINUTES until stopped with Ctrl+C.
 */
import { createStockQuoteRefresh, loadConfig } from '../index';

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
