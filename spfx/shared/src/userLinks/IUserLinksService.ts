import type { IUserLink } from './IUserLink';

export interface IUserLinksService {
  /** The current user's links, in display order. */
  getLinks(): Promise<IUserLink[]>;
}
