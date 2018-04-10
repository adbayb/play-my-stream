import React, { Component } from "react";
import PropTypes from "prop-types";

import styles from "./styles.css";

class ListHorizontal extends Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    renderItem: PropTypes.func.isRequired
  };

  render() {
    const { data, renderItem } = this.props;

    if (!data) {
      return null;
    }

    return <ul className={styles.container}>{data.map(renderItem)}</ul>;
  }
}

export default ListHorizontal;
