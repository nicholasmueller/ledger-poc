"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.awaitsBleOn = void 0;

var _errors = require("@ledgerhq/errors");

var _logs = require("@ledgerhq/logs");

var _timer = _interopRequireDefault(require("./timer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const awaitsBleOn = (bleManager, ms = 3000) => new Promise((resolve, reject) => {
  let done = false;
  let lastState = "Unknown";
  const stateSub = bleManager.onStateChange(state => {
    lastState = state;
    (0, _logs.log)("ble-verbose", `ble state -> ${state}`);

    if (state === "PoweredOn") {
      if (done) return;
      removeTimeout();
      done = true;
      stateSub.remove();
      resolve();
    }
  }, true);

  const removeTimeout = _timer.default.timeout(() => {
    if (done) return;
    stateSub.remove();
    reject(new _errors.BluetoothRequired("", {
      state: lastState
    }));
  }, ms);
});

exports.awaitsBleOn = awaitsBleOn;
//# sourceMappingURL=awaitsBleOn.js.map