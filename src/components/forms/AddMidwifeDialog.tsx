import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Info, LockKeyhole, Mail, UserRound, X, BriefcaseBusiness, Building2, Phone } from "lucide-react";
import { getHospitals } from "../../features/admin/api/admin-api";
import type { CreateMidwifeAccountPayload } from "../../features/admin/api/types";
import { useAsyncData } from "../../features/admin/hooks/useAsyncData";
import "./add-midwife-dialog.css";

export function AddMidwifeDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: CreateMidwifeAccountPayload) => Promise<void>;
}) {
  const hospitalsQuery = useAsyncData(getHospitals, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        identifier: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim().startsWith("+251") ? phoneNumber.trim() : `+251${phoneNumber.trim()}`,
        licenseNumber: licenseNumber.trim(),
        specialty: specialty.trim(),
        experienceYears: Number(experienceYears),
        hospitalId,
        bio: bio.trim(),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add this midwife.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop add-midwife-backdrop">
      <section className="add-midwife-dialog" role="dialog" aria-modal="true" aria-labelledby="add-midwife-title">
        <header>
          <div><h2 id="add-midwife-title">Add New Midwife</h2><p>Add a midwife and their account and professional information.</p></div>
          <button type="button" onClick={onClose} aria-label="Close add midwife dialog"><X /></button>
        </header>
        <form onSubmit={submit}>
          <div className="add-midwife-body">
            <section className="midwife-form-section">
              <h3><LockKeyhole /> Account Information</h3>
              <div className="midwife-form-grid">
                <label>Email <sup>*</sup><span className="midwife-input"><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email address" required autoComplete="email" /></span></label>
                <label>Temporary Password <sup>*</sup><span className="midwife-input"><LockKeyhole /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter temporary password" minLength={8} required autoComplete="new-password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
              </div>
              <p className="midwife-form-note"><Info /> The midwife can use this password to log in initially.</p>
            </section>

            <section className="midwife-form-section">
              <h3><UserRound /> Personal Information</h3>
              <div className="midwife-form-grid">
                <label>Name <sup>*</sup><span className="midwife-input"><UserRound /><input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter full name" required autoComplete="name" /></span></label>
                <label>Phone Number <sup>*</sup><span className="midwife-phone-input"><b>🇪🇹 +251</b><input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value.replace(/^\+?251\s*/, ""))} placeholder="9xx xxx xxx" required autoComplete="tel-national" /><Phone /></span></label>
              </div>
            </section>

            <section className="midwife-form-section">
              <h3><BriefcaseBusiness /> Professional Information</h3>
              <div className="midwife-form-grid">
                <label>License Number<span className="midwife-input"><BriefcaseBusiness /><input value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} placeholder="Enter license number" /></span></label>
                <label>Qualification / Specialty<span className="midwife-input"><input value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="Enter qualification or specialty" /></span></label>
                <label>Years of Experience <sup>*</sup><span className="midwife-input"><input type="number" min="0" step="1" value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)} placeholder="e.g. 5" required /></span></label>
                <label>Hospital<span className="midwife-input"><Building2 /><select value={hospitalId} onChange={(event) => setHospitalId(event.target.value)}><option value="">Select hospital</option>{hospitalsQuery.data?.data.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></span>{hospitalsQuery.error ? <small className="midwife-field-error">{hospitalsQuery.error}</small> : null}</label>
              </div>
            </section>

            <section className="midwife-form-section about-midwife-section">
              <h3><Info /> About the Midwife</h3>
              <label>About the Midwife<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} placeholder="Briefly describe the midwife's experience, background, areas of expertise, and professional experience..." /></label>
              <small className="midwife-character-count">{bio.length} / 500</small>
            </section>
            {error ? <p className="midwife-form-error" role="alert">{error}</p> : null}
          </div>
          <footer><button type="button" className="outline" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" className="primary" disabled={submitting || hospitalsQuery.loading}>{submitting ? "Adding..." : "Add Midwife"}</button></footer>
        </form>
      </section>
    </div>
  );
}
