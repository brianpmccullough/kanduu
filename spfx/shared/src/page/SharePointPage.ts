/** What the URL says about SharePoint search on a page. */
export interface ISharePointSearch {
  /** True on a SharePoint search results page (".../_layouts/15/search.aspx"), on any site. */
  readonly isSearchPage: boolean;
  /** The search text ("q" parameter); empty when there is none or this is not a search page. */
  readonly query: string;
  /** The results tab after "search.aspx/" (e.g. "siteall", "files", "people"); undefined when none. */
  readonly vertical: string | undefined;
}

const SEARCH_PAGE_PATH = /\/_layouts\/15\/search\.aspx(?:\/([^/]+))?\/?$/i;

/**
 * A SharePoint page described by its URL.  Plain TypeScript (no SPFx context), so it can be built
 * from window.location after each navigation and tested with any URL.
 */
export class SharePointPage {
  public readonly url: URL;
  public readonly search: ISharePointSearch;

  public constructor(url: string | URL) {
    this.url = new URL(url.toString());
    this.search = SharePointPage._readSearch(this.url);
  }

  private static _readSearch(url: URL): ISharePointSearch {
    const match = SEARCH_PAGE_PATH.exec(url.pathname);
    if (!match) {
      return { isSearchPage: false, query: '', vertical: undefined };
    }
    return {
      isSearchPage: true,
      query: url.searchParams.get('q') ?? '',
      vertical: match[1] ? decodeURIComponent(match[1]).toLowerCase() : undefined
    };
  }
}
