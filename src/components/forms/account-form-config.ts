export type AccountFormVariant = "user" | "midwife" | "admin";

export type AccountFormValues = {
  identifier: string;
  password: string;
  confirmPassword: string;
};

export type AccountFormConfig = {
  title: string;
  subtitle: string;
  backLabel: string;
  sectionTitle: string;
  sectionSubtitle?: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHelper?: string;
  passwordHelper?: string;
  alert: {
    tone: "info" | "warning";
    message: string;
  };
  submitLabel: string;
  footerNote?: string;
};

export const accountFormConfig: Record<AccountFormVariant, AccountFormConfig> = {
  user: {
    title: "Add User",
    subtitle: "Create a new patient/user account.",
    backLabel: "Back / Users Directory",
    sectionTitle: "Account Credentials",
    sectionSubtitle: "PRIMARY AUTHENTICATION DETAILS",
    emailLabel: "Email / Phone Number",
    emailPlaceholder: "Enter email or phone number",
    emailHelper:
      "A verification link or SMS passcode will be automatically dispatched upon registration.",
    passwordHelper: "Min. 8 characters",
    alert: {
      tone: "info",
      message:
        "Account creation creates an initial baseline record adhering to CAGH's clinical privacy framework. Midwives and hospital care teams can subsequently attach verified EHR records.",
    },
    submitLabel: "Create User",
  },
  midwife: {
    title: "Add Midwife",
    subtitle: "Create a midwife account for the platform.",
    backLabel: "Back",
    sectionTitle: "Account Credentials",
    emailLabel: "Email / Phone Number",
    emailPlaceholder: "Email or phone number",
    alert: {
      tone: "info",
      message:
        "The midwife will remain pending until their professional credentials are verified.",
    },
    submitLabel: "Create Midwife",
  },
  admin: {
    title: "Add Administrator",
    subtitle: "Create an account with administrative access.",
    backLabel: "Back to Administration Control Center",
    sectionTitle: "Account Credentials",
    emailLabel: "Email / Phone Number",
    emailPlaceholder: "Enter email or phone number",
    emailHelper:
      "A verification link and login credential alert will be dispatched to this address.",
    alert: {
      tone: "warning",
      message:
        "Administrator accounts have access to sensitive platform management functions. Privileges include system configuration, clinical user management, and hospital directory governance.",
    },
    submitLabel: "Create Admin",
    footerNote:
      "Role-based access controls compliant with HIPAA & GDPR administrative standards.",
  },
};
