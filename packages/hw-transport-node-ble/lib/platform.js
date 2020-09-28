"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.write = exports.monitorCharacteristic = exports.retrieveServiceAndCharacteristics = exports.listen = exports.isDeviceDisconnected = exports.disconnectDevice = exports.connectDevice = exports.listenDeviceDisconnect = exports.availability = void 0;

var _noble = _interopRequireDefault(require("@abandonware/noble"));

var _rxjs = require("rxjs");

var _logs = require("@ledgerhq/logs");

var _devices = require("@ledgerhq/devices");

var _errors = require("@ledgerhq/errors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable prefer-template */
_noble.default.on("warning", message => {
  (0, _logs.log)("ble-warning", message);
});

const POWERED_ON = "poweredOn";

const availability = _rxjs.Observable.create(observer => {
  const onAvailabilityChanged = e => {
    observer.next(e === POWERED_ON);
  };

  _noble.default.addListener("stateChanged", onAvailabilityChanged); // events lib?


  observer.next(_noble.default.state === POWERED_ON);
  return () => {
    _noble.default.removeListener("stateChanged", onAvailabilityChanged);
  };
});

exports.availability = availability;

const listenDeviceDisconnect = (device, onDisconnect) => {
  device.addListener("disconnect", onDisconnect);
  return () => {
    device.removeListener("disconnect", onDisconnect);
  };
};

exports.listenDeviceDisconnect = listenDeviceDisconnect;

const connectDevice = device => new Promise((resolve, reject) => {
  device.connect(error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
});

exports.connectDevice = connectDevice;

const disconnectDevice = device => new Promise((resolve, reject) => {
  device.disconnect(error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
});

exports.disconnectDevice = disconnectDevice;

const isDeviceDisconnected = device => device.state === "disconnected";

exports.isDeviceDisconnected = isDeviceDisconnected;

const discoverDeviceServices = device => new Promise((resolve, reject) => device.discoverServices(null, (error, services) => {
  if (error) reject(error);else resolve(services);
}));

const discoverServiceCharacteristics = service => new Promise((resolve, reject) => service.discoverCharacteristics(null, (error, chs) => {
  if (error) reject(error);else resolve(chs);
}));

const listen = () => _rxjs.Observable.create(observer => {
  const discoveredDevices = {};

  const onDiscover = peripheral => {
    const {
      uuid: id
    } = peripheral;
    const {
      localName
    } = peripheral.advertisement;
    const name = localName || (discoveredDevices[id] ? discoveredDevices[id].name : null);
    discoveredDevices[id] = {
      peripheral,
      name
    };
    (0, _logs.log)("ble-advertisement", id + " (" + String(name) + ")");
    observer.next({
      type: "add",
      descriptor: peripheral,
      device: {
        id,
        name
      }
    });
  };

  _noble.default.addListener("discover", onDiscover);

  _noble.default.startScanning((0, _devices.getBluetoothServiceUuids)(), true);

  return () => {
    _noble.default.removeListener("discover", onDiscover);

    _noble.default.stopScanning();
  };
});

exports.listen = listen;

const retrieveServiceAndCharacteristics = async device => {
  const [service] = await discoverDeviceServices(device);
  const infos = (0, _devices.getInfosForServiceUuid)(service.uuid);

  if (!infos) {
    throw new _errors.TransportError("service not found", "BLEServiceNotFound");
  }

  const characteristics = await discoverServiceCharacteristics(service);
  let writeC;
  let notifyC;

  for (const c of characteristics) {
    if (c.uuid === infos.writeUuid.replace(/-/g, "")) {
      writeC = c;
    } else if (c.uuid === infos.notifyUuid.replace(/-/g, "")) {
      notifyC = c;
    }
  }

  if (!writeC || !notifyC) {
    throw new _errors.TransportError("missing characteristics", "BLEMissingCharacteristics");
  }

  return {
    writeC,
    notifyC,
    deviceModel: infos.deviceModel
  };
};

exports.retrieveServiceAndCharacteristics = retrieveServiceAndCharacteristics;

const monitorCharacteristic = characteristic => {
  let resolve;
  let reject;
  const readyness = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const observable = _rxjs.Observable.create(o => {
    function onCharacteristicValueChanged(data) {
      o.next(Buffer.from(data));
    }

    function onSubscribe(error) {
      if (error) {
        reject(error);
        o.error(error);
      } else {
        resolve();
        (0, _logs.log)("verbose", "start monitor " + characteristic.uuid);
      }
    }

    characteristic.on("data", onCharacteristicValueChanged);
    characteristic.subscribe(onSubscribe);
    return () => {
      (0, _logs.log)("verbose", "end monitor " + characteristic.uuid);
      characteristic.removeListener("data", onCharacteristicValueChanged);
      characteristic.unsubscribe();
    };
  });

  return [observable, readyness];
};

exports.monitorCharacteristic = monitorCharacteristic;

const write = (writeCharacteristic, buffer) => new Promise((resolve, reject) => {
  writeCharacteristic.write(buffer, false, e => {
    if (e) reject(e);else resolve();
  });
});

exports.write = write;
//# sourceMappingURL=platform.js.map