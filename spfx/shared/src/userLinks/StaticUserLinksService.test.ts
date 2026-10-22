import { StaticUserLinksService } from './StaticUserLinksService';

const links = [
  { key: 'outlook', title: 'Outlook', url: 'https://outlook.office.com/mail/', iconName: 'OutlookLogo' },
  { key: 'teams', title: 'Teams', url: 'https://teams.microsoft.com/' }
];

describe('StaticUserLinksService', () => {
  it('returns the links in order', async () => {
    await expect(new StaticUserLinksService(links).getLinks()).resolves.toEqual(links);
  });

  it('returns copies so callers cannot change the configured links', async () => {
    const service = new StaticUserLinksService(links);
    const first = await service.getLinks();
    first[0].title = 'Changed';
    first.pop();

    await expect(service.getLinks()).resolves.toEqual(links);
  });
});
