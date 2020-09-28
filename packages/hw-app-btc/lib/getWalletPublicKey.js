"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWalletPublicKey = getWalletPublicKey;

var _bip = require("./bip32");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const addressFormatMap = {
  legacy: 0,
  p2sh: 1,
  bech32: 2,
  cashaddr: 3
};

async function getWalletPublicKey(transport, options) {
  const {
    path,
    verify,
    format
  } = _objectSpread({
    verify: false,
    format: "legacy"
  }, options);

  if (!(format in addressFormatMap)) {
    throw new Error("btc.getWalletPublicKey invalid format=" + format);
  }

  const buffer = (0, _bip.bip32asBuffer)(path);
  var p1 = verify ? 1 : 0;
  var p2 = addressFormatMap[format];
  const response = await transport.send(0xe0, 0x40, p1, p2, buffer);
  const publicKeyLength = response[0];
  const addressLength = response[1 + publicKeyLength];
  const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
  const bitcoinAddress = response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString("ascii");
  const chainCode = response.slice(1 + publicKeyLength + 1 + addressLength, 1 + publicKeyLength + 1 + addressLength + 32).toString("hex");
  return {
    publicKey,
    bitcoinAddress,
    chainCode
  };
}
//# sourceMappingURL=getWalletPublicKey.js.map