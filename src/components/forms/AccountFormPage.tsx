import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AccountCredentialsForm } from "./AccountCredentialsForm";
import {
  accountFormConfig,
  type AccountFormVariant,
  type AccountFormValues,
} from "./account-form-config";
import "./account-form.css";

type AccountFormPageProps = {
  variant: AccountFormVariant;
  onBack: () => void;
  onSubmit: (values: AccountFormValues) => Promise<void>;
};

/** Full-page account creation flow for Users, Midwives, and Administrators. */
export function AccountFormPage({
  variant,
  onBack,
  onSubmit,
}: AccountFormPageProps) {
  const config = accountFormConfig[variant];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: AccountFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="account-form-page">
      <button type="button" className="account-form-back" onClick={onBack}>
        ← {config.backLabel}
      </button>
      <header className="account-form-heading">
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
      </header>
      <AccountCredentialsForm
        config={config}
        isSubmitting={isSubmitting}
        error={error}
        onCancel={onBack}
        onSubmit={handleSubmit}
      />
      {config.footerNote ? (
        <p className="account-form-footer-note">
          <ShieldCheck aria-hidden="true" />
          {config.footerNote}
        </p>
      ) : null}
    </section>
  );
}
