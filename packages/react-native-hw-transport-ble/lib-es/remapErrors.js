import { DisconnectedDevice } from "@ledgerhq/errors";
export const remapError = error => {
  if (!error || !error.message) return error;

  if (error.message.includes("was disconnected") || error.message.includes("not found")) {
    return new DisconnectedDevice();
  }

  return error;
};
export const rethrowError = e => {
  throw remapError(e);
};
export const decoratePromiseErrors = promise => promise.catch(rethrowError);
//# sourceMappingURL=remapErrors.js.map