"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactNative = require("react-native");

var _devices = require("@ledgerhq/devices");

var _errors = require("@ledgerhq/errors");

var _logs = require("@ledgerhq/logs");

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const disconnectedErrors = ["I/O error", "Attempt to invoke virtual method 'int android.hardware.usb.UsbDevice.getDeviceClass()' on a null object reference"];

const listLedgerDevices = async () => {
  const devices = await _reactNative.NativeModules.HID.getDeviceList();
  return devices.filter(d => d.vendorId === _devices.ledgerUSBVendorId);
};

const liveDeviceEventsSubject = new _rxjs.Subject();

_reactNative.DeviceEventEmitter.addListener("onDeviceConnect", device => {
  if (device.vendorId !== _devices.ledgerUSBVendorId) return;
  const deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
  liveDeviceEventsSubject.next({
    type: "add",
    descriptor: device,
    deviceModel
  });
});

_reactNative.DeviceEventEmitter.addListener("onDeviceDisconnect", device => {
  if (device.vendorId !== _devices.ledgerUSBVendorId) return;
  const deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
  liveDeviceEventsSubject.next({
    type: "remove",
    descriptor: device,
    deviceModel
  });
});

const liveDeviceEvents = liveDeviceEventsSubject;
/**
 * Ledger's React Native HID Transport implementation
 * @example
 * import TransportHID from "@ledgerhq/react-native-hid";
 * ...
 * TransportHID.create().then(transport => ...)
 */

class HIDTransport extends _hwTransport.default {
  constructor(nativeId, productId) {
    super();
    this.id = void 0;
    this.deviceModel = void 0;
    this.id = nativeId;
    this.deviceModel = (0, _devices.identifyUSBProductId)(productId);
  }
  /**
   * Check if the transport is supported (basically true on Android)
   */


  /**
   * List currently connected devices.
   * @returns Promise of devices
   */
  static async list() {
    if (!_reactNative.NativeModules.HID) return Promise.resolve([]);
    let list = await listLedgerDevices();
    return list;
  }
  /**
   * Listen to ledger devices events
   */


  static listen(observer) {
    if (!_reactNative.NativeModules.HID) return {
      unsubscribe: () => {}
    };
    return (0, _rxjs.concat)((0, _rxjs.from)(listLedgerDevices()).pipe((0, _operators.mergeMap)(devices => (0, _rxjs.from)(devices.map(device => ({
      type: "add",
      descriptor: device,
      deviceModel: (0, _devices.identifyUSBProductId)(device.productId)
    }))))), liveDeviceEvents).subscribe(observer);
  }
  /**
   * Open a the transport with a Ledger device
   */


  static async open(deviceObj) {
    try {
      const nativeObj = await _reactNative.NativeModules.HID.openDevice(deviceObj);
      return new HIDTransport(nativeObj.id, deviceObj.productId);
    } catch (error) {
      if (disconnectedErrors.includes(error.message)) {
        throw new _errors.DisconnectedDevice(error.message);
      }

      throw error;
    }
  }
  /**
   * @param {*} apdu input value
   * @returns Promise of apdu response
   */


  async exchange(apdu) {
    return this.exchangeAtomicImpl(async () => {
      try {
        const apduHex = apdu.toString("hex");
        (0, _logs.log)("apdu", "=> " + apduHex);
        const resultHex = await _reactNative.NativeModules.HID.exchange(this.id, apduHex);
        const res = Buffer.from(resultHex, "hex");
        (0, _logs.log)("apdu", "<= " + resultHex);
        return res;
      } catch (error) {
        if (disconnectedErrors.includes(error.message)) {
          this.emit("disconnect", error);
          throw new _errors.DisconnectedDeviceDuringOperation(error.message);
        }

        throw error;
      }
    });
  }
  /**
   * Close the transport
   * @returns Promise
   */


  async close() {
    await this.exchangeBusyPromise;
    return _reactNative.NativeModules.HID.closeDevice(this.id);
  }

  setScrambleKey() {}

}

exports.default = HIDTransport;

HIDTransport.isSupported = () => Promise.resolve(!!_reactNative.NativeModules.HID);
//# sourceMappingURL=index.js.map