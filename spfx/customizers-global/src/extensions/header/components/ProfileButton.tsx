import * as React from 'react';
import { Log } from '@microsoft/sp-core-library';
import { ActionButton, DirectionalHint, FocusTrapCallout, getId, Persona, PersonaSize } from '@fluentui/react';
import type { IUserLink, IUserLinksService } from '@kanduu/spfx-shared';

import * as strings from 'HeaderApplicationCustomizerStrings';
import ProfileCard from './ProfileCard';

const LOG_SOURCE: string = 'ProfileButton';

export interface IProfileButtonProps {
  userDisplayName: string;
  userEmail: string;
  userLinksService: IUserLinksService;
  hoverBackgroundColor?: string;
}

/**
 * Current user's profile button.  Opens a popup below it with the user's details and links.
 * Links are loaded the first time the popup opens.
 */
const ProfileButton: React.FC<IProfileButtonProps> = ({ userDisplayName, userEmail, userLinksService, hoverBackgroundColor }) => {
  const [buttonId] = React.useState(() => getId('profileButton'));
  const [titleId] = React.useState(() => getId('profileCardTitle'));
  const buttonRef = React.useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [links, setLinks] = React.useState<IUserLink[] | undefined>(undefined);
  const hasRequestedLinks = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen || hasRequestedLinks.current) {
      return;
    }
    hasRequestedLinks.current = true;
    userLinksService.getLinks()
      .then(setLinks)
      .catch((error: Error) => {
        Log.warn(LOG_SOURCE, `Unable to load user links: ${error.message}`);
        setLinks([]);
      });
  }, [isOpen, userLinksService]);

  const close = React.useCallback(() => setIsOpen(false), []);
  // Clicks on the button toggle the popup, so they must not also dismiss it as an outside click.
  const isFromButton = React.useCallback(
    (ev: Event | React.SyntheticEvent) => !!buttonRef.current?.contains(ev.target as Node),
    []
  );

  return (
    <>
      <span ref={buttonRef}>
        <ActionButton
          id={buttonId}
          ariaLabel={`${strings.ProfileAriaLabel} ${userDisplayName}`}
          title={userEmail || userDisplayName}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          styles={{ root: { padding: '0 4px' }, rootHovered: { backgroundColor: hoverBackgroundColor } }}
          onClick={() => setIsOpen((open) => !open)}
        >
          <Persona text={userDisplayName} size={PersonaSize.size24} hidePersonaDetails />
        </ActionButton>
      </span>
      {isOpen && (
        <FocusTrapCallout
          target={`#${buttonId}`}
          role="dialog"
          ariaLabelledBy={titleId}
          directionalHint={DirectionalHint.bottomRightEdge}
          gapSpace={4}
          isBeakVisible={false}
          setInitialFocus
          onDismiss={close}
          preventDismissOnEvent={isFromButton}
          focusTrapProps={{ isClickableOutsideFocusTrap: true }}
        >
          <ProfileCard titleId={titleId} userDisplayName={userDisplayName} userEmail={userEmail} links={links} />
        </FocusTrapCallout>
      )}
    </>
  );
};

export default ProfileButton;
