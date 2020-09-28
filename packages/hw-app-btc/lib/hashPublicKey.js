"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hashPublicKey = hashPublicKey;

var _ripemd = _interopRequireDefault(require("ripemd160"));

var _sha = _interopRequireDefault(require("sha.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hashPublicKey(buffer) {
  return new _ripemd.default().update((0, _sha.default)("sha256").update(buffer).digest()).digest();
}
//# sourceMappingURL=hashPublicKey.js.map