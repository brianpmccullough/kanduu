import { spfi, SPFx, type ISPFXContext, type SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/folders';
import '@pnp/sp/files';

import type { IStorageCache } from '../storage';
import type { IHeaderMenuLink } from './IHeaderMenu';
import type { IHeaderMenuService } from './IHeaderMenuService';
import { localizeHeaderMenu } from './localizeHeaderMenu';

export const DEFAULT_HEADER_MENU_LIBRARY_TITLE = 'Header Menu';
export const DEFAULT_HEADER_MENU_FILE_NAME = 'header-menu.json';

export interface IHeaderMenuServiceOptions {
  /** Site that hosts the library; defaults to the current site. */
  siteUrl?: string;
  /** Document library title; defaults to DEFAULT_HEADER_MENU_LIBRARY_TITLE. */
  libraryTitle?: string;
  /** File in the library's root folder; defaults to DEFAULT_HEADER_MENU_FILE_NAME. */
  fileName?: string;
  /** How long the cache keeps the menu; the cache's default (60) when omitted, 0 to always read the file. */
  cacheExpiryMinutes?: number;
}

/**
 * Reads the header menu JSON from a SharePoint document library with PnPJS.  With a cache, the raw JSON
 * is kept (for every locale) under a key naming its site, library and file, so edits to the file show
 * once the cached copy expires.
 */
export class HeaderMenuService implements IHeaderMenuService {
  private readonly _sp: SPFI;
  private readonly _libraryTitle: string;
  private readonly _fileName: string;
  private readonly _cacheKey: string;

  public constructor(
    context: ISPFXContext,
    private readonly _options: IHeaderMenuServiceOptions = {},
    private readonly _cache?: IStorageCache
  ) {
    const siteUrl = _options.siteUrl || context.pageContext.web.absoluteUrl;
    this._sp = spfi(siteUrl).using(SPFx(context));
    this._libraryTitle = _options.libraryTitle || DEFAULT_HEADER_MENU_LIBRARY_TITLE;
    this._fileName = _options.fileName || DEFAULT_HEADER_MENU_FILE_NAME;
    this._cacheKey = `headerMenu:${siteUrl}|${this._libraryTitle}|${this._fileName}`.toLowerCase();
  }

  public async getCommands(locales: readonly string[]): Promise<IHeaderMenuLink[]> {
    const menu: unknown = this._cache
      ? await this._cache.getOrLoad(this._cacheKey, () => this._readMenu(), this._options.cacheExpiryMinutes)
      : await this._readMenu();
    return localizeHeaderMenu(menu, locales);
  }

  private _readMenu(): Promise<unknown> {
    return this._sp.web.lists
      .getByTitle(this._libraryTitle)
      .rootFolder.files.getByUrl(this._fileName)
      .getJSON();
  }
}
