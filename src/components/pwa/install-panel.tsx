"use client";
import { Download, Smartphone, Check, RefreshCw } from "lucide-react";
import { usePwa } from "./pwa-provider";
export function InstallPanel() {
  const { installed, canInstall, install, updateReady, update } = usePwa();
  return (
    <section className="install-panel">
      <div className="install-heading">
        <Smartphone size={22} />
        <div>
          <h3>Make a little space for Recall.</h3>
          <p>Open it from your home screen or Dock, in its own window.</p>
        </div>
      </div>
      {installed ? (
        <span className="install-state">
          <Check size={15} />
          Installed on this device
        </span>
      ) : canInstall ? (
        <button className="button" onClick={() => void install()}>
          <Download size={16} />
          Install Recall
        </button>
      ) : (
        <p className="install-hint">
          Use your browser’s install or share menu to add Recall.
        </p>
      )}
      {!installed && (
        <details className="install-instructions">
          <summary>How to install</summary>
          <p>
            iPhone or iPad: open Recall, tap Share, then Add to Home Screen.
          </p>
          <p>Mac Safari: choose File → Add to Dock.</p>
          <p>
            Chrome or Edge: use the install icon in the address bar or the
            browser’s app menu.
          </p>
        </details>
      )}
      <p className="form-hint">
        An internet connection is needed for cloud cards, saved reviews, AI, and
        uploads. Offline launches show a reconnect screen.
      </p>
      {updateReady && (
        <button className="text-button" onClick={update}>
          <RefreshCw size={14} />
          Update ready · reload Recall
        </button>
      )}
    </section>
  );
}
export function PwaStatus({
  deferUpdates = false,
}: {
  deferUpdates?: boolean;
}) {
  const { online, updateReady, update } = usePwa();
  if (!online)
    return (
      <div className="connection-banner" role="status">
        You’re offline. Reconnect to save cloud changes.
      </div>
    );
  if (!updateReady) return null;
  return (
    <div className="connection-banner" role="status">
      A new version of Recall is ready.
      <button className="text-button" disabled={deferUpdates} onClick={update}>
        {deferUpdates ? "Available after your session" : "Reload to update"}
      </button>
    </div>
  );
}
