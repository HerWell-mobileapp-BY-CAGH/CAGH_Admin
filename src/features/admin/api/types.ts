export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};

export type DirectoryRecord = {
  id: string;
  name: string;
  contact: string;
  location: string;
  status: string;
};

export type HospitalRecord = {
  id: string;
  name: string;
  location: string;
  midwifeCount: number;
  status: string;
};

export type DashboardStats = {
  totalUsers: string | number;
  totalUsersChange?: string;
  totalMidwives: string | number;
  midwivesPending?: number;
  hospitals: string | number;
  consultations: string | number;
  consultationsChange?: string;
};

export type AppointmentSummaryItem = {
  label: string;
  description: string;
  count: string | number;
  kind: "complete" | "booked" | "cancelled";
};

export type ServiceUsageItem = {
  name: string;
  percentage: string;
  barClass: string;
};

export type ActivityItem = {
  title: string;
  description: string;
  time: string;
  tag: string;
};

export type TableRecord = {
  id: string;
  cells: string[];
};

export type FeedbackSummary = {
  averageRating: number;
  maxRating: number;
  trend?: string;
  distribution: Array<{
    rating: number;
    count: number;
    percentage: string;
  }>;
};

export type ConsultationStats = {
  anonymous: string | number;
  anonymousChange?: string;
  messages: string | number;
  voice: string | number;
  completed: string | number;
  completedChange?: string;
};

export type AnalyticsOverview = {
  stats: Array<{ label: string; value: string | number }>;
  midwifePerformance: PaginatedResponse<TableRecord>;
};

export type ConsultationReport = {
  name: string;
  subtitle: string;
  status: string;
  stats: Array<{ label: string; value: string | number }>;
  breakdown: Array<{ label: string; count: string | number; width: string }>;
  history: PaginatedResponse<TableRecord>;
};

// Backend payload for GET /api/v1/admin/dashboard/.
export type AdminDashboardResponse = {
  totals: {
    users: number;
    midwives: number;
    consultations: number;
    appointments: Record<string, number>;
  };
  midwives_by_verification_status: Record<string, number>;
  consultations_by_status: Record<string, number>;
  appointments_by_status: Record<string, number>;
  recent_activities: Array<{
    id: string;
    action: string;
    timestamp: string;
    ip_address: string | null;
    details: Record<string, unknown>;
    performed_by: string | null;
  }>;
};

// Backend payload for the admin midwife application queue and review endpoint.
export type MidwifeApplication = {
  id: string;
  user: { id: string; username: string; email: string; phone_number?: string | null };
  hospital?: { id: string; name: string } | null;
  license_number: string;
  specialty: string;
  experience_years: number;
  verification_status: string;
  rejection_reason: string;
  suspension_reason: string;
  created_at: string;
  qualifications: unknown[];
  certificates: unknown[];
};

export type MidwifeReviewAction = "APPROVE" | "REJECT" | "SUSPEND";

export type MidwifeReviewResponse = {
  status: string;
  message: string;
  verification_status: string;
  rejection_reason?: string;
  suspension_reason?: string;
  application: MidwifeApplication;
};
