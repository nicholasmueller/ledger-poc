"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTrustedInputRaw = getTrustedInputRaw;
exports.getTrustedInput = getTrustedInput;

var _invariant = _interopRequireDefault(require("invariant"));

var _constants = require("./constants");

var _varint = require("./varint");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getTrustedInputRaw(transport, transactionData, indexLookup) {
  let data;
  let firstRound = false;

  if (typeof indexLookup === "number") {
    firstRound = true;
    const prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(indexLookup, 0);
    data = Buffer.concat([prefix, transactionData], transactionData.length + 4);
  } else {
    data = transactionData;
  }

  const trustedInput = await transport.send(0xe0, 0x42, firstRound ? 0x00 : 0x80, 0x00, data);
  const res = trustedInput.slice(0, trustedInput.length - 2).toString("hex");
  return res;
}

async function getTrustedInput(transport, indexLookup, transaction, additionals = []) {
  const {
    version,
    inputs,
    outputs,
    locktime,
    nExpiryHeight,
    extraData
  } = transaction;

  if (!outputs || !locktime) {
    throw new Error("getTrustedInput: locktime & outputs is expected");
  }

  const isDecred = additionals.includes("decred");
  const isXST = additionals.includes("stealthcoin");

  const processScriptBlocks = async (script, sequence) => {
    const seq = sequence || Buffer.alloc(0);
    const scriptBlocks = [];
    let offset = 0;

    while (offset !== script.length) {
      let blockSize = script.length - offset > _constants.MAX_SCRIPT_BLOCK ? _constants.MAX_SCRIPT_BLOCK : script.length - offset;

      if (offset + blockSize !== script.length) {
        scriptBlocks.push(script.slice(offset, offset + blockSize));
      } else {
        scriptBlocks.push(Buffer.concat([script.slice(offset, offset + blockSize), seq]));
      }

      offset += blockSize;
    } // Handle case when no script length: we still want to pass the sequence
    // relatable: https://github.com/LedgerHQ/ledger-live-desktop/issues/1386


    if (script.length === 0) {
      scriptBlocks.push(seq);
    }

    let res;

    for (let scriptBlock of scriptBlocks) {
      res = await getTrustedInputRaw(transport, scriptBlock);
    }

    return res;
  };

  const processWholeScriptBlock = block => getTrustedInputRaw(transport, block);

  await getTrustedInputRaw(transport, Buffer.concat([transaction.version, transaction.timestamp || Buffer.alloc(0), transaction.nVersionGroupId || Buffer.alloc(0), (0, _varint.createVarint)(inputs.length)]), indexLookup);

  for (let input of inputs) {
    const isXSTV2 = isXST && Buffer.compare(version, Buffer.from([0x02, 0x00, 0x00, 0x00])) === 0;
    const treeField = isDecred ? input.tree || Buffer.from([0x00]) : Buffer.alloc(0);
    const data = Buffer.concat([input.prevout, treeField, isXSTV2 ? Buffer.from([0x00]) : (0, _varint.createVarint)(input.script.length)]);
    await getTrustedInputRaw(transport, data); // iteration (eachSeries) ended
    // TODO notify progress
    // deferred.notify("input");
    // Reference: https://github.com/StealthSend/Stealth/commit/5be35d6c2c500b32ed82e5d6913d66d18a4b0a7f#diff-e8db9b851adc2422aadfffca88f14c91R566

    await (isDecred ? processWholeScriptBlock(Buffer.concat([input.script, input.sequence])) : isXSTV2 ? processWholeScriptBlock(input.sequence) : processScriptBlocks(input.script, input.sequence));
  }

  await getTrustedInputRaw(transport, (0, _varint.createVarint)(outputs.length));

  for (let output of outputs) {
    const data = Buffer.concat([output.amount, isDecred ? Buffer.from([0x00, 0x00]) : Buffer.alloc(0), //Version script
    (0, _varint.createVarint)(output.script.length), output.script]);
    await getTrustedInputRaw(transport, data);
  }

  const endData = [];

  if (nExpiryHeight && nExpiryHeight.length > 0) {
    endData.push(nExpiryHeight);
  }

  if (extraData && extraData.length > 0) {
    endData.push(extraData);
  }

  let extraPart;

  if (endData.length) {
    const data = Buffer.concat(endData);
    extraPart = isDecred ? data : Buffer.concat([(0, _varint.createVarint)(data.length), data]);
  }

  const res = await processScriptBlocks(Buffer.concat([locktime, extraPart || Buffer.alloc(0)]));
  (0, _invariant.default)(res, "missing result in processScriptBlocks");
  return res;
}
//# sourceMappingURL=getTrustedInput.js.map