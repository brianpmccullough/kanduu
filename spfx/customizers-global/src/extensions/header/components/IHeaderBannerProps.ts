import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import type { IHeaderMenuService, IStockQuoteService, IUserLinksService } from '@kanduu/spfx-shared';

export interface IHeaderBannerProps {
  /** Current SPFx site theme; undefined until a theme is available. */
  theme: IReadonlyTheme | undefined;
  userDisplayName: string;
  userEmail: string;
  /** Culture for number and date formatting, e.g. "en-US". */
  locale: string | undefined;
  /** Languages for menu text in preference order, e.g. ["fr", "en-US"] (the page's, then the user's). */
  menuLocales: string[];
  /** Commands shown in the banner. */
  headerMenuService: IHeaderMenuService;
  stockQuoteService: IStockQuoteService;
  /** Links shown in the profile popup. */
  userLinksService: IUserLinksService;
}
