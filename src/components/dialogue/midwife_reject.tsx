"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import type { PendingMidwife } from "./midwife_review";
import "./midwife_dialogues.css";

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
  const [reason, setReason] = useState("");
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
        <div className="reject-content reject-dialog-content">
          <p>
            Are you sure you want to reject this registration request?
            <br />
            This action will notify the applicant and cannot be easily undone.
          </p>
          <div className="reject-identity">
            <div className="mini-avatar">
              {midwife.name.slice(0, 2).toUpperCase()}
            </div>
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
              required
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Please provide a reason..."
            />
          </label>
          <small>
            This reason will be included in the email sent to the applicant.
          </small>
          <span className="reject-char-count">{reason.length}/500</span>
        </div>
        <footer className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Reject
          </button>
        </footer>
      </section>
    </div>
  );
}
