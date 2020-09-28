"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decoratePromiseErrors = exports.rethrowError = exports.remapError = void 0;

var _errors = require("@ledgerhq/errors");

const remapError = error => {
  if (!error || !error.message) return error;

  if (error.message.includes("was disconnected") || error.message.includes("not found")) {
    return new _errors.DisconnectedDevice();
  }

  return error;
};

exports.remapError = remapError;

const rethrowError = e => {
  throw remapError(e);
};

exports.rethrowError = rethrowError;

const decoratePromiseErrors = promise => promise.catch(rethrowError);

exports.decoratePromiseErrors = decoratePromiseErrors;
//# sourceMappingURL=remapErrors.js.map