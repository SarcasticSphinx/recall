"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, Smartphone, Check, RefreshCw } from "lucide-react";
import { installGuide } from "@/lib/install-guide";
import { usePwa } from "./pwa-provider";
export function InstallPanel() {
  const { installed, canInstall, install, updateReady, update } = usePwa();
  const [guide, setGuide] = useState(installGuide);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [promptFailed, setPromptFailed] = useState(false);
  async function handleInstall() {
    setGuide(installGuide(navigator));
    if (!canInstall) {
      setPromptFailed(false);
      setHelpOpen(true);
      return;
    }
    setInstalling(true);
    try {
      const outcome = await install();
      if (outcome === "failed" || outcome === "unavailable") {
        setPromptFailed(outcome === "failed");
        setHelpOpen(true);
      }
    } finally {
      setInstalling(false);
    }
  }
  return (
    <section className="install-panel">
      <div className="install-heading">
        <Smartphone size={22} />
        <div>
          <h3>Install Recall</h3>
          <p>Open it from your home screen or Dock, in its own window.</p>
        </div>
      </div>
      {installed ? (
        <span className="install-state">
          <Check size={15} />
          Installed on this device
        </span>
      ) : (
        <Button
          className="button primary"
          disabled={installing}
          onClick={() => void handleInstall()}
        >
          <Download size={16} />
          {installing ? "Opening install…" : "Install Recall"}
        </Button>
      )}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="install-dialog">
          <DialogHeader>
            <DialogTitle>{guide.title}</DialogTitle>
            <DialogDescription>
              {promptFailed
                ? "The install prompt couldn’t open. You can still use your browser’s menu."
                : guide.description}
            </DialogDescription>
          </DialogHeader>
          <ol className="install-device-steps">
            {guide.steps.map((step, index) => (
              <li key={step}>
                <strong>Step {index + 1}</strong>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <p className="install-hint">
            Installation needs your confirmation in the browser. Recall can’t
            install itself silently.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="button">Got it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
