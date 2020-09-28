"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setReconnectionConfig = setReconnectionConfig;
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _sendAPDU = require("@ledgerhq/devices/lib/ble/sendAPDU");

var _receiveAPDU = require("@ledgerhq/devices/lib/ble/receiveAPDU");

var _logs = require("@ledgerhq/logs");

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _errors = require("@ledgerhq/errors");

var _platform = require("./platform");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable prefer-template */
const transportsCache = {};
let reconnectionConfig = {
  pairingThreshold: 1000,
  delayAfterFirstPairing: 4000
};

function setReconnectionConfig(config) {
  reconnectionConfig = config;
}

const delay = ms => new Promise(success => setTimeout(success, ms));

async function open(deviceOrId, needsReconnect) {
  let device;

  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      (0, _logs.log)("ble-verbose", "Transport in cache, using that.");
      return transportsCache[deviceOrId];
    }
  } else {
    device = deviceOrId;
  }

  if (!device) {
    throw new _errors.CantOpenDevice();
  }

  await _platform.availability.pipe((0, _operators.first)(enabled => enabled)).toPromise();

  if ((0, _platform.isDeviceDisconnected)(device)) {
    (0, _logs.log)("ble-verbose", "not connected. connecting...");
    await (0, _platform.connectDevice)(device);
  }

  const {
    notifyC,
    writeC,
    deviceModel
  } = await (0, _platform.retrieveServiceAndCharacteristics)(device);
  const [observable, monitoringReady] = (0, _platform.monitorCharacteristic)(notifyC);
  const notifyObservable = observable.pipe((0, _operators.tap)(value => {
    (0, _logs.log)("ble-frame", "<= " + value.toString("hex"));
  }), (0, _operators.share)());
  const notif = notifyObservable.subscribe();
  const transport = new BluetoothTransport(device, writeC, notifyObservable, deviceModel);

  const onDisconnect = e => {
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub();
    delete transportsCache[transport.id];
    (0, _logs.log)("ble-verbose", `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  }; // eslint-disable-next-line require-atomic-updates


  transportsCache[transport.id] = transport;
  const disconnectedSub = (0, _platform.listenDeviceDisconnect)(device, e => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });
  let beforeMTUTime = Date.now();

  try {
    await monitoringReady;
    await transport.inferMTU();
  } finally {
    let afterMTUTime = Date.now();

    if (reconnectionConfig) {
      // workaround for #279: we need to open() again if we come the first time here,
      // to make sure we do a disconnect() after the first pairing time
      // because of a firmware bug
      if (afterMTUTime - beforeMTUTime < reconnectionConfig.pairingThreshold) {
        needsReconnect = false; // (optim) there is likely no new pairing done because mtu answer was fast.
      }

      if (needsReconnect) {
        // necessary time for the bonding workaround
        await (0, _platform.disconnectDevice)(device).catch(() => {});
        await delay(reconnectionConfig.delayAfterFirstPairing);
      }
    } else {
      needsReconnect = false;
    }
  }

  if (needsReconnect) {
    return open(device, false);
  }

  return transport;
}
/**
 * TransportNodeBle bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/hw-transport-node-ble";
 */


class BluetoothTransport extends _hwTransport.default {
  /**
   *
   */

  /**
   *
   */

  /**
   * Scan for bluetooth Ledger devices
   */
  static listen(observer) {
    (0, _logs.log)("ble-verbose", "listen...");
    return (0, _platform.listen)().subscribe(observer);
  }
  /**
   * Open a BLE transport
   * @param {*} deviceOrId
   */


  static async open(deviceOrId) {
    return open(deviceOrId, true);
  }
  /**
   * Globally disconnect a BLE device by its ID
   */


  constructor(device, writeCharacteristic, notifyObservable, deviceModel) {
    super();
    this.id = void 0;
    this.device = void 0;
    this.mtuSize = 20;
    this.writeCharacteristic = void 0;
    this.notifyObservable = void 0;
    this.deviceModel = void 0;
    this.notYetDisconnected = true;

    this.exchange = apdu => this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        (0, _logs.log)("apdu", `=> ${msgIn}`);
        const data = await (0, _rxjs.merge)(this.notifyObservable.pipe(_receiveAPDU.receiveAPDU), (0, _sendAPDU.sendAPDU)(this.write, apdu, this.mtuSize)).toPromise();
        const msgOut = data.toString("hex");
        (0, _logs.log)("apdu", `<= ${msgOut}`);
        return data;
      } catch (e) {
        (0, _logs.log)("ble-error", "exchange got " + String(e));

        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await (0, _platform.disconnectDevice)(this.device).catch(() => {}); // but we ignore if disconnect worked.
        }

        throw e;
      }
    });

    this.write = async buffer => {
      (0, _logs.log)("ble-frame", "=> " + buffer.toString("hex"));

      try {
        await (0, _platform.write)(this.writeCharacteristic, buffer);
      } catch (e) {
        throw new _errors.DisconnectedDeviceDuringOperation(e.message);
      }
    };

    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;
    (0, _logs.log)("ble-verbose", `BleTransport(${String(this.id)}) new instance`);
  }
  /**
   * communicate with a BLE transport
   */


  // TODO we probably will do this at end of open
  async inferMTU() {
    let {
      mtu
    } = this.device;
    await this.exchangeAtomicImpl(async () => {
      try {
        mtu = (await (0, _rxjs.merge)(this.notifyObservable.pipe((0, _operators.first)(buffer => buffer.readUInt8(0) === 0x08), (0, _operators.map)(buffer => buffer.readUInt8(5))), (0, _rxjs.defer)(() => (0, _rxjs.from)(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe((0, _operators.ignoreElements)())).toPromise()) + 3;
      } catch (e) {
        (0, _logs.log)("ble-error", "inferMTU got " + String(e));
        await (0, _platform.disconnectDevice)(this.device).catch(() => {}); // but we ignore if disconnect worked.

        throw e;
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      (0, _logs.log)("ble-verbose", `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`);
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  setScrambleKey() {}

  async close() {
    if (this.exchangeBusyPromise) {
      await this.exchangeBusyPromise;
    }
  }

}

exports.default = BluetoothTransport;

BluetoothTransport.isSupported = () => Promise.resolve(true);

BluetoothTransport.availability = _platform.availability;

BluetoothTransport.list = () => {
  throw new Error("not implemented");
};

BluetoothTransport.disconnect = async id => {
  (0, _logs.log)("ble-verbose", `user disconnect(${id})`);

  if (id in transportsCache) {
    (0, _platform.disconnectDevice)(transportsCache[id].device);
  }
};
//# sourceMappingURL=TransportNodeBle.js.map