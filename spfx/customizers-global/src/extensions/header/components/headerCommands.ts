import {
  ContextualMenuItemType,
  type IButtonStyles,
  type ICommandBarItemProps,
  type IContextualMenuItem
} from '@fluentui/react';

/** A destination in a header menu. */
export interface IHeaderMenuLink {
  key: string;
  text: string;
  iconName?: string;
  /** Where the link goes.  Omitted for stubs, which do nothing yet. */
  href?: string;
  /** Open the link in a new tab (e.g. external sites). */
  openInNewTab?: boolean;
}

/** A group of links in a header menu, with an optional heading. */
export interface IHeaderMenuSection {
  key: string;
  title?: string;
  links: IHeaderMenuLink[];
}

/** A top-level header command: a link, or a menu when it has sections. */
export interface IHeaderCommand extends IHeaderMenuLink {
  sections?: IHeaderMenuSection[];
}

const toMenuItem = ({ key, text, iconName, href, openInNewTab }: IHeaderMenuLink): IContextualMenuItem => ({
  key,
  text,
  href,
  target: openInNewTab ? '_blank' : undefined,
  rel: openInNewTab ? 'noopener noreferrer' : undefined,
  iconProps: iconName ? { iconName } : undefined
});

const toSectionItem = (section: IHeaderMenuSection, index: number): IContextualMenuItem => ({
  key: section.key,
  itemType: ContextualMenuItemType.Section,
  sectionProps: {
    key: section.key,
    title: section.title,
    topDivider: index > 0,
    items: section.links.map(toMenuItem)
  }
});

/** Maps header commands to Fluent CommandBar items; each section becomes a titled group in the menu. */
export function toCommandBarItems(commands: IHeaderCommand[], buttonStyles?: IButtonStyles): ICommandBarItemProps[] {
  return commands.map((command) => ({
    ...toMenuItem(command),
    buttonStyles,
    subMenuProps: command.sections?.length
      ? { items: command.sections.map(toSectionItem) }
      : undefined
  }));
}
