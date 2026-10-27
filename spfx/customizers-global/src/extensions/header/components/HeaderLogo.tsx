import * as React from 'react';

import * as strings from 'HeaderApplicationCustomizerStrings';
import markUrl from '../assets/kanduu-mark.png';
import styles from './HeaderBanner.module.scss';

/**
 * Brand at the start of the banner: the Kanduu "K" mark, then the name in the banner's text color.
 * The mark carries the accessible name, so it is still announced when the name is hidden on narrow screens.
 */
const HeaderLogo: React.FC = () => (
  <div className={styles.logo}>
    <img className={styles.logoMark} src={markUrl} alt={strings.LogoText} />
    <span className={styles.logoWordmark} aria-hidden="true">
      {strings.LogoText}
    </span>
  </div>
);

export default HeaderLogo;
