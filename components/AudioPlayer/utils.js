export class AudioWritableStream {
  constructor(onSourceReady) {
    this.waitingQueue = [];
    this.buffer = null;
    this.onSourceReady = onSourceReady;

    return new WritableStream(this);
  }

  start(controller) {
    const source = this.createSource();
    this.onSourceReady(source);
  }

  createSource() {
    const source = new MediaSource();

    source.addEventListener("sourceopen", () => {
      // @note: addSourceBuffer needs to be called when source is open to avoid
      // InvalidStateError (@see: https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/addSourceBuffer#Errors)
      // or Failed to execute 'addSourceBuffer' on 'MediaSource': The MediaSource's readyState is not 'open'
      this.buffer = source.addSourceBuffer("audio/mpeg");
      this.buffer.addEventListener("updateend", () => {
        if (this.waitingQueue.length > 0) {
          this.buffer.appendBuffer(this.waitingQueue.shift());
        }
      });
    });

    return source;
  }

  write(chunk, controller) {
    try {
      this.push(chunk);

      // new Promise(resolve => setTimeout(resolve, 1000))
      //   .then(() => {
      //     throw new class extends Error {
      //       constructor(...args) {
      //         super(...args);
      //         this.name = "QuotaExceededError";
      //         this.message = "aie";
      //       }
      //     }();
      //   })
      //   .catch(error => {
      //     console.error("====> QUOTA ERROR", error);
      //     // this.source.endOfStream();
      //     // @todo: queue source stream
      //     controller.error(error);
      //   });
    } catch (error) {
      LogStream.write("AudioWritableStream->write", error);

      if (error.name !== "QuotaExceededError") {
        // @note: Writable error stream occurs (for example source buffer error...)
        // It will call the ReadableStream.cancel() hook:
        controller.error(error);
      } else {
        // @todo: queue source stream
      }
    }
  }

  close(controller) {
    LogStream.write("AudioWritableStream->close", "walou");
    controller.close();

    console.error("AudioWritableStream->close", controller);
  }

  abort(reason) {
    LogStream.write("AudioWritableStream->abort", "walou");

    console.error("AudioWritableStream->abort", reason);
  }

  // @note: utility function:
  push(chunk) {
    // @note: we use appendBuffer to append a chunk if and only if the buffer is not currently updating its state (to avoid InvalidStateError)
    // and the queue of missed chunks is totally flushed (to garantee continuous chunks reading):
    if (this.buffer.updating || this.waitingQueue.length > 0) {
      // @note: fallback to avoid concurrent appendBuffer (SourceBuffer is not available while it's working (e.g. here appending the previous chunk for example))
      this.waitingQueue.push(chunk);

      return;
    }

    this.buffer.appendBuffer(chunk);
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
