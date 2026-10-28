import { SharePointPage } from './SharePointPage';

describe('SharePointPage', () => {
  describe('search', () => {
    it.each([
      ['tenant search', 'https://contoso.sharepoint.com/_layouts/15/search.aspx/siteall?q=budget', 'budget', 'siteall'],
      ['site search', 'https://contoso.sharepoint.com/sites/team/_layouts/15/search.aspx/files?q=q3%20report', 'q3 report', 'files'],
      ['no vertical', 'https://contoso.sharepoint.com/_layouts/15/Search.aspx?q=budget', 'budget', undefined],
      ['no query', 'https://contoso.sharepoint.com/_layouts/15/search.aspx/people', '', 'people'],
      ['trailing slash', 'https://contoso.sharepoint.com/_layouts/15/search.aspx/SiteAll/?q=a', 'a', 'siteall']
    ])('reads %s', (_label: string, url: string, query: string, vertical: string | undefined) => {
      expect(new SharePointPage(url).search).toEqual({ isSearchPage: true, query, vertical });
    });

    it.each([
      ['a site page', 'https://contoso.sharepoint.com/sites/team/SitePages/Home.aspx?q=budget'],
      ['a page named search', 'https://contoso.sharepoint.com/sites/team/SitePages/search.aspx'],
      ['another layouts page', 'https://contoso.sharepoint.com/_layouts/15/viewlsts.aspx'],
      ['a nested path', 'https://contoso.sharepoint.com/_layouts/15/search.aspx/siteall/more?q=a']
    ])('is not a search page for %s', (_label: string, url: string) => {
      expect(new SharePointPage(url).search).toEqual({ isSearchPage: false, query: '', vertical: undefined });
    });
  });

  it('keeps the URL', () => {
    expect(new SharePointPage('https://contoso.sharepoint.com/sites/team').url.hostname).toBe('contoso.sharepoint.com');
  });
});
