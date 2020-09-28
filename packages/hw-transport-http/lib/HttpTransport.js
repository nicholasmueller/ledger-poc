"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _errors = require("@ledgerhq/errors");

var _axios = _interopRequireDefault(require("axios"));

var _logs = require("@ledgerhq/logs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * HTTP transport implementation
 */
class HttpTransport extends _hwTransport.default {
  // this transport is not discoverable
  static async open(url, timeout) {
    await HttpTransport.check(url, timeout);
    return new HttpTransport(url);
  }

  constructor(url) {
    super();
    this.url = void 0;
    this.url = url;
  }

  async exchange(apdu) {
    const apduHex = apdu.toString("hex");
    (0, _logs.log)("apdu", "=> " + apduHex);
    const response = await (0, _axios.default)({
      method: "POST",
      url: this.url,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        apduHex
      })
    });

    if (response.status !== 200) {
      throw new _errors.TransportError("failed to communicate to server. code=" + response.status, "HttpTransportStatus" + response.status);
    }

    const body = await response.data;
    if (body.error) throw body.error;
    (0, _logs.log)("apdu", "<= " + body.data);
    return Buffer.from(body.data, "hex");
  }

  setScrambleKey() {}

  close() {
    return Promise.resolve();
  }

}

exports.default = HttpTransport;

HttpTransport.isSupported = () => Promise.resolve(typeof fetch === "function");

HttpTransport.list = () => Promise.resolve([]);

HttpTransport.listen = _observer => ({
  unsubscribe: () => {}
});

HttpTransport.check = async (url, timeout = 5000) => {
  const response = await (0, _axios.default)({
    url,
    timeout
  });

  if (response.status !== 200) {
    throw new _errors.TransportError("failed to access HttpTransport(" + url + "): status " + response.status, "HttpTransportNotAccessible");
  }
};
//# sourceMappingURL=HttpTransport.js.map