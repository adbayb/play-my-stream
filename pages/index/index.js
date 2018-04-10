import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import AudioPlayer, { LogStream } from "../../components/AudioPlayer";
import Header from "../../components/Header";
import Icon from "../../components/Icon";
import ItemRadio from "../../components/ItemRadio";
import ListHorizontal from "../../components/ListHorizontal";
import LogView from "../../components/LogView";
import { radios } from "./data";
import styles from "./styles.css";

class App extends Component {
  state = {
    radio: radios[0],
    previousRadio: null,
    showLog: false
  };

  handleLogView = () => {
    this.setState(({ showLog }) => ({
      showLog: !showLog
    }));
  };

  handleRadioChange = ({ name, url }) => {
    console.log("url", url);
    this.setState(({ radio }) => ({
      previousRadio: radio,
      radio: {
        name,
        url
      }
    }));
  };

  handleRadioSwitch = () => {
    this.setState(({ previousRadio, radio }) => {
      if (!previousRadio) {
        return null;
      }

      return {
        previousRadio: radio,
        radio: previousRadio
      };
    });
  };

  renderItemRadio = ({ logo, name, url }) => {
    return (
      <ItemRadio
        key={name}
        onClick={() => this.handleRadioChange({ name, url })}
        logo={logo}
        name={name}
      />
    );
  };

  renderPlayButton = ({ play, pause, isPlaying }) => {
    return (
      <Icon
        className={styles.audioIcon}
        name={isPlaying ? "pause" : "play"}
        onClick={() => (isPlaying ? pause() : play())}
      />
    );
  };

  render() {
    const { showLog, radio: { name, url } } = this.state;

    return (
      <div className={styles.container}>
        <Header
          left={<Icon name="info" onClick={this.handleLogView} />}
          right={<Icon name="switch" onClick={this.handleRadioSwitch} />}
        >
          {name}
        </Header>
        <main className={styles.mainContainer}>
          <div className={styles.playerContainer}>
            <AudioPlayer url={url} render={this.renderPlayButton} />
          </div>
          <ListHorizontal data={radios} renderItem={this.renderItemRadio} />
          {showLog && <LogView data={LogStream.read()} />}
        </main>
      </div>
    );
  }
}

export default App;
