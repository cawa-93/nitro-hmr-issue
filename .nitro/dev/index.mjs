globalThis._importMeta_={url:import.meta.url,env:process.env};import { Server } from 'http';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { parentPort, threadId } from 'worker_threads';
import { provider, isWindows } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/std-env/dist/index.mjs';
import { withoutTrailingSlash } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/ufo/dist/index.mjs';
import { createRouter as createRouter$1 } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/radix3/dist/index.mjs';
import { createFetch as createFetch$1, Headers } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/ohmyfetch/dist/node.mjs';
import destr from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/destr/dist/index.mjs';
import { createCall, createFetch } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/unenv/runtime/fetch/index.mjs';
import { createHooks } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/hookable/dist/index.mjs';
import { snakeCase } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/scule/dist/index.mjs';
import { hash } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/ohash/dist/index.mjs';
import { createStorage } from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/unstorage/dist/index.mjs';
import _unstorage_drivers_fs from 'file://C:/Users/kozac/Dev/temp-projects/nitro-app/node_modules/unstorage/dist/drivers/fs.mjs';
import { PrismaClient } from '@prisma/client';

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public"].concat(opts.cacheControls || []);
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    opts.cacheControls?.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.req.headers["if-modified-since"];
    event.res.setHeader("Last-Modified", modifiedTime.toUTCString());
    if (ifModifiedSince) {
      if (new Date(ifModifiedSince) >= opts.modifiedTime) {
        cacheMatched = true;
      }
    }
  }
  if (opts.etag) {
    event.res.setHeader("Etag", opts.etag);
    const ifNonMatch = event.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.res.setHeader("Cache-Control", cacheControls.join(", "));
  if (cacheMatched) {
    event.res.statusCode = 304;
    event.res.end("");
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const defer = typeof setImmediate !== "undefined" ? setImmediate : (fn) => fn();
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data);
      resolve(void 0);
    });
  });
}
function defaultContentType(event, type) {
  if (type && !event.res.getHeader("Content-Type")) {
    event.res.setHeader("Content-Type", type);
  }
}
function isStream(data) {
  return data && typeof data === "object" && typeof data.pipe === "function" && typeof data.on === "function";
}
function sendStream(event, data) {
  return new Promise((resolve, reject) => {
    data.pipe(event.res);
    data.on("end", () => resolve(void 0));
    data.on("error", (error) => reject(createError(error)));
  });
}

class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.statusMessage = "H3Error";
  }
}
function createError(input) {
  if (input instanceof H3Error) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage);
  if (input.statusCode) {
    err.statusCode = input.statusCode;
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  }
  if (input.data) {
    err.data = input.data;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.res.writableEnded) {
    return;
  }
  const h3Error = isError(error) ? error : createError(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.res.writableEnded) {
    return;
  }
  event.res.statusCode = h3Error.statusCode;
  event.res.statusMessage = h3Error.statusMessage;
  event.res.setHeader("Content-Type", MIMES.json);
  event.res.end(JSON.stringify(responseBody, null, 2));
}
function isError(input) {
  return input instanceof H3Error;
}
function callHandler(handler, req, res) {
  const isMiddleware = handler.length > 2;
  return new Promise((resolve, reject) => {
    const next = (err) => {
      if (isMiddleware) {
        res.off("close", next);
        res.off("error", next);
      }
      return err ? reject(createError(err)) : resolve(void 0);
    };
    try {
      const returned = handler(req, res, next);
      if (isMiddleware && returned === void 0) {
        res.once("close", next);
        res.once("error", next);
      } else {
        resolve(returned);
      }
    } catch (err) {
      next(err);
    }
  });
}

function defineEventHandler(handler) {
  handler.__is_handler__ = true;
  return handler;
}
const eventHandler = defineEventHandler;
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new TypeError("Invalid lazy handler result. It should be a function:", handler);
        }
        _resolved = toEventHandler(r.default || r);
        return _resolved;
      });
    }
    return _promise;
  };
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event);
    }
    return resolveHandler().then((handler) => handler(event));
  });
}
const lazyEventHandler = defineLazyEventHandler;
function isEventHandler(input) {
  return "__is_handler__" in input;
}
function toEventHandler(handler) {
  if (isEventHandler(handler)) {
    return handler;
  }
  if (typeof handler !== "function") {
    throw new TypeError("Invalid handler. It should be a function:", handler);
  }
  return eventHandler((event) => {
    return callHandler(handler, event.req, event.res);
  });
}
function createEvent(req, res) {
  const event = {
    __is_event__: true,
    req,
    res,
    context: {}
  };
  event.event = event;
  req.event = event;
  req.context = event.context;
  req.req = req;
  req.res = res;
  res.event = event;
  res.res = res;
  res.req = res.req || {};
  res.req.res = res;
  res.req.req = req;
  return event;
}

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const nodeHandler = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await handler(event);
    } catch (err) {
      if (options.onError) {
        await options.onError(err, event);
      } else {
        if (!isError(err)) {
          console.error("[h3]", err);
        }
        await sendError(event, err, !!options.debug);
      }
    }
  };
  const app = nodeHandler;
  app.nodeHandler = nodeHandler;
  app.stack = stack;
  app.handler = handler;
  app.use = (arg1, arg2, arg3) => use(app, arg1, arg2, arg3);
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    arg1.forEach((i) => use(app, i, arg2, arg3));
  } else if (Array.isArray(arg2)) {
    arg2.forEach((i) => use(app, arg1, i, arg3));
  } else if (typeof arg1 === "string") {
    app.stack.push(normalizeLayer({ ...arg3, route: arg1, handler: arg2 }));
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, route: "/", handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.req.originalUrl = event.req.originalUrl || event.req.url || "/";
    const reqUrl = event.req.url || "/";
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!reqUrl.startsWith(layer.route)) {
          continue;
        }
        event.req.url = reqUrl.slice(layer.route.length) || "/";
      } else {
        event.req.url = reqUrl;
      }
      if (layer.match && !layer.match(event.req.url, event)) {
        continue;
      }
      const val = await layer.handler(event);
      if (event.res.writableEnded) {
        return;
      }
      const type = typeof val;
      if (type === "string") {
        return send(event, val, MIMES.html);
      } else if (isStream(val)) {
        return sendStream(event, val);
      } else if (type === "object" || type === "boolean" || type === "number") {
        if (val && val.buffer) {
          return send(event, val);
        } else if (val instanceof Error) {
          throw createError(val);
        } else {
          return send(event, JSON.stringify(val, null, spacing), MIMES.json);
        }
      }
    }
    if (!event.res.writableEnded) {
      throw createError({ statusCode: 404, statusMessage: "Not Found" });
    }
  });
}
function normalizeLayer(input) {
  let handler = input.handler || input.handle;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}

const RouterMethods = ["connect", "delete", "get", "head", "options", "post", "put", "trace"];
function createRouter() {
  const _router = createRouter$1({});
  const routes = {};
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      method.forEach((m) => addRoute(path, handler, m));
    } else {
      route.handlers[method] = toEventHandler(handler);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  router.handler = eventHandler((event) => {
    let path = event.req.url || "/";
    const queryUrlIndex = path.lastIndexOf("?");
    if (queryUrlIndex > -1) {
      path = path.substring(0, queryUrlIndex);
    }
    const matched = _router.lookup(path);
    if (!matched) {
      throw createError({
        statusCode: 404,
        name: "Not Found",
        statusMessage: `Cannot find any route matching ${event.req.url || "/"}.`
      });
    }
    const method = (event.req.method || "get").toLowerCase();
    const handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      throw createError({
        statusCode: 405,
        name: "Method Not Allowed",
        statusMessage: `Method ${method} is not allowed on this route.`
      });
    }
    const params = matched.params || {};
    event.event.context.params = params;
    event.req.context.params = params;
    return handler(event);
  });
  return router;
}

const _runtimeConfig = {"app":{"baseURL":"/"},"nitro":{"routes":{}}};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _runtimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const getEnv = (key) => {
  const envKey = snakeCase(key).toUpperCase();
  return destr(process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]);
};
function isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function overrideConfig(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey);
    if (isObject(obj[key])) {
      if (isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      overrideConfig(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
}
overrideConfig(_runtimeConfig);
const config = deepFreeze(_runtimeConfig);
const useRuntimeConfig = () => config;
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const globalTiming = globalThis.__timing__ || {
  start: () => 0,
  end: () => 0,
  metrics: []
};
function timingMiddleware(_req, res, next) {
  const start = globalTiming.start();
  const _end = res.end;
  res.end = (data, encoding, callback) => {
    const metrics = [["Generate", globalTiming.end(start)], ...globalTiming.metrics];
    const serverTiming = metrics.map((m) => `-;dur=${m[1]};desc="${encodeURIComponent(m[0])}"`).join(", ");
    if (!res.headersSent) {
      res.setHeader("Server-Timing", serverTiming);
    }
    _end.call(res, data, encoding, callback);
  };
  next();
}

const serverAssets = [{"baseName":"server","dir":"C:/Users/kozac/Dev/temp-projects/nitro-app/assets"}];

const assets = createStorage();

for (const asset of serverAssets) {
  assets.mount(asset.baseName, _unstorage_drivers_fs({ base: asset.dir }));
}

const storage = createStorage({});

const useStorage = () => storage;

storage.mount('/assets', assets);

storage.mount('root', _unstorage_drivers_fs({"driver":"fs","base":"C:\\Users\\kozac\\Dev\\temp-projects\\nitro-app","ignore":["**/node_modules/**","**/.git/**"]}));
storage.mount('src', _unstorage_drivers_fs({"driver":"fs","base":"C:\\Users\\kozac\\Dev\\temp-projects\\nitro-app","ignore":["**/node_modules/**","**/.git/**"]}));
storage.mount('build', _unstorage_drivers_fs({"driver":"fs","base":"C:\\Users\\kozac\\Dev\\temp-projects\\nitro-app\\.nitro","ignore":["**/node_modules/**","**/.git/**"]}));
storage.mount('cache', _unstorage_drivers_fs({"driver":"fs","base":"C:\\Users\\kozac\\Dev\\temp-projects\\nitro-app\\.nitro\\cache","ignore":["**/node_modules/**","**/.git/**"]}));

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro";
  const name = opts.name || fn.name || "_";
  const integrity = hash([opts.integrity, fn, opts]);
  async function get(key, resolver) {
    const cacheKey = [opts.base, group, name, key].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl;
    const _resolve = async () => {
      if (!pending[key]) {
        pending[key] = Promise.resolve(resolver());
      }
      entry.value = await pending[key];
      entry.mtime = Date.now();
      entry.integrity = integrity;
      delete pending[key];
      useStorage().setItem(cacheKey, entry).catch((error) => console.error("[nitro] [cache]", error));
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (opts.swr && entry.value) {
      _resolvePromise.catch(console.error);
      return Promise.resolve(entry);
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const key = (opts.getKey || getKey)(...args);
    const entry = await get(key, () => fn(...args));
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length ? hash(args, {}) : "";
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const _opts = {
    ...opts,
    getKey: (event) => {
      return event.req.originalUrl || event.req.url;
    },
    group: opts.group || "nitro/handlers",
    integrity: [
      opts.integrity,
      handler
    ]
  };
  const _cachedHandler = cachedFunction(async (incomingEvent) => {
    const reqProxy = cloneWithProxy(incomingEvent.req, { headers: {} });
    const resHeaders = {};
    const resProxy = cloneWithProxy(incomingEvent.res, {
      statusCode: 200,
      getHeader(name) {
        return resHeaders[name];
      },
      setHeader(name, value) {
        resHeaders[name] = value;
        return this;
      },
      getHeaderNames() {
        return Object.keys(resHeaders);
      },
      hasHeader(name) {
        return name in resHeaders;
      },
      removeHeader(name) {
        delete resHeaders[name];
      },
      getHeaders() {
        return resHeaders;
      }
    });
    const event = createEvent(reqProxy, resProxy);
    event.context = incomingEvent.context;
    const body = await handler(event);
    const headers = event.res.getHeaders();
    headers.Etag = `W/"${hash(body)}"`;
    headers["Last-Modified"] = new Date().toUTCString();
    const cacheControl = [];
    if (opts.swr) {
      if (opts.maxAge) {
        cacheControl.push(`s-maxage=${opts.maxAge}`);
      }
      if (opts.staleMaxAge) {
        cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
      } else {
        cacheControl.push("stale-while-revalidate");
      }
    } else if (opts.maxAge) {
      cacheControl.push(`max-age=${opts.maxAge}`);
    }
    if (cacheControl.length) {
      headers["Cache-Control"] = cacheControl.join(", ");
    }
    const cacheEntry = {
      code: event.res.statusCode,
      headers,
      body
    };
    return cacheEntry;
  }, _opts);
  return defineEventHandler(async (event) => {
    const response = await _cachedHandler(event);
    if (event.res.headersSent || event.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["Last-Modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.res.statusCode = response.code;
    for (const name in response.headers) {
      event.res.setHeader(name, response.headers[name]);
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const plugins = [
  
];

function hasReqHeader(req, header, includes) {
  const value = req.headers[header];
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event.req, "accept", "application/json") || hasReqHeader(event.req, "user-agent", "curl/") || hasReqHeader(event.req, "user-agent", "httpie/") || event.req.url?.endsWith(".json") || event.req.url?.includes("/api/");
}
function normalizeError(error) {
  const cwd = process.cwd();
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Route Not Found" : "Internal Server Error");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const isDev = "development" === "development";
const errorHandler = (function(error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(error);
  const showDetails = isDev && statusCode !== 404;
  const errorObject = {
    url: event.req.url || "",
    statusCode,
    statusMessage,
    message,
    stack: showDetails ? stack.map((i) => i.text) : void 0
  };
  if (statusCode !== 404) {
    console.error("[nitro] [request error]", error.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  event.res.statusCode = statusCode;
  event.res.statusMessage = statusMessage;
  if (isJsonRequest(event)) {
    event.res.setHeader("Content-Type", "application/json");
    event.res.end(JSON.stringify(errorObject));
  } else {
    event.res.setHeader("Content-Type", "text/html");
    event.res.end(renderHTMLError(errorObject));
  }
});
function renderHTMLError(error) {
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "server";
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${statusCode} ${statusMessage}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico/css/pico.min.css">
  </head>
  <body>
    <main class="container">
      <dialog open>
        <article>
          <header>
            <h2>${statusCode} ${statusMessage}</h2>
          </header>
          <code>
            ${error.message}<br><br>
            ${"\n" + (error.stack || []).map((i) => `&nbsp;&nbsp;${i}`).join("<br>")}
          </code>
          <footer>
            <a href="/" onclick="event.preventDefault();history.back();">Go Back</a>
          </footer>
        </article>
      </dialog>
    </main>
  </body>
</html>
`;
}

const _lazy_486606 = () => Promise.resolve().then(function () { return index$1; });

const handlers = [
  { route: '', handler: _lazy_486606, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const h3App = createApp({
    debug: destr(true),
    onError: errorHandler
  });
  h3App.use(config.app.baseURL, timingMiddleware);
  const router = createRouter();
  const routerOptions = createRouter$1({ routes: config.nitro.routes });
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    const referenceRoute = h.route.replace(/:\w+|\*\*/g, "_");
    const routeOptions = routerOptions.lookup(referenceRoute) || {};
    if (routeOptions.swr) {
      handler = cachedEventHandler(handler, {
        group: "nitro/routes"
      });
    }
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(/\/+/g, "/");
      h3App.use(middlewareBase, handler);
    } else {
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router);
  const localCall = createCall(h3App.nodeHandler);
  const localFetch = createFetch(localCall, globalThis.fetch);
  const $fetch = createFetch$1({ fetch: localFetch, Headers, defaults: { baseURL: config.app.baseURL } });
  globalThis.$fetch = $fetch;
  const app = {
    hooks,
    h3App,
    localCall,
    localFetch
  };
  for (const plugin of plugins) {
    plugin(app);
  }
  return app;
}
const nitroApp = createNitroApp();

const server = new Server(nitroApp.h3App.nodeHandler);
function getAddress() {
  if (provider === "stackblitz" || process.env.NITRO_NO_UNIX_SOCKET) {
    return "0";
  }
  const socketName = `worker-${process.pid}-${threadId}.sock`;
  if (isWindows) {
    return join("\\\\.\\pipe\\nitro", socketName);
  } else {
    const socketDir = join(tmpdir(), "nitro");
    mkdirSync(socketDir, { recursive: true });
    return join(socketDir, socketName);
  }
}
const listenAddress = getAddress();
server.listen(listenAddress, () => {
  const _address = server.address();
  parentPort.postMessage({
    event: "listen",
    address: typeof _address === "string" ? { socketPath: _address } : { host: "localhost", port: _address.port }
  });
});
{
  process.on("unhandledRejection", (err) => console.error("[nitro] [dev] [unhandledRejection]", err));
  process.on("uncaughtException", (err) => console.error("[nitro] [dev] [uncaughtException]", err));
}

console.log("[PrismaClient] [before] new PrismaClient()");
new PrismaClient();
console.log("[PrismaClient] [after] new PrismaClient()");
const index = () => {
  return {
    users: "client.user.findMany()"
  };
};

const index$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': index
});
//# sourceMappingURL=index.mjs.map
