import * as strings from 'HeaderApplicationCustomizerStrings';
import type { IHeaderCommand } from './headerCommands';

/**
 * Sample intranet commands.  Stubs: apart from Socials, no destinations yet, so the links do nothing.
 * Destinations will come from configuration once the target systems are known.
 * Socials point at Microsoft's public accounts as placeholders for the company's own.
 */
export function getDefaultHeaderCommands(): IHeaderCommand[] {
  return [
    {
      key: 'iWantTo',
      text: strings.CommandIWantTo,
      iconName: 'Lightbulb',
      sections: [
        {
          key: 'payAndTimeOff',
          title: strings.CommandSectionPayAndTimeOff,
          links: [
            { key: 'paySlip', text: strings.CommandGetPaySlip, iconName: 'Money' },
            { key: 'timeOff', text: strings.CommandRequestTimeOff, iconName: 'Vacation' },
            { key: 'expenses', text: strings.CommandSubmitExpenseReport, iconName: 'ReceiptCheck' },
            { key: 'personalDetails', text: strings.CommandUpdatePersonalDetails, iconName: 'ContactCard' }
          ]
        },
        {
          key: 'workplace',
          title: strings.CommandSectionWorkplace,
          links: [
            { key: 'bookRoom', text: strings.CommandBookMeetingRoom, iconName: 'Room' },
            { key: 'bookTravel', text: strings.CommandBookTravel, iconName: 'Airplane' },
            { key: 'findColleague', text: strings.CommandFindColleague, iconName: 'People' }
          ]
        },
        {
          key: 'support',
          title: strings.CommandSectionSupport,
          links: [
            { key: 'itIssue', text: strings.CommandReportItIssue, iconName: 'Repair' },
            { key: 'askHr', text: strings.CommandAskHr, iconName: 'Communications' }
          ]
        }
      ]
    },
    {
      key: 'departments',
      text: strings.CommandDepartments,
      iconName: 'Org',
      sections: [
        {
          key: 'departments',
          links: [
            { key: 'hr', text: strings.CommandDepartmentHr, iconName: 'Group' },
            { key: 'finance', text: strings.CommandDepartmentFinance, iconName: 'Bank' },
            { key: 'it', text: strings.CommandDepartmentIt, iconName: 'Processing' },
            { key: 'facilities', text: strings.CommandDepartmentFacilities, iconName: 'CityNext' }
          ]
        }
      ]
    },
    { key: 'news', text: strings.CommandNews, iconName: 'News' },
    {
      key: 'socials',
      text: strings.CommandSocials,
      iconName: 'Share',
      sections: [
        {
          key: 'socials',
          links: [
            { key: 'linkedIn', text: strings.SocialLinkedIn, iconName: 'BrandLinkedIn', href: 'https://www.linkedin.com/company/microsoft/', openInNewTab: true },
            { key: 'youTube', text: strings.SocialYouTube, iconName: 'BrandYouTube', href: 'https://www.youtube.com/@Microsoft', openInNewTab: true },
            { key: 'facebook', text: strings.SocialFacebook, iconName: 'BrandFacebook', href: 'https://www.facebook.com/Microsoft', openInNewTab: true },
            { key: 'instagram', text: strings.SocialInstagram, iconName: 'BrandInstagram', href: 'https://www.instagram.com/microsoft/', openInNewTab: true },
            { key: 'x', text: strings.SocialX, iconName: 'BrandX', href: 'https://x.com/Microsoft', openInNewTab: true }
          ]
        },
        {
          key: 'website',
          links: [
            { key: 'website', text: strings.SocialWebsite, iconName: 'Globe', href: 'https://www.microsoft.com/', openInNewTab: true }
          ]
        }
      ]
    }
  ];
}
