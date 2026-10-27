import { spfi } from '@pnp/sp';
import type { ISPFXContext } from '@pnp/sp';

import { BrowserStorageCache } from '../storage';
import { DEFAULT_HEADER_MENU_FILE_NAME, DEFAULT_HEADER_MENU_LIBRARY_TITLE, HeaderMenuService } from './HeaderMenuService';

jest.mock('@pnp/sp', () => ({ spfi: jest.fn(), SPFx: jest.fn() }));
jest.mock('@pnp/sp/webs', () => ({}));
jest.mock('@pnp/sp/lists', () => ({}));
jest.mock('@pnp/sp/folders', () => ({}));
jest.mock('@pnp/sp/files', () => ({}));

const context = { pageContext: { web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/team' } } } as ISPFXContext;

/** Mocks the PnPJS chain: sp.web.lists.getByTitle(...).rootFolder.files.getByUrl(...).getJSON(). */
function mockFile(json: Promise<unknown>): { getByTitle: jest.Mock; getByUrl: jest.Mock } {
  const getByUrl = jest.fn().mockReturnValue({ getJSON: () => json });
  const getByTitle = jest.fn().mockReturnValue({ rootFolder: { files: { getByUrl } } });
  (spfi as jest.Mock).mockReturnValue({ using: () => ({ web: { lists: { getByTitle } } }) });
  return { getByTitle, getByUrl };
}

describe('HeaderMenuService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the default file on the current site', async () => {
    const { getByTitle, getByUrl } = mockFile(Promise.resolve({ commands: [] }));
    await new HeaderMenuService(context).getCommands(['en-US']);
    expect(spfi).toHaveBeenCalledWith('https://contoso.sharepoint.com/sites/team');
    expect(getByTitle).toHaveBeenCalledWith(DEFAULT_HEADER_MENU_LIBRARY_TITLE);
    expect(getByUrl).toHaveBeenCalledWith(DEFAULT_HEADER_MENU_FILE_NAME);
  });

  it('reads the configured file and site', async () => {
    const { getByTitle, getByUrl } = mockFile(Promise.resolve({ commands: [] }));
    await new HeaderMenuService(context, {
      siteUrl: 'https://contoso.sharepoint.com',
      libraryTitle: 'Config',
      fileName: 'menu.json'
    }).getCommands(['en-US']);
    expect(spfi).toHaveBeenCalledWith('https://contoso.sharepoint.com');
    expect(getByTitle).toHaveBeenCalledWith('Config');
    expect(getByUrl).toHaveBeenCalledWith('menu.json');
  });

  it('returns the commands localized for the locale', async () => {
    mockFile(Promise.resolve({ version: 1, commands: [{ key: 'news', text: { default: 'News', fr: 'Actualités' } }] }));
    await expect(new HeaderMenuService(context).getCommands(['fr-FR'])).resolves.toMatchObject([{ key: 'news', text: 'Actualités' }]);
  });

  it('rejects when the file cannot be read', async () => {
    mockFile(Promise.reject(new Error('Not found')));
    await expect(new HeaderMenuService(context).getCommands(['en-US'])).rejects.toThrow('Not found');
  });

  describe('with a cache', () => {
    const menu = { version: 1, commands: [{ key: 'news', text: { default: 'News', fr: 'Actualités' } }] };
    let items: Map<string, string>;
    let cache: BrowserStorageCache;

    beforeEach(() => {
      items = new Map();
      const storage = {
        get length() { return items.size; },
        key: (index: number) => Array.from(items.keys())[index] ?? null,
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => { items.set(key, value); },
        removeItem: (key: string) => { items.delete(key); },
        clear: () => items.clear()
      } as Storage;
      cache = new BrowserStorageCache(storage, { prefix: 'test:' });
    });

    it('reads the file once and localizes the cached menu for each locale', async () => {
      const { getByUrl } = mockFile(Promise.resolve(menu));
      const service = new HeaderMenuService(context, {}, cache);

      await expect(service.getCommands(['en-US'])).resolves.toMatchObject([{ text: 'News' }]);
      await expect(service.getCommands(['fr-FR'])).resolves.toMatchObject([{ text: 'Actualités' }]);
      expect(getByUrl).toHaveBeenCalledTimes(1);
      expect(Array.from(items.keys())).toEqual([
        `test:headermenu:https://contoso.sharepoint.com/sites/team|${DEFAULT_HEADER_MENU_LIBRARY_TITLE}|${DEFAULT_HEADER_MENU_FILE_NAME}`.toLowerCase()
      ]);
    });

    it('always reads the file with a cache expiry of 0', async () => {
      const { getByUrl } = mockFile(Promise.resolve(menu));
      const service = new HeaderMenuService(context, { cacheExpiryMinutes: 0 }, cache);

      await service.getCommands(['en-US']);
      await service.getCommands(['en-US']);
      expect(getByUrl).toHaveBeenCalledTimes(2);
      expect(items.size).toBe(0);
    });
  });
});
