/**
 * thrown by the RecordStore.fromString parser.
 */
export function RecordStoreInvalidSynthax(message) {
  this.name = "RecordStoreInvalidSynthax";
  this.message = message;
  this.stack = new Error().stack;
} //$FlowFixMe

RecordStoreInvalidSynthax.prototype = new Error();
/**
 * thrown by the replayer if the queue is empty
 */

export function RecordStoreQueueEmpty() {
  this.name = "RecordStoreQueueEmpty";
  this.message = "EOF: no more APDU to replay";
  this.stack = new Error().stack;
} //$FlowFixMe

RecordStoreQueueEmpty.prototype = new Error();
/**
 * thrown by replayer if it meets an unexpected apdu
 */

export function RecordStoreWrongAPDU(expected, got, line) {
  this.name = "RecordStoreWrongAPDU";
  this.message = `wrong apdu to replay line ${line}. Expected ${expected}, Got ${got}`;
  this.expectedAPDU = expected;
  this.gotAPDU = got;
  this.stack = new Error().stack;
} //$FlowFixMe

RecordStoreWrongAPDU.prototype = new Error();
/**
 * thrown by ensureQueueEmpty
 */

export function RecordStoreRemainingAPDU(expected) {
  this.name = "RecordStoreRemainingAPDU";
  this.message = `replay expected more APDUs to come:\n${expected}`;
  this.stack = new Error().stack;
} //$FlowFixMe

RecordStoreRemainingAPDU.prototype = new Error();
const defaultOpts = {
  autoSkipUnknownApdu: false,
  warning: log => console.warn(log)
};
/**
 * a RecordStore is a stateful object that represents a queue of APDUs.
 * It is both used by replayer and recorder transports and is the basic for writing Ledger tests with a mock device.
 */

export class RecordStore {
  constructor(queue, opts) {
    this.passed = 0;
    this.queue = void 0;
    this.opts = void 0;

    this.isEmpty = () => this.queue.length === 0;

    this.queue = queue || [];
    this.opts = { ...defaultOpts,
      ...opts
    };
  }
  /**
   * check if there is no more APDUs to replay
   */


  /**
   * Record an APDU (used by createTransportRecorder)
   * @param {Buffer} apdu input
   * @param {Buffer} out response
   */
  recordExchange(apdu, out) {
    this.queue.push([apdu.toString("hex"), out.toString("hex")]);
  }
  /**
   * Replay an APDU (used by createTransportReplayer)
   * @param apdu
   */


  replayExchange(apdu) {
    const {
      queue,
      opts
    } = this;
    const apduHex = apdu.toString("hex");

    for (let i = 0; i < queue.length; i++) {
      const head = queue[i];
      const line = 2 * (this.passed + i);

      if (apduHex === head[0]) {
        ++this.passed;
        this.queue = queue.slice(i + 1);
        return Buffer.from(head[1], "hex");
      } else {
        if (opts.autoSkipUnknownApdu) {
          opts.warning("skipped unmatched apdu (line " + line + " – expected " + head[0] + ")");
          ++this.passed;
        } else {
          throw new RecordStoreWrongAPDU(head[0], apduHex, line);
        }
      }
    }

    this.queue = [];
    throw new RecordStoreQueueEmpty();
  }
  /**
   * Check all APDUs was replayed. Throw if it's not the case.
   */


  ensureQueueEmpty() {
    if (!this.isEmpty()) {
      throw new RecordStoreRemainingAPDU(this.toString());
    }
  }
  /**
   * Print out the series of apdus
   */


  toString() {
    return this.queue.map(([send, receive]) => `=> ${send}\n<= ${receive}`).join("\n") + "\n";
  }
  /**
   * Create a RecordStore by parsing a string (a series of => HEX\n<= HEX)
   * @param {string} series of APDUs
   * @param {$Shape<RecordStoreOptions>} opts
   */


  static fromString(str, opts) {
    const queue = [];
    let value = [];
    str.split("\n").map(line => line.replace(/ /g, "")).filter(o => o).forEach(line => {
      if (value.length === 0) {
        const m = line.match(/^=>([0-9a-fA-F]+)$/);

        if (!m) {
          throw new RecordStoreInvalidSynthax("expected an apdu input");
        }

        value.push(m[1]);
      } else {
        const m = line.match(/^<=([0-9a-fA-F]+)$/);

        if (!m) {
          throw new RecordStoreInvalidSynthax("expected an apdu output");
        }

        value.push(m[1]);
        queue.push([value[0], value[1]]);
        value = [];
      }
    });

    if (value.length !== 0) {
      throw new RecordStoreInvalidSynthax("unexpected end of file");
    }

    return new RecordStore(queue, opts);
  }

}
//# sourceMappingURL=RecordStore.js.map