"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rxjs = require("rxjs");

var _net = _interopRequireDefault(require("net"));

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _errors = require("@ledgerhq/errors");

var _logs = require("@ledgerhq/logs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Speculos TCP transport implementation
 *
 * @example
 * import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
 * const transport = await SpeculosTransport.open({ apduPort });
 * const res = await transport.send(0xE0, 0x01, 0, 0);
 */
class SpeculosTransport extends _hwTransport.default {
  // this transport is not discoverable

  /**
   *
   */
  constructor(apduSocket, opts) {
    super();
    this.apduSocket = void 0;
    this.opts = void 0;

    this.rejectExchange = _e => {};

    this.resolveExchange = _b => {};

    this.automationSocket = void 0;
    this.automationEvents = new _rxjs.Subject();

    this.button = command => new Promise((resolve, reject) => {
      (0, _logs.log)("speculos-button", command);
      const {
        buttonPort,
        host
      } = this.opts;
      if (!buttonPort) throw new Error("buttonPort is missing");
      const socket = new _net.default.Socket();
      socket.on("error", e => {
        socket.destroy();
        reject(e);
      });
      socket.connect(buttonPort, host || "127.0.0.1", () => {
        socket.write(Buffer.from(command, "ascii"));
        socket.destroy();
        resolve();
      });
    });

    this.opts = opts;
    this.apduSocket = apduSocket;
    apduSocket.on("error", e => {
      this.emit("disconnect", new _errors.DisconnectedDevice(e.message));
      this.rejectExchange(e);
      this.apduSocket.destroy();
    });
    apduSocket.on("end", () => {
      this.emit("disconnect", new _errors.DisconnectedDevice());
      this.rejectExchange(new _errors.DisconnectedDeviceDuringOperation());
    });
    apduSocket.on("data", data => {
      try {
        this.resolveExchange(decodeAPDUPayload(data));
      } catch (e) {
        this.rejectExchange(e);
      }
    });
    const {
      automationPort
    } = opts;

    if (automationPort) {
      const socket = new _net.default.Socket();
      this.automationSocket = socket;
      socket.on("error", e => {
        (0, _logs.log)("speculos-automation-error", String(e));
        socket.destroy();
      });
      socket.on("data", data => {
        (0, _logs.log)("speculos-automation-data", data);
        const split = data.toString("ascii").split("\n");
        split.filter(ascii => !!ascii).forEach(ascii => {
          const json = JSON.parse(ascii);
          this.automationEvents.next(json);
        });
      });
      socket.connect(automationPort, opts.host || "127.0.0.1");
    }
  }
  /**
   * Send a speculos button command
   * typically "Ll" would press and release the left button
   * typically "Rr" would press and release the right button
   * @param {*} command
   */


  async exchange(apdu) {
    const hex = apdu.toString("hex");
    (0, _logs.log)("apdu", "=> " + hex);
    const encoded = encodeAPDU(apdu);
    const res = await new Promise((resolve, reject) => {
      this.rejectExchange = reject;
      this.resolveExchange = resolve;
      this.apduSocket.write(encoded);
    });
    (0, _logs.log)("apdu", "<= " + res.toString("hex"));
    return res;
  }

  setScrambleKey() {}

  async close() {
    if (this.automationSocket) this.automationSocket.destroy();
    this.apduSocket.destroy();
    return Promise.resolve();
  }

}

exports.default = SpeculosTransport;

SpeculosTransport.isSupported = () => Promise.resolve(true);

SpeculosTransport.list = () => Promise.resolve([]);

SpeculosTransport.listen = _observer => ({
  unsubscribe: () => {}
});

SpeculosTransport.open = opts => new Promise((resolve, reject) => {
  const socket = new _net.default.Socket();
  socket.on("error", e => {
    socket.destroy();
    reject(e);
  });
  socket.on("end", () => {
    reject(new _errors.DisconnectedDevice("tcp closed"));
  });
  socket.connect(opts.apduPort, opts.host || "127.0.0.1", () => {
    // we delay a bit the transport creation to make sure the tcp does not hang up
    setTimeout(() => {
      resolve(new SpeculosTransport(socket, opts));
    }, 100);
  });
});

function encodeAPDU(apdu) {
  const size = Buffer.allocUnsafe(4);
  size.writeUIntBE(apdu.length, 0, 4);
  return Buffer.concat([size, apdu]);
}

function decodeAPDUPayload(data) {
  const dataLength = data.readUIntBE(0, 4); // 4 bytes tells the data length

  const size = dataLength + 2; // size does not include the status code so we add 2

  const payload = data.slice(4);

  if (payload.length !== size) {
    throw new _errors.TransportError(`Expected payload of length ${size} but got ${payload.length}`);
  }

  return payload;
}
//# sourceMappingURL=SpeculosTransport.js.map