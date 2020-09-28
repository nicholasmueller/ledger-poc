"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _HttpTransport = _interopRequireDefault(require("./HttpTransport"));

var _WebSocketTransport = _interopRequireDefault(require("./WebSocketTransport"));

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getTransport = url => !url.startsWith("ws") ? _HttpTransport.default : _WebSocketTransport.default;

const inferURLs = async urls => {
  const r = await (typeof urls === "function" ? urls() : urls);
  return typeof r === "string" ? [r] : r;
};

var _default = urls => {
  class StaticTransport extends _hwTransport.default {}

  StaticTransport.isSupported = _HttpTransport.default.isSupported;

  StaticTransport.list = () => inferURLs(urls).then(urls => Promise.all(urls.map(url => getTransport(url).check(url).then(() => [url]).catch(() => [])))).then(arrs => arrs.reduce((acc, a) => acc.concat(a), []));

  StaticTransport.listen = observer => {
    let unsubscribed = false;
    const seen = {};

    function checkLoop() {
      if (unsubscribed) return;
      inferURLs(urls).then(urls => Promise.all(urls.map(async url => {
        if (unsubscribed) return;

        try {
          await getTransport(url).check(url);
          if (unsubscribed) return;

          if (!seen[url]) {
            seen[url] = 1;
            observer.next({
              type: "add",
              descriptor: url
            });
          }
        } catch (e) {
          // nothing
          if (seen[url]) {
            delete seen[url];
            observer.next({
              type: "remove",
              descriptor: url
            });
          }
        }
      }))).then(() => new Promise(success => setTimeout(success, 5000))).then(checkLoop);
    }

    checkLoop();
    return {
      unsubscribe: () => {
        unsubscribed = true;
      }
    };
  };

  StaticTransport.open = url => getTransport(url).open(url);

  return StaticTransport;
};

exports.default = _default;
//# sourceMappingURL=withStaticURLs.js.map