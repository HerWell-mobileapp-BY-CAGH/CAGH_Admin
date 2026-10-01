"use client";

import { ArrowLeft, BadgeCheck, CheckCircle2, Clock3, FileText, IdCard, Save, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { PendingMidwife } from "./midwife_review";
import type {
  HospitalRecord,
  UpdateMidwifeApplicationPayload,
} from "../../features/admin/api/types";
import "./midwife_cv_review.css";
import "./midwife_dialogues.css";

interface MidwifeCvReviewDialogProps {
  midwife: PendingMidwife;
  hospitals: HospitalRecord[];
  initialValues: {
    licenseNumber: string;
    bio: string;
    experienceYears: number;
    hospitalId: string;
    cvUrl: string | null;
    specialty: string;
    languages: string;
  };
  onBack: () => void;
  onClose: () => void;
  onSaveInformation: (payload: UpdateMidwifeApplicationPayload) => Promise<void>;
  onApprove: (payload: UpdateMidwifeApplicationPayload) => Promise<void>;
  onReject: () => void;
}

export function MidwifeCvReviewDialog({
  midwife,
  hospitals,
  initialValues,
  onClose,
  onBack,
  onSaveInformation,
  onApprove,
  onReject,
}: MidwifeCvReviewDialogProps) {
  const [about, setAbout] = useState(initialValues.bio);
  const [licenseNumber, setLicenseNumber] = useState(
    initialValues.licenseNumber,
  );
  const [experienceYears, setExperienceYears] = useState(
    String(initialValues.experienceYears),
  );
  const [hospitalId, setHospitalId] = useState(initialValues.hospitalId);
  const [specialty, setSpecialty] = useState(initialValues.specialty);
  const [languages, setLanguages] = useState(initialValues.languages);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Display the actual uploaded document when available; never synthesize CV content.
  const cvFileName = initialValues.cvUrl?.split("/").pop() || "Submitted CV";

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
        specialty: specialty.trim(),
        languages: languages.trim(),
        ...(cvFile ? { cv_file: cvFile } : {}),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save application details.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveInformation() {
    setError(null);
    if (!licenseNumber.trim() || !about.trim() || !hospitalId || !experienceYears) {
      setError("Complete the required license, profile, experience, and workplace fields first.");
      return;
    }
    setSaving(true);
    try {
      await onSaveInformation({
        license_number: licenseNumber.trim(), bio: about.trim(),
        experience_years: Number(experienceYears), hospital_id: hospitalId,
        specialty: specialty.trim(), languages: languages.trim(),
        ...(cvFile ? { cv_file: cvFile } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save application details.");
    } finally { setSaving(false); }
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
          <button type="button" className="cv-back-button" onClick={onBack} aria-label="Back to midwife review">
            <ArrowLeft /><span>Back to review</span>
          </button>
          <div className="cv-modal-title">
            <h2 id="midwife-cv-title">Review Midwife Registration</h2>
            <p>Review the submitted CV and complete the midwife's professional information.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close CV review">
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="cv-review-body">
            <section className="cv-document-pane" aria-label="Curriculum vitae">
              <div className="cv-pane-bar"><span><FileText /> Curriculum Vitae</span><span>Original submitted document</span></div>
              {initialValues.cvUrl ? (
                <>
                  <div className="cv-file-strip"><FileText /><div><b>{cvFileName}</b><small>Uploaded by applicant</small></div><a href={initialValues.cvUrl} target="_blank" rel="noreferrer">Open in new tab</a></div>
                  <iframe className="cv-document-frame" src={initialValues.cvUrl} title={`Curriculum vitae for ${midwife.name}`} />
                </>
              ) : <div className="cv-empty"><FileText /><b>No CV was attached to this application.</b><span>Ask the applicant to provide a CV before approval.</span></div>}
            </section>
            <section
              className="cv-information-form"
              aria-label="Midwife information"
            >
              <div className="cv-pane-bar"><span><IdCard /> Midwife Information</span><span className="cv-verified"><BadgeCheck /> ID Verified</span></div>
              <div className="cv-applicant-card">
                <div className="mini-avatar">{midwife.name.slice(0, 2).toUpperCase()}</div>
                <div><h3>{midwife.name}</h3><p>{midwife.qualification}</p><small><Clock3 /> Registered {midwife.registered} · License {licenseNumber || "Not provided"}</small></div>
                <span className="status pending">Pending verification</span>
              </div>
              <label>
                <span>LICENSE NUMBER <sup>*</sup></span>
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
                <span>WORK EXPERIENCE · YEARS</span>
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
                <span>SPECIALTY</span>
                <input value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="e.g. Maternal health" />
              </label>
              <label>
                <span>LANGUAGES</span>
                <input value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="e.g. Amharic, Afaan Oromo" />
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
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
                <small>Choose the verified facility where this midwife works.</small>
              </label>
              <label className="cv-replacement-label"><span>REPLACE CV (OPTIONAL)</span><input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setCvFile(event.target.files?.[0] ?? null)} /></label>
              <button className="cv-save-info" type="button" onClick={saveInformation} disabled={saving}><Save /> {saving ? "Saving information…" : "Save Information"}</button>
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
              <button
                type="submit"
                className="primary"
                disabled={!reviewed || saving}
              >
                <CheckCircle2 /> {saving ? "Saving..." : "Approve Midwife"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
