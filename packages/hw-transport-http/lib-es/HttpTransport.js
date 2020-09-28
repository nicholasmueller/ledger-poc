import Transport from "@ledgerhq/hw-transport";
import { TransportError } from "@ledgerhq/errors";
import axios from "axios";
import { log } from "@ledgerhq/logs";
/**
 * HTTP transport implementation
 */

export default class HttpTransport extends Transport {
  // this transport is not discoverable
  static async open(url, timeout) {
    await HttpTransport.check(url, timeout);
    return new HttpTransport(url);
  }

  constructor(url) {
    super();
    this.url = void 0;
    this.url = url;
  }

  async exchange(apdu) {
    const apduHex = apdu.toString("hex");
    log("apdu", "=> " + apduHex);
    const response = await axios({
      method: "POST",
      url: this.url,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        apduHex
      })
    });

    if (response.status !== 200) {
      throw new TransportError("failed to communicate to server. code=" + response.status, "HttpTransportStatus" + response.status);
    }

    const body = await response.data;
    if (body.error) throw body.error;
    log("apdu", "<= " + body.data);
    return Buffer.from(body.data, "hex");
  }

  setScrambleKey() {}

  close() {
    return Promise.resolve();
  }

}

HttpTransport.isSupported = () => Promise.resolve(typeof fetch === "function");

HttpTransport.list = () => Promise.resolve([]);

HttpTransport.listen = _observer => ({
  unsubscribe: () => {}
});

HttpTransport.check = async (url, timeout = 5000) => {
  const response = await axios({
    url,
    timeout
  });

  if (response.status !== 200) {
    throw new TransportError("failed to access HttpTransport(" + url + "): status " + response.status, "HttpTransportNotAccessible");
  }
};
//# sourceMappingURL=HttpTransport.js.map