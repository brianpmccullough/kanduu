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

  it('applies the button styles to every top-level item', () => {
    const buttonStyles = { root: { backgroundColor: 'transparent' } };
    expect(toCommandBarItems(commands, buttonStyles).every((item) => item.buttonStyles === buttonStyles)).toBe(true);
  });
});
