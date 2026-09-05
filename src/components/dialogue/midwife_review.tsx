"use client";

import {
  CheckCircle2,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

/**
 * Minimal profile data passed into the review dialog. Keeping this contract
 * small makes the dialog reusable for any pending midwife record.
 */
export interface PendingMidwife {
  name: string;
  phone: string;
  email: string;
  license: string;
  qualification: string;
  experience: string;
  registered: string;
  cv: string;
}

interface ReviewMidwifeRegistrationDialogProps {
  midwife: PendingMidwife;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * ReviewMidwifeRegistrationDialog presents all submitted credentials before
 * an administrator approves or rejects a pending midwife application.
 */
export function ReviewMidwifeRegistrationDialog({
  midwife,
  onClose,
  onApprove,
  onReject,
}: ReviewMidwifeRegistrationDialogProps) {
  return (
    <div className="modal-backdrop">
      {/* The shared modal class keeps spacing, borders, and typography aligned with every dashboard dialog. */}
      <section
        className="modal review-modal dashboard-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-midwife-title"
      >
        <header>
          <h2 id="review-midwife-title">
            <ShieldCheck /> Review Midwife Registration
          </h2>
          <button onClick={onClose} aria-label="Close review dialog">
            <X />
          </button>
        </header>
        <div className="review-content">
          <div className="review-identity">
            <div className="mini-avatar">HT</div>
            <div>
              <h3>{midwife.name}</h3>
              <p>Professional Midwife</p>
            </div>
            <span className="status pending">Pending Verification</span>
          </div>
          <div className="review-section">
            <h4>
              <UserRound /> Personal Information
            </h4>
            <div className="review-info-grid">
              <p>
                <small>FULL NAME</small>
                <b>{midwife.name}</b>
              </p>
              <p>
                <small>
                  <Phone /> PHONE NUMBER
                </small>
                <b>{midwife.phone}</b>
              </p>
              <p>
                <small>
                  <Mail /> EMAIL ADDRESS
                </small>
                <b>{midwife.email}</b>
              </p>
            </div>
          </div>
          <div className="review-section">
            <h4>
              <ShieldCheck /> Professional Information
            </h4>
            <div className="review-info-grid">
              <p>
                <small>LICENSE NUMBER</small>
                <b>{midwife.license}</b>
              </p>
              <p>
                <small>
                  <GraduationCap /> QUALIFICATION
                </small>
                <b>{midwife.qualification}</b>
              </p>
              <p>
                <small>YEARS OF EXPERIENCE</small>
                <b>{midwife.experience}</b>
              </p>
            </div>
          </div>
          <div className="review-section">
            <h4>
              <FileText /> Curriculum Vitae <span>Verified format</span>
            </h4>
            <div className="cv-row">
              <FileText />
              <b>{midwife.cv}</b>
              <button>View CV ↗</button>
            </div>
          </div>
        </div>
        <footer className="review-footer">
          <label>
            <input type="checkbox" /> I have reviewed the submitted information
          </label>
          <div>
            <button className="danger-outline" onClick={onReject}>
              Reject
            </button>
            <button className="primary" onClick={onApprove}>
              <CheckCircle2 /> Approve Midwife
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
