import { SharePointPage } from './SharePointPage';

/** An SPFx event such as `context.application.navigatedEvent`, without depending on SPFx. */
export interface INavigatedEventSource {
  add(observer: object, handler: () => void): void;
  remove(observer: object, handler: () => void): void;
}

/** Arguments of PageWatcher.changedEvent, like SPFx's ThemeChangedEventArgs. */
export class PageChangedEventArgs {
  public constructor(public readonly page: SharePointPage) {}
}

/** Subscribe with add(this, handler) and unsubscribe with remove(this, handler), like an SPFx event. */
export interface IPageChangedEvent {
  add(observer: object, handler: (args: PageChangedEventArgs) => void): void;
  remove(observer: object, handler: (args: PageChangedEventArgs) => void): void;
}

export interface IPageWatcherOptions {
  /** Also listen to SPFx's navigatedEvent; changes it reports are raised like any other. */
  navigatedEvent?: INavigatedEventSource;
  /** How long the URL must stay the same before changedEvent is raised; default 250 ms. */
  delayMs?: number;
  /** The window to watch; defaults to the global window (for tests). */
  window?: Window;
}

export const DEFAULT_PAGE_CHANGE_DELAY_MS = 250;

/** The Navigation API (not in TypeScript's DOM types yet); only what this module uses. */
interface INavigation {
  addEventListener(type: 'currententrychange', listener: () => void, options?: AddEventListenerOptions): void;
}

type PageChangedHandler = (args: PageChangedEventArgs) => void;

const HISTORY_EVENT = 'kanduu:pagechange';
const HISTORY_PATCHED = '__kanduuHistoryPatched';

/**
 * Raises changedEvent after every page change, including the ones SPFx's navigatedEvent misses:
 * search query and tab changes on search.aspx, new page creation, back and forward.
 *
 * Changes come from the Navigation API where the browser has it, otherwise from pushState /
 * replaceState (wrapped once per window) and popstate, plus navigatedEvent when given.  The event
 * is raised once the URL has been stable for delayMs (SharePoint finishes updating the page after
 * the URL changes) and only when the URL differs from the last one raised.  Dispose it with the
 * extension (onDispose) to stop listening.
 */
export class PageWatcher {
  public readonly changedEvent: IPageChangedEvent;

  private readonly _window: Window;
  private readonly _delayMs: number;
  private readonly _navigatedEvent: INavigatedEventSource | undefined;
  private readonly _subscriptions: Array<{ observer: object; handler: PageChangedHandler }> = [];
  private readonly _listeners = new AbortController();
  private _url: string;
  private _timer: ReturnType<typeof setTimeout> | undefined;

  public constructor(options: IPageWatcherOptions = {}) {
    this._window = options.window ?? window;
    this._delayMs = options.delayMs ?? DEFAULT_PAGE_CHANGE_DELAY_MS;
    this._navigatedEvent = options.navigatedEvent;
    this._url = this._window.location.href;

    this.changedEvent = {
      add: (observer, handler) => { this._subscriptions.push({ observer, handler }); },
      remove: (observer, handler) => {
        const index = this._subscriptions.findIndex((s) => s.observer === observer && s.handler === handler);
        if (index >= 0) {
          this._subscriptions.splice(index, 1);
        }
      }
    };

    const listenerOptions: AddEventListenerOptions = { signal: this._listeners.signal };
    const navigation = (this._window as Window & { navigation?: INavigation }).navigation;
    if (navigation) {
      navigation.addEventListener('currententrychange', this._onUrlChanging, listenerOptions);
    } else {
      patchHistory(this._window);
      this._window.addEventListener(HISTORY_EVENT, this._onUrlChanging, listenerOptions);
      this._window.addEventListener('popstate', this._onUrlChanging, listenerOptions);
    }
    this._navigatedEvent?.add(this, this._onUrlChanging);
  }

  /** The current page. */
  public get page(): SharePointPage {
    return new SharePointPage(this._window.location.href);
  }

  public get isDisposed(): boolean {
    return this._listeners.signal.aborted;
  }

  /** Stops listening and drops every subscription. */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._listeners.abort();
    this._navigatedEvent?.remove(this, this._onUrlChanging);
    clearTimeout(this._timer);
    this._subscriptions.length = 0;
  }

  private readonly _onUrlChanging = (): void => {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._raiseIfChanged(), this._delayMs);
  };

  private _raiseIfChanged(): void {
    const url = this._window.location.href;
    if (url === this._url) {
      return;
    }
    this._url = url;
    const args = new PageChangedEventArgs(new SharePointPage(url));
    for (const { observer, handler } of [...this._subscriptions]) {
      handler.call(observer, args);
    }
  }
}

/** Raises HISTORY_EVENT after pushState / replaceState.  Wraps once per window, so watchers never stack wrappers. */
function patchHistory(win: Window): void {
  const flags = win as Window & { [HISTORY_PATCHED]?: boolean };
  if (flags[HISTORY_PATCHED]) {
    return;
  }
  flags[HISTORY_PATCHED] = true;

  const { history } = win;
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History['pushState']>): void {
      original.apply(this, args);
      win.dispatchEvent(new Event(HISTORY_EVENT));
    };
  }
}
