import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import manifest from "../src/app/manifest.ts";
test("install manifest points to correctly sized any and maskable icons", async () => {
  const m = manifest();
  assert.equal(m.display, "standalone");
  assert.equal(m.scope, "/");
  assert.equal(m.start_url, "/");
  for (const icon of m.icons) {
    const file = await readFile(
      new URL("../public" + icon.src, import.meta.url),
    );
    assert.equal(
      `${file.readUInt32BE(16)}x${file.readUInt32BE(20)}`,
      icon.sizes,
    );
  }
  assert.ok(m.icons.some((i) => i.purpose === "maskable"));
});
test("worker caches public assets only and falls back offline without caching account pages", async () => {
  const handlers = {};
  let assets = [];
  const deleted = [];
  const fallback = { offline: true };
  let fails = false;
  const cache = {
    addAll: async (list) => {
      assets = list;
    },
    match: async () => fallback,
  };
  const ctx = {
    URL,
    Response,
    Promise,
    self: {
      location: { origin: "https://recall.test" },
      clients: { claim: async () => {} },
      skipWaiting: async () => {},
      addEventListener: (name, fn) => (handlers[name] = fn),
    },
    caches: {
      open: async () => cache,
      keys: async () => ["recall-shell-old", "other-app"],
      delete: async (key) => deleted.push(key),
    },
    fetch: async () => {
      if (fails) throw Error("offline");
      return { network: true };
    },
  };
  vm.runInNewContext(
    await readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    ctx,
  );
  let wait;
  handlers.install({ waitUntil: (p) => (wait = p) });
  await wait;
  assert.ok(assets.includes("/offline.html"));
  assert.ok(assets.every((a) => !a.startsWith("/api/") && a !== "/"));
  handlers.activate({ waitUntil: (p) => (wait = p) });
  await wait;
  assert.deepEqual(deleted, ["recall-shell-old"]);
  for (const request of [
    { url: "https://recall.test/api/workspace", method: "GET" },
    { url: "https://recall.test/", method: "POST" },
    { url: "https://other.test/a", method: "GET" },
  ])
    handlers.fetch({
      request,
      respondWith: () => assert.fail("private/external request intercepted"),
    });
  const request = {
    url: "https://recall.test/",
    method: "GET",
    mode: "navigate",
  };
  handlers.fetch({ request, respondWith: (p) => (wait = p) });
  assert.deepEqual(await wait, { network: true });
  fails = true;
  handlers.fetch({ request, respondWith: (p) => (wait = p) });
  assert.equal(await wait, fallback);
});
