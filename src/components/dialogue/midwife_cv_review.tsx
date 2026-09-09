"use client";

import { CheckCircle2, FileText, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { PendingMidwife } from "./midwife_review";
import type { HospitalRecord, UpdateMidwifeApplicationPayload } from "../../features/admin/api/types";
import "./midwife_cv_review.css";

interface MidwifeCvReviewDialogProps {
  midwife: PendingMidwife;
  hospitals: HospitalRecord[];
  initialValues: {
    licenseNumber: string;
    bio: string;
    experienceYears: number;
    hospitalId: string;
    cvUrl: string | null;
  };
  onClose: () => void;
  onApprove: (payload: UpdateMidwifeApplicationPayload) => Promise<void>;
  onReject: () => void;
}

export function MidwifeCvReviewDialog({
  midwife,
  hospitals,
  initialValues,
  onClose,
  onApprove,
  onReject,
}: MidwifeCvReviewDialogProps) {
  const [about, setAbout] = useState(initialValues.bio);
  const [licenseNumber, setLicenseNumber] = useState(initialValues.licenseNumber);
  const [experienceYears, setExperienceYears] = useState(String(initialValues.experienceYears));
  const [hospitalId, setHospitalId] = useState(initialValues.hospitalId);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // The parent first PATCHes the admin-completed fields, then approves.
      await onApprove({
        license_number: licenseNumber.trim(),
        bio: about.trim(),
        experience_years: Number(experienceYears),
        hospital_id: hospitalId,
        ...(cvFile ? { cv_file: cvFile } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save application details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        className="modal midwife-cv-modal dashboard-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="midwife-cv-title"
      >
        <header>
          <h2 id="midwife-cv-title">Review Midwife Registration</h2>
          <button type="button" onClick={onClose} aria-label="Close CV review">
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="cv-review-body">
            <section className="cv-document" aria-label="Curriculum vitae">
              <div className="cv-document-heading">
                <FileText />
                <div>
                  <h3>{midwife.name}</h3>
                  <p>Submitted curriculum vitae</p>
                </div>
              </div>
              <div className="cv-document-copy">
                <strong>Professional credentials</strong>
                <p>{midwife.qualification}</p>
                <p>{midwife.experience} of clinical experience</p>
                <p>License number: {midwife.license}</p>
                <p>Registered: {midwife.registered}</p>
              </div>
              {initialValues.cvUrl ? (
                <a href={initialValues.cvUrl} target="_blank" rel="noreferrer">
                  Open submitted CV
                </a>
              ) : null}
            </section>
            <section
              className="cv-information-form"
              aria-label="Midwife information"
            >
              <div className="cv-form-heading">
                <div>
                  <h3>Midwife Information</h3>
                  <p>{midwife.name}</p>
                </div>
                <span className="status pending">Pending Verification</span>
              </div>
              <label>
                <span>LICENSE NUMBER</span>
                <input
                  required
                  value={licenseNumber}
                  onChange={(event) => setLicenseNumber(event.target.value)}
                  placeholder="Enter verified licence number"
                />
              </label>
              <label>
                <span>ABOUT THE MIDWIFE</span>
                <textarea
                  required
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  placeholder="Add a short professional summary..."
                />
              </label>
              <label>
                <span>YEARS OF WORK EXPERIENCE</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(event) => setExperienceYears(event.target.value)}
                  placeholder="e.g. 5"
                />
              </label>
              <label>
                <span>HOSPITAL / WORKPLACE</span>
                <select
                  required
                  value={hospitalId}
                  onChange={(event) => setHospitalId(event.target.value)}
                >
                  <option value="">Select a hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>CV FILE</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </section>
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <footer className="review-footer cv-review-footer">
            <label>
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />
              I have reviewed the submitted CV and completed the required
              information.
            </label>
            <div>
              <button
                type="button"
                className="danger-outline"
                onClick={onReject}
                disabled={saving}
              >
                Reject
              </button>
              <button type="submit" className="primary" disabled={!reviewed || saving}>
                <CheckCircle2 /> {saving ? "Saving..." : "Approve Midwife"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
