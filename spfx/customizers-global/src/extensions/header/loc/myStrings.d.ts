declare interface IHeaderApplicationCustomizerStrings {
  Title: string;
  BannerAriaLabel: string;
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
  CommandSocials: string;
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
  MyLinksTitle: string;
  MyLinksLoading: string;
  MyLinksEmpty: string;
  MyLinksPersonalizeNote: string;
  SampleLinkOutlook: string;
  SampleLinkTeams: string;
  SampleLinkMicrosoft365: string;
  SampleLinkMyApps: string;
  SampleLinkMyAccount: string;
}

declare module 'HeaderApplicationCustomizerStrings' {
  const strings: IHeaderApplicationCustomizerStrings;
  export = strings;
}
