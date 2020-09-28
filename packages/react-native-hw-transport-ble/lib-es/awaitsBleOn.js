import { BluetoothRequired } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import timer from "./timer";
export const awaitsBleOn = (bleManager, ms = 3000) => new Promise((resolve, reject) => {
  let done = false;
  let lastState = "Unknown";
  const stateSub = bleManager.onStateChange(state => {
    lastState = state;
    log("ble-verbose", `ble state -> ${state}`);

    if (state === "PoweredOn") {
      if (done) return;
      removeTimeout();
      done = true;
      stateSub.remove();
      resolve();
    }
  }, true);
  const removeTimeout = timer.timeout(() => {
    if (done) return;
    stateSub.remove();
    reject(new BluetoothRequired("", {
      state: lastState
    }));
  }, ms);
});
//# sourceMappingURL=awaitsBleOn.js.map