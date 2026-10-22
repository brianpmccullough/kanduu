declare interface IHeaderApplicationCustomizerStrings {
  Title: string;
  BannerAriaLabel: string;
  ActionsAriaLabel: string;
  StockTickerPlaceholder: string;
  StockTickerAriaLabel: string;
  SearchPlaceholder: string;
  SearchAriaLabel: string;
  SettingsLabel: string;
  ProfileAriaLabel: string;
}

declare module 'HeaderApplicationCustomizerStrings' {
  const strings: IHeaderApplicationCustomizerStrings;
  export = strings;
}
