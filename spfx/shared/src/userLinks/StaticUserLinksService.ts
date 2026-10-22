import type { IUserLink } from './IUserLink';
import type { IUserLinksService } from './IUserLinksService';

/**
 * Returns a fixed set of links.  Stand-in until links are personalizable and stored per user
 * (e.g. JSON in the app folder of the user's OneDrive), which will be another IUserLinksService.
 */
export class StaticUserLinksService implements IUserLinksService {
  public constructor(private readonly _links: readonly IUserLink[]) {}

  public getLinks(): Promise<IUserLink[]> {
    return Promise.resolve(this._links.map((link) => ({ ...link })));
  }
}
