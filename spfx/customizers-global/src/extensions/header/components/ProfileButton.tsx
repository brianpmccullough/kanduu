import * as React from 'react';
import { ActionButton, Persona, PersonaSize } from '@fluentui/react';

import * as strings from 'HeaderApplicationCustomizerStrings';

export interface IProfileButtonProps {
  userDisplayName: string;
  userEmail: string;
  hoverBackgroundColor?: string;
}

/** Current user's profile button.  Stub: no menu or profile card yet. */
const ProfileButton: React.FC<IProfileButtonProps> = ({ userDisplayName, userEmail, hoverBackgroundColor }) => (
  <ActionButton
    ariaLabel={`${strings.ProfileAriaLabel} ${userDisplayName}`}
    title={userEmail || userDisplayName}
    styles={{ root: { padding: '0 4px' }, rootHovered: { backgroundColor: hoverBackgroundColor } }}
    onClick={() => { /* stub: profile menu not implemented yet */ }}
  >
    <Persona text={userDisplayName} size={PersonaSize.size24} hidePersonaDetails />
  </ActionButton>
);

export default ProfileButton;
