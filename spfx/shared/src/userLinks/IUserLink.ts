/** A link the user keeps for quick access (shown in the header's profile card). */
export interface IUserLink {
  /** Stable identifier, unique within the user's links. */
  key: string;
  title: string;
  url: string;
}
