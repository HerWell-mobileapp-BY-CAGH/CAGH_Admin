import { useState, type ReactNode } from "react";
import { AccountCredentialsForm } from "./AccountCredentialsForm";
import {
  accountFormConfig,
  type AccountFormValues,
} from "./account-form-config";
import "./account-form.css";

type AccountFormModalProps = {
  onClose: () => void;
  onSubmit: (values: AccountFormValues) => Promise<void>;
};

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop account-form-modal">
      <section className="modal">
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

/** Modal wrapper for creating administrator accounts from the Administration screen. */
export function AccountFormModal({ onClose, onSubmit }: AccountFormModalProps) {
  const config = accountFormConfig.admin;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: AccountFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title={config.title} onClose={onClose}>
      <AccountCredentialsForm
        config={config}
        isSubmitting={isSubmitting}
        error={error}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </ModalShell>
  );
}
