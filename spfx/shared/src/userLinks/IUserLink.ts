/** A link the user keeps for quick access (shown in the header's profile card). */
export interface IUserLink {
  /** Stable identifier, unique within the user's links. */
  key: string;
  title: string;
  url: string;
  /** Fluent UI icon name shown with the link; a generic link icon when omitted. */
  iconName?: string;
}
