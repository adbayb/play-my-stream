import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import getConfig from "next/config";

import styles from "./styles.css";

const { publicRuntimeConfig } = getConfig();

const Icon = ({ className, name, onClick }) => (
  <img
    className={classNames(styles.container, className)}
    onClick={onClick}
    src={`${publicRuntimeConfig.staticFolder}/assets/${name}.svg`}
    alt={`icon ${name}`}
  />
);

Icon.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

Icon.defaultProps = {
  onClick: () => {}
};

export default Icon;
