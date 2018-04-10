export class AudioWritableStream {
  constructor(onSourceReady) {
    this.mediaSource = null;
    this.waitingQueue = [];
    this.buffer = null;
    this.queueBuffer = new Uint8Array();
    this.onSourceReady = onSourceReady;

    return new WritableStream(this);
  }

  start(controller) {
    this.mediaSource = this.createSource();
    this.onSourceReady(this.mediaSource);

    // this.handleQuotaExceeded(controller);
  }

  handleQuotaExceeded = async controller => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    // URL.createObjectURL(new Blob([], { type: "audio/mpeg" }))

    // this.activeSource.endOfStream();
    // this.activeSource.removeSourceBuffer(this.buffer);
    this.mediaSource.endOfStream();
    this.mediaSource.removeSourceBuffer(this.buffer);
    // this.buffer = null;

    await new Promise(resolve => setTimeout(resolve, 5000));
    this.mediaSource = this.createSource();
    this.onSourceReady(this.mediaSource);
    // this.attachBuffer(this.mediaSource);
  };

  createSource() {
    const source = new MediaSource();
    source.addEventListener("sourceopen", () => this.attachBuffer(source));

    return source;
  }

  attachBuffer(source) {
    // @todo: transform this.buffer to function local variable:

    // @note: addSourceBuffer needs to be called when source is open to avoid
    // InvalidStateError (@see: https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/addSourceBuffer#Errors)
    // or Failed to execute 'addSourceBuffer' on 'MediaSource': The MediaSource's readyState is not 'open'
    this.buffer = source.addSourceBuffer("audio/mpeg");
    this.buffer.addEventListener("updateend", () => {
      this.buffer.appendBuffer(this.queueBuffer);
      // @note: flush the queue:
      this.queueBuffer = new Uint8Array();
    });
    this.buffer.appendBuffer(this.queueBuffer);

    this.buffer.addEventListener("error", error => {
      console.error("SourceBuffer error", error);
    });
    this.buffer.addEventListener("abort", error => {
      console.error("SourceBuffer abort", error);
    });
  }

  write(chunk, controller) {
    this.queueBuffer = new Uint8Array([...this.queueBuffer, ...chunk]);
    // console.log(this.queueBuffer, this.buffer.updating, chunk);
    // try {
    //   this.push(chunk);
    // } catch (error) {
    //   // LogStream.write("AudioWritableStream->write", error.toString());
    //   console.error(error);

    //   if (error.name !== "QuotaExceededError") {
    //     // @note: Writable error stream occurs (for example source buffer error...)
    //     // It will call the ReadableStream.cancel() hook:
    //     // controller.error(error);
    //   } else {
    //     // @todo: queue source stream
    //   }
    // }
  }

  close(controller) {
    LogStream.write("AudioWritableStream->close");
    controller.close();

    console.error("AudioWritableStream->close", controller);
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
