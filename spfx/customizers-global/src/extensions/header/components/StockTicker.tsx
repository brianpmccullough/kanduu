import * as React from 'react';
import { Log } from '@microsoft/sp-core-library';
import { hiddenContentStyle, Icon, mergeStyles, TooltipHost, useTheme } from '@fluentui/react';
import {
  getStockQuoteChange,
  type IStockQuote,
  type IStockQuoteService,
  type StockQuoteDirection
} from '@kanduu/spfx-shared';

import * as strings from 'HeaderApplicationCustomizerStrings';
import styles from './HeaderBanner.module.scss';
import { formatAsOf, formatPercentChange, formatPrice, formatString } from './stockTickerFormat';

const LOG_SOURCE: string = 'StockTicker';
const hiddenClassName: string = mergeStyles(hiddenContentStyle);

const directionIcons: Record<StockQuoteDirection, string> = {
  up: 'CaretSolidUp',
  down: 'CaretSolidDown',
  unchanged: 'Remove'
};

const directionLabels: Record<StockQuoteDirection, string> = {
  up: strings.StockTickerUp,
  down: strings.StockTickerDown,
  unchanged: strings.StockTickerUnchanged
};

export interface IStockTickerProps {
  stockQuoteService: IStockQuoteService;
  /** Culture for number and date formatting, e.g. "en-US". */
  locale: string | undefined;
}

/**
 * Shows the first quote from the stock ticker list: ticker, current price and a direction
 * indicator.  Hover or focus shows the percent change and when the price was last updated.
 * Renders nothing while loading or when no quote is available.
 */
const StockTicker: React.FC<IStockTickerProps> = ({ stockQuoteService, locale }) => {
  const theme = useTheme();
  const [quote, setQuote] = React.useState<IStockQuote | undefined>(undefined);

  React.useEffect(() => {
    let isMounted = true;
    stockQuoteService.getFirstQuote()
      .then((result) => { if (isMounted) { setQuote(result); } })
      .catch((error: Error) => Log.warn(LOG_SOURCE, `Unable to load stock quote: ${error.message}`));
    return () => { isMounted = false; };
  }, [stockQuoteService]);

  if (!quote) {
    return null;
  }

  const { direction, percentChange } = getStockQuoteChange(quote);
  const price = formatPrice(quote.currentPrice, locale);
  const percent = percentChange === undefined ? undefined : formatPercentChange(percentChange, locale);
  const asOf = quote.currentPriceAsOf
    ? formatString(strings.StockTickerAsOf, formatAsOf(quote.currentPriceAsOf, locale))
    : undefined;

  const tooltip = [percent, asOf].filter(Boolean).join(' · ');
  const description = [
    `${quote.ticker} ${price}`,
    percent ? `${directionLabels[direction]} ${percent}` : directionLabels[direction],
    asOf
  ].filter(Boolean).join(', ');

  const iconColor = direction === 'up'
    ? theme.semanticColors.successIcon
    : direction === 'down' ? theme.semanticColors.errorIcon : theme.semanticColors.bodySubtext;

  return (
    <TooltipHost content={tooltip || undefined}>
      <span className={styles.ticker} tabIndex={0}>
        <span className={styles.tickerContent} aria-hidden="true">
          <span className={styles.tickerSymbol}>{quote.ticker}</span>
          <span>{price}</span>
          <span
            className={styles.tickerTrend}
            style={{ backgroundColor: theme.semanticColors.bodyBackground, color: iconColor }}
          >
            <Icon iconName={directionIcons[direction]} />
          </span>
        </span>
        <span className={hiddenClassName}>{description}</span>
      </span>
    </TooltipHost>
  );
};

export default StockTicker;
