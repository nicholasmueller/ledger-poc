"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _errors = require("@ledgerhq/errors");

var _scrambling = require("@ledgerhq/devices/lib/scrambling");

var _logs = require("@ledgerhq/logs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const attemptExchange = (apdu, timeout, scrambleKey) => {
  if (!scrambleKey) {
    throw new _errors.TransportError("transport.setScrambleKey must be used to set a scramble key. Refer to documentation.", "NoScrambleKey");
  }

  if (!navigator.credentials) {
    throw new _errors.TransportError("WebAuthn not supported", "NotSupported");
  }

  return navigator.credentials // $FlowFixMe
  .get({
    publicKey: {
      timeout,
      challenge: new Uint8Array(32),
      allowCredentials: [{
        type: "public-key",
        id: new Uint8Array((0, _scrambling.wrapApdu)(apdu, scrambleKey))
      }]
    }
  }) // $FlowFixMe
  .then(r => Buffer.from(r.response.signature));
};
/**
 * WebAuthn Transport implementation
 * @example
 * import TransportWebAuthn from "@ledgerhq/hw-transport-webauthn";
 * ...
 * TransportWebAuthn.create().then(transport => ...)
 */


class TransportWebAuthn extends _hwTransport.default {
  constructor(...args) {
    super(...args);
    this.scrambleKey = void 0;
  }

  static async open() {
    return new TransportWebAuthn();
  }
  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */


  async exchange(apdu) {
    (0, _logs.log)("apdu", "=> " + apdu.toString("hex"));
    const res = await attemptExchange(apdu, this.exchangeTimeout, this.scrambleKey);
    (0, _logs.log)("apdu", "<= " + res.toString("hex"));
    return res;
  }
  /**
   * A scramble key is a string that xor the data exchanged.
   * It depends on the device app you need to exchange with.
   * For instance it can be "BTC" for the bitcoin app, "B0L0S" for the dashboard.
   *
   * @example
   * transport.setScrambleKey("B0L0S")
   */


  setScrambleKey(scrambleKey) {
    this.scrambleKey = Buffer.from(scrambleKey, "ascii");
  }

  close() {
    return Promise.resolve();
  }

}

exports.default = TransportWebAuthn;

TransportWebAuthn.isSupported = () => Promise.resolve(!!navigator.credentials);

TransportWebAuthn.list = () => navigator.credentials ? [null] : [];

TransportWebAuthn.listen = observer => {
  setTimeout(() => {
    if (!navigator.credentials) {
      observer.error(new _errors.TransportError("WebAuthn not supported", "NotSupported"));
      return {
        unsubscribe: () => {}
      };
    }

    observer.next({
      type: "add",
      descriptor: null
    });
    observer.complete();
  }, 0);
  return {
    unsubscribe: () => {}
  };
};
//# sourceMappingURL=TransportWebAuthn.js.map