import Transport from "@ledgerhq/hw-transport";

/**
 * decorate a real transport and proxy it to record the APDUs.
 * @param {Class<Transport<*>>} DecoratedTransport: an actual transport class. Like @ledgerhq/hw-transport-webusb
 * @param {RecordStore} recordStore: a record store to record the apdu in.
 */
const createTransportRecorder = (DecoratedTransport, recordStore) => {
  class TransportRecorder extends Transport {
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

export default createTransportRecorder;
//# sourceMappingURL=createTransportRecorder.js.map