import { apiClient, getApiErrorMessage } from "../../../lib/api-client";
import { adminEndpoints } from "./endpoints";
import type {
  AdminDashboardResponse,
  AnalyticsOverview,
  ConsultationReport,
  ConsultationStats,
  DirectoryRecord,
  FeedbackSummary,
  HospitalRecord,
  MidwifeApplication,
  MidwifeReviewAction,
  MidwifeReviewResponse,
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

export function getUsers() {
  return get<PaginatedResponse<DirectoryRecord>>(
    adminEndpoints.users,
    "Unable to load users.",
  );
}

export function getMidwives() {
  return get<PaginatedResponse<DirectoryRecord>>(
    adminEndpoints.midwives,
    "Unable to load midwives.",
  );
}

export function getHospitals() {
  return get<PaginatedResponse<HospitalRecord>>(
    adminEndpoints.hospitals,
    "Unable to load hospitals.",
  );
}

export function getConsultations() {
  return get<PaginatedResponse<TableRecord>>(
    adminEndpoints.consultations,
    "Unable to load consultations.",
  );
}

export function getConsultationStats() {
  return get<ConsultationStats>(
    adminEndpoints.consultationStats,
    "Unable to load consultation stats.",
  );
}

export function getAppointments() {
  return get<PaginatedResponse<TableRecord>>(
    adminEndpoints.appointments,
    "Unable to load appointments.",
  );
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

export function getEmergencyContacts() {
  return get<PaginatedResponse<TableRecord>>(
    adminEndpoints.emergencyContacts,
    "Unable to load emergency contacts.",
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
