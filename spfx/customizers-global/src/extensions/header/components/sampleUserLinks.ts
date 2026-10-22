import type { IUserLink } from '@kanduu/spfx-shared';
import * as strings from 'HeaderApplicationCustomizerStrings';

/**
 * Sample quick links for the profile card until users can personalize their own.  Internal tools
 * (nelAI, CRM, Learning) point at placeholder addresses.
 */
export function getSampleUserLinks(): IUserLink[] {
  return [
    { key: 'workday', title: strings.SampleLinkWorkday, url: 'https://www.myworkday.com/', iconName: 'Work' },
    { key: 'nelAi', title: strings.SampleLinkNelAi, url: 'https://nelai.example.com/', iconName: 'ChatBot' },
    { key: 'crm', title: strings.SampleLinkCrm, url: 'https://crm.example.com/', iconName: 'CRMReport' },
    { key: 'outlook', title: strings.SampleLinkOutlook, url: 'https://outlook.office.com/mail/', iconName: 'OutlookLogo' },
    { key: 'teams', title: strings.SampleLinkTeams, url: 'https://teams.microsoft.com/', iconName: 'TeamsLogo' },
    { key: 'learning', title: strings.SampleLinkLearning, url: 'https://learning.example.com/', iconName: 'Education' }
  ];
}
