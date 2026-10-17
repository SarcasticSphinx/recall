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

test("Preferences always offers an install action before a browser prompt is available", async () => {
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { PwaProvider } =
    await import("../src/components/pwa/pwa-provider.tsx");
  const { InstallPanel } =
    await import("../src/components/pwa/install-panel.tsx");
  const html = renderToStaticMarkup(
    React.createElement(PwaProvider, null, React.createElement(InstallPanel)),
  );
  assert.match(html, /<button[^>]*>[\s\S]*?Install Recall<\/button>/);
  assert.doesNotMatch(html, /<button[^>]*\sdisabled(?:=|[\s>])/);
});

test("install guidance matches Safari, iPad desktop mode, Android and desktop Chromium", async () => {
  const { installGuide } = await import("../src/lib/install-guide.ts");
  assert.match(
    installGuide({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/26.0 Safari/605.1.15",
      platform: "MacIntel",
    }).title,
    /Dock/,
  );
  assert.match(
    installGuide({
      userAgent: "Mozilla/5.0 (Macintosh) Safari/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    }).title,
    /Home Screen/,
  );
  assert.match(
    installGuide({ userAgent: "iPhone Safari/605.1.15" }).title,
    /Home Screen/,
  );
  assert.match(
    installGuide({ userAgent: "Android Chrome/140.0" }).title,
    /Android/,
  );
  assert.doesNotMatch(
    installGuide({
      userAgent: "Macintosh Chrome/140.0 Safari/537.36",
      platform: "MacIntel",
    }).title,
    /Dock/,
  );
});
test("favicon contains brand PNG icons at 16, 32 and 48 pixels", async () => {
  const ico = await readFile(
    new URL("../src/app/favicon.ico", import.meta.url),
  );
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (let i = 0; i < 3; i++) {
    const entry = 6 + i * 16;
    const offset = ico.readUInt32LE(entry + 12);
    const size = ico.readUInt32LE(entry + 8);
    assert.ok(offset + size <= ico.length);
    assert.equal(ico.subarray(offset + 1, offset + 4).toString(), "PNG");
    assert.equal(ico.readUInt32BE(offset + 16), [16, 32, 48][i]);
  }
});
