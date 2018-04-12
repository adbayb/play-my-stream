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
  currentStream = null;

  componentWillReceiveProps({ autoplay, url }) {
    if (this.props.url !== url) {
      console.warn(`Radio changed: ${this.props.url} => ${url}`);
      this.currentStream
        .abort()
        .then(() => {
          this.handleSource({ url });
        })
        .catch(err => console.error(err));
    }
  }

  playerDidMount = ref => {
    console.warn("Player is mount (dom ready)");
    const { url } = this.props;

    this.player = ref;
    this.handleSource({ url });
  };

  handleSource = async ({ url }) => {
    if (!url) {
      return;
    }

    try {
      const readableStream = new AudioReadableStream(url);
      const writableStream = new AudioWritableStream(source => {
        console.warn("Audio stream source is ready");
        this.setState(() => ({
          source: URL.createObjectURL(source)
        }));
      });

      // @todo: better way without instance variable ?
      this.writableStream = writableStream;
      this.currentStream = readableStream;

      await readableStream.getStream().pipeTo(writableStream.getStream());
    } catch (error) {
      LogStream.write("AudioPlayer->handleSource", error.toString());
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

  handleEndedEvent = () => {
    console.warn("Player->end: setting next source...");
    this.writableStream.handleNextSource();
  };

  handlePlay = async () => {
    // @note: to avoid error like "Uncaught (in promise) DOMException: The play() request was interrupted by a new load request."
    // Or "Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause()."
    // @see: https://developers.google.com/web/updates/2017/06/play-request-was-interrupted :
    // @scenario:
    // 1. video.play() starts loading video content asynchronously.
    // 2. video.pause() interrupts video loading because it is not ready yet.
    // 3. video.play() rejects asynchronously loudly.
    await this.player.play();
  };

  handlePause = async () => {
    await this.player.pause();
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
          onEnded={this.handleEndedEvent}
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
