import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { AccountFormConfig, AccountFormValues } from "./account-form-config";
import "./account-form.css";

type AccountCredentialsFormProps = {
  config: AccountFormConfig;
  isSubmitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (values: AccountFormValues) => Promise<void>;
};

function passwordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 50;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 25;
  return Math.min(score, 100);
}

/** Shared credential form used for user, midwife, and admin account creation. */
export function AccountCredentialsForm({
  config,
  isSubmitting = false,
  error,
  onCancel,
  onSubmit,
}: AccountCredentialsFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!identifier.trim()) {
      setValidationError("Email or phone number is required.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    await onSubmit({ identifier: identifier.trim(), password, confirmPassword });
  }

  const displayError = validationError ?? error;

  return (
    <form className="account-form-card" onSubmit={handleSubmit} noValidate>
      <div className="account-form-section-head">
        <div>
          <h2>{config.sectionTitle}</h2>
          {config.sectionSubtitle ? <small>{config.sectionSubtitle}</small> : null}
        </div>
        <div className="account-form-section-icon" aria-hidden="true">
          <UserPlus />
        </div>
      </div>

      <div className="account-form-field">
        <label htmlFor="account-identifier">
          {config.emailLabel} <span>*</span>
        </label>
        <div className="account-form-input-wrap">
          <Mail aria-hidden="true" />
          <input
            id="account-identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={config.emailPlaceholder}
            autoComplete="username"
            required
          />
        </div>
        {config.emailHelper ? (
          <p className="account-form-helper">{config.emailHelper}</p>
        ) : null}
      </div>

      <div className="account-form-field">
        <label htmlFor="account-password">
          Password <span>*</span>
        </label>
        <div className="account-form-input-wrap">
          <LockKeyhole aria-hidden="true" />
          <input
            id="account-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="account-form-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {config.passwordHelper ? (
          <>
            <div className="account-form-strength" aria-hidden="true">
              <i style={{ width: `${strength}%` }} />
            </div>
            <p className="account-form-helper">{config.passwordHelper}</p>
          </>
        ) : null}
      </div>

      <div className="account-form-field">
        <label htmlFor="account-confirm-password">
          Confirm Password <span>*</span>
        </label>
        <div className="account-form-input-wrap">
          <ShieldCheck aria-hidden="true" />
          <input
            id="account-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••••••"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="account-form-toggle"
            onClick={() => setShowConfirmPassword((visible) => !visible)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      <div
        className={`account-form-alert ${config.alert.tone}`}
        role="note"
      >
        {config.alert.tone === "warning" ? <AlertTriangle /> : <Info />}
        <p>{config.alert.message}</p>
      </div>

      {displayError ? (
        <p className="account-form-error" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="account-form-actions">
        <button type="button" className="outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={isSubmitting}>
          <UserPlus aria-hidden="true" />
          {isSubmitting ? "Creating…" : config.submitLabel}
        </button>
      </div>
    </form>
  );
}
