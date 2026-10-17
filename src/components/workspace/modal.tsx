"use client";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/icon";
export function Modal({
  title,
  close,
  children,
  variant,
}: {
  variant?: "signin";
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={`modal max-w-none translate-x-0 translate-y-0 ${variant === "signin" ? "signin-modal" : ""}`}
      >
        {variant === "signin" && (
          <div className="signin-art" aria-hidden="true">
            <svg viewBox="0 0 320 150" fill="none">
              <path
                className="memory-line memory-line-one"
                d="M0 104C51 104 59 35 111 35S188 118 233 80 283 45 320 48"
              />
              <path
                className="memory-line memory-line-two"
                d="M0 120C59 120 79 56 128 56S183 104 225 61 281 27 320 29"
              />
              <path
                className="memory-line memory-line-three"
                d="M0 84C48 84 71 17 116 17S191 88 236 46 287 13 320 12"
              />
              <circle className="memory-orbit" cx="160" cy="75" r="48" />
            </svg>
            <span className="signin-mark">
              <Icon name="cards" size={30} />
            </span>
            <span className="signin-art-caption">
              A LITTLE PRACTICE. A LASTING TRACE.
            </span>
          </div>
        )}
        <div className="modal-heading">
          <DialogTitle asChild>
            <h2 id="modal-title">{title}</h2>
          </DialogTitle>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
