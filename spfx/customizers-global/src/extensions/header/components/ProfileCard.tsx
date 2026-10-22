import * as React from 'react';
import { Link, Persona, PersonaSize, Spinner, SpinnerSize, Text } from '@fluentui/react';
import type { IUserLink } from '@kanduu/spfx-shared';

import * as strings from 'HeaderApplicationCustomizerStrings';
import styles from './HeaderBanner.module.scss';

export interface IProfileCardProps {
  /** Id of the element naming the card, referenced by the popup's aria-labelledby. */
  titleId: string;
  userDisplayName: string;
  userEmail: string;
  /** The user's links; undefined while loading. */
  links: IUserLink[] | undefined;
}

/** Contents of the profile popup: who is signed in, and their links. */
const ProfileCard: React.FC<IProfileCardProps> = ({ titleId, userDisplayName, userEmail, links }) => (
  <div className={styles.profileCard}>
    <div id={titleId}>
      <Persona text={userDisplayName} secondaryText={userEmail} size={PersonaSize.size48} />
    </div>
    <section className={styles.profileLinks} aria-labelledby={`${titleId}-links`}>
      <Text as="h2" variant="mediumPlus" block className={styles.profileLinksTitle} id={`${titleId}-links`}>
        {strings.MyLinksTitle}
      </Text>
      {links === undefined && <Spinner size={SpinnerSize.small} label={strings.MyLinksLoading} />}
      {links?.length === 0 && <Text block>{strings.MyLinksEmpty}</Text>}
      {!!links?.length && (
        <ul className={styles.profileLinkList}>
          {links.map((link) => (
            <li key={link.key}>
              <Link href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</Link>
            </li>
          ))}
        </ul>
      )}
      <Text variant="small" block className={styles.profileNote}>{strings.MyLinksPersonalizeNote}</Text>
    </section>
  </div>
);

export default ProfileCard;
