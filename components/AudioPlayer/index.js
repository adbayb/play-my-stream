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
    error: false
  };

  componentDidMount() {
    const { autoplay, url } = this.props;

    this.player = new Audio();
    this.initPlayer({ autoplay, url });
  }

  componentWillReceiveProps({ autoplay, url }) {
    if (this.props.url !== url) {
      console.log("Radio change! ", this.props.url, " => ", url);
      this.setState(
        // @todo: handleReset
        () => ({
          isPlaying: false,
          error: false
        }),
        () => {
          this.initPlayer({ autoplay, url });
        }
      );
    }
  }

  initPlayer = async ({ autoplay, url }) => {
    if (!url) {
      return;
    }

    try {
      const source = new AudioReadableStream(url);
      await source.pipeTo(
        new AudioWritableStream(async source => {
          this.player.src = URL.createObjectURL(source);
          // this.player.muted = true;
          autoplay && (await this.handlePlay());
        })
      );
    } catch (error) {
      LogStream.write("AudioPlayer->initPlayer", error);
    }
  };

  handlePlay = async () => {
    try {
      const { isPlaying } = this.state;

      if (isPlaying) {
        return;
      }

      // @note: to avoid error like "Uncaught (in promise) DOMException: The play() request was interrupted by a new load request."
      // Or "Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause()."
      // @see: https://developers.google.com/web/updates/2017/06/play-request-was-interrupted :
      // @scenario:
      // 1. video.play() starts loading video content asynchronously.
      // 2. video.pause() interrupts video loading because it is not ready yet.
      // 3. video.play() rejects asynchronously loudly.
      await this.player.play();
      this.setState(() => ({
        isPlaying: true
      }));
    } catch (error) {
      LogStream.write("AudioPlayer->handlePlay", error);

      this.setState(() => ({
        error: true
      }));
    }
  };

  handlePause = async () => {
    this.player.pause();
    this.setState(() => ({
      isPlaying: false
    }));

    try {
      const { isPlaying } = this.state;

      if (!isPlaying) {
        return;
      }

      await this.player.pause();
      this.setState(() => ({
        isPlaying: false
      }));
    } catch (error) {
      LogStream.write("AudioPlayer->handlePause", error);

      this.setState(() => ({
        error: true
      }));
    }
  };

  playerDidMount = ref => {
    this.player = ref;
    this.player.addEventListener("timeupdate", data => {
      console.log("player->timeupdate: ", this.player.currentTime);
    });
    this.player.addEventListener("durationchange", data => {
      console.log("player->durationchange: ", this.player.duration);
    });
    this.player.addEventListener("ended", data => {
      console.log("player->ended");
    });
    this.player.addEventListener("waiting", data => {
      console.log("player->waiting");
    });
    this.player.addEventListener("seeked", data => {
      console.log("player->seeked");
    });
    this.player.addEventListener("seeking", data => {
      console.log("player->seeking");
    });
    this.player.addEventListener("suspend", data => {
      console.log("player->suspend");
    });
    this.player.addEventListener("playing", data => {
      console.log("player->playing");
    });
    this.player.addEventListener("play", data => {
      console.log("player->play");
    });
    this.player.addEventListener("pause", data => {
      console.log("player->pause");
    });
  };

  render() {
    const { render } = this.props;
    const { isPlaying } = this.state;

    return (
      <Fragment>
        {/* <audio
          ref={this.playerDidMount}
          preload="auto"
          src="https://medradio-maroc.ice.infomaniak.ch/medradio-maroc-64.mp3"
        /> */}
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
