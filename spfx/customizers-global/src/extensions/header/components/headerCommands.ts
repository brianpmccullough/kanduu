import {
  ContextualMenuItemType,
  type IButtonStyles,
  type ICommandBarItemProps,
  type IContextualMenuItem
} from '@fluentui/react';

/** A destination in a header menu, or a submenu when it has sections. */
export interface IHeaderMenuLink {
  key: string;
  text: string;
  iconName?: string;
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

/** A top-level header command: a link, or a menu when it has sections. */
export type IHeaderCommand = IHeaderMenuLink;

function toMenuItem({ key, text, iconName, href, openInNewTab, sections }: IHeaderMenuLink): IContextualMenuItem {
  return {
    key,
    text,
    href,
    target: openInNewTab ? '_blank' : undefined,
    rel: openInNewTab ? 'noopener noreferrer' : undefined,
    iconProps: iconName ? { iconName } : undefined,
    subMenuProps: sections?.length ? { items: sections.map(toSectionItem) } : undefined
  };
}

function toSectionItem(section: IHeaderMenuSection, index: number): IContextualMenuItem {
  return {
    key: section.key,
    itemType: ContextualMenuItemType.Section,
    sectionProps: {
      key: section.key,
      title: section.title,
      topDivider: index > 0,
      items: section.links.map(toMenuItem)
    }
  };
}

/**
 * Maps header commands to Fluent CommandBar items.  Each section becomes a titled group in the menu,
 * and links with sections become nested submenus.
 */
export function toCommandBarItems(commands: IHeaderCommand[], buttonStyles?: IButtonStyles): ICommandBarItemProps[] {
  return commands.map((command) => ({ ...toMenuItem(command), buttonStyles }));
}
