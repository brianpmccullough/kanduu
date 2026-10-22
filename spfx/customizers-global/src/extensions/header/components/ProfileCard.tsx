import * as React from 'react';
import { ActionButton, Icon, Persona, PersonaSize, Spinner, SpinnerSize, Text } from '@fluentui/react';
import type { IUserLink } from '@kanduu/spfx-shared';

import * as strings from 'HeaderApplicationCustomizerStrings';
import styles from './HeaderBanner.module.scss';

const DEFAULT_LINK_ICON: string = 'Link';

export interface IProfileCardProps {
  /** Id of the element naming the card, referenced by the popup's aria-labelledby. */
  titleId: string;
  userDisplayName: string;
  userEmail: string;
  /** The user's quick links; undefined while loading. */
  links: IUserLink[] | undefined;
}

/** Contents of the profile popup: who is signed in, and their quick links as tiles. */
const ProfileCard: React.FC<IProfileCardProps> = ({ titleId, userDisplayName, userEmail, links }) => (
  <div className={styles.profileCard}>
    <div id={titleId}>
      <Persona text={userDisplayName} secondaryText={userEmail} size={PersonaSize.size48} />
    </div>
    <section className={styles.quickLinks} aria-labelledby={`${titleId}-links`}>
      <div className={styles.quickLinksHeader}>
        <Text as="h2" variant="mediumPlus" className={styles.quickLinksTitle} id={`${titleId}-links`}>
          {strings.QuickLinksTitle}
        </Text>
        <ActionButton
          iconProps={{ iconName: 'Edit' }}
          text={strings.ManageQuickLinksLabel}
          ariaLabel={strings.ManageQuickLinksAriaLabel}
          styles={{ root: { height: 32 } }}
          onClick={() => { /* stub: managing quick links not implemented yet */ }}
        />
      </div>
      {links === undefined && <Spinner size={SpinnerSize.small} label={strings.QuickLinksLoading} />}
      {links?.length === 0 && <Text block>{strings.QuickLinksEmpty}</Text>}
      {!!links?.length && (
        <ul className={styles.quickLinkGrid}>
          {links.map((link) => (
            <li key={link.key}>
              <a className={styles.quickLink} href={link.url} target="_blank" rel="noopener noreferrer">
                <Icon iconName={link.iconName || DEFAULT_LINK_ICON} className={styles.quickLinkIcon} aria-hidden="true" />
                <span className={styles.quickLinkTitle}>{link.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
);

export default ProfileCard;
