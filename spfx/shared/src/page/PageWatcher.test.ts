import { type INavigatedEventSource, type PageChangedEventArgs, PageWatcher } from './PageWatcher';

type FakeWindow = EventTarget & { location: { href: string }; history: History; navigation?: EventTarget };

const HOME = 'https://contoso.sharepoint.com/SitePages/Home.aspx';
const NEWS = 'https://contoso.sharepoint.com/SitePages/News.aspx';
const ABOUT = 'https://contoso.sharepoint.com/SitePages/About.aspx';

/** A window with a location, a history that changes it, and optionally the Navigation API. */
function createWindow(withNavigation: boolean): FakeWindow {
  const win = new EventTarget() as FakeWindow;
  win.location = { href: HOME };
  const navigate = (_state: unknown, _title: string, url?: string | URL | null): void => {
    win.location.href = String(url);
    win.navigation?.dispatchEvent(new Event('currententrychange'));
  };
  win.history = { pushState: navigate, replaceState: navigate } as unknown as History;
  if (withNavigation) {
    win.navigation = new EventTarget();
  }
  return win;
}

function createNavigatedEvent(): INavigatedEventSource & { raise(): void } {
  const handlers = new Set<() => void>();
  return {
    add: (_observer, handler) => handlers.add(handler),
    remove: (_observer, handler) => handlers.delete(handler),
    raise: () => handlers.forEach((handler) => handler())
  };
}

function watch(win: FakeWindow, options: { navigatedEvent?: INavigatedEventSource; delayMs?: number } = {}): {
  watcher: PageWatcher;
  handler: jest.Mock;
} {
  const watcher = new PageWatcher({ ...options, window: win as unknown as Window });
  const handler = jest.fn();
  watcher.changedEvent.add({}, handler);
  return { watcher, handler };
}

describe('PageWatcher', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe.each([
    ['the Navigation API', true],
    ['the history API', false]
  ])('with %s', (_label: string, withNavigation: boolean) => {
    it('raises changedEvent once the URL settles', () => {
      const win = createWindow(withNavigation);
      const { handler } = watch(win);

      win.history.pushState(null, '', 'https://contoso.sharepoint.com/_layouts/15/search.aspx/siteall?q=a');
      win.history.replaceState(null, '', 'https://contoso.sharepoint.com/_layouts/15/search.aspx/siteall?q=ab');
      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(250);
      expect(handler).toHaveBeenCalledTimes(1);
      const args: PageChangedEventArgs = handler.mock.calls[0][0];
      expect(args.page.search).toEqual({ isSearchPage: true, query: 'ab', vertical: 'siteall' });
    });

    it('stops when disposed', () => {
      const win = createWindow(withNavigation);
      const { watcher, handler } = watch(win);

      win.history.pushState(null, '', NEWS);
      watcher.dispose();
      jest.advanceTimersByTime(250);
      win.history.pushState(null, '', ABOUT);
      jest.advanceTimersByTime(250);
      expect(handler).not.toHaveBeenCalled();
      expect(watcher.isDisposed).toBe(true);
    });
  });

  it('calls handlers with the observer as this, and stops after remove', () => {
    const win = createWindow(true);
    const watcher = new PageWatcher({ window: win as unknown as Window });
    const observer = { urls: [] as string[] };
    function onChanged(this: typeof observer, args: PageChangedEventArgs): void {
      this.urls.push(args.page.url.href);
    }
    watcher.changedEvent.add(observer, onChanged);

    win.history.pushState(null, '', NEWS);
    jest.advanceTimersByTime(250);
    watcher.changedEvent.remove(observer, onChanged);
    win.history.pushState(null, '', ABOUT);
    jest.advanceTimersByTime(250);
    expect(observer.urls).toEqual([NEWS]);
  });

  it('handles back and forward without the Navigation API', () => {
    const win = createWindow(false);
    const { handler } = watch(win);

    win.location.href = NEWS;
    win.dispatchEvent(new Event('popstate'));
    jest.advanceTimersByTime(250);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('wraps history once for any number of watchers', () => {
    const win = createWindow(false);
    const first = watch(win);
    const wrapped = win.history.pushState;
    const second = watch(win);
    expect(win.history.pushState).toBe(wrapped);

    win.history.pushState(null, '', NEWS);
    jest.advanceTimersByTime(250);
    expect(first.handler).toHaveBeenCalledTimes(1);
    expect(second.handler).toHaveBeenCalledTimes(1);
  });

  it('uses navigatedEvent, ignoring it when the URL is unchanged', () => {
    const win = createWindow(true);
    const navigatedEvent = createNavigatedEvent();
    const { watcher, handler } = watch(win, { navigatedEvent });

    navigatedEvent.raise();
    jest.advanceTimersByTime(250);
    expect(handler).not.toHaveBeenCalled();

    win.location.href = NEWS;
    navigatedEvent.raise();
    jest.advanceTimersByTime(250);
    expect(handler).toHaveBeenCalledTimes(1);

    watcher.dispose();
    win.location.href = ABOUT;
    navigatedEvent.raise();
    jest.advanceTimersByTime(250);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('honors a custom delay', () => {
    const win = createWindow(true);
    const { handler } = watch(win, { delayMs: 1000 });

    win.history.pushState(null, '', NEWS);
    jest.advanceTimersByTime(999);
    expect(handler).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('describes the current page', () => {
    const win = createWindow(true);
    expect(new PageWatcher({ window: win as unknown as Window }).page.url.href).toBe(HOME);
  });
});
