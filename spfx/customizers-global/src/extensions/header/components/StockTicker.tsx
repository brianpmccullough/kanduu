import * as React from 'react';

import * as strings from 'HeaderApplicationCustomizerStrings';

export interface IStockTickerProps {
  className?: string;
}

/** Placeholder for a stock ticker.  No data source yet. */
const StockTicker: React.FC<IStockTickerProps> = ({ className }) => (
  <span className={className} role="status" aria-label={strings.StockTickerAriaLabel}>
    {strings.StockTickerPlaceholder}
  </span>
);

export default StockTicker;
