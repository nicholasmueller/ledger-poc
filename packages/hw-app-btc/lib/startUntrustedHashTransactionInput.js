"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startUntrustedHashTransactionInputRaw = startUntrustedHashTransactionInputRaw;
exports.startUntrustedHashTransactionInput = startUntrustedHashTransactionInput;

var _varint = require("./varint");

var _constants = require("./constants");

function startUntrustedHashTransactionInputRaw(transport, newTransaction, firstRound, transactionData, bip143 = false, overwinter = false, additionals = []) {
  const p2 = additionals.includes("cashaddr") ? 0x03 : bip143 ? additionals.includes("sapling") ? 0x05 : overwinter ? 0x04 : 0x02 : 0x00;
  return transport.send(0xe0, 0x44, firstRound ? 0x00 : 0x80, newTransaction ? p2 : 0x80, transactionData);
}

async function startUntrustedHashTransactionInput(transport, newTransaction, transaction, inputs, bip143 = false, overwinter = false, additionals = [], useTrustedInputForSegwit = false) {
  let data = Buffer.concat([transaction.version, transaction.timestamp || Buffer.alloc(0), transaction.nVersionGroupId || Buffer.alloc(0), (0, _varint.createVarint)(transaction.inputs.length)]);
  await startUntrustedHashTransactionInputRaw(transport, newTransaction, true, data, bip143, overwinter, additionals);
  let i = 0;
  const isDecred = additionals.includes("decred");

  for (let input of transaction.inputs) {
    let prefix;
    let inputValue = inputs[i].value;

    if (bip143) {
      if (useTrustedInputForSegwit && inputs[i].trustedInput) {
        prefix = Buffer.from([0x01, inputValue.length]);
      } else {
        prefix = Buffer.from([0x02]);
      }
    } else {
      if (inputs[i].trustedInput) {
        prefix = Buffer.from([0x01, inputs[i].value.length]);
      } else {
        prefix = Buffer.from([0x00]);
      }
    }

    data = Buffer.concat([prefix, inputValue, isDecred ? Buffer.from([0x00]) : Buffer.alloc(0), (0, _varint.createVarint)(input.script.length)]);
    await startUntrustedHashTransactionInputRaw(transport, newTransaction, false, data, bip143, overwinter, additionals);
    let scriptBlocks = [];
    let offset = 0;

    if (input.script.length === 0) {
      scriptBlocks.push(input.sequence);
    } else {
      while (offset !== input.script.length) {
        let blockSize = input.script.length - offset > _constants.MAX_SCRIPT_BLOCK ? _constants.MAX_SCRIPT_BLOCK : input.script.length - offset;

        if (offset + blockSize !== input.script.length) {
          scriptBlocks.push(input.script.slice(offset, offset + blockSize));
        } else {
          scriptBlocks.push(Buffer.concat([input.script.slice(offset, offset + blockSize), input.sequence]));
        }

        offset += blockSize;
      }
    }

    for (let scriptBlock of scriptBlocks) {
      await startUntrustedHashTransactionInputRaw(transport, newTransaction, false, scriptBlock, bip143, overwinter, additionals);
    }

    i++;
  }
}
//# sourceMappingURL=startUntrustedHashTransactionInput.js.map