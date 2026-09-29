"use client";

import { PauseCircle, X } from "lucide-react";
import type { PendingMidwife } from "./midwife_review";
import "./midwife_suspend.css";

interface SuspendMidwifeDialogProps {
  midwife: PendingMidwife;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
}

export function SuspendMidwifeDialog({
  midwife,
  onClose,
  onConfirm,
  submitting = false,
}: SuspendMidwifeDialogProps) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal suspend-modal dashboard-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-midwife-title"
      >
        <header>
          <h2 id="suspend-midwife-title">
            <PauseCircle /> Suspend Midwife
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close suspension dialog"
          >
            <X />
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const reason = new FormData(event.currentTarget).get(
              "suspension-reason",
            );
            onConfirm(typeof reason === "string" ? reason.trim() : "");
          }}
        >
          <div className="suspend-content">
            <p>
              Are you sure you want to suspend this midwife?
              <br />
              This action will temporarily deactivate the midwife&apos;s account
              and prevent them from providing services until further notice.
            </p>
            <div className="suspend-identity">
              <div className="mini-avatar">
                {midwife.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <b>{midwife.name}</b>
                <span>{midwife.qualification}</span>
                <em>Pending Review</em>
              </div>
            </div>
            <label className="modal-field" htmlFor="suspension-reason">
              <b>
                REASON FOR SUSPENSION <sup>*</sup>
              </b>
              <textarea
                id="suspension-reason"
                name="suspension-reason"
                placeholder="Please provide a reason for suspending this midwife..."
                maxLength={500}
                required
                autoFocus
              />
            </label>
            <small>
              This reason will be included in the notification sent to the
              midwife.
            </small>
          </div>
          <footer className="modal-actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="danger" disabled={submitting}>
              <PauseCircle /> {submitting ? "Suspending..." : "Suspend"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
