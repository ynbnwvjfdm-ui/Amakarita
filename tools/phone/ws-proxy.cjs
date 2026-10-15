// Loaded into the Expo CLI by tools/phone/start.sh (node --require).
//
// In a Claude Code cloud session every outside connection must go through the
// session's HTTPS proxy. Expo's tunnel opens a websocket with the `ws`
// library, which connects directly unless it is given an agent, so the
// tunnel fails with "getaddrinfo ENOTFOUND ...on.expo.app". This hands every
// non-local `ws` connection an agent that goes through the proxy.
const Module = require('module');

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxy) {
  const { HttpsProxyAgent } = require('https-proxy-agent');
  const agent = new HttpsProxyAgent(proxy);
  const isLocal = (url) => /^wss?:\/\/(localhost|127\.|\[::1\])/.test(String(url));
  const patched = new WeakSet();
  const load = Module._load;
  Module._load = function (request) {
    const m = load.apply(this, arguments);
    if (request === 'ws' && m && m.WebSocket && !patched.has(m)) {
      patched.add(m);
      class ProxiedWebSocket extends m.WebSocket {
        constructor(address, protocols, options) {
          if (address != null && !isLocal(address)) {
            // `ws` takes its options either second or third.
            if (protocols && typeof protocols === 'object' && !Array.isArray(protocols)) protocols = { agent, ...protocols };
            else options = { agent, ...(options || {}) };
          }
          super(address, protocols, options);
        }
      }
      m.WebSocket = ProxiedWebSocket;
    }
    return m;
  };
}
