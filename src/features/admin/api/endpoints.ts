/**
 * Backend route paths. Update these when your API URLs are ready.
 * All paths are resolved against VITE_API_BASE_URL.
 */
export const adminEndpoints = {
  dashboard: {
    // Real platform-wide admin dashboard endpoint exposed by Django.
    overview: "/admin/dashboard/",
    stats: "/admin/dashboard/stats",
    appointmentsSummary: "/admin/dashboard/appointments-summary",
    serviceUsage: "/admin/dashboard/service-usage",
    recentActivity: "/admin/dashboard/recent-activity",
  },
  // Admin review queue and actions for midwife applications.
  midwifeApplications: "/midwives/applications/",
  midwifeApplicationDetail: (id: string) => `/midwives/applications/${id}/`,
  midwifeApplicationReview: (id: string) =>
    `/midwives/applications/${id}/review/`,
  // Admin drill-down data for the selected midwife.
  midwifeStats: (id: string) => `/admin/midwives/${id}/stats/`,
  // Public/readable directory endpoint used for the hospital total card.
  hospitalsDirectory: "/midwives/hospitals/",
  // Admin-only directory endpoints provided by the Django backend.
  users: "/admin/users/",
  hospitals: "/admin/hospitals/",
  profile: "/admin/profile/",
  // The signed-in administrator's persisted dashboard language preference.
  languagePreference: "/admin/language/",
  consultations: "/admin/consultations/",
  consultationStats: "/consultations/stats",
  appointments: "/admin/appointments/",
  feedback: "/feedback",
  feedbackSummary: "/feedback/summary",
  healthContent: "/health-content",
  services: "/services",
  emergencyContacts: "/admin/emergency-contacts/",
  analytics: "/analytics",
  consultationReport: "/consultations/report",
} as const;
