"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signP2SHTransaction = signP2SHTransaction;

var _getTrustedInput = require("./getTrustedInput");

var _startUntrustedHashTransactionInput = require("./startUntrustedHashTransactionInput");

var _getTrustedInputBIP = require("./getTrustedInputBIP143");

var _signTransaction = require("./signTransaction");

var _finalizeInput = require("./finalizeInput");

var _constants = require("./constants");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const defaultArg = {
  lockTime: _constants.DEFAULT_LOCKTIME,
  sigHashType: _constants.SIGHASH_ALL,
  segwit: false,
  transactionVersion: _constants.DEFAULT_VERSION
};
/**
 *
 */

async function signP2SHTransaction(transport, arg) {
  const {
    inputs,
    associatedKeysets,
    outputScriptHex,
    lockTime,
    sigHashType,
    segwit,
    transactionVersion
  } = _objectSpread(_objectSpread({}, defaultArg), arg); // Inputs are provided as arrays of [transaction, output_index, redeem script, optional sequence]
  // associatedKeysets are provided as arrays of [path]


  const nullScript = Buffer.alloc(0);
  const nullPrevout = Buffer.alloc(0);
  const defaultVersion = Buffer.alloc(4);
  defaultVersion.writeUInt32LE(transactionVersion, 0);
  const trustedInputs = [];
  const regularOutputs = [];
  const signatures = [];
  let firstRun = true;
  const resuming = false;
  let targetTransaction = {
    inputs: [],
    version: defaultVersion
  };
  const getTrustedInputCall = segwit ? _getTrustedInputBIP.getTrustedInputBIP143 : _getTrustedInput.getTrustedInput;
  const outputScript = Buffer.from(outputScriptHex, "hex");

  for (let input of inputs) {
    if (!resuming) {
      const trustedInput = await getTrustedInputCall(transport, input[1], input[0]);
      let sequence = Buffer.alloc(4);
      sequence.writeUInt32LE(input.length >= 4 && typeof input[3] === "number" ? input[3] : _constants.DEFAULT_SEQUENCE, 0);
      trustedInputs.push({
        trustedInput: false,
        value: segwit ? Buffer.from(trustedInput, "hex") : Buffer.from(trustedInput, "hex").slice(4, 4 + 0x24),
        sequence
      });
    }

    const {
      outputs
    } = input[0];
    const index = input[1];

    if (outputs && index <= outputs.length - 1) {
      regularOutputs.push(outputs[index]);
    }
  } // Pre-build the target transaction


  for (let i = 0; i < inputs.length; i++) {
    let sequence = Buffer.alloc(4);
    sequence.writeUInt32LE(inputs[i].length >= 4 && typeof inputs[i][3] === "number" ? inputs[i][3] : _constants.DEFAULT_SEQUENCE, 0);
    targetTransaction.inputs.push({
      script: nullScript,
      prevout: nullPrevout,
      sequence
    });
  }

  if (segwit) {
    await (0, _startUntrustedHashTransactionInput.startUntrustedHashTransactionInput)(transport, true, targetTransaction, trustedInputs, true);
    await (0, _finalizeInput.hashOutputFull)(transport, outputScript);
  }

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    let script = inputs[i].length >= 3 && typeof input[2] === "string" ? Buffer.from(input[2], "hex") : regularOutputs[i].script;
    let pseudoTX = Object.assign({}, targetTransaction);
    let pseudoTrustedInputs = segwit ? [trustedInputs[i]] : trustedInputs;

    if (segwit) {
      pseudoTX.inputs = [_objectSpread(_objectSpread({}, pseudoTX.inputs[i]), {}, {
        script
      })];
    } else {
      pseudoTX.inputs[i].script = script;
    }

    await (0, _startUntrustedHashTransactionInput.startUntrustedHashTransactionInput)(transport, !segwit && firstRun, pseudoTX, pseudoTrustedInputs, segwit);

    if (!segwit) {
      await (0, _finalizeInput.hashOutputFull)(transport, outputScript);
    }

    const signature = await (0, _signTransaction.signTransaction)(transport, associatedKeysets[i], lockTime, sigHashType);
    signatures.push(segwit ? signature.toString("hex") : signature.slice(0, signature.length - 1).toString("hex"));
    targetTransaction.inputs[i].script = nullScript;

    if (firstRun) {
      firstRun = false;
    }
  }

  return signatures;
}
//# sourceMappingURL=signP2SHTransaction.js.map