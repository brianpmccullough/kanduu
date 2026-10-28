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
import { PageWatcher } from '@kanduu/spfx-shared';

import * as strings from 'SearchApplicationCustomizerStrings';
import SearchPanel, { type ISearchPanelProps } from './components/SearchPanel';

const LOG_SOURCE: string = 'SearchApplicationCustomizer';

/** ClientSideComponentProperties for search; none yet. */
export interface ISearchApplicationCustomizerProperties {}

/** Shows the custom search panel on SharePoint search results pages. */
export default class SearchApplicationCustomizer
  extends BaseApplicationCustomizer<ISearchApplicationCustomizerProperties> {

  private _themeProvider: ThemeProvider | undefined;
  private _pageWatcher: PageWatcher | undefined;
  private _theme: IReadonlyTheme | undefined;
  private _bottomPlaceholder: PlaceholderContent | undefined;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this._theme = this._themeProvider.tryGetTheme();
    this._themeProvider.themeChangedEvent.add(this, this._onThemeChanged);

    this.context.placeholderProvider.changedEvent.add(this, this._render);
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
    this._bottomPlaceholder = undefined;
  }

  private _onThemeChanged(args: ThemeChangedEventArgs): void {
    this._theme = args.theme;
    this._render();
  }

  private _render(): void {
    const search = this._pageWatcher?.page.search;
    if (!search?.isSearchPage) {
      this._unmount();
      return;
    }

    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Bottom,
        { onDispose: () => this._unmount() }
      );
    }

    if (!this._bottomPlaceholder) {
      Log.warn(LOG_SOURCE, 'Bottom placeholder is not available.');
      return;
    }

    // The Panel itself draws in a layer over the page; the placeholder hosts the React tree.
    const element: React.ReactElement<ISearchPanelProps> = React.createElement(SearchPanel, {
      theme: this._theme,
      search
    });
    ReactDom.render(element, this._bottomPlaceholder.domElement);
  }

  private _unmount(): void {
    if (this._bottomPlaceholder) {
      ReactDom.unmountComponentAtNode(this._bottomPlaceholder.domElement);
    }
  }
}
