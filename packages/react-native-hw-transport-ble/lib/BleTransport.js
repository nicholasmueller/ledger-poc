"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setReconnectionConfig = setReconnectionConfig;
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _reactNativeBlePlx = require("react-native-ble-plx");

var _devices = require("@ledgerhq/devices");

var _sendAPDU = require("@ledgerhq/devices/lib/ble/sendAPDU");

var _receiveAPDU = require("@ledgerhq/devices/lib/ble/receiveAPDU");

var _logs = require("@ledgerhq/logs");

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _errors = require("@ledgerhq/errors");

var _monitorCharacteristic = require("./monitorCharacteristic");

var _awaitsBleOn = require("./awaitsBleOn");

var _remapErrors = require("./remapErrors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable prefer-template */
let connectOptions = {
  requestMTU: 156
};
const transportsCache = {};
const bleManager = new _reactNativeBlePlx.BleManager();

const retrieveInfos = device => {
  if (!device || !device.serviceUUIDs) return;
  const [serviceUUID] = device.serviceUUIDs;
  if (!serviceUUID) return;
  const infos = (0, _devices.getInfosForServiceUuid)(serviceUUID);
  if (!infos) return;
  return infos;
};

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

    (0, _logs.log)("ble-verbose", `open(${deviceOrId})`);
    await (0, _awaitsBleOn.awaitsBleOn)(bleManager);

    if (!device) {
      // works for iOS but not Android
      const devices = await bleManager.devices([deviceOrId]);
      (0, _logs.log)("ble-verbose", `found ${devices.length} devices`);
      [device] = devices;
    }

    if (!device) {
      const connectedDevices = await bleManager.connectedDevices((0, _devices.getBluetoothServiceUuids)());
      const connectedDevicesFiltered = connectedDevices.filter(d => d.id === deviceOrId);
      (0, _logs.log)("ble-verbose", `found ${connectedDevicesFiltered.length} connected devices`);
      [device] = connectedDevicesFiltered;
    }

    if (!device) {
      (0, _logs.log)("ble-verbose", `connectToDevice(${deviceOrId})`);

      try {
        device = await bleManager.connectToDevice(deviceOrId, connectOptions);
      } catch (e) {
        if (e.errorCode === _reactNativeBlePlx.BleErrorCode.DeviceMTUChangeFailed) {
          // eslint-disable-next-line require-atomic-updates
          connectOptions = {};
          device = await bleManager.connectToDevice(deviceOrId);
        } else {
          throw e;
        }
      }
    }

    if (!device) {
      throw new _errors.CantOpenDevice();
    }
  } else {
    device = deviceOrId;
  }

  if (!(await device.isConnected())) {
    (0, _logs.log)("ble-verbose", "not connected. connecting...");

    try {
      await device.connect(connectOptions);
    } catch (e) {
      if (e.errorCode === _reactNativeBlePlx.BleErrorCode.DeviceMTUChangeFailed) {
        // eslint-disable-next-line require-atomic-updates
        connectOptions = {};
        await device.connect();
      } else {
        throw e;
      }
    }
  }

  await device.discoverAllServicesAndCharacteristics();
  let res = retrieveInfos(device);
  let characteristics;

  if (!res) {
    for (const uuid of (0, _devices.getBluetoothServiceUuids)()) {
      try {
        characteristics = await device.characteristicsForService(uuid);
        res = (0, _devices.getInfosForServiceUuid)(uuid);
        break;
      } catch (e) {// we attempt to connect to service
      }
    }
  }

  if (!res) {
    throw new _errors.TransportError("service not found", "BLEServiceNotFound");
  }

  const {
    deviceModel,
    serviceUuid,
    writeUuid,
    notifyUuid
  } = res;

  if (!characteristics) {
    characteristics = await device.characteristicsForService(serviceUuid);
  }

  if (!characteristics) {
    throw new _errors.TransportError("service not found", "BLEServiceNotFound");
  }

  let writeC;
  let notifyC;

  for (const c of characteristics) {
    if (c.uuid === writeUuid) {
      writeC = c;
    } else if (c.uuid === notifyUuid) {
      notifyC = c;
    }
  }

  if (!writeC) {
    throw new _errors.TransportError("write characteristic not found", "BLEChracteristicNotFound");
  }

  if (!notifyC) {
    throw new _errors.TransportError("notify characteristic not found", "BLEChracteristicNotFound");
  }

  if (!writeC.isWritableWithResponse) {
    throw new _errors.TransportError("write characteristic not writableWithResponse", "BLEChracteristicInvalid");
  }

  if (!notifyC.isNotifiable) {
    throw new _errors.TransportError("notify characteristic not notifiable", "BLEChracteristicInvalid");
  }

  (0, _logs.log)("ble-verbose", `device.mtu=${device.mtu}`);
  const notifyObservable = (0, _monitorCharacteristic.monitorCharacteristic)(notifyC).pipe((0, _operators.tap)(value => {
    (0, _logs.log)("ble-frame", "<= " + value.toString("hex"));
  }), (0, _operators.share)());
  const notif = notifyObservable.subscribe();
  const transport = new BluetoothTransport(device, writeC, notifyObservable, deviceModel);

  const onDisconnect = e => {
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub.remove();
    delete transportsCache[transport.id];
    (0, _logs.log)("ble-verbose", `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  }; // eslint-disable-next-line require-atomic-updates


  transportsCache[transport.id] = transport;
  const disconnectedSub = device.onDisconnected(e => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });
  let beforeMTUTime = Date.now();

  try {
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
        await BluetoothTransport.disconnect(transport.id).catch(() => {});
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
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
 */


class BluetoothTransport extends _hwTransport.default {
  /**
   *
   */

  /**
   *
   */

  /**
   * TODO could add this concept in all transports
   * observe event with { available: bool, string } // available is generic, type is specific
   * an event is emit once and then listened
   */
  static observeState(observer) {
    const emitFromState = type => {
      observer.next({
        type,
        available: type === "PoweredOn"
      });
    };

    bleManager.onStateChange(emitFromState, true);
    return {
      unsubscribe: () => {}
    };
  }

  /**
   * Scan for bluetooth Ledger devices
   */
  static listen(observer) {
    (0, _logs.log)("ble-verbose", "listen...");
    let unsubscribed; // $FlowFixMe

    const stateSub = bleManager.onStateChange(async state => {
      if (state === "PoweredOn") {
        stateSub.remove();
        const devices = await bleManager.connectedDevices((0, _devices.getBluetoothServiceUuids)());
        if (unsubscribed) return;
        await Promise.all(devices.map(d => BluetoothTransport.disconnect(d.id).catch(() => {})));
        if (unsubscribed) return;
        bleManager.startDeviceScan((0, _devices.getBluetoothServiceUuids)(), null, (bleError, device) => {
          if (bleError) {
            observer.error(bleError);
            unsubscribe();
            return;
          }

          const res = retrieveInfos(device);
          const deviceModel = res && res.deviceModel;
          observer.next({
            type: "add",
            descriptor: device,
            deviceModel
          });
        });
      }
    }, true);

    const unsubscribe = () => {
      unsubscribed = true;
      bleManager.stopDeviceScan();
      stateSub.remove();
      (0, _logs.log)("ble-verbose", "done listening.");
    };

    return {
      unsubscribe
    };
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
        const data = await (0, _rxjs.merge)( // $FlowFixMe
        this.notifyObservable.pipe(_receiveAPDU.receiveAPDU), (0, _sendAPDU.sendAPDU)(this.write, apdu, this.mtuSize)).toPromise();
        const msgOut = data.toString("hex");
        (0, _logs.log)("apdu", `<= ${msgOut}`);
        return data;
      } catch (e) {
        (0, _logs.log)("ble-error", "exchange got " + String(e));

        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
        }

        throw (0, _remapErrors.remapError)(e);
      }
    });

    this.write = async (buffer, txid) => {
      (0, _logs.log)("ble-frame", "=> " + buffer.toString("hex"));

      try {
        await this.writeCharacteristic.writeWithResponse(buffer.toString("base64"), txid);
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
        await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.

        throw (0, _remapErrors.remapError)(e);
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      (0, _logs.log)("ble-verbose", `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`);
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  async requestConnectionPriority(connectionPriority) {
    await (0, _remapErrors.decoratePromiseErrors)(this.device.requestConnectionPriority(_reactNativeBlePlx.ConnectionPriority[connectionPriority]));
  }

  setScrambleKey() {}

  async close() {
    if (this.exchangeBusyPromise) {
      await this.exchangeBusyPromise;
    }
  }

}

exports.default = BluetoothTransport;

BluetoothTransport.isSupported = () => Promise.resolve(typeof _reactNativeBlePlx.BleManager === "function");

BluetoothTransport.setLogLevel = level => {
  bleManager.setLogLevel(level);
};

BluetoothTransport.list = () => {
  throw new Error("not implemented");
};

BluetoothTransport.disconnect = async id => {
  (0, _logs.log)("ble-verbose", `user disconnect(${id})`);
  await bleManager.cancelDeviceConnection(id);
};
//# sourceMappingURL=BleTransport.js.map