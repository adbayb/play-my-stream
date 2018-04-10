import React from "react";
import PropTypes from "prop-types";

import styles from "./styles.css";

const ItemRadio = ({ onClick, logo, name }) => (
  <div className={styles.container} onClick={onClick}>
    <img className={styles.logo} src={logo} alt={`${name} radio preview`} />
    <span className={styles.name}>{name}</span>
  </div>
);

ItemRadio.propTypes = {
  onClick: PropTypes.func,
  logo: PropTypes.string,
  name: PropTypes.string.isRequired
};

export default ItemRadio;
