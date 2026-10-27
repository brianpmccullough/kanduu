import { getPageTranslationLanguage } from './getPageTranslationLanguage';

describe('getPageTranslationLanguage', () => {
  it.each([
    ['/sites/ourbrand/SitePages/fr/Home.aspx', 'fr'],
    ['/sites/ourbrand/SitePages/pt-BR/Home.aspx', 'pt-br'],
    ['/sites/ourbrand/sitepages/zh-cn/News.aspx', 'zh-cn'],
    ['/SitePages/es/Home.aspx', 'es']
  ])('reads the language folder of %s', (pathname: string, language: string) => {
    expect(getPageTranslationLanguage(pathname)).toBe(language);
  });

  it.each([
    ['a page in the Site Pages root', '/sites/ourbrand/SitePages/Home.aspx'],
    ['a folder that is not a language', '/sites/ourbrand/SitePages/Archive/Home.aspx'],
    ['a nested folder', '/sites/ourbrand/SitePages/fr/2026/Home.aspx'],
    ['a list view', '/sites/ourbrand/Lists/Tasks/AllItems.aspx'],
    ['a library folder', '/sites/ourbrand/Shared Documents/fr/Home.aspx']
  ])('is undefined for %s', (_label: string, pathname: string) => {
    expect(getPageTranslationLanguage(pathname)).toBeUndefined();
  });
});
