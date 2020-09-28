"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createLedgerSubprovider;

var _hwAppEth = _interopRequireDefault(require("@ledgerhq/hw-app-eth"));

var _hookedWallet = _interopRequireDefault(require("web3-provider-engine/subproviders/hooked-wallet"));

var _stripHexPrefix = _interopRequireDefault(require("strip-hex-prefix"));

var _ethereumjsTx = require("ethereumjs-tx");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function makeError(msg, id) {
  const err = new Error(msg); // $FlowFixMe

  err.id = id;
  return err;
}
/**
 */


const defaultOptions = {
  networkId: 1,
  // mainnet
  paths: ["44'/60'/x'/0/0", "44'/60'/0'/x"],
  // ledger live derivation path
  askConfirm: false,
  accountsLength: 1,
  accountsOffset: 0
};
/**
 * Create a HookedWalletSubprovider for Ledger devices.
 * @param getTransport gets lazily called each time the device is needed. It is a function that returns a Transport instance. You can typically give `()=>TransportU2F.create()`
 * @example
import Web3 from "web3";
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import ProviderEngine from "web3-provider-engine";
import RpcSubprovider from "web3-provider-engine/subproviders/rpc";
const engine = new ProviderEngine();
const getTransport = () => TransportU2F.create();
const ledger = createLedgerSubprovider(getTransport, {
  accountsLength: 5
});
engine.addProvider(ledger);
engine.addProvider(new RpcSubprovider({ rpcUrl }));
engine.start();
const web3 = new Web3(engine);
 */

function createLedgerSubprovider(getTransport, options) {
  if (options && "path" in options) {
    throw new Error("@ledgerhq/web3-subprovider: path options was replaced by paths. example: paths: [\"44'/60'/x'/0/0\"]");
  }

  const {
    networkId,
    paths,
    askConfirm,
    accountsLength,
    accountsOffset
  } = _objectSpread(_objectSpread({}, defaultOptions), options);

  if (!paths.length) {
    throw new Error("paths must not be empty");
  }

  const addressToPathMap = {};

  async function getAccounts() {
    const transport = await getTransport();

    try {
      const eth = new _hwAppEth.default(transport);
      const addresses = {};

      for (let i = accountsOffset; i < accountsOffset + accountsLength; i++) {
        const x = Math.floor(i / paths.length);
        const pathIndex = i - paths.length * x;
        const path = paths[pathIndex].replace("x", String(x));
        const address = await eth.getAddress(path, askConfirm, false);
        addresses[path] = address.address;
        addressToPathMap[address.address.toLowerCase()] = path;
      }

      return addresses;
    } finally {
      transport.close();
    }
  }

  async function signPersonalMessage(msgData) {
    const path = addressToPathMap[msgData.from.toLowerCase()];
    if (!path) throw new Error("address unknown '" + msgData.from + "'");
    const transport = await getTransport();

    try {
      const eth = new _hwAppEth.default(transport);
      const result = await eth.signPersonalMessage(path, (0, _stripHexPrefix.default)(msgData.data));
      const v = parseInt(result.v, 10) - 27;
      let vHex = v.toString(16);

      if (vHex.length < 2) {
        vHex = `0${v}`;
      }

      return `0x${result.r}${result.s}${vHex}`;
    } finally {
      transport.close();
    }
  }

  async function signTransaction(txData) {
    const path = addressToPathMap[txData.from.toLowerCase()];
    if (!path) throw new Error("address unknown '" + txData.from + "'");
    const transport = await getTransport();

    try {
      const eth = new _hwAppEth.default(transport);
      const tx = new _ethereumjsTx.Transaction(txData, {
        chain: networkId
      }); // Set the EIP155 bits

      tx.raw[6] = Buffer.from([networkId]); // v

      tx.raw[7] = Buffer.from([]); // r

      tx.raw[8] = Buffer.from([]); // s
      // Pass hex-rlp to ledger for signing

      const result = await eth.signTransaction(path, tx.serialize().toString("hex")); // Store signature in transaction

      tx.v = Buffer.from(result.v, "hex");
      tx.r = Buffer.from(result.r, "hex");
      tx.s = Buffer.from(result.s, "hex"); // EIP155: v should be chain_id * 2 + {35, 36}

      const signedChainId = Math.floor((tx.v[0] - 35) / 2);
      const validChainId = networkId & 0xff; // FIXME this is to fixed a current workaround that app don't support > 0xff

      if (signedChainId !== validChainId) {
        throw makeError("Invalid networkId signature returned. Expected: " + networkId + ", Got: " + signedChainId, "InvalidNetworkId");
      }

      return `0x${tx.serialize().toString("hex")}`;
    } finally {
      transport.close();
    }
  }

  const subprovider = new _hookedWallet.default({
    getAccounts: callback => {
      getAccounts().then(res => callback(null, Object.values(res))).catch(err => callback(err, null));
    },
    signPersonalMessage: (txData, callback) => {
      signPersonalMessage(txData).then(res => callback(null, res)).catch(err => callback(err, null));
    },
    signTransaction: (txData, callback) => {
      signTransaction(txData).then(res => callback(null, res)).catch(err => callback(err, null));
    }
  });
  return subprovider;
}
//# sourceMappingURL=index.js.map