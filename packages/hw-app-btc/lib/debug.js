"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatTransactionDebug = formatTransactionDebug;
exports.displayTransactionDebug = displayTransactionDebug;

function formatTransactionDebug(transaction) {
  let str = "TX";
  str += " version " + transaction.version.toString("hex");

  if (transaction.locktime) {
    str += " locktime " + transaction.locktime.toString("hex");
  }

  if (transaction.witness) {
    str += " witness " + transaction.witness.toString("hex");
  }

  if (transaction.timestamp) {
    str += " timestamp " + transaction.timestamp.toString("hex");
  }

  if (transaction.nVersionGroupId) {
    str += " nVersionGroupId " + transaction.nVersionGroupId.toString("hex");
  }

  if (transaction.nExpiryHeight) {
    str += " nExpiryHeight " + transaction.nExpiryHeight.toString("hex");
  }

  if (transaction.extraData) {
    str += " extraData " + transaction.extraData.toString("hex");
  }

  transaction.inputs.forEach(({
    prevout,
    script,
    sequence
  }, i) => {
    str += `\ninput ${i}:`;
    str += ` prevout ${prevout.toString("hex")}`;
    str += ` script ${script.toString("hex")}`;
    str += ` sequence ${sequence.toString("hex")}`;
  });
  (transaction.outputs || []).forEach(({
    amount,
    script
  }, i) => {
    str += `\noutput ${i}:`;
    str += ` amount ${amount.toString("hex")}`;
    str += ` script ${script.toString("hex")}`;
  });
  return str;
}

function displayTransactionDebug(transaction) {
  console.log(formatTransactionDebug(transaction));
}
//# sourceMappingURL=debug.js.map