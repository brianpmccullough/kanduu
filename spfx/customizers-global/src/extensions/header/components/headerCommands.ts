import {
  ContextualMenuItemType,
  type IButtonStyles,
  type ICommandBarItemProps,
  type IContextualMenuItem,
  type IIconProps
} from '@fluentui/react';
import type { IHeaderMenuLink, IHeaderMenuSection } from '@kanduu/spfx-shared';

/** A top-level header command: a link, or a menu when it has sections. */
export type IHeaderCommand = IHeaderMenuLink;

/** A custom image in place of an icon; decorative, since the item's text names it. */
function toIconProps(iconName: string | undefined, image: string | undefined): IIconProps | undefined {
  if (image) {
    return { imageProps: { src: image, alt: '', width: 16, height: 16 } };
  }
  return iconName ? { iconName } : undefined;
}

function toMenuItem({ key, text, iconName, image, href, openInNewTab, sections }: IHeaderMenuLink): IContextualMenuItem {
  return {
    key,
    text,
    href,
    target: openInNewTab ? '_blank' : undefined,
    rel: openInNewTab ? 'noopener noreferrer' : undefined,
    iconProps: toIconProps(iconName, image),
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
