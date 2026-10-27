/**
 * Text in the menu JSON: a plain string, or translations keyed by locale (e.g. "fr-fr" or "fr")
 * with a required "default" used when no translation matches.
 */
export type LocalizedText = string | ({ default: string } & Record<string, string>);

/** A link or submenu as stored in the menu JSON. */
export interface IHeaderMenuLinkDefinition {
  key: string;
  text: LocalizedText;
  /** Fluent UI icon name (including the header's registered Brand* icons). */
  iconName?: string;
  /** Custom image as a base64 data URI (data:image/png;base64,...); takes precedence over iconName. */
  image?: string;
  href?: string;
  openInNewTab?: boolean;
  sections?: IHeaderMenuSectionDefinition[];
}

/** A group of links as stored in the menu JSON. */
export interface IHeaderMenuSectionDefinition {
  key: string;
  title?: LocalizedText;
  links: IHeaderMenuLinkDefinition[];
}

/** The menu JSON file: header commands in display order. */
export interface IHeaderMenuDefinition {
  version: 1;
  commands: IHeaderMenuLinkDefinition[];
}

/** A destination in a header menu, or a submenu when it has sections, with text for one locale. */
export interface IHeaderMenuLink {
  key: string;
  text: string;
  iconName?: string;
  /** Custom image (base64 data URI); shown instead of iconName. */
  image?: string;
  /** Where the link goes.  Omitted for stubs, which do nothing yet. */
  href?: string;
  /** Open the link in a new tab (e.g. external sites). */
  openInNewTab?: boolean;
  /** Groups of links shown in a submenu. */
  sections?: IHeaderMenuSection[];
}

/** A group of links in a header menu, with an optional heading. */
export interface IHeaderMenuSection {
  key: string;
  title?: string;
  links: IHeaderMenuLink[];
}
