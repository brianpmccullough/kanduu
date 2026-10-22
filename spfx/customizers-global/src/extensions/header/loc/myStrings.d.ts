declare interface IHeaderApplicationCustomizerStrings {
  Title: string;
  BannerAriaLabel: string;
  ActionsAriaLabel: string;
  StockTickerUp: string;
  StockTickerDown: string;
  StockTickerUnchanged: string;
  /** {0}: localized date and time of the current price. */
  StockTickerAsOf: string;
  SearchPlaceholder: string;
  SearchAriaLabel: string;
  SettingsLabel: string;
  ProfileAriaLabel: string;
}

declare module 'HeaderApplicationCustomizerStrings' {
  const strings: IHeaderApplicationCustomizerStrings;
  export = strings;
}
