import * as React from 'react';
import { createTheme, type IPartialTheme, type ITheme, Panel, PanelType, Text, ThemeProvider } from '@fluentui/react';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import type { ISharePointSearch } from '@kanduu/spfx-shared';

import * as strings from 'SearchApplicationCustomizerStrings';

export interface ISearchPanelProps {
  theme: IReadonlyTheme | undefined;
  search: ISharePointSearch;
}

/** Custom search panel shown on SharePoint search results pages; it opens again for each new search. */
const SearchPanel: React.FC<ISearchPanelProps> = ({ theme, search }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  React.useEffect(() => setIsOpen(true), [search.query, search.vertical]);

  const fluentTheme: ITheme = React.useMemo(
    () => createTheme(theme as IPartialTheme | undefined),
    [theme]
  );

  return (
    <ThemeProvider theme={fluentTheme}>
      <Panel
        isOpen={isOpen}
        isBlocking={false}
        type={PanelType.custom}
        customWidth="90vw"
        headerText={strings.PanelTitle}
        closeButtonAriaLabel={strings.CloseButtonAriaLabel}
        onDismiss={() => setIsOpen(false)}
      >
        <Text>{strings.PanelTitle}</Text>
      </Panel>
    </ThemeProvider>
  );
};

export default SearchPanel;
