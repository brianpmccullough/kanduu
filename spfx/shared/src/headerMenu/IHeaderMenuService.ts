import type { IHeaderMenuLink } from './IHeaderMenu';

export interface IHeaderMenuService {
  /** Header commands with text for the locale (e.g. "fr-FR"); rejects when the menu file cannot be read. */
  getCommands(locale: string | undefined): Promise<IHeaderMenuLink[]>;
}
