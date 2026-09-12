import { apiClient, getApiErrorMessage } from "../../../lib/api-client";
import { adminEndpoints } from "./endpoints";
import type {
  AdminDashboardResponse,
  AdminProfile,
  AdminLanguagePreference,
  AnalyticsOverview,
  ConsultationReport,
  ConsultationStats,
  CreateAccountPayload,
  CreateAccountResponse,
  CreateEmergencyContactPayload,
  CreateHospitalPayload,
  DirectoryRecord,
  FeedbackSummary,
  HospitalRecord,
  MidwifeApplication,
  MidwifeReviewAction,
  MidwifeReviewResponse,
  UpdateMidwifeApplicationPayload,
  PaginatedResponse,
  TableRecord,
} from "./types";

async function get<T>(url: string, fallback: string): Promise<T> {
  try {
    const response = await apiClient.get<T>(url);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallback));
  }
}

/** Fetches the real aggregate payload used by the administrator home screen. */
export function getAdminDashboard() {
  return get<AdminDashboardResponse>(
    adminEndpoints.dashboard.overview,
    "Unable to load the administrator dashboard.",
  );
}

/** Loads the language preference currently saved for the signed-in admin. */
export function getAdminLanguagePreference() {
  return get<AdminLanguagePreference>(
    adminEndpoints.languagePreference,
    "Unable to load the administrator language preference.",
  );
}

export function getAdminProfile() {
  return get<AdminProfile>(adminEndpoints.profile, "Unable to load the administrator profile.");
}

export async function updateAdminProfile(payload: Partial<AdminProfile>) {
  try {
    const response = await apiClient.patch<AdminProfile>(adminEndpoints.profile, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to save the administrator profile."));
  }
}

/** Persists the selected dashboard language (`en` or `am`) for this admin. */
export async function updateAdminLanguagePreference(
  preferred_language: AdminLanguagePreference["preferred_language"],
) {
  try {
    const response = await apiClient.patch<AdminLanguagePreference>(
      adminEndpoints.languagePreference,
      { preferred_language },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to save the administrator language preference."),
    );
  }
}

/** Reads Django pagination metadata for the live hospitals total card. */
export async function getHospitalCount() {
  try {
    const response = await apiClient.get<{ count: number }>(adminEndpoints.hospitalsDirectory);
    return response.data.count;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load the hospital count."));
  }
}

/** Lists pending applications by default; pass a status to inspect another queue. */
export function getMidwifeApplications(status?: string) {
  const params = status ? { status } : undefined;
  return apiClient
    // Django's page-number paginator returns { count, results }, while the UI
    // consistently consumes { total, data }.
    .get<{ count: number; results: MidwifeApplication[] }>(adminEndpoints.midwifeApplications, { params })
    .then((response) => ({ total: response.data.count, data: response.data.results }))
    .catch((error: unknown) => {
      throw new Error(getApiErrorMessage(error, "Unable to load midwife applications."));
    });
}

/** Sends the admin's approve, reject, or suspend decision to the backend. */
export async function reviewMidwifeApplication(
  id: string,
  action: MidwifeReviewAction,
  reason?: string,
) {
  try {
    const response = await apiClient.post<MidwifeReviewResponse>(
      adminEndpoints.midwifeApplicationReview(id),
      { action, ...(reason?.trim() ? { reason: reason.trim() } : {}) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update the midwife application."));
  }
}

/** Saves admin-supplied credentials. FormData permits a CV file upload. */
export async function updateMidwifeApplication(
  id: string,
  payload: UpdateMidwifeApplicationPayload,
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value instanceof File ? value : String(value));
    }
  }

  try {
    const response = await apiClient.patch<MidwifeApplication>(
      adminEndpoints.midwifeApplicationDetail(id),
      formData,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to save the midwife application details."),
    );
  }
}

export function getUsers() {
  return getAdminUsers("PATIENT");
}

export function getMidwives() {
  return getAdminUsers("MIDWIFE");
}

type BackendPage<T> = { count: number; results: T[] };

type BackendUser = {
  id: string;
  username: string | null;
  email: string | null;
  phone_number: string | null;
  profile?: { first_name?: string; last_name?: string; region?: string; city?: string } | null;
  midwife_profile?: { verification_status?: string } | null;
};

type BackendHospital = {
  id: string;
  name: string;
  address: string;
  midwife_count: number;
};
type BackendEmergencyContact = {
  id: string;
  user: string;
  name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
};

type BackendUserSummary = {
  username?: string | null;
  email?: string | null;
  first_name?: string;
  last_name?: string;
  profile?: { first_name?: string; last_name?: string } | null;
};

type BackendAppointment = {
  id: string;
  appointment_number: string;
  scheduled_date: string;
  appointment_type: string;
  status: string;
  user_detail: BackendUserSummary;
  midwife_detail?: { user?: BackendUserSummary } | null;
};

type BackendConsultation = {
  id: string;
  appointment: string;
  consultation_type: string;
  status: string;
  created_at: string;
  user_detail?: BackendUserSummary | null;
  midwife_detail?: { user?: BackendUserSummary } | null;
};

function displayUser(user?: BackendUserSummary | null) {
  const profile = user?.profile;
  const name = [
    profile?.first_name || user?.first_name,
    profile?.last_name || user?.last_name,
  ].filter(Boolean).join(" ");
  return name || user?.username || user?.email || "Not specified";
}

async function getAdminUsers(role: "PATIENT" | "MIDWIFE") {
  try {
    const response = await apiClient.get<BackendPage<BackendUser>>(adminEndpoints.users, {
      params: { role },
    });
    // Adapt the Django user serializer to the dashboard's existing directory rows.
    return {
      total: response.data.count,
      data: response.data.results.map((user) => ({
        id: user.id,
        name: [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(" ") || user.username || user.email || "Unnamed user",
        email: user.email ?? undefined,
        contact: user.email || user.phone_number || "No contact information",
        location: [user.profile?.city, user.profile?.region].filter(Boolean).join(", ") || "Not specified",
        status: user.midwife_profile?.verification_status || "ACTIVE",
      })),
    } satisfies PaginatedResponse<DirectoryRecord>;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load users."));
  }
}

export async function getHospitals() {
  try {
    const response = await apiClient.get<BackendPage<BackendHospital>>(adminEndpoints.hospitals);
    return {
      total: response.data.count,
      data: response.data.results.map((hospital) => ({
        id: hospital.id,
        name: hospital.name,
        location: hospital.address,
        midwifeCount: hospital.midwife_count,
        status: "ACTIVE",
      })),
    } satisfies PaginatedResponse<HospitalRecord>;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load hospitals."));
  }
}

/** Creates a hospital in the administrator-managed directory. */
export function createHospital(payload: CreateHospitalPayload) {
  return post<BackendHospital>(
    adminEndpoints.hospitals,
    payload,
    "Unable to create hospital.",
  );
}

export function getConsultations() {
  return apiClient.get<BackendPage<BackendConsultation>>(adminEndpoints.consultations)
    .then((response) => ({
      total: response.data.count,
      data: response.data.results.map((item) => ({
        id: item.id,
        cells: [item.id, item.consultation_type, displayUser(item.midwife_detail?.user), item.created_at, item.status, item.appointment],
      })),
    }) satisfies PaginatedResponse<TableRecord>)
    .catch((error: unknown) => { throw new Error(getApiErrorMessage(error, "Unable to load consultations.")); });
}

export function getConsultationStats() {
  return apiClient.get<BackendPage<BackendConsultation>>(adminEndpoints.consultations)
    .then((response) => {
      const records = response.data.results;
      const stats: ConsultationStats = {
        anonymous: records.filter((item) => !item.user_detail?.email).length,
        messages: records.filter((item) => item.consultation_type === "IN_PERSON").length,
        voice: records.filter((item) => item.consultation_type === "VIRTUAL_VOICE").length,
        completed: records.filter((item) => item.status === "COMPLETED").length,
      };
      return stats;
    })
    .catch((error: unknown) => { throw new Error(getApiErrorMessage(error, "Unable to load consultation statistics.")); });
}

export function getAppointments() {
  return apiClient.get<BackendPage<BackendAppointment>>(adminEndpoints.appointments)
    .then((response) => ({
      total: response.data.count,
      data: response.data.results.map((item) => ({
        id: item.id,
        cells: [item.scheduled_date, displayUser(item.user_detail), displayUser(item.midwife_detail?.user), item.appointment_type, item.status, item.appointment_number],
      })),
    }) satisfies PaginatedResponse<TableRecord>)
    .catch((error: unknown) => { throw new Error(getApiErrorMessage(error, "Unable to load appointments.")); });
}

export function getFeedback() {
  return get<PaginatedResponse<TableRecord>>(
    adminEndpoints.feedback,
    "Unable to load feedback.",
  );
}

export function getFeedbackSummary() {
  return get<FeedbackSummary>(
    adminEndpoints.feedbackSummary,
    "Unable to load feedback summary.",
  );
}

export function getHealthContent() {
  return get<PaginatedResponse<TableRecord>>(
    adminEndpoints.healthContent,
    "Unable to load health content.",
  );
}

export function getServices() {
  return get<PaginatedResponse<TableRecord>>(
    adminEndpoints.services,
    "Unable to load services.",
  );
}

export async function getEmergencyContacts() {
  try {
    const response = await apiClient.get<BackendPage<BackendEmergencyContact>>(
      adminEndpoints.emergencyContacts,
    );
    return {
      total: response.data.count,
      // Preserve the owner UUID so each contact can be traced to its user account.
      data: response.data.results.map((contact) => ({
        id: contact.id,
        cells: [contact.name, contact.phone_number, contact.relationship, contact.is_primary ? "Primary" : "Secondary", contact.user],
      })),
    } satisfies PaginatedResponse<TableRecord>;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load emergency contacts."));
  }
}

/** Creates a contact for the user UUID selected by the administrator. */
export function createEmergencyContact(payload: CreateEmergencyContactPayload) {
  return post<BackendEmergencyContact>(
    adminEndpoints.emergencyContacts,
    payload,
    "Unable to create emergency contact.",
  );
}

export function getAnalytics() {
  return get<AnalyticsOverview>(
    adminEndpoints.analytics,
    "Unable to load analytics.",
  );
}

export function getConsultationReport(midwifeId?: string) {
  const url = midwifeId
    ? `${adminEndpoints.consultationReport}/${midwifeId}`
    : adminEndpoints.consultationReport;
  return get<ConsultationReport>(url, "Unable to load consultation report.");
}

async function post<T>(
  url: string,
  payload: unknown,
  fallback: string,
): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallback));
  }
}

function toAccountPayload(
  { identifier, password }: CreateAccountPayload,
  role: "PATIENT" | "MIDWIFE" | "ADMIN",
) {
  const isEmail = identifier.includes("@");
  return {
    // Match the admin API's required field names and role value.
    ...(isEmail ? { email: identifier } : { phone_number: identifier }),
    password,
    password_confirm: password,
    role,
  };
}

export function createUserAccount(payload: CreateAccountPayload) {
  return post<CreateAccountResponse>(
    adminEndpoints.users,
    toAccountPayload(payload, "PATIENT"),
    "Unable to create user account.",
  );
}

export function createMidwifeAccount(payload: CreateAccountPayload) {
  return post<CreateAccountResponse>(
    adminEndpoints.users,
    toAccountPayload(payload, "MIDWIFE"),
    "Unable to create midwife account.",
  );
}

export function createAdminAccount(payload: CreateAccountPayload) {
  return post<CreateAccountResponse>(
    adminEndpoints.users,
    toAccountPayload(payload, "ADMIN"),
    "Unable to create administrator account.",
  );
}
