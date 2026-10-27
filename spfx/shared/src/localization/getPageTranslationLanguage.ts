/**
 * Language folder of a translated SharePoint page, or undefined.  Multilingual sites keep each
 * translation in a Site Pages folder named for its language (".../SitePages/fr/Home.aspx",
 * ".../SitePages/pt-br/Home.aspx"), so the page URL gives its language whatever the user's own
 * language is.  Adapted from the "page" mode of the PnP react-custom-localization sample.
 *
 * A normal folder can look like a language ("SitePages/hr/" for Human Resources is also Croatian),
 * so treat the result as a preference that falls back to the user's language, not as a certainty.
 */
export function getPageTranslationLanguage(pathname: string): string | undefined {
  const match = /\/sitepages\/([a-z]{2,3}(?:-[a-z0-9]{2,8})*)\/[^/]+\.aspx$/i.exec(pathname);
  return match ? match[1].toLowerCase() : undefined;
}
