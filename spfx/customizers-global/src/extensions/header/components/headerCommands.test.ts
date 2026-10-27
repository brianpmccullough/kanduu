import { ContextualMenuItemType } from '@fluentui/react';
import { type IHeaderCommand, toCommandBarItems } from './headerCommands';

const commands: IHeaderCommand[] = [
  {
    key: 'iWantTo',
    text: 'I want to...',
    sections: [
      { key: 'pay', title: 'Pay', links: [{ key: 'paySlip', text: 'Get my pay slip', iconName: 'Money' }] },
      { key: 'help', links: [{ key: 'it', text: 'Report an IT issue', href: 'https://help.example.com', openInNewTab: true }] }
    ]
  },
  { key: 'news', text: 'News', iconName: 'News', href: 'https://example.com/news' }
];

describe('toCommandBarItems', () => {
  it('maps a link to a button without a menu', () => {
    const [, news] = toCommandBarItems(commands);
    expect(news).toMatchObject({ key: 'news', text: 'News', href: 'https://example.com/news', iconProps: { iconName: 'News' } });
    expect(news.subMenuProps).toBeUndefined();
    expect(news.target).toBeUndefined();
  });

  it('maps sections to menu sections, divided after the first', () => {
    const [iWantTo] = toCommandBarItems(commands);
    const sections = iWantTo.subMenuProps?.items ?? [];

    expect(sections.map((item) => item.itemType)).toEqual([ContextualMenuItemType.Section, ContextualMenuItemType.Section]);
    expect(sections[0].sectionProps).toMatchObject({ title: 'Pay', topDivider: false });
    expect(sections[1].sectionProps).toMatchObject({ title: undefined, topDivider: true });
    expect(sections[0].sectionProps?.items[0]).toMatchObject({ key: 'paySlip', text: 'Get my pay slip', iconProps: { iconName: 'Money' } });
    expect(sections[1].sectionProps?.items[0]).toMatchObject({ href: 'https://help.example.com', iconProps: undefined });
  });

  it('opens new-tab links safely', () => {
    const [iWantTo] = toCommandBarItems(commands);
    const link = iWantTo.subMenuProps?.items[1].sectionProps?.items[0];
    expect(link).toMatchObject({ target: '_blank', rel: 'noopener noreferrer' });
  });

  it('maps links with sections to nested submenus', () => {
    const [brands] = toCommandBarItems([{
      key: 'brands',
      text: 'Our brands',
      sections: [{
        key: 'brands',
        links: [{
          key: 'contoso',
          text: 'Contoso',
          sections: [{ key: 'contoso', title: 'Contoso', links: [{ key: 'web', text: 'Website', href: 'https://contoso.com' }] }]
        }]
      }]
    }]);
    const contoso = brands.subMenuProps?.items[0].sectionProps?.items[0];
    const nested = contoso?.subMenuProps?.items[0].sectionProps;

    expect(contoso).toMatchObject({ key: 'contoso', text: 'Contoso', href: undefined });
    expect(nested).toMatchObject({ title: 'Contoso', items: [{ key: 'web', href: 'https://contoso.com' }] });
  });

  it('shows a custom image instead of the icon', () => {
    const image = 'data:image/png;base64,iVBORw0KGgo=';
    const [item] = toCommandBarItems([{ key: 'intranet', text: 'Intranet', iconName: 'Home', image }]);
    expect(item.iconProps).toEqual({ imageProps: { src: image, alt: '', width: 16, height: 16 } });
  });

  it('applies the button styles to every top-level item', () => {
    const buttonStyles = { root: { backgroundColor: 'transparent' } };
    expect(toCommandBarItems(commands, buttonStyles).every((item) => item.buttonStyles === buttonStyles)).toBe(true);
  });
});
