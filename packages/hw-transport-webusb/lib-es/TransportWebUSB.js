import Transport from "@ledgerhq/hw-transport";
import hidFraming from "@ledgerhq/devices/lib/hid-framing";
import { identifyUSBProductId } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import { TransportOpenUserCancelled, TransportInterfaceNotAvailable, TransportWebUSBGestureRequired, DisconnectedDeviceDuringOperation, DisconnectedDevice } from "@ledgerhq/errors";
import { getLedgerDevices, getFirstLedgerDevice, requestLedgerDevice, isSupported } from "./webusb";
const configurationValue = 1;
const endpointNumber = 3;
/**
 * WebUSB Transport implementation
 * @example
 * import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
 * ...
 * TransportWebUSB.create().then(transport => ...)
 */

export default class TransportWebUSB extends Transport {
  constructor(device, interfaceNumber) {
    super();
    this.device = void 0;
    this.deviceModel = void 0;
    this.channel = Math.floor(Math.random() * 0xffff);
    this.packetSize = 64;
    this.interfaceNumber = void 0;
    this._disconnectEmitted = false;

    this._emitDisconnect = e => {
      if (this._disconnectEmitted) return;
      this._disconnectEmitted = true;
      this.emit("disconnect", e);
    };

    this.exchange = apdu => this.exchangeAtomicImpl(async () => {
      const {
        channel,
        packetSize
      } = this;
      log("apdu", "=> " + apdu.toString("hex"));
      const framing = hidFraming(channel, packetSize); // Write...

      const blocks = framing.makeBlocks(apdu);

      for (let i = 0; i < blocks.length; i++) {
        await this.device.transferOut(endpointNumber, blocks[i]);
      } // Read...


      let result;
      let acc;

      while (!(result = framing.getReducedResult(acc))) {
        const r = await this.device.transferIn(endpointNumber, packetSize);
        const buffer = Buffer.from(r.data.buffer);
        acc = framing.reduceResponse(acc, buffer);
      }

      log("apdu", "<= " + result.toString("hex"));
      return result;
    }).catch(e => {
      if (e && e.message && e.message.includes("disconnected")) {
        this._emitDisconnect(e);

        throw new DisconnectedDeviceDuringOperation(e.message);
      }

      throw e;
    });

    this.device = device;
    this.interfaceNumber = interfaceNumber;
    this.deviceModel = identifyUSBProductId(device.productId);
  }
  /**
   * Check if WebUSB transport is supported.
   */


  /**
   * Similar to create() except it will always display the device permission (even if some devices are already accepted).
   */
  static async request() {
    const device = await requestLedgerDevice();
    return TransportWebUSB.open(device);
  }
  /**
   * Similar to create() except it will never display the device permission (it returns a Promise<?Transport>, null if it fails to find a device).
   */


  static async openConnected() {
    const devices = await getLedgerDevices();
    if (devices.length === 0) return null;
    return TransportWebUSB.open(devices[0]);
  }
  /**
   * Create a Ledger transport with a USBDevice
   */


  static async open(device) {
    await device.open();

    if (device.configuration === null) {
      await device.selectConfiguration(configurationValue);
    }

    await device.reset();
    const iface = device.configurations[0].interfaces.find(({
      alternates
    }) => alternates.some(a => a.interfaceClass === 255));

    if (!iface) {
      throw new TransportInterfaceNotAvailable("No WebUSB interface found for your Ledger device. Please upgrade firmware or contact techsupport.");
    }

    const interfaceNumber = iface.interfaceNumber;

    try {
      await device.claimInterface(interfaceNumber);
    } catch (e) {
      await device.close();
      throw new TransportInterfaceNotAvailable(e.message);
    }

    const transport = new TransportWebUSB(device, interfaceNumber);

    const onDisconnect = e => {
      if (device === e.device) {
        // $FlowFixMe
        navigator.usb.removeEventListener("disconnect", onDisconnect);

        transport._emitDisconnect(new DisconnectedDevice());
      }
    }; // $FlowFixMe


    navigator.usb.addEventListener("disconnect", onDisconnect);
    return transport;
  }

  /**
   * Release the transport device
   */
  async close() {
    await this.exchangeBusyPromise;
    await this.device.releaseInterface(this.interfaceNumber);
    await this.device.reset();
    await this.device.close();
  }
  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */


  setScrambleKey() {}

}
TransportWebUSB.isSupported = isSupported;
TransportWebUSB.list = getLedgerDevices;

TransportWebUSB.listen = observer => {
  let unsubscribed = false;
  getFirstLedgerDevice().then(device => {
    if (!unsubscribed) {
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "add",
        descriptor: device,
        deviceModel
      });
      observer.complete();
    }
  }, error => {
    if (window.DOMException && error instanceof window.DOMException && error.code === 18) {
      observer.error(new TransportWebUSBGestureRequired(error.message));
    } else {
      observer.error(new TransportOpenUserCancelled(error.message));
    }
  });

  function unsubscribe() {
    unsubscribed = true;
  }

  return {
    unsubscribe
  };
};
//# sourceMappingURL=TransportWebUSB.js.map