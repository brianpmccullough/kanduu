import { localizeHeaderMenu, resolveLocalizedText } from './localizeHeaderMenu';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('resolveLocalizedText', () => {
  const text = { default: 'News', fr: 'Actualités', 'fr-CA': 'Nouvelles', 'de-de': 'Neuigkeiten' };

  it('returns plain strings for every locale', () => {
    expect(resolveLocalizedText('News', 'fr-FR')).toBe('News');
  });

  it('prefers an exact locale match, ignoring case', () => {
    expect(resolveLocalizedText(text, 'fr-ca')).toBe('Nouvelles');
  });

  it('falls back to the language', () => {
    expect(resolveLocalizedText(text, 'fr-FR')).toBe('Actualités');
  });

  it('falls back to another region of the language', () => {
    expect(resolveLocalizedText(text, 'de-AT')).toBe('Neuigkeiten');
  });

  it('falls back to default', () => {
    expect(resolveLocalizedText(text, 'es-ES')).toBe('News');
    expect(resolveLocalizedText(text, undefined)).toBe('News');
  });

  it('is undefined without usable text', () => {
    expect(resolveLocalizedText('', 'en-US')).toBeUndefined();
    expect(resolveLocalizedText({ fr: 'Actualités' }, 'en-US')).toBeUndefined();
    expect(resolveLocalizedText(42, 'en-US')).toBeUndefined();
  });
});

describe('localizeHeaderMenu', () => {
  const menu = {
    version: 1,
    commands: [
      {
        key: 'news',
        text: { default: 'News', fr: 'Actualités' },
        iconName: 'News',
        sections: [
          {
            key: 'all',
            title: { default: 'All news', fr: 'Toutes' },
            links: [
              { key: 'latest', text: 'Latest', href: 'https://example.com/news', openInNewTab: true, image: PNG },
              { key: 'noText' },
              { text: 'No key' }
            ]
          }
        ]
      },
      { key: 'help', text: 'Help', image: 'https://example.com/tracker.png', sections: [] }
    ]
  };

  it('localizes text and section titles', () => {
    const [news] = localizeHeaderMenu(menu, 'fr-FR');
    expect(news.text).toBe('Actualités');
    expect(news.sections?.[0].title).toBe('Toutes');
  });

  it('maps links and leaves out entries without a key or text', () => {
    const [news] = localizeHeaderMenu(menu, 'en-US');
    expect(news).toMatchObject({ key: 'news', text: 'News', iconName: 'News' });
    expect(news.sections?.[0].links).toEqual([
      { key: 'latest', text: 'Latest', iconName: undefined, image: PNG, href: 'https://example.com/news', openInNewTab: true, sections: undefined }
    ]);
  });

  it('ignores images that are not base64 image data URIs, and empty sections', () => {
    const [, help] = localizeHeaderMenu(menu, 'en-US');
    expect(help.image).toBeUndefined();
    expect(help.sections).toBeUndefined();
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['no commands', { version: 1 }]
  ])('returns no commands for %s', (_label: string, value: unknown) => {
    expect(localizeHeaderMenu(value, 'en-US')).toEqual([]);
  });
});
