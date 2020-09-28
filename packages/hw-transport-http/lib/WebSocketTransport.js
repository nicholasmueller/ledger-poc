"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _errors = require("@ledgerhq/errors");

var _logs = require("@ledgerhq/logs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const WebSocket = global.WebSocket || require("ws");
/**
 * WebSocket transport implementation
 */


class WebSocketTransport extends _hwTransport.default {
  // this transport is not discoverable
  static async open(url) {
    const exchangeMethods = await new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        const exchangeMethods = {
          resolveExchange: _b => {},
          rejectExchange: _e => {},
          onDisconnect: () => {},
          close: () => socket.close(),
          send: msg => socket.send(msg)
        };

        socket.onopen = () => {
          socket.send("open");
        };

        socket.onerror = e => {
          exchangeMethods.onDisconnect();
          reject(e);
        };

        socket.onclose = () => {
          exchangeMethods.onDisconnect();
          reject(new _errors.TransportError("OpenFailed", "OpenFailed"));
        };

        socket.onmessage = e => {
          if (typeof e.data !== "string") return;
          const data = JSON.parse(e.data);

          switch (data.type) {
            case "opened":
              return resolve(exchangeMethods);

            case "error":
              reject(new Error(data.error));
              return exchangeMethods.rejectExchange(new _errors.TransportError(data.error, "WSError"));

            case "response":
              return exchangeMethods.resolveExchange(Buffer.from(data.data, "hex"));
          }
        };
      } catch (e) {
        reject(e);
      }
    });
    return new WebSocketTransport(exchangeMethods);
  }

  constructor(hook) {
    super();
    this.hook = void 0;
    this.hook = hook;

    hook.onDisconnect = () => {
      this.emit("disconnect");
      this.hook.rejectExchange(new _errors.TransportError("WebSocket disconnected", "WSDisconnect"));
    };
  }

  async exchange(apdu) {
    const hex = apdu.toString("hex");
    (0, _logs.log)("apdu", "=> " + hex);
    const res = await new Promise((resolve, reject) => {
      this.hook.rejectExchange = e => reject(e);

      this.hook.resolveExchange = b => resolve(b);

      this.hook.send(hex);
    });
    (0, _logs.log)("apdu", "<= " + res.toString("hex"));
    return res;
  }

  setScrambleKey() {}

  async close() {
    this.hook.close();
    return new Promise(success => {
      setTimeout(success, 200);
    });
  }

}

exports.default = WebSocketTransport;

WebSocketTransport.isSupported = () => Promise.resolve(typeof WebSocket === "function");

WebSocketTransport.list = () => Promise.resolve([]);

WebSocketTransport.listen = _observer => ({
  unsubscribe: () => {}
});

WebSocketTransport.check = async (url, timeout = 5000) => new Promise((resolve, reject) => {
  const socket = new WebSocket(url);
  let success = false;
  setTimeout(() => {
    socket.close();
  }, timeout);

  socket.onopen = () => {
    success = true;
    socket.close();
  };

  socket.onclose = () => {
    if (success) resolve();else {
      reject(new _errors.TransportError("failed to access WebSocketTransport(" + url + ")", "WebSocketTransportNotAccessible"));
    }
  };

  socket.onerror = () => {
    reject(new _errors.TransportError("failed to access WebSocketTransport(" + url + "): error", "WebSocketTransportNotAccessible"));
  };
});
//# sourceMappingURL=WebSocketTransport.js.map