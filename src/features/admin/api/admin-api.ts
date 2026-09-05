import { apiClient, getApiErrorMessage } from "../../../lib/api-client";
import { adminEndpoints } from "./endpoints";
import type {
  ActivityItem,
  AdminDashboardResponse,
  AnalyticsOverview,
  AppointmentSummaryItem,
  ConsultationReport,
  ConsultationStats,
  DashboardStats,
  DirectoryRecord,
  FeedbackSummary,
  HospitalRecord,
  MidwifeApplication,
  MidwifeReviewAction,
  MidwifeReviewResponse,
  PaginatedResponse,
  ServiceUsageItem,
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

export function getDashboardStats() {
  return get<DashboardStats>(
    adminEndpoints.dashboard.stats,
    "Unable to load dashboard stats.",
  );
}

/** Fetches the real aggregate payload used by the administrator home screen. */
export function getAdminDashboard() {
  return get<AdminDashboardResponse>(
    adminEndpoints.dashboard.overview,
    "Unable to load the administrator dashboard.",
  );
}

/** Lists pending applications by default; pass a status to inspect another queue. */
export function getMidwifeApplications(status?: string) {
  const params = status ? { status } : undefined;
  return apiClient
    .get<PaginatedResponse<MidwifeApplication>>(adminEndpoints.midwifeApplications, { params })
    .then((response) => response.data)
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

export function getAppointmentsSummary() {
  return get<AppointmentSummaryItem[]>(
    adminEndpoints.dashboard.appointmentsSummary,
    "Unable to load appointment summary.",
  );
}

export function getServiceUsage() {
  return get<ServiceUsageItem[]>(
    adminEndpoints.dashboard.serviceUsage,
    "Unable to load service usage.",
  );
}

export function getRecentActivity() {
  return get<ActivityItem[]>(
    adminEndpoints.dashboard.recentActivity,
    "Unable to load recent activity.",
  );
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
