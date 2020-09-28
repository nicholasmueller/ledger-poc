import { NativeModules, DeviceEventEmitter } from "react-native";
import { ledgerUSBVendorId, identifyUSBProductId } from "@ledgerhq/devices";
import { DisconnectedDeviceDuringOperation, DisconnectedDevice } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import { Subject, from, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";
const disconnectedErrors = ["I/O error", "Attempt to invoke virtual method 'int android.hardware.usb.UsbDevice.getDeviceClass()' on a null object reference"];

const listLedgerDevices = async () => {
  const devices = await NativeModules.HID.getDeviceList();
  return devices.filter(d => d.vendorId === ledgerUSBVendorId);
};

const liveDeviceEventsSubject = new Subject();
DeviceEventEmitter.addListener("onDeviceConnect", device => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "add",
    descriptor: device,
    deviceModel
  });
});
DeviceEventEmitter.addListener("onDeviceDisconnect", device => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);
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

export default class HIDTransport extends Transport {
  constructor(nativeId, productId) {
    super();
    this.id = void 0;
    this.deviceModel = void 0;
    this.id = nativeId;
    this.deviceModel = identifyUSBProductId(productId);
  }
  /**
   * Check if the transport is supported (basically true on Android)
   */


  /**
   * List currently connected devices.
   * @returns Promise of devices
   */
  static async list() {
    if (!NativeModules.HID) return Promise.resolve([]);
    let list = await listLedgerDevices();
    return list;
  }
  /**
   * Listen to ledger devices events
   */


  static listen(observer) {
    if (!NativeModules.HID) return {
      unsubscribe: () => {}
    };
    return concat(from(listLedgerDevices()).pipe(mergeMap(devices => from(devices.map(device => ({
      type: "add",
      descriptor: device,
      deviceModel: identifyUSBProductId(device.productId)
    }))))), liveDeviceEvents).subscribe(observer);
  }
  /**
   * Open a the transport with a Ledger device
   */


  static async open(deviceObj) {
    try {
      const nativeObj = await NativeModules.HID.openDevice(deviceObj);
      return new HIDTransport(nativeObj.id, deviceObj.productId);
    } catch (error) {
      if (disconnectedErrors.includes(error.message)) {
        throw new DisconnectedDevice(error.message);
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
        log("apdu", "=> " + apduHex);
        const resultHex = await NativeModules.HID.exchange(this.id, apduHex);
        const res = Buffer.from(resultHex, "hex");
        log("apdu", "<= " + resultHex);
        return res;
      } catch (error) {
        if (disconnectedErrors.includes(error.message)) {
          this.emit("disconnect", error);
          throw new DisconnectedDeviceDuringOperation(error.message);
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
    return NativeModules.HID.closeDevice(this.id);
  }

  setScrambleKey() {}

}

HIDTransport.isSupported = () => Promise.resolve(!!NativeModules.HID);
//# sourceMappingURL=index.js.map