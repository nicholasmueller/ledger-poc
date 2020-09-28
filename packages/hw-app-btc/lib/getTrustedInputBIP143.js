"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTrustedInputBIP143 = getTrustedInputBIP143;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _sha = _interopRequireDefault(require("sha.js"));

var _serializeTransaction = require("./serializeTransaction");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getTrustedInputBIP143(transport, indexLookup, transaction, additionals = []) {
  if (!transaction) {
    throw new Error("getTrustedInputBIP143: missing tx");
  }

  const isDecred = additionals.includes("decred");

  if (isDecred) {
    throw new Error("Decred does not implement BIP143");
  }

  let hash = (0, _sha.default)("sha256").update((0, _sha.default)("sha256").update((0, _serializeTransaction.serializeTransaction)(transaction, true)).digest()).digest();
  const data = Buffer.alloc(4);
  data.writeUInt32LE(indexLookup, 0);
  const {
    outputs,
    locktime
  } = transaction;

  if (!outputs || !locktime) {
    throw new Error("getTrustedInputBIP143: locktime & outputs is expected");
  }

  if (!outputs[indexLookup]) {
    throw new Error("getTrustedInputBIP143: wrong index");
  }

  hash = Buffer.concat([hash, data, outputs[indexLookup].amount]);
  return hash.toString("hex");
}
//# sourceMappingURL=getTrustedInputBIP143.js.map