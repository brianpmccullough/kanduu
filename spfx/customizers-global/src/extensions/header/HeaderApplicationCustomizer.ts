import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  type PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import {
  type IReadonlyTheme,
  type ThemeChangedEventArgs,
  ThemeProvider
} from '@microsoft/sp-component-base';

import {
  BrowserStorageCache,
  getBrowserStorage,
  getPageTranslationLanguage,
  HeaderMenuService,
  type IHeaderMenuService,
  type IHeaderMenuServiceOptions,
  type IStockQuoteService,
  type IStockQuoteServiceOptions,
  type IUserLinksService,
  PageWatcher,
  StaticUserLinksService,
  StockQuoteService
} from '@kanduu/spfx-shared';

import * as strings from 'HeaderApplicationCustomizerStrings';
import HeaderBanner from './components/HeaderBanner';
import type { IHeaderBannerProps } from './components/IHeaderBannerProps';
import { getSampleUserLinks } from './components/sampleUserLinks';

const LOG_SOURCE: string = 'HeaderApplicationCustomizer';

/** ClientSideComponentProperties for the header (set in /scripts/config/header.*.json). */
export interface IHeaderApplicationCustomizerProperties {
  /**
   * Menu JSON location (defaults to header-menu.json in the "Header Menu" library on the current site)
   * and how long browsers cache it.
   */
  headerMenu?: IHeaderMenuServiceOptions;
  /** Stock ticker list location; defaults to the "Stock Ticker" list on the current site. */
  stockTicker?: IStockQuoteServiceOptions;
}

/** Renders the themed React header banner into the page's Top placeholder. */
export default class HeaderApplicationCustomizer
  extends BaseApplicationCustomizer<IHeaderApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _themeProvider: ThemeProvider | undefined;
  private _pageWatcher: PageWatcher | undefined;
  private _theme: IReadonlyTheme | undefined;
  private _headerMenuService!: IHeaderMenuService;
  private _stockQuoteService!: IStockQuoteService;
  private _userLinksService!: IUserLinksService;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this._theme = this._themeProvider.tryGetTheme();
    this._themeProvider.themeChangedEvent.add(this, this._onThemeChanged);

    // One cache for the extension's data; entries share the "kanduu:" prefix in localStorage.
    const cache = new BrowserStorageCache(getBrowserStorage('local'));
    cache.purgeExpired();
    this._headerMenuService = new HeaderMenuService(this.context, this.properties.headerMenu, cache);
    this._stockQuoteService = new StockQuoteService(this.context, this.properties.stockTicker);
    // Sample links until users can personalize them (stored per user in OneDrive).
    this._userLinksService = new StaticUserLinksService(getSampleUserLinks());

    this.context.placeholderProvider.changedEvent.add(this, this._render);
    // The header stays loaded across page changes, and each page can be a different translation.
    // navigatedEvent misses some page changes (search queries, new pages), so watch the URL too.
    this._pageWatcher = new PageWatcher({ navigatedEvent: this.context.application.navigatedEvent });
    this._pageWatcher.changedEvent.add(this, this._render);
    this._render();

    return Promise.resolve();
  }

  public onDispose(): void {
    this._themeProvider?.themeChangedEvent.remove(this, this._onThemeChanged);
    this.context.placeholderProvider.changedEvent.remove(this, this._render);
    this._pageWatcher?.changedEvent.remove(this, this._render);
    this._pageWatcher?.dispose();
    this._unmount();
  }

  private _onThemeChanged(args: ThemeChangedEventArgs): void {
    this._theme = args.theme;
    this._render();
  }

  private _render(): void {
    if (!this._topPlaceholder) {
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top,
        { onDispose: () => this._unmount() }
      );
    }

    if (!this._topPlaceholder) {
      Log.warn(LOG_SOURCE, 'Top placeholder is not available.');
      return;
    }

    const { user, cultureInfo } = this.context.pageContext;
    // Menu text: a translated page's language first, then the user's.
    const pageLanguage = getPageTranslationLanguage(window.location.pathname);
    const menuLocales = [pageLanguage, cultureInfo.currentUICultureName].filter((locale): locale is string => !!locale);
    const element: React.ReactElement<IHeaderBannerProps> = React.createElement(HeaderBanner, {
      theme: this._theme,
      userDisplayName: user.displayName,
      userEmail: user.email,
      locale: cultureInfo.currentCultureName,
      menuLocales,
      headerMenuService: this._headerMenuService,
      stockQuoteService: this._stockQuoteService,
      userLinksService: this._userLinksService
    });

    ReactDom.render(element, this._topPlaceholder.domElement);
  }

  private _unmount(): void {
    if (this._topPlaceholder) {
      ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
      this._topPlaceholder = undefined;
    }
  }
}
