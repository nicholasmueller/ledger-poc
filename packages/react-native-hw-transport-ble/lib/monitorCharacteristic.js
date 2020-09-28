"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitorCharacteristic = void 0;

var _rxjs = require("rxjs");

var _errors = require("@ledgerhq/errors");

var _logs = require("@ledgerhq/logs");

const monitorCharacteristic = characteristic => _rxjs.Observable.create(o => {
  (0, _logs.log)("ble-verbose", "start monitor " + characteristic.uuid);
  const subscription = characteristic.monitor((error, c) => {
    if (error) {
      (0, _logs.log)("ble-verbose", "error monitor " + characteristic.uuid + ": " + error);
      o.error(error);
    } else if (!c) {
      o.error(new _errors.TransportError("characteristic monitor null value", "CharacteristicMonitorNull"));
    } else {
      try {
        const value = Buffer.from(c.value, "base64");
        o.next(value);
      } catch (error) {
        o.error(error);
      }
    }
  });
  return () => {
    (0, _logs.log)("ble-verbose", "end monitor " + characteristic.uuid);
    subscription.remove();
  };
});

exports.monitorCharacteristic = monitorCharacteristic;
//# sourceMappingURL=monitorCharacteristic.js.map