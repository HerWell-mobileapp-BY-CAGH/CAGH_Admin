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
  users: "/users",
  midwives: "/midwives",
  hospitals: "/hospitals",
  consultations: "/consultations",
  consultationStats: "/consultations/stats",
  appointments: "/appointments",
  feedback: "/feedback",
  feedbackSummary: "/feedback/summary",
  healthContent: "/health-content",
  services: "/services",
  emergencyContacts: "/emergency-contacts",
  analytics: "/analytics",
  consultationReport: "/consultations/report",
} as const;
