"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signMessage = signMessage;

var _bip32Path = _interopRequireDefault(require("bip32-path"));

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function signMessage(transport, {
  path,
  messageHex
}) {
  const paths = _bip32Path.default.fromString(path).toPathArray();

  const message = Buffer.from(messageHex, "hex");
  let offset = 0;

  while (offset !== message.length) {
    let maxChunkSize = offset === 0 ? _constants.MAX_SCRIPT_BLOCK - 1 - paths.length * 4 - 4 : _constants.MAX_SCRIPT_BLOCK;
    let chunkSize = offset + maxChunkSize > message.length ? message.length - offset : maxChunkSize;
    const buffer = Buffer.alloc(offset === 0 ? 1 + paths.length * 4 + 2 + chunkSize : chunkSize);

    if (offset === 0) {
      buffer[0] = paths.length;
      paths.forEach((element, index) => {
        buffer.writeUInt32BE(element, 1 + 4 * index);
      });
      buffer.writeUInt16BE(message.length, 1 + 4 * paths.length);
      message.copy(buffer, 1 + 4 * paths.length + 2, offset, offset + chunkSize);
    } else {
      message.copy(buffer, 0, offset, offset + chunkSize);
    }

    await transport.send(0xe0, 0x4e, 0x00, offset === 0 ? 0x01 : 0x80, buffer);
    offset += chunkSize;
  }

  const res = await transport.send(0xe0, 0x4e, 0x80, 0x00, Buffer.from([0x00]));
  const v = res[0] - 0x30;
  let r = res.slice(4, 4 + res[3]);

  if (r[0] === 0) {
    r = r.slice(1);
  }

  r = r.toString("hex");
  offset = 4 + res[3] + 2;
  let s = res.slice(offset, offset + res[offset - 1]);

  if (s[0] === 0) {
    s = s.slice(1);
  }

  s = s.toString("hex");
  return {
    v,
    r,
    s
  };
}
//# sourceMappingURL=signMessage.js.map