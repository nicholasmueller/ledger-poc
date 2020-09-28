"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldUseTrustedInputForSegwit = shouldUseTrustedInputForSegwit;

var _semver = _interopRequireDefault(require("semver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function shouldUseTrustedInputForSegwit({
  version,
  name
}) {
  if (name === "Decred") return false;
  if (name === "Exchange") return true;
  return _semver.default.gte(version, "1.4.0");
}
//# sourceMappingURL=shouldUseTrustedInputForSegwit.js.map