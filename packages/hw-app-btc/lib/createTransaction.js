"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTransaction = createTransaction;

var _logs = require("@ledgerhq/logs");

var _hashPublicKey = require("./hashPublicKey");

var _getWalletPublicKey = require("./getWalletPublicKey");

var _getTrustedInput = require("./getTrustedInput");

var _startUntrustedHashTransactionInput = require("./startUntrustedHashTransactionInput");

var _serializeTransaction = require("./serializeTransaction");

var _getTrustedInputBIP = require("./getTrustedInputBIP143");

var _compressPublicKey = require("./compressPublicKey");

var _signTransaction = require("./signTransaction");

var _finalizeInput = require("./finalizeInput");

var _getAppAndVersion = require("./getAppAndVersion");

var _constants = require("./constants");

var _shouldUseTrustedInputForSegwit = require("./shouldUseTrustedInputForSegwit");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const defaultsSignTransaction = {
  lockTime: _constants.DEFAULT_LOCKTIME,
  sigHashType: _constants.SIGHASH_ALL,
  segwit: false,
  additionals: [],
  onDeviceStreaming: _e => {},
  onDeviceSignatureGranted: () => {},
  onDeviceSignatureRequested: () => {}
};
/**
 *
 */

async function createTransaction(transport, arg) {
  let {
    inputs,
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    segwit,
    initialTimestamp,
    additionals,
    expiryHeight,
    useTrustedInputForSegwit,
    onDeviceStreaming,
    onDeviceSignatureGranted,
    onDeviceSignatureRequested
  } = _objectSpread(_objectSpread({}, defaultsSignTransaction), arg);

  if (useTrustedInputForSegwit === undefined) {
    try {
      const a = await (0, _getAppAndVersion.getAppAndVersion)(transport);
      useTrustedInputForSegwit = (0, _shouldUseTrustedInputForSegwit.shouldUseTrustedInputForSegwit)(a);
    } catch (e) {
      if (e.statusCode === 0x6d00) {
        useTrustedInputForSegwit = false;
      } else {
        throw e;
      }
    }
  } // loop: 0 or 1 (before and after)
  // i: index of the input being streamed
  // i goes on 0...n, inluding n. in order for the progress value to go to 1
  // we normalize the 2 loops to make a global percentage


  const notify = (loop, i) => {
    const {
      length
    } = inputs;
    if (length < 3) return; // there is not enough significant event to worth notifying (aka just use a spinner)

    const index = length * loop + i;
    const total = 2 * length;
    const progress = index / total;
    onDeviceStreaming({
      progress,
      total,
      index
    });
  };

  const isDecred = additionals.includes("decred");
  const isXST = additionals.includes("stealthcoin");
  let startTime = Date.now();
  const sapling = additionals.includes("sapling");
  const bech32 = segwit && additionals.includes("bech32");
  let useBip143 = segwit || !!additionals && (additionals.includes("abc") || additionals.includes("gold") || additionals.includes("bip143")) || !!expiryHeight && !isDecred; // Inputs are provided as arrays of [transaction, output_index, optional redeem script, optional sequence]
  // associatedKeysets are provided as arrays of [path]

  const nullScript = Buffer.alloc(0);
  const nullPrevout = Buffer.alloc(0);
  const defaultVersion = Buffer.alloc(4);
  !!expiryHeight && !isDecred ? defaultVersion.writeUInt32LE(sapling ? 0x80000004 : 0x80000003, 0) : isXST ? defaultVersion.writeUInt32LE(2, 0) : defaultVersion.writeUInt32LE(1, 0); // Default version to 2 for XST not to have timestamp

  const trustedInputs = [];
  const regularOutputs = [];
  const signatures = [];
  const publicKeys = [];
  let firstRun = true;
  const resuming = false;
  const targetTransaction = {
    inputs: [],
    version: defaultVersion,
    timestamp: Buffer.alloc(0)
  };
  const getTrustedInputCall = useBip143 && !useTrustedInputForSegwit ? _getTrustedInputBIP.getTrustedInputBIP143 : _getTrustedInput.getTrustedInput;
  const outputScript = Buffer.from(outputScriptHex, "hex");
  notify(0, 0); // first pass on inputs to get trusted inputs

  for (let input of inputs) {
    if (!resuming) {
      const trustedInput = await getTrustedInputCall(transport, input[1], input[0], additionals);
      (0, _logs.log)("hw", "got trustedInput=" + trustedInput);
      let sequence = Buffer.alloc(4);
      sequence.writeUInt32LE(input.length >= 4 && typeof input[3] === "number" ? input[3] : _constants.DEFAULT_SEQUENCE, 0);
      trustedInputs.push({
        trustedInput: true,
        value: Buffer.from(trustedInput, "hex"),
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

    if (expiryHeight && !isDecred) {
      targetTransaction.nVersionGroupId = Buffer.from(sapling ? [0x85, 0x20, 0x2f, 0x89] : [0x70, 0x82, 0xc4, 0x03]);
      targetTransaction.nExpiryHeight = expiryHeight; // For sapling : valueBalance (8), nShieldedSpend (1), nShieldedOutput (1), nJoinSplit (1)
      // Overwinter : use nJoinSplit (1)

      targetTransaction.extraData = Buffer.from(sapling ? [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] : [0x00]);
    } else if (isDecred) {
      targetTransaction.nExpiryHeight = expiryHeight;
    }
  }

  targetTransaction.inputs = inputs.map(input => {
    let sequence = Buffer.alloc(4);
    sequence.writeUInt32LE(input.length >= 4 && typeof input[3] === "number" ? input[3] : _constants.DEFAULT_SEQUENCE, 0);
    return {
      script: nullScript,
      prevout: nullPrevout,
      sequence
    };
  });

  if (!resuming) {
    // Collect public keys
    const result = [];

    for (let i = 0; i < inputs.length; i++) {
      const r = await (0, _getWalletPublicKey.getWalletPublicKey)(transport, {
        path: associatedKeysets[i]
      });
      notify(0, i + 1);
      result.push(r);
    }

    for (let i = 0; i < result.length; i++) {
      publicKeys.push((0, _compressPublicKey.compressPublicKey)(Buffer.from(result[i].publicKey, "hex")));
    }
  }

  if (initialTimestamp !== undefined) {
    targetTransaction.timestamp = Buffer.alloc(4);
    targetTransaction.timestamp.writeUInt32LE(Math.floor(initialTimestamp + (Date.now() - startTime) / 1000), 0);
  }

  onDeviceSignatureRequested();

  if (useBip143) {
    // Do the first run with all inputs
    await (0, _startUntrustedHashTransactionInput.startUntrustedHashTransactionInput)(transport, true, targetTransaction, trustedInputs, true, !!expiryHeight, additionals, useTrustedInputForSegwit);

    if (!resuming && changePath) {
      await (0, _finalizeInput.provideOutputFullChangePath)(transport, changePath);
    }

    await (0, _finalizeInput.hashOutputFull)(transport, outputScript);
  }

  if (!!expiryHeight && !isDecred) {
    await (0, _signTransaction.signTransaction)(transport, "", lockTime, _constants.SIGHASH_ALL, expiryHeight);
  } // Do the second run with the individual transaction


  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    let script = inputs[i].length >= 3 && typeof input[2] === "string" ? Buffer.from(input[2], "hex") : !segwit ? regularOutputs[i].script : Buffer.concat([Buffer.from([_constants.OP_DUP, _constants.OP_HASH160, _constants.HASH_SIZE]), (0, _hashPublicKey.hashPublicKey)(publicKeys[i]), Buffer.from([_constants.OP_EQUALVERIFY, _constants.OP_CHECKSIG])]);
    let pseudoTX = Object.assign({}, targetTransaction);
    let pseudoTrustedInputs = useBip143 ? [trustedInputs[i]] : trustedInputs;

    if (useBip143) {
      pseudoTX.inputs = [_objectSpread(_objectSpread({}, pseudoTX.inputs[i]), {}, {
        script
      })];
    } else {
      pseudoTX.inputs[i].script = script;
    }

    await (0, _startUntrustedHashTransactionInput.startUntrustedHashTransactionInput)(transport, !useBip143 && firstRun, pseudoTX, pseudoTrustedInputs, useBip143, !!expiryHeight && !isDecred, additionals, useTrustedInputForSegwit);

    if (!useBip143) {
      if (!resuming && changePath) {
        await (0, _finalizeInput.provideOutputFullChangePath)(transport, changePath);
      }

      await (0, _finalizeInput.hashOutputFull)(transport, outputScript, additionals);
    }

    if (firstRun) {
      onDeviceSignatureGranted();
      notify(1, 0);
    }

    const signature = await (0, _signTransaction.signTransaction)(transport, associatedKeysets[i], lockTime, sigHashType, expiryHeight, additionals);
    notify(1, i + 1);
    signatures.push(signature);
    targetTransaction.inputs[i].script = nullScript;

    if (firstRun) {
      firstRun = false;
    }
  } // Populate the final input scripts


  for (let i = 0; i < inputs.length; i++) {
    if (segwit) {
      targetTransaction.witness = Buffer.alloc(0);

      if (!bech32) {
        targetTransaction.inputs[i].script = Buffer.concat([Buffer.from("160014", "hex"), (0, _hashPublicKey.hashPublicKey)(publicKeys[i])]);
      }
    } else {
      const signatureSize = Buffer.alloc(1);
      const keySize = Buffer.alloc(1);
      signatureSize[0] = signatures[i].length;
      keySize[0] = publicKeys[i].length;
      targetTransaction.inputs[i].script = Buffer.concat([signatureSize, signatures[i], keySize, publicKeys[i]]);
    }

    let offset = useBip143 && !useTrustedInputForSegwit ? 0 : 4;
    targetTransaction.inputs[i].prevout = trustedInputs[i].value.slice(offset, offset + 0x24);
  }

  const lockTimeBuffer = Buffer.alloc(4);
  lockTimeBuffer.writeUInt32LE(lockTime, 0);
  var result = Buffer.concat([(0, _serializeTransaction.serializeTransaction)(targetTransaction, false, targetTransaction.timestamp, additionals), outputScript]);

  if (segwit && !isDecred) {
    var witness = Buffer.alloc(0);

    for (var i = 0; i < inputs.length; i++) {
      var tmpScriptData = Buffer.concat([Buffer.from("02", "hex"), Buffer.from([signatures[i].length]), signatures[i], Buffer.from([publicKeys[i].length]), publicKeys[i]]);
      witness = Buffer.concat([witness, tmpScriptData]);
    }

    result = Buffer.concat([result, witness]);
  } // FIXME: In ZEC or KMD sapling lockTime is serialized before expiryHeight.
  // expiryHeight is used only in overwinter/sapling so I moved lockTimeBuffer here
  // and it should not break other coins because expiryHeight is false for them.
  // Don't know about Decred though.


  result = Buffer.concat([result, lockTimeBuffer]);

  if (expiryHeight) {
    result = Buffer.concat([result, targetTransaction.nExpiryHeight || Buffer.alloc(0), targetTransaction.extraData || Buffer.alloc(0)]);
  }

  if (isDecred) {
    let decredWitness = Buffer.from([targetTransaction.inputs.length]);
    inputs.forEach((input, inputIndex) => {
      decredWitness = Buffer.concat([decredWitness, Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), Buffer.from([0x00, 0x00, 0x00, 0x00]), //Block height
      Buffer.from([0xff, 0xff, 0xff, 0xff]), //Block index
      Buffer.from([targetTransaction.inputs[inputIndex].script.length]), targetTransaction.inputs[inputIndex].script]);
    });
    result = Buffer.concat([result, decredWitness]);
  }

  return result.toString("hex");
}
//# sourceMappingURL=createTransaction.js.map