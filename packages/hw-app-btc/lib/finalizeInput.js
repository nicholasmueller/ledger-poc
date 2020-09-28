"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.provideOutputFullChangePath = provideOutputFullChangePath;
exports.hashOutputFull = hashOutputFull;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _bip = require("./bip32");

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function provideOutputFullChangePath(transport, path) {
  let buffer = (0, _bip.bip32asBuffer)(path);
  return transport.send(0xe0, 0x4a, 0xff, 0x00, buffer);
}

async function hashOutputFull(transport, outputScript, additionals = []) {
  let offset = 0;
  let p1 = 0x80;
  const isDecred = additionals.includes("decred"); ///WARNING: Decred works only with one call (without chunking)
  //TODO: test without this for Decred

  if (isDecred) {
    return transport.send(0xe0, 0x4a, p1, 0x00, outputScript);
  }

  while (offset < outputScript.length) {
    let blockSize = offset + _constants.MAX_SCRIPT_BLOCK >= outputScript.length ? outputScript.length - offset : _constants.MAX_SCRIPT_BLOCK;
    let p1 = offset + blockSize === outputScript.length ? 0x80 : 0x00;
    let data = outputScript.slice(offset, offset + blockSize);
    await transport.send(0xe0, 0x4a, p1, 0x00, data);
    offset += blockSize;
  }
}
//# sourceMappingURL=finalizeInput.js.map