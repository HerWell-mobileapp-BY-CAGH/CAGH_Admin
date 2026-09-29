export type CreateAccountPayload = {
  identifier: string;
  password: string;
};

export type CreateAccountResponse = {
  id: string;
  message?: string;
};

export type CreateEmergencyContactPayload = {
  user_id: string;
  name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
};

export type CreateHospitalPayload = {
  name: string;
  address: string;
  // Django's Hospital model exposes this field as `phone`.
  phone: string;
  latitude?: number;
  longitude?: number;
};

export type AdminLanguagePreference = {
  preferred_language: "en" | "am";
};

export type AdminProfile = {
  id: string;
  username: string | null;
  email: string | null;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  role: string;
  profile: {
    first_name: string;
    last_name: string;
    region: string;
    city: string;
    preferred_language: "en" | "am";
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};

/** Learning Center records use UUIDs and the backend's editorial status values. */
export type LearningCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subtitle_summary: string;
  description: string;
  order: number;
  topics_count?: number;
  topics?: LearningTopic[];
};

export type LearningTopic = {
  id: string;
  category: string;
  category_name?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order: number;
  articles_count?: number;
};

export type LearningArticleStatus = "PUBLISHED" | "DRAFT" | "REVIEW" | "ARCHIVED";
export type LearningArticle = {
  id: string;
  topic: string;
  topic_name?: string;
  category_name?: string;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  content_type: "TEXT" | "INFOGRAPHIC" | "VIDEO" | "INTERACTIVE";
  sections: Array<{ title: string; detail: string }>;
  key_takeaway_tip: string;
  next_article: string | null;
  author: string;
  author_name?: string;
  status: LearningArticleStatus;
  reading_time_minutes: number;
  views_count?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
};

export type DirectoryRecord = {
  id: string;
  /** MidwifeProfile UUID; present only in the midwife directory. */
  midwifeProfileId?: string;
  name: string;
  email?: string;
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
  totalReviews: number;
  trend?: string;
  distribution: Array<{
    rating: number;
    count: number;
    percentage: string;
  }>;
};

export type FeedbackRecord = {
  id: string;
  midwifeId: string;
  midwifeName: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isAnonymous: boolean;
};

export type PasswordChangePayload = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
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
  license_number: string | null;
  bio: string;
  languages: string;
  cv_file_url: string | null;
  specialty: string;
  experience_years: number;
  verification_status: string;
  rejection_reason: string;
  suspension_reason: string;
  created_at: string;
  qualifications: unknown[];
  certificates: unknown[];
  review_actions?: Array<{
    action: MidwifeReviewAction;
    requires_reason: boolean;
    review_url: string;
  }>;
};

/** Fields an administrator may supply or correct before approving a midwife. */
export type UpdateMidwifeApplicationPayload = {
  license_number?: string;
  cv_file?: File;
  hospital_id?: string;
  bio?: string;
  experience_years?: number;
  specialty?: string;
  languages?: string;
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
