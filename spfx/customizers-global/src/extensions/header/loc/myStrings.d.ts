declare interface IHeaderApplicationCustomizerStrings {
  Title: string;
  BannerAriaLabel: string;
  LogoText: string;
  ActionsAriaLabel: string;
  MoreCommandsAriaLabel: string;
  CommandIWantTo: string;
  CommandSectionPayAndTimeOff: string;
  CommandGetPaySlip: string;
  CommandRequestTimeOff: string;
  CommandSubmitExpenseReport: string;
  CommandUpdatePersonalDetails: string;
  CommandSectionWorkplace: string;
  CommandBookMeetingRoom: string;
  CommandBookTravel: string;
  CommandFindColleague: string;
  CommandSectionSupport: string;
  CommandReportItIssue: string;
  CommandAskHr: string;
  CommandDepartments: string;
  CommandDepartmentHr: string;
  CommandDepartmentFinance: string;
  CommandDepartmentIt: string;
  CommandDepartmentFacilities: string;
  CommandNews: string;
  CommandOurBrands: string;
  BrandMicrosoft: string;
  BrandXbox: string;
  BrandLinkedIn: string;
  BrandMicrosoft365: string;
  BrandAzure: string;
  BrandCopilot: string;
  SocialLinkedIn: string;
  SocialYouTube: string;
  SocialFacebook: string;
  SocialInstagram: string;
  SocialX: string;
  SocialWebsite: string;
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
