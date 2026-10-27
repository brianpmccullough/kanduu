declare interface IHeaderApplicationCustomizerStrings {
  Title: string;
  BannerAriaLabel: string;
  LogoText: string;
  ActionsAriaLabel: string;
  MoreCommandsAriaLabel: string;
  StockTickerUp: string;
  StockTickerDown: string;
  StockTickerUnchanged: string;
  /** {0}: localized date and time of the current price. */
  StockTickerAsOf: string;
  SearchPlaceholder: string;
  SearchAriaLabel: string;
  SettingsLabel: string;
  ProfileAriaLabel: string;
  QuickLinksTitle: string;
  QuickLinksLoading: string;
  QuickLinksEmpty: string;
  ManageQuickLinksLabel: string;
  ManageQuickLinksAriaLabel: string;
  SampleLinkWorkday: string;
  SampleLinkNelAi: string;
  SampleLinkCrm: string;
  SampleLinkOutlook: string;
  SampleLinkTeams: string;
  SampleLinkLearning: string;
}

declare module 'HeaderApplicationCustomizerStrings' {
  const strings: IHeaderApplicationCustomizerStrings;
  export = strings;
}
