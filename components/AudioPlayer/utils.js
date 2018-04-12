export class AudioWritableStream {
  constructor(onSourceReady) {
    this.queueBuffer = [];
    this.queueSource = [];
    this.activeSource = null;
    this.activeBuffer = null;
    this.onSourceReady = onSourceReady;
    this.stream = new WritableStream(this);
  }

  getStream() {
    return this.stream;
  }

  start(controller) {
    this.activeSource = this.createSource(controller);
    this.onSourceReady(this.activeSource);
  }

  handleNextSource = controller => {
    const nextSource = this.queueSource.shift();
    console.log("handleNextSource", nextSource);

    if (!nextSource) {
      return;
    }

    this.onSourceReady(nextSource);
  };

  enqueueSource = () => {
    this.activeSource = this.createSource();
    this.queueSource.push(this.activeSource);
    console.log("enqueueSource", this.queueSource);
  };

  createSource(controller) {
    const source = new MediaSource();
    source.addEventListener("sourceopen", () => {
      console.warn(
        "MediaSource is open (e.g. currently playing by an HTMLAudioElement)"
      );
      this.activeBuffer = this.createBuffer(source, controller);
    });

    return source;
  }

  createBuffer(source, controller) {
    // @note: addSourceBuffer needs to be called when source is open to avoid
    // InvalidStateError (@see: https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/addSourceBuffer#Errors)
    // or Failed to execute 'addSourceBuffer' on 'MediaSource': The MediaSource's readyState is not 'open'
    const buffer = source.addSourceBuffer("audio/mpeg");
    buffer.addEventListener("updateend", () => {
      // @note: flush the queue:
      this.push(this.queueBuffer.shift(), controller);
      // console.log("flushing...", this.queueBuffer.length);
    });

    return buffer;
  }

  write(chunk, controller) {
    this.push(chunk, controller);
  }

  push = (chunk, controller) => {
    if (!chunk) {
      return;
    }

    try {
      if (
        !this.activeBuffer.updating &&
        this.activeSource.readyState === "open"
      ) {
        this.activeBuffer.appendBuffer(chunk);
      } else {
        this.queueBuffer.push(chunk);
        // console.log("buffering...", this.queueBuffer.length);
      }
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("QuotaExceededError");
        this.activeSource.endOfStream();
        this.enqueueSource();

        return;
      }
      // @todo clean listeners here (graceful shutdown of the stream):
      // URL.revokeObjectURL(audio.src);
      // @note: Writable error stream occurs (for example source buffer error...)
      // It will call the ReadableStream.cancel() hook:
      console.error(error);
      controller.error(error);
    }
  };

  close() {
    LogStream.write("AudioWritableStream->close");
  }

  abort(reason) {
    LogStream.write("AudioWritableStream->abort");
  }
}

export class AudioReadableStream {
  constructor(url) {
    this.reader = null;
    this.url = url;
    this.stream = new ReadableStream(this);

    // return new ReadableStream(this)
  }

  getStream() {
    return this.stream;
  }

  async start(controller) {
    const response = await fetch(this.url);
    this.reader = response.body.getReader();
    const loop = async () => {
      const { value: chunk, done: isDone } = await this.reader.read();

      if (isDone) {
        return controller.close();
      }

      controller.enqueue(chunk);
      return loop();
    };

    await loop();
  }

  cancel(reason) {
    console.error("AudioReadableStream->cancel", reason);
    // @note: graceful shutdown of the readable stream here
    // @note: we cancel chunk reading process: fetch will consecuently abort:
    this.reader.cancel();
  }

  abort() {
    if (!this.reader) {
      return Promise.resolve();
    }
    // @note: we can't use built-in ReadableStream cancel() function to abort stream
    // since we're going to have this error: Cannot cancel a readable stream that is locked to a reader
    // We need to create our own function to cancel reader which results on calling close() builtin WritableStream hook
    return this.reader.cancel();
  }
}

export class PersistTransformStream {
  get readable() {
    return new ReadableStream({
      start(controller) {
        controller = controller;
      }
    });
  }

  get writable() {
    return new WritableStream({
      write(chunk) {
        //console.log("Hey chunk", chunk);
        //controller.enqueue(chunk);
      }
    });
  }
}

export class LogStream {
  static key = "error";

  static read() {
    if (typeof window === "undefined") {
      return null;
    }

    return JSON.parse(localStorage.getItem(LogStream.key));
  }

  static write(context, message) {
    if (typeof window === "undefined") {
      return;
    }

    const previousLog = JSON.parse(localStorage.getItem(LogStream.key)) || {};
    const previousContextualLog = previousLog[context] || [];

    localStorage.setItem(
      LogStream.key,
      JSON.stringify({
        ...previousLog,
        [context]: [
          ...previousContextualLog,
          {
            date: new Date(),
            message
          }
        ]
      })
    );
  }
}
