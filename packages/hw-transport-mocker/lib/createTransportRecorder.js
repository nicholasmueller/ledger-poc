"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * decorate a real transport and proxy it to record the APDUs.
 * @param {Class<Transport<*>>} DecoratedTransport: an actual transport class. Like @ledgerhq/hw-transport-webusb
 * @param {RecordStore} recordStore: a record store to record the apdu in.
 */
const createTransportRecorder = (DecoratedTransport, recordStore) => {
  class TransportRecorder extends _hwTransport.default {
    setScrambleKey() {}

    close() {
      return this.transport.close();
    }

    constructor(t) {
      super();
      this.transport = void 0;
      this.transport = t;
    }

    exchange(apdu) {
      const output = this.transport.exchange(apdu);
      output.then(out => {
        recordStore.recordExchange(apdu, out);
      });
      return output;
    }

  }

  TransportRecorder.recordStore = recordStore;
  TransportRecorder.isSupported = DecoratedTransport.isSupported;
  TransportRecorder.list = DecoratedTransport.list;
  TransportRecorder.listen = DecoratedTransport.listen;

  TransportRecorder.open = (...args) => DecoratedTransport.open(...args).then(t => new TransportRecorder(t));

  return TransportRecorder;
};

var _default = createTransportRecorder;
exports.default = _default;
//# sourceMappingURL=createTransportRecorder.js.map