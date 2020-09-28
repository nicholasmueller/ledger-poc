"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _logs = require("@ledgerhq/logs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * create a transport replayer with a record store.
 * @param recordStore
 */
const createTransportReplayer = recordStore => {
  class TransportReplayer extends _hwTransport.default {
    setScrambleKey() {}

    close() {
      return Promise.resolve();
    }

    exchange(apdu) {
      (0, _logs.log)("apdu", apdu.toString("hex"));

      try {
        const buffer = recordStore.replayExchange(apdu);
        (0, _logs.log)("apdu", buffer.toString("hex"));
        return Promise.resolve(buffer);
      } catch (e) {
        (0, _logs.log)("apdu-error", String(e));
        return Promise.reject(e);
      }
    }

  }

  TransportReplayer.isSupported = () => Promise.resolve(true);

  TransportReplayer.list = () => Promise.resolve([null]);

  TransportReplayer.listen = o => {
    let unsubscribed;
    setTimeout(() => {
      if (unsubscribed) return;
      o.next({
        type: "add",
        descriptor: null
      });
      o.complete();
    }, 0);
    return {
      unsubscribe: () => {
        unsubscribed = true;
      }
    };
  };

  TransportReplayer.open = () => Promise.resolve(new TransportReplayer());

  return TransportReplayer;
};

var _default = createTransportReplayer;
exports.default = _default;
//# sourceMappingURL=createTransportReplayer.js.map