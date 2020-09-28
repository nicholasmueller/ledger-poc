import HttpTransport from "./HttpTransport";
import WebSocketTransport from "./WebSocketTransport";
import Transport from "@ledgerhq/hw-transport";

const getTransport = url => !url.startsWith("ws") ? HttpTransport : WebSocketTransport;

const inferURLs = async urls => {
  const r = await (typeof urls === "function" ? urls() : urls);
  return typeof r === "string" ? [r] : r;
};

export default (urls => {
  class StaticTransport extends Transport {}

  StaticTransport.isSupported = HttpTransport.isSupported;

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
});
//# sourceMappingURL=withStaticURLs.js.map