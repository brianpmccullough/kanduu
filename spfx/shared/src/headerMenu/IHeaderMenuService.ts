import type { IHeaderMenuLink } from './IHeaderMenu';

export interface IHeaderMenuService {
  /**
   * Header commands with text for the first of the locales (in preference order, e.g. the page's
   * language then the user's) that has a translation.  Rejects when the menu file cannot be read.
   */
  getCommands(locales: readonly string[]): Promise<IHeaderMenuLink[]>;
}
