"use client";

import { AlertTriangle, X } from "lucide-react";
import type { PendingMidwife } from "./midwife_review";

interface RejectMidwifeRegistrationDialogProps {
  midwife: PendingMidwife;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * RejectMidwifeRegistrationDialog collects the required rejection reason and
 * keeps the destructive action behind an explicit confirmation step.
 */
export function RejectMidwifeRegistrationDialog({
  midwife,
  onClose,
  onConfirm,
}: RejectMidwifeRegistrationDialogProps) {
  return (
    <div className="modal-backdrop">
      {/* Reuse the dashboard dialog surface so destructive confirmations match the rest of the admin UI. */}
      <section
        className="modal reject-modal dashboard-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-midwife-title"
      >
        <header>
          <h2 id="reject-midwife-title">
            <AlertTriangle /> Reject Midwife Registration
          </h2>
          <button onClick={onClose} aria-label="Close rejection dialog">
            <X />
          </button>
        </header>
        <div className="reject-content">
          <p>
            Are you sure you want to reject this registration request?
            <br />
            This action will notify the applicant and cannot be easily undone.
          </p>
          <div className="reject-identity">
            <div className="mini-avatar">SJ</div>
            <div>
              <b>{midwife.name}</b>
              <span>License: {midwife.license}</span>
              <em>Pending Review</em>
            </div>
          </div>
          <label className="modal-field">
            <b>
              REASON FOR REJECTION <sup>*</sup>
            </b>
            <textarea
              id="rejection-reason"
              placeholder="Please provide a reason..."
            />
          </label>
          <small>
            This reason will be included in the email sent to the applicant.
          </small>
        </div>
        <footer className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="danger"
            onClick={() =>
              onConfirm(
                (
                  document.getElementById(
                    "rejection-reason",
                  ) as HTMLTextAreaElement
                )?.value ?? "",
              )
            }
          >
            Reject
          </button>
        </footer>
      </section>
    </div>
  );
}
