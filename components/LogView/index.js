import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import styles from "./styles.css";

class LogView extends Component {
  static propTypes = {
    data: PropTypes.object
  };

  render() {
    const { data } = this.props;

    if (!data) {
      return null;
    }

    return (
      <section className={styles.container}>
        {Object.keys(data).map(context => {
          return (
            <Fragment key={context}>
              <p className={styles.context}>{context}</p>
              {data[context].map(({ date, message }, index) => (
                <p key={index} className={styles.item}>
                  {date}:
                  <span className={styles.message}>{message.stack}</span>
                </p>
              ))}
            </Fragment>
          );
        })}
      </section>
    );
  }
}

export default LogView;
