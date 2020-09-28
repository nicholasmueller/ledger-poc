"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _signMessage = require("./signMessage");

var _getWalletPublicKey = require("./getWalletPublicKey");

var _splitTransaction = require("./splitTransaction");

var _getTrustedInput = require("./getTrustedInput");

var _getTrustedInputBIP = require("./getTrustedInputBIP143");

var _createTransaction = require("./createTransaction");

var _signP2SHTransaction = require("./signP2SHTransaction");

var _serializeTransaction = require("./serializeTransaction");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc(transport)
 */
class Btc {
  constructor(transport, scrambleKey = "BTC") {
    this.transport = void 0;
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getWalletPublicKey", "signP2SHTransaction", "signMessageNew", "createPaymentTransactionNew", "getTrustedInput", "getTrustedInputBIP143"], scrambleKey);
  }
  /**
   * @param path a BIP 32 path
   * @param options an object with optional these fields:
   *
   * - verify (boolean) will ask user to confirm the address on the device
   *
   * - format ("legacy" | "p2sh" | "bech32" | "cashaddr") to use different bitcoin address formatter.
   *
   * NB The normal usage is to use:
   *
   * - legacy format with 44' paths
   *
   * - p2sh format with 49' paths
   *
   * - bech32 format with 173' paths
   *
   * - cashaddr in case of Bitcoin Cash
   *
   * @example
   * btc.getWalletPublicKey("44'/0'/0'/0/0").then(o => o.bitcoinAddress)
   * btc.getWalletPublicKey("49'/0'/0'/0/0", { format: "p2sh" }).then(o => o.bitcoinAddress)
   */


  getWalletPublicKey(path, opts) {
    let options;

    if (arguments.length > 2 || typeof opts === "boolean") {
      console.warn("btc.getWalletPublicKey deprecated signature used. Please switch to getWalletPublicKey(path, { format, verify })");
      options = {
        verify: !!opts,
        format: arguments[2] ? "p2sh" : "legacy"
      };
    } else {
      options = opts || {};
    }

    return (0, _getWalletPublicKey.getWalletPublicKey)(this.transport, _objectSpread(_objectSpread({}, options), {}, {
      path
    }));
  }
  /**
   * You can sign a message according to the Bitcoin Signature format and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
   * @example
   btc.signMessageNew_async("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
     var v = result['v'] + 27 + 4;
     var signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64');
     console.log("Signature : " + signature);
   }).catch(function(ex) {console.log(ex);});
   */


  signMessageNew(path, messageHex) {
    return (0, _signMessage.signMessage)(this.transport, {
      path,
      messageHex
    });
  }
  /**
   * To sign a transaction involving standard (P2PKH) inputs, call createTransaction with the following parameters
   * @param inputs is an array of [ transaction, output_index, optional redeem script, optional sequence ] where
   *
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the optional redeem script to use when consuming a Segregated Witness input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param changePath is an optional BIP 32 path pointing to the path to the public key used to compute the change address
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @param segwit is an optional boolean indicating wether to use segwit or not
   * @param initialTimestamp is an optional timestamp of the function call to use for coins that necessitate timestamps only, (not the one that the tx will include)
   * @param additionals list of additionnal options
   *
   * - "bech32" for spending native segwit outputs
   * - "abc" for bch
   * - "gold" for btg
   * - "bipxxx" for using BIPxxx
   * - "sapling" to indicate a zec transaction is supporting sapling (to be set over block 419200)
   * @param expiryHeight is an optional Buffer for zec overwinter / sapling Txs
   * @param useTrustedInputForSegwit trust inputs for segwit transactions
   * @return the signed transaction ready to be broadcast
   * @example
  btc.createTransaction({
   inputs: [ [tx1, 1] ],
   associatedKeysets: ["0'/0/0"],
   outputScriptHex: "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
  }).then(res => ...);
   */


  createPaymentTransactionNew(arg) {
    if (arguments.length > 1) {
      console.warn("@ledgerhq/hw-app-btc: createPaymentTransactionNew multi argument signature is deprecated. please switch to named parameters.");
      arg = fromDeprecateArguments(arguments, ["inputs", "associatedKeysets", "changePath", "outputScriptHex", "lockTime", "sigHashType", "segwit", "initialTimestamp", "additionals", "expiryHeight", "useTrustedInputForSegwit"]);
    }

    return (0, _createTransaction.createTransaction)(this.transport, arg);
  }
  /**
   * To obtain the signature of multisignature (P2SH) inputs, call signP2SHTransaction_async with the folowing parameters
   * @param inputs is an array of [ transaction, output_index, redeem script, optional sequence ] where
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the mandatory redeem script associated to the current P2SH input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @return the signed transaction ready to be broadcast
   * @example
  btc.signP2SHTransaction({
  inputs: [ [tx, 1, "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"] ],
  associatedKeysets: ["0'/0/0"],
  outputScriptHex: "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
  }).then(result => ...);
   */


  signP2SHTransaction(arg) {
    if (arguments.length > 1) {
      console.warn("@ledgerhq/hw-app-btc: signP2SHTransaction multi argument signature is deprecated. please switch to named parameters.");
      const [inputs, associatedKeysets, outputScriptHex, lockTime, sigHashType, segwit, transactionVersion] = arguments;
      arg = {
        inputs,
        associatedKeysets,
        outputScriptHex,
        lockTime,
        sigHashType,
        segwit,
        transactionVersion
      };
      arg = fromDeprecateArguments(arguments, ["inputs", "associatedKeysets", "outputScriptHex", "lockTime", "sigHashType", "segwit", "transactionVersion"]);
    }

    return (0, _signP2SHTransaction.signP2SHTransaction)(this.transport, arg);
  }
  /**
   * For each UTXO included in your transaction, create a transaction object from the raw serialized version of the transaction used in this UTXO.
   * @example
  const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
   */


  splitTransaction(transactionHex, isSegwitSupported = false, hasTimestamp = false, hasExtraData = false, additionals = []) {
    return (0, _splitTransaction.splitTransaction)(transactionHex, isSegwitSupported, hasTimestamp, hasExtraData, additionals);
  }
  /**
  @example
  const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
  const outputScript = btc.serializeTransactionOutputs(tx1).toString('hex');
  */


  serializeTransactionOutputs(t) {
    return (0, _serializeTransaction.serializeTransactionOutputs)(t);
  }

  getTrustedInput(indexLookup, transaction, additionals = []) {
    return (0, _getTrustedInput.getTrustedInput)(this.transport, indexLookup, transaction, additionals);
  }

  getTrustedInputBIP143(indexLookup, transaction, additionals = []) {
    return (0, _getTrustedInputBIP.getTrustedInputBIP143)(this.transport, indexLookup, transaction, additionals);
  }

}

exports.default = Btc;

function fromDeprecateArguments(args, keys) {
  const obj = {};
  keys.forEach((key, i) => {
    const value = args[i];

    if (value !== undefined) {
      obj[key] = value;
    }
  });
  return obj;
}
//# sourceMappingURL=Btc.js.map