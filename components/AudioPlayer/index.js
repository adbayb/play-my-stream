import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import { AudioReadableStream, AudioWritableStream, LogStream } from "./utils";

class AudioPlayer extends Component {
  static propTypes = {
    autoplay: PropTypes.bool,
    render: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  };
  static defaultProps = {
    autoplay: true,
    render: () => null
  };

  state = {
    isPlaying: false,
    error: false,
    source: null
  };

  componentWillReceiveProps({ autoplay, url }) {
    if (this.props.url !== url) {
      console.log("Radio change! ", this.props.url, " => ", url);
      this.handleSource({ url });
    }
  }

  playerDidMount = ref => {
    console.warn("PLAYER IS MOUNT");
    const { url } = this.props;

    this.player = ref;
    this.handleSource({ url });

    this.player.addEventListener("ended", data => {
      console.log("player->ended");
    });
    this.player.addEventListener("waiting", data => {
      console.log("player->waiting");
    });

    this.player.addEventListener("error", data => {
      console.log("player->error", data);
    });
  };

  handleSource = async ({ url }) => {
    if (!url) {
      return;
    }

    try {
      const source = new AudioReadableStream(url);
      const writableStream = new AudioWritableStream(async source => {
        console.error("SOURCE CHANGED");
        this.setState(() => ({
          source: URL.createObjectURL(source)
        }));
      });

      await source.pipeTo(writableStream);
    } catch (error) {
      LogStream.write("AudioPlayer->handleSource", error.toString());
      console.error("AudioPlayer->handleSource", error);
    }
  };

  handlePlayEvent = () => {
    this.setState(({ isPlaying }) => {
      if (isPlaying) {
        return null;
      }

      return {
        isPlaying: true
      };
    });
  };

  handlePauseEvent = () => {
    this.setState(({ isPlaying }) => {
      if (!isPlaying) {
        return null;
      }

      return {
        isPlaying: false
      };
    });
  };

  handleSuspendEvent = () => {
    // console.error("SUSPEND EVENT TRIGGER");
  };

  handleTimeUpdateEvent = () => {
    // console.log(
    //   "player->handleTimeUpdateEvent: ",
    //   this.player.currentTime,
    //   this.player.buffered
    // );
  };

  handleEndedEvent = () => {
    // console.error("ENDED EVENT TRIGGER");
  };

  handlePlay = () => {
    // @note: to avoid error like "Uncaught (in promise) DOMException: The play() request was interrupted by a new load request."
    // Or "Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause()."
    // @see: https://developers.google.com/web/updates/2017/06/play-request-was-interrupted :
    // @scenario:
    // 1. video.play() starts loading video content asynchronously.
    // 2. video.pause() interrupts video loading because it is not ready yet.
    // 3. video.play() rejects asynchronously loudly.
    this.player.play();
  };

  handlePause = () => {
    this.player.pause();
  };

  render() {
    const { autoplay, render } = this.props;
    const { isPlaying, source } = this.state;

    return (
      <Fragment>
        <audio
          ref={this.playerDidMount}
          preload="auto"
          src={source}
          onPlay={this.handlePlayEvent}
          onPause={this.handlePauseEvent}
          onSuspend={this.handleSuspendEvent}
          onEnded={this.handleEndedEvent}
          onTimeUpdate={this.handleTimeUpdateEvent}
          autoPlay={autoplay}
        >
          No support for HTML audio element provided by your browser
        </audio>
        {render({
          play: this.handlePlay,
          pause: this.handlePause,
          isPlaying
        })}
      </Fragment>
    );
  }
}

export { LogStream };
export default AudioPlayer;
