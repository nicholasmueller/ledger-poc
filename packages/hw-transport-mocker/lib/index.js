"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  createTransportReplayer: true,
  createTransportRecorder: true
};
Object.defineProperty(exports, "createTransportReplayer", {
  enumerable: true,
  get: function () {
    return _createTransportReplayer.default;
  }
});
Object.defineProperty(exports, "createTransportRecorder", {
  enumerable: true,
  get: function () {
    return _createTransportRecorder.default;
  }
});

var _RecordStore = require("./RecordStore");

Object.keys(_RecordStore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _RecordStore[key];
    }
  });
});

var _createTransportReplayer = _interopRequireDefault(require("./createTransportReplayer"));

var _createTransportRecorder = _interopRequireDefault(require("./createTransportRecorder"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map