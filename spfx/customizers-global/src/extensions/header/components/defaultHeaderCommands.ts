import * as strings from 'HeaderApplicationCustomizerStrings';
import type { IHeaderCommand, IHeaderMenuLink } from './headerCommands';

type SocialNetwork = 'linkedIn' | 'youTube' | 'facebook' | 'instagram' | 'x';

/** Social networks in menu order. */
const socialNetworks: { network: SocialNetwork; text: string; iconName: string }[] = [
  { network: 'linkedIn', text: strings.SocialLinkedIn, iconName: 'BrandLinkedIn' },
  { network: 'youTube', text: strings.SocialYouTube, iconName: 'BrandYouTube' },
  { network: 'facebook', text: strings.SocialFacebook, iconName: 'BrandFacebook' },
  { network: 'instagram', text: strings.SocialInstagram, iconName: 'BrandInstagram' },
  { network: 'x', text: strings.SocialX, iconName: 'BrandX' }
];

/** A brand's submenu: its social accounts under the brand name, then its public website. */
function brand(
  key: string,
  name: string,
  website: string,
  accounts: Partial<Record<SocialNetwork, string>>
): IHeaderMenuLink {
  return {
    key,
    text: name,
    sections: [
      {
        key: `${key}Socials`,
        title: name,
        links: socialNetworks
          .filter(({ network }) => accounts[network])
          .map(({ network, text, iconName }) => ({
            key: `${key}-${network}`,
            text,
            iconName,
            href: accounts[network],
            openInNewTab: true
          }))
      },
      {
        key: `${key}Website`,
        links: [{ key: `${key}-website`, text: strings.SocialWebsite, iconName: 'Globe', href: website, openInNewTab: true }]
      }
    ]
  };
}

/**
 * Sample intranet commands.  Stubs: apart from Our brands, no destinations yet, so the links do nothing.
 * Destinations will come from configuration once the target systems are known.
 * Our brands lists Microsoft brands' public accounts as placeholders for the company's own.
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
      key: 'ourBrands',
      text: strings.CommandOurBrands,
      iconName: 'Tag',
      sections: [
        {
          key: 'brands',
          links: [
            brand('microsoft', strings.BrandMicrosoft, 'https://www.microsoft.com/', {
              linkedIn: 'https://www.linkedin.com/company/microsoft/',
              youTube: 'https://www.youtube.com/@Microsoft',
              facebook: 'https://www.facebook.com/Microsoft',
              instagram: 'https://www.instagram.com/microsoft/',
              x: 'https://x.com/Microsoft'
            }),
            brand('xbox', strings.BrandXbox, 'https://www.xbox.com/', {
              linkedIn: 'https://www.linkedin.com/company/xbox/',
              youTube: 'https://www.youtube.com/@Xbox',
              facebook: 'https://www.facebook.com/Xbox',
              instagram: 'https://www.instagram.com/xbox/',
              x: 'https://x.com/Xbox'
            }),
            brand('linkedIn', strings.BrandLinkedIn, 'https://www.linkedin.com/', {
              linkedIn: 'https://www.linkedin.com/company/linkedin/',
              youTube: 'https://www.youtube.com/@LinkedIn',
              facebook: 'https://www.facebook.com/LinkedIn',
              instagram: 'https://www.instagram.com/linkedin/',
              x: 'https://x.com/LinkedIn'
            }),
            brand('microsoft365', strings.BrandMicrosoft365, 'https://www.microsoft.com/microsoft-365', {
              facebook: 'https://www.facebook.com/Microsoft365',
              instagram: 'https://www.instagram.com/microsoft365/',
              x: 'https://x.com/Microsoft365'
            }),
            brand('azure', strings.BrandAzure, 'https://azure.microsoft.com/', {
              linkedIn: 'https://www.linkedin.com/showcase/microsoft-azure/',
              youTube: 'https://www.youtube.com/@MicrosoftAzure',
              facebook: 'https://www.facebook.com/microsoftazure',
              x: 'https://x.com/Azure'
            }),
            brand('copilot', strings.BrandCopilot, 'https://copilot.microsoft.com/', {
              linkedIn: 'https://www.linkedin.com/showcase/microsoftcopilot/'
            })
          ]
        }
      ]
    }
  ];
}
