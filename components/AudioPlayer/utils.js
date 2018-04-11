export class AudioWritableStream {
  constructor(onSourceReady) {
    this.mediaSource = null;
    this.waitingQueue = [];
    this.buffer = null;
    this.queueBuffer = [];
    this.onSourceReady = onSourceReady;

    return new WritableStream(this);
  }

  start(controller) {
    this.mediaSource = this.createSource(controller);
    this.onSourceReady(this.mediaSource);

    // this.handleQuotaExceeded(controller);
  }

  handleQuotaExceeded = async controller => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    // URL.createObjectURL(new Blob([], { type: "audio/mpeg" }))
    // this.mediaSource.endOfStream();
    // this.mediaSource.removeSourceBuffer(this.buffer);

    console.log("handleQuotaExceeded");

    // Attempt
    this.buffer.abort();
    this.mediaSource.removeSourceBuffer(this.buffer);

    await new Promise(resolve => setTimeout(resolve, 5000));

    // this.mediaSource = this.createSource(controller);
    // this.onSourceReady(this.mediaSource);
    this.attachBuffer(this.mediaSource, controller);
    // this.mediaSource = this.createSource();
    // this.onSourceReady(this.mediaSource);
  };

  createSource(controller) {
    const source = new MediaSource();
    source.addEventListener("sourceopen", () =>
      this.attachBuffer(source, controller)
    );

    return source;
  }

  attachBuffer(source, controller) {
    // @todo: transform this.buffer to function local variable:

    // @note: addSourceBuffer needs to be called when source is open to avoid
    // InvalidStateError (@see: https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/addSourceBuffer#Errors)
    // or Failed to execute 'addSourceBuffer' on 'MediaSource': The MediaSource's readyState is not 'open'
    this.buffer = source.addSourceBuffer("audio/mpeg");
    this.buffer.addEventListener("updateend", () => {
      // @note: flush the queue:
      this.push(this.queueBuffer.shift(), controller);
    });

    // this.buffer.addEventListener("error", error => {
    //   console.error("SourceBuffer error", error);
    // });
    // this.buffer.addEventListener("abort", error => {
    //   console.error("SourceBuffer abort", error);
    // });
  }

  write(chunk, controller) {
    this.push(chunk, controller);
  }

  push = (chunk, controller) => {
    if (!chunk) {
      return;
    }

    try {
      if (!this.buffer.updating) {
        this.buffer.appendBuffer(chunk);
      } else {
        this.queueBuffer.push(chunk);
      }
    } catch (error) {
      if (error.name !== "QuotaExceededError") {
        // @todo: create new source
        // or try removeBuffer => source.appendBuffer

        return;
      }

      // @todo clean listeners here (graceful shutdown of the stream):

      // @note: Writable error stream occurs (for example source buffer error...)
      // It will call the ReadableStream.cancel() hook:
      controller.error(error);
    }
  };

  close(controller) {
    LogStream.write("AudioWritableStream->close");
    console.error("AudioWritableStream->close", controller);

    controller.close();
  }

  abort(reason) {
    LogStream.write("AudioWritableStream->abort");

    console.error("AudioWritableStream->abort", reason);
  }
}

export class AudioReadableStream {
  constructor(url) {
    this.reader = null;
    this.url = url;

    return new ReadableStream(this);
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
    console.log(this.reader);

    // @note: graceful shutdown of the readable stream here
    // @note: we cancel chunk reading process: fetch will consecuently abort:
    this.reader.cancel();
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
