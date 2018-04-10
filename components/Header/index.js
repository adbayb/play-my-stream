import React from "react";
import PropTypes from "prop-types";

import styles from "./styles.css";

const Header = ({ children, left, right }) => (
  <header className={styles.container}>
    {left && <div className={styles.sideContainer}>{left}</div>}
    <h1 className={styles.label}>{children}</h1>
    {right && <div className={styles.sideContainer}>{right}</div>}
  </header>
);

Header.propTypes = {
  children: PropTypes.string,
  left: PropTypes.node,
  right: PropTypes.node
};

export default Header;
