"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAppAndVersion = void 0;

var _invariant = _interopRequireDefault(require("invariant"));

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getAppAndVersion = async (transport) => {
  const r = await transport.send(0xb0, 0x01, 0x00, 0x00);
  let i = 0;
  const format = r[i++];
  (0, _invariant.default)(format === 1, "getAppAndVersion: format not supported");
  const nameLength = r[i++];
  const name = r.slice(i, i += nameLength).toString("ascii");
  const versionLength = r[i++];
  const version = r.slice(i, i += versionLength).toString("ascii");
  const flagLength = r[i++];
  const flags = r.slice(i, i += flagLength);
  return {
    name,
    version,
    flags
  };
};

exports.getAppAndVersion = getAppAndVersion;
//# sourceMappingURL=getAppAndVersion.js.map