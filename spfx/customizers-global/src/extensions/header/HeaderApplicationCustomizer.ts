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

import * as strings from 'HeaderApplicationCustomizerStrings';
import HeaderBanner from './components/HeaderBanner';
import type { IHeaderBannerProps } from './components/IHeaderBannerProps';

const LOG_SOURCE: string = 'HeaderApplicationCustomizer';

/**
 * ClientSideComponentProperties for the header.  None are needed yet.
 */
export interface IHeaderApplicationCustomizerProperties {}

/** Renders the themed React header banner into the page's Top placeholder. */
export default class HeaderApplicationCustomizer
  extends BaseApplicationCustomizer<IHeaderApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _themeProvider: ThemeProvider | undefined;
  private _theme: IReadonlyTheme | undefined;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this._theme = this._themeProvider.tryGetTheme();
    this._themeProvider.themeChangedEvent.add(this, this._onThemeChanged);

    this.context.placeholderProvider.changedEvent.add(this, this._render);
    this._render();

    return Promise.resolve();
  }

  public onDispose(): void {
    this._themeProvider?.themeChangedEvent.remove(this, this._onThemeChanged);
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

    const { user } = this.context.pageContext;
    const element: React.ReactElement<IHeaderBannerProps> = React.createElement(HeaderBanner, {
      theme: this._theme,
      userDisplayName: user.displayName,
      userEmail: user.email
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
