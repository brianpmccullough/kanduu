import * as React from 'react';
import {
  CommandBar,
  createTheme,
  type IButtonStyles,
  type ICommandBarItemProps,
  IconButton,
  initializeIcons,
  type IPartialTheme,
  type ITheme,
  SearchBox,
  ThemeProvider
} from '@fluentui/react';

import * as strings from 'HeaderApplicationCustomizerStrings';
import { getDefaultHeaderCommands } from './defaultHeaderCommands';
import styles from './HeaderBanner.module.scss';
import { toCommandBarItems } from './headerCommands';
import type { IHeaderBannerProps } from './IHeaderBannerProps';
import ProfileButton from './ProfileButton';
import StockTicker from './StockTicker';

initializeIcons();

/**
 * Themed banner for the page header.  Wrapped in a Fluent ThemeProvider built from the
 * SPFx site theme so any menus, panels and dialogs added here pick up the site theme.
 */
const HeaderBanner: React.FC<IHeaderBannerProps> = ({
  theme, userDisplayName, userEmail, locale, stockQuoteService, userLinksService
}) => {
  const fluentTheme: ITheme = React.useMemo(
    () => createTheme(theme as IPartialTheme | undefined),
    [theme]
  );

  const { primaryButtonBackground, primaryButtonText } = fluentTheme.semanticColors;
  const { themeDark, themeDarker } = fluentTheme.palette;
  const bannerStyle: React.CSSProperties = {
    backgroundColor: primaryButtonBackground,
    color: primaryButtonText
  };
  const iconStyles = {
    root: { color: primaryButtonText },
    rootHovered: { color: primaryButtonText, backgroundColor: themeDark },
    rootPressed: { color: primaryButtonText, backgroundColor: themeDarker }
  };

  const commandItems: ICommandBarItemProps[] = React.useMemo(() => {
    const onBanner = { color: primaryButtonText };
    const buttonStyles: IButtonStyles = {
      root: { ...onBanner, backgroundColor: 'transparent' },
      rootHovered: { ...onBanner, backgroundColor: themeDark },
      rootPressed: { ...onBanner, backgroundColor: themeDarker },
      rootExpanded: { ...onBanner, backgroundColor: themeDarker },
      rootExpandedHovered: { ...onBanner, backgroundColor: themeDarker },
      rootFocused: onBanner,
      icon: onBanner,
      iconHovered: onBanner,
      iconPressed: onBanner,
      iconExpanded: onBanner,
      menuIcon: onBanner,
      menuIconHovered: onBanner,
      menuIconPressed: onBanner,
      menuIconExpanded: onBanner
    };
    return toCommandBarItems(getDefaultHeaderCommands(), buttonStyles);
  }, [primaryButtonText, themeDark, themeDarker]);

  return (
    <ThemeProvider theme={fluentTheme}>
      <header className={styles.headerBanner} style={bannerStyle} aria-label={strings.BannerAriaLabel}>
        <div className={styles.actions}>
          <CommandBar
            items={commandItems}
            ariaLabel={strings.ActionsAriaLabel}
            overflowButtonProps={{ ariaLabel: strings.MoreCommandsAriaLabel, styles: iconStyles }}
            styles={{ root: { backgroundColor: 'transparent', padding: 0 } }}
          />
        </div>
        <div className={styles.utilities}>
          <StockTicker stockQuoteService={stockQuoteService} locale={locale} />
          <SearchBox
            className={styles.search}
            placeholder={strings.SearchPlaceholder}
            ariaLabel={strings.SearchAriaLabel}
            onSearch={() => { /* stub: search not implemented yet */ }}
          />
          <IconButton
            iconProps={{ iconName: 'Settings' }}
            title={strings.SettingsLabel}
            ariaLabel={strings.SettingsLabel}
            styles={iconStyles}
            onClick={() => { /* stub: settings not implemented yet */ }}
          />
          <ProfileButton
            userDisplayName={userDisplayName}
            userEmail={userEmail}
            userLinksService={userLinksService}
            hoverBackgroundColor={themeDark}
          />
        </div>
      </header>
    </ThemeProvider>
  );
};

export default HeaderBanner;
