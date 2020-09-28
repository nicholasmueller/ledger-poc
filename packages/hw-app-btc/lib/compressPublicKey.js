"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compressPublicKey = compressPublicKey;

function compressPublicKey(publicKey) {
  const prefix = (publicKey[64] & 1) !== 0 ? 0x03 : 0x02;
  const prefixBuffer = Buffer.alloc(1);
  prefixBuffer[0] = prefix;
  return Buffer.concat([prefixBuffer, publicKey.slice(1, 1 + 32)]);
}
//# sourceMappingURL=compressPublicKey.js.map