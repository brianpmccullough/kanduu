import type { IReadonlyTheme } from '@microsoft/sp-component-base';

export interface IHeaderBannerProps {
  /** Current SPFx site theme; undefined until a theme is available. */
  theme: IReadonlyTheme | undefined;
  userDisplayName: string;
  userEmail: string;
}
