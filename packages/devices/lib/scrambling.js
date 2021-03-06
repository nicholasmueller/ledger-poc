"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrapApdu = wrapApdu;

function wrapApdu(apdu, key) {
  if (apdu.length === 0) return apdu;
  const result = Buffer.alloc(apdu.length);

  for (let i = 0; i < apdu.length; i++) {
    result[i] = apdu[i] ^ key[i % key.length];
  }

  return result;
}
//# sourceMappingURL=scrambling.js.map