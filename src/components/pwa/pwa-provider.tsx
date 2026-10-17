"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
function subscribeInstalled(callback: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}
const onlineSnapshot = () => navigator.onLine;
const installedSnapshot = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const Context = createContext<{
  online: boolean;
  installed: boolean;
  canInstall: boolean;
  updateReady: boolean;
  install: () => Promise<void>;
  update: () => void;
} | null>(null);
export function PwaProvider({ children }: { children: ReactNode }) {
  const online = useSyncExternalStore(
    subscribeOnline,
    onlineSnapshot,
    () => true,
  );
  const installed = useSyncExternalStore(
    subscribeInstalled,
    installedSnapshot,
    () => false,
  );
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const reload = useRef(false);
  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", beforeInstall);
  }, []);
  useEffect(() => {
    // Keep the browser bar matched to Recall's selected theme, including manual changes.
    const sync = () => {
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute(
        "content",
        document.documentElement.dataset.theme === "dark"
          ? "#1c201c"
          : "#faf9f6",
      );
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // An earlier production build must not intercept hot-reload development requests.
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) =>
          Promise.all(
            regs
              .filter(
                (reg) =>
                  reg.active?.scriptURL ===
                  new URL("/sw.js", location.origin).href,
              )
              .map((reg) => reg.unregister()),
          ),
        )
        .catch(() => {});
      return;
    }
    let cancelled = false;
    let tracked: ServiceWorker | null = null;
    const ready = () => {
      if (!cancelled && registration.current?.waiting) setUpdateReady(true);
    };
    const controllerChanged = () => {
      if (reload.current) window.location.reload();
    };
    const onUpdateFound = () => {
      tracked = registration.current?.installing || null;
      tracked?.addEventListener("statechange", ready);
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChanged,
    );
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return;
        registration.current = reg;
        ready();
        reg.addEventListener("updatefound", onUpdateFound);
      })
      .catch(() => {
        console.warn("Recall offline fallback could not be registered.");
      });
    return () => {
      cancelled = true;
      registration.current?.removeEventListener("updatefound", onUpdateFound);
      tracked?.removeEventListener("statechange", ready);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChanged,
      );
    };
  }, []);
  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }
  function update() {
    const waiting = registration.current?.waiting;
    if (waiting) {
      reload.current = true;
      waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }
  return (
    <Context.Provider
      value={{
        online,
        installed,
        canInstall: Boolean(installEvent) && !installed,
        updateReady,
        install,
        update,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePwa() {
  const value = useContext(Context);
  if (!value) throw new Error("PWA provider is missing.");
  return value;
}
