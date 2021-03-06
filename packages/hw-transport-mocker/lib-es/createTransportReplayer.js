import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";

/**
 * create a transport replayer with a record store.
 * @param recordStore
 */
const createTransportReplayer = recordStore => {
  class TransportReplayer extends Transport {
    setScrambleKey() {}

    close() {
      return Promise.resolve();
    }

    exchange(apdu) {
      log("apdu", apdu.toString("hex"));

      try {
        const buffer = recordStore.replayExchange(apdu);
        log("apdu", buffer.toString("hex"));
        return Promise.resolve(buffer);
      } catch (e) {
        log("apdu-error", String(e));
        return Promise.reject(e);
      }
    }

  }

  TransportReplayer.isSupported = () => Promise.resolve(true);

  TransportReplayer.list = () => Promise.resolve([null]);

  TransportReplayer.listen = o => {
    let unsubscribed;
    setTimeout(() => {
      if (unsubscribed) return;
      o.next({
        type: "add",
        descriptor: null
      });
      o.complete();
    }, 0);
    return {
      unsubscribe: () => {
        unsubscribed = true;
      }
    };
  };

  TransportReplayer.open = () => Promise.resolve(new TransportReplayer());

  return TransportReplayer;
};

export default createTransportReplayer;
//# sourceMappingURL=createTransportReplayer.js.map