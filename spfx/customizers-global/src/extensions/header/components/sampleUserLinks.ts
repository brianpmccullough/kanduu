import type { IUserLink } from '@kanduu/spfx-shared';
import * as strings from 'HeaderApplicationCustomizerStrings';

/** Sample "My links" for the profile card until users can personalize their own. */
export function getSampleUserLinks(): IUserLink[] {
  return [
    { key: 'outlook', title: strings.SampleLinkOutlook, url: 'https://outlook.office.com/mail/' },
    { key: 'teams', title: strings.SampleLinkTeams, url: 'https://teams.microsoft.com/' },
    { key: 'microsoft365', title: strings.SampleLinkMicrosoft365, url: 'https://www.microsoft365.com/' },
    { key: 'myApps', title: strings.SampleLinkMyApps, url: 'https://myapps.microsoft.com/' },
    { key: 'myAccount', title: strings.SampleLinkMyAccount, url: 'https://myaccount.microsoft.com/' }
  ];
}
