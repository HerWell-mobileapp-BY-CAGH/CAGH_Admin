"use client";

/**
 * This module contains the interactive admin dashboard. It is a client module
 * because navigation, filters, dialogs, and form controls all need React state.
 */
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import logo from "../assets/logo.jpg";
import {
  createAdminAccount,
  createEmergencyContact,
  createHospital,
  createMidwifeAccount,
  createUserAccount,
  changeAdminPassword,
  getAdminLanguagePreference,
  getAdminProfile,
  getAdminDashboard,
  getAppointments,
  getConsultationReport,
  getConsultationStats,
  getConsultations,
  getEmergencyContacts,
  getFeedback,
  getFeedbackForMidwife,
  getFeedbackSummary,
  getHealthContent,
  getHospitalCount,
  getHospitals,
  getMidwifeApplications,
  getMidwives,
  reviewMidwifeApplication,
  updateMidwifeApplication,
  getServices,
  getUsers,
  updateAdminLanguagePreference,
  updateAdminProfile,
} from "../features/admin/api/admin-api";
import type {
  DirectoryRecord,
  HospitalRecord,
  MidwifeApplication,
  MidwifeReviewAction,
  UpdateMidwifeApplicationPayload,
  PaginatedResponse,
  TableRecord,
  CreateEmergencyContactPayload,
  CreateHospitalPayload,
  CreateMidwifeAccountPayload,
  AdminLanguagePreference,
} from "../features/admin/api/types";
import { useAsyncData } from "../features/admin/hooks/useAsyncData";
import { useAuth } from "../features/auth/auth-context";
import type { AdminUser } from "../features/auth/types";
import { AdminShell } from "./layout/AdminShell";
import { AccountFormModal } from "./forms/AccountFormModal";
import { AddMidwifeDialog } from "./forms/AddMidwifeDialog";
import { AccountFormPage } from "./forms/AccountFormPage";
import {
  ReviewMidwifeRegistrationDialog,
  type PendingMidwife,
} from "./dialogue/midwife_review";
import { RejectMidwifeRegistrationDialog } from "./dialogue/midwife_reject";
import { SuspendMidwifeDialog } from "./dialogue/midwife_suspend";
import { MidwifeCvReviewDialog } from "./dialogue/midwife_cv_review";
import type { AccountFormVariant } from "./forms/account-form-config";
import type { AccountFormValues } from "./forms/account-form-config";
import { StatCard } from "./ui/stat-card";
import "./midwife-analytics.css";
import "./admin-profile.css";
import { LearningManagement } from "./learning/LearningManagement";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  Grid2X2,
  Hospital,
  LogOut,
  Menu,
  MoreVertical,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
  XCircle,
  CirclePlus,
  Crosshair,
  Download,
  MapPin,
  Phone,
} from "lucide-react";
import * as XLSX from "xlsx";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <p className="loading-state">{label}</p>;
}

function ErrorState({ message }: { message: string }) {
  return (
    <p className="loading-state" role="alert">
      {message}
    </p>
  );
}

function toTableRows(records: TableRecord[]) {
  return records.map((record) => record.cells);
}

/** Primary navigation entries shown above the management divider. */
const navItems = [
  { label: "Dashboard", icon: Grid2X2 },
  { label: "Users", icon: Users },
  { label: "Midwives", icon: Stethoscope },
  { label: "Hospitals", icon: Hospital },
  { label: "Consultations", icon: FileText },
  { label: "Appointments", icon: CalendarDays },
  { label: "Learning", icon: BookOpen },
];
const manageItems = [
  { label: "Emergency Contacts", icon: ShieldCheck },
  { label: "Feedback", icon: AlertTriangle },
  { label: "Administration", icon: UserCog },
  { label: "Settings", icon: Settings },
];
/** Brand block reused at the top of the responsive sidebar. */
function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <img src={logo} alt="CAGH logo" />
      </div>
      <div>
        <strong>CAGH</strong>
        <span>Healthcare Admin</span>
      </div>
    </div>
  );
}
/**
 * Sidebar navigation. Selecting an item updates the active view and closes
 * the mobile drawer so the main content is immediately visible.
 */
function Sidebar({
  active,
  setActive,
  open,
  setOpen,
  onLogout,
}: {
  active: string;
  setActive: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLogout?: () => void;
}) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <Brand />
      <nav>
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={active === label ? "nav-active" : ""}
            onClick={() => {
              setActive(label);
              setOpen(false);
            }}
          >
            <Icon />
            {label}
          </button>
        ))}
        <div className="nav-divider" />
        <p className="nav-label">MANAGEMENT</p>
        {manageItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={active === label ? "nav-active" : ""}
            onClick={() => {
              setActive(label);
              setOpen(false);
            }}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
      <button className="logout" onClick={onLogout}>
        <LogOut />
        Logout
      </button>
    </aside>
  );
}
/**
 * Global header with mobile navigation and notifications,
 * and the signed-in administrator summary.
 */
function Topbar({
  setOpen,
  onNotify,
  onProfile,
  user,
}: {
  setOpen: (v: boolean) => void;
  onNotify: () => void;
  onProfile: () => void;
  user: AdminUser;
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      <div className="top-actions">
        <button
          className="bell"
          onClick={onNotify}
          aria-label="Open notifications"
        >
          <Bell />
          <i />
        </button>
        <button
          type="button"
          className="admin admin-profile-trigger"
          onClick={onProfile}
          aria-label="Open administrator profile"
        >
          <div className="avatar">{getInitials(user.name)}</div>
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
        </button>
      </div>
    </header>
  );
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="heading-actions">{actions}</div> : null}
    </div>
  );
}

function StatsGrid({
  stats,
  navigateTo,
}: {
  navigateTo?: (page: string) => void;
  stats: {
    totalUsers: number | string;
    totalUsersChange?: number | string;
    totalMidwives: number | string;
    midwivesPending?: number | string;
    hospitals: number | string;
    consultations: number | string;
    consultationsChange?: number | string;
  };
}) {
  return (
    <section className="stats">
      <StatCard
        title="Total Users"
        value={String(stats.totalUsers)}
        featured
        onNavigate={navigateTo ? () => navigateTo("Users") : undefined}
        note={
          stats.totalUsersChange ? (
            <>
              <b>↗ {stats.totalUsersChange}</b> Increased from last month
            </>
          ) : undefined
        }
      />
      <StatCard
        title="Total Midwives"
        value={String(stats.totalMidwives)}
        onNavigate={navigateTo ? () => navigateTo("Midwives") : undefined}
        note={
          stats.midwivesPending ? (
            <em>{stats.midwivesPending} pending approval</em>
          ) : undefined
        }
      />
      <StatCard
        title="Hospitals"
        value={String(stats.hospitals)}
        note={<span className="orange-dot" />}
      />
      <StatCard
        title="Consultations"
        value={String(stats.consultations)}
        note={
          stats.consultationsChange ? (
            <>
              <b className="green-text">↗ {stats.consultationsChange}</b> Since
              last quarter
            </>
          ) : undefined
        }
      />
    </section>
  );
}

function GrowthChartPanel() {
  return (
    <div className="panel growth">
      <div className="panel-header">
        <h2>User Growth</h2>
        <MoreVertical />
      </div>
      <div className="chart">
        <div className="bars">
          <i />
          <i />
          <i />
          <i />
        </div>
        <svg viewBox="0 0 400 170" preserveAspectRatio="none">
          <path d="M0 145 C95 135 160 110 230 75 S330 35 400 15" />
        </svg>
        <div className="quarters">
          <span>Q1</span>
          <span>Q2</span>
          <span>Q3</span>
          <span>Q4</span>
        </div>
      </div>
    </div>
  );
}

function AppointmentsSummaryPanel({
  appointments,
  onNavigate,
}: {
  appointments: Array<{
    label: string;
    description: string;
    count: number | string;
    kind: "complete" | "booked" | "cancelled";
  }>;
  onNavigate: () => void;
}) {
  const appointmentIcons = {
    complete: Check,
    booked: CalendarDays,
    cancelled: XCircle,
  } as const;

  return (
    <div className="panel appointments">
      <div className="panel-header">
        <h2>Appointments Summary</h2>
        <button type="button" className="summary-link" onClick={onNavigate}>View All ›</button>
      </div>
      {appointments.map((item) => {
        const Icon = appointmentIcons[item.kind];
        return (
          <div className="appointment" key={item.label}>
            <div className={`appointment-icon ${item.kind}`}>
              <Icon />
            </div>
            <div>
              <b>{item.label}</b>
              <small>{item.description}</small>
            </div>
            <strong>{String(item.count)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Dashboard({ navigateTo }: { navigateTo: (page: string) => void }) {
  // One authoritative request supplies the live dashboard totals, statuses,
  // and audited activity feed from GET /api/v1/admin/dashboard/.
  const dashboardQuery = useAsyncData(getAdminDashboard, []);
  // Hospital counts live in the directory endpoint, not the aggregate payload.
  const hospitalCountQuery = useAsyncData(getHospitalCount, []);

  if (dashboardQuery.loading || hospitalCountQuery.loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (
    dashboardQuery.error ||
    hospitalCountQuery.error ||
    !dashboardQuery.data
  ) {
    return (
      <ErrorState
        message={
          dashboardQuery.error ??
          hospitalCountQuery.error ??
          "Unable to load dashboard."
        }
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const appointments: Array<{
    label: string;
    description: string;
    count: number;
    kind: "complete" | "booked" | "cancelled";
  }> = [
    {
      label: "Completed",
      description: "Successfully attended",
      count: dashboard.appointments_by_status.COMPLETED ?? 0,
      kind: "complete",
    },
    {
      label: "Booked",
      description: "Upcoming sessions",
      count:
        (dashboard.appointments_by_status.CONFIRMED ?? 0) +
        (dashboard.appointments_by_status.PENDING ?? 0),
      kind: "booked",
    },
    {
      label: "Cancelled",
      description: "Patient or provider cancelled",
      count: dashboard.appointments_by_status.CANCELLED ?? 0,
      kind: "cancelled",
    },
  ];
  const stats = {
    totalUsers: dashboard.totals.users,
    totalMidwives: dashboard.totals.midwives,
    midwivesPending:
      (dashboard.midwives_by_verification_status.PENDING ?? 0) +
      (dashboard.midwives_by_verification_status.UNDER_REVIEW ?? 0),
    hospitals: hospitalCountQuery.data ?? 0,
    consultations: dashboard.totals.consultations,
  };
  function exportDashboard() {
    const rows = [
      ["Metric", "Value"],
      ["Total users", stats.totalUsers],
      ["Total midwives", stats.totalMidwives],
      ["Pending midwives", stats.midwivesPending],
      ["Hospitals", stats.hospitals],
      ["Consultations", stats.consultations],
      [],
      ["Appointment outcome", "Count"],
      ...appointments.map((appointment) => [
        appointment.label,
        appointment.count,
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 24 }, { wch: 16 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard");
    XLSX.writeFile(
      workbook,
      `cagh-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Administrator. Here's what's happening on CAGH today."
        actions={
          <button type="button" className="outline" onClick={exportDashboard}>
            Export Data
          </button>
        }
      />
      <StatsGrid stats={stats} navigateTo={navigateTo} />
      <section className="dashboard-grid">
        <GrowthChartPanel />
        <AppointmentsSummaryPanel appointments={appointments} onNavigate={() => navigateTo("Appointments")} />
      </section>
    </>
  );
}
function FeedbackView() {
  const summaryQuery = useAsyncData(getFeedbackSummary, []);
  const feedbackQuery = useAsyncData(getFeedback, []);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const feedback = feedbackQuery.data?.data ?? [];
  const feedbackPageSize = 10;
  const feedbackPageCount = Math.max(
    1,
    Math.ceil(feedback.length / feedbackPageSize),
  );
  const visibleFeedback = feedback.slice(
    (feedbackPage - 1) * feedbackPageSize,
    feedbackPage * feedbackPageSize,
  );

  if (summaryQuery.loading || feedbackQuery.loading) {
    return <LoadingState label="Loading feedback..." />;
  }

  if (summaryQuery.error || feedbackQuery.error) {
    return (
      <ErrorState
        message={
          summaryQuery.error ??
          feedbackQuery.error ??
          "Unable to load feedback."
        }
      />
    );
  }

  const summary = summaryQuery.data!;
  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Consultation Feedback</h1>
          <p>Monitor user satisfaction and midwife performance.</p>
        </div>
      </div>
      <section className="feedback-summary">
        <div className="rating-card">
          <small>AVERAGE RATING</small>
          <strong>
            {summary.averageRating} <span>/ {summary.maxRating}</span>
          </strong>
          <div className="stars">★★★★☆</div>
          <small>
            {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}{" "}
            overall
          </small>
          {summary.trend && <em>{summary.trend}</em>}
        </div>
        <div className="panel distribution">
          <small>RATING DISTRIBUTION</small>
          {summary.distribution.map(({ rating, count, percentage }) => (
            <div className="rating-row" key={rating}>
              <span>{rating} ★</span>
              <i>
                <b style={{ width: percentage }} />
              </i>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="panel data-panel">
        <div className="panel-header">
          <h2>Recent Feedback</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["Midwife", "Rating", "Date", "Feedback"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleFeedback.map((review) => (
                <tr key={review.id}>
                  <td>
                    <b>{review.midwifeName}</b>
                    <small>{review.reviewerName}</small>
                  </td>
                  <td className="stars-cell">{stars(review.rating)}</td>
                  <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td>{review.comment || "No written feedback."}</td>
                </tr>
              ))}
              {!feedback.length ? (
                <tr>
                  <td colSpan={4}>No feedback has been submitted yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-footer">
            Showing{" "}
            {feedback.length ? (feedbackPage - 1) * feedbackPageSize + 1 : 0} to{" "}
            {Math.min(feedbackPage * feedbackPageSize, feedback.length)} of{" "}
            {feedback.length} entries
            <div>
              <button
                type="button"
                disabled={feedbackPage === 1}
                onClick={() => setFeedbackPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="table-page-indicator">
                {feedbackPage} / {feedbackPageCount}
              </span>
              <button
                type="button"
                disabled={feedbackPage === feedbackPageCount}
                onClick={() => setFeedbackPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function ConsultationsView() {
  const statsQuery = useAsyncData(getConsultationStats, []);
  const consultationsQuery = useAsyncData(getConsultations, []);

  if (statsQuery.loading || consultationsQuery.loading) {
    return <LoadingState label="Loading consultations..." />;
  }

  if (statsQuery.error || consultationsQuery.error) {
    return (
      <ErrorState
        message={
          statsQuery.error ??
          consultationsQuery.error ??
          "Unable to load consultations."
        }
      />
    );
  }

  const stats = statsQuery.data!;
  const consultationRows = toTableRows(consultationsQuery.data?.data ?? []);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Consultations</h1>
          <p>Monitor platform consultation activity.</p>
        </div>
      </div>
      <section className="stats consultation-stats">
        <StatCard
          title="Anonymous"
          value={String(stats.anonymous)}
          showArrow={false}
          note={
            stats.anonymousChange ? (
              <b className="green-text">↗ {stats.anonymousChange}</b>
            ) : undefined
          }
        />
        <StatCard
          title="Messages"
          value={String(stats.messages)}
          note={<>Consultation messages</>}
          showArrow={false}
        />
        <StatCard
          title="Voice"
          value={String(stats.voice)}
          note={<>Voice sessions</>}
          showArrow={false}
        />
        <StatCard
          title="Completed"
          value={String(stats.completed)}
          showArrow={false}
          note={
            stats.completedChange ? (
              <b className="green-text">↗ {stats.completedChange}</b>
            ) : undefined
          }
        />
      </section>
      <DataTable
        title="Recent Activity"
        headers={["Type", "Midwife", "Date", "Status"]}
        rows={consultationRows}
        showToolbar={false}
        total={String(
          consultationsQuery.data?.total ?? consultationRows.length,
        )}
      />
    </>
  );
}
function AppointmentsView() {
  const appointmentsQuery = useAsyncData(getAppointments, []);

  if (appointmentsQuery.loading) {
    return <LoadingState label="Loading appointments..." />;
  }

  if (appointmentsQuery.error) {
    return <ErrorState message={appointmentsQuery.error} />;
  }

  const appointmentRows = toTableRows(appointmentsQuery.data?.data ?? []);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Appointments</h1>
          <p>Monitor online and in-person appointments.</p>
        </div>
      </div>
      <DataTable
        title="Appointments"
        headers={["Date", "User", "Midwife", "Type", "Status"]}
        rows={appointmentRows}
        showToolbar={false}
        total={`${appointmentsQuery.data?.total ?? appointmentRows.length} appointments`}
      />
    </>
  );
}
/** Health library view with filters and the entry point for new content. */
function HealthView({ onAddContent }: { onAddContent: () => void }) {
  const contentQuery = useAsyncData(getHealthContent, []);

  if (contentQuery.loading) {
    return <LoadingState label="Loading health content..." />;
  }

  if (contentQuery.error) {
    return <ErrorState message={contentQuery.error} />;
  }

  const rows = toTableRows(contentQuery.data?.data ?? []);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Health Information</h1>
          <p>Manage health articles, PDFs, and educational content.</p>
        </div>
        <button className="primary" onClick={onAddContent}>
          + Add Content
        </button>
      </div>
      <div className="filter-panel">
        <button>All</button>
        <button>Published</button>
        <button>Draft</button>
        <button>Review</button>
        <select>
          <option>Category</option>
        </select>
        <select>
          <option>Content Type</option>
        </select>
        <select>
          <option>Language</option>
        </select>
      </div>
      <DataTable
        title="Content Library"
        headers={["Title", "Category", "Type", "Status", "Actions"]}
        rows={rows}
        total={String(contentQuery.data?.total ?? rows.length)}
      />
    </>
  );
}
function ServicesView({ onAddCategory }: { onAddCategory?: () => void }) {
  const servicesQuery = useAsyncData(getServices, []);

  if (servicesQuery.loading) {
    return <LoadingState label="Loading services..." />;
  }

  if (servicesQuery.error) {
    return <ErrorState message={servicesQuery.error} />;
  }

  const serviceRows = toTableRows(servicesQuery.data?.data ?? []);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Service Categories</h1>
          <p>Manage and configure healthcare service groupings.</p>
        </div>
        <button className="primary" onClick={onAddCategory}>
          + Add Category
        </button>
      </div>
      <DataTable
        title="Search categories...                                      Filter"
        headers={["Category", "Services", "Status", "Actions"]}
        rows={serviceRows}
        total={`${servicesQuery.data?.total ?? serviceRows.length} entries`}
      />
    </>
  );
}
/**
 * Shared table renderer. Callers provide column labels and row values so
 * every directory-style page keeps the same table, filters, and pagination UI.
 */
function DataTable({
  title,
  headers,
  rows,
  total,
  showToolbar = true,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  total: string;
  showToolbar?: boolean;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  const filteredRows = useMemo(() => normalizedQuery
    ? rows.filter((row) => row.some((cell) => cell.toLocaleLowerCase().includes(normalizedQuery)))
    : rows, [normalizedQuery, rows]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="panel data-panel generic-table">
      <div className="panel-header">
        <h2>{title}</h2>
        <label className="table-search"><Search /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}...`} aria-label={`Search ${title.toLowerCase()}`} /></label>
        {showToolbar ? (
          <div className="table-filters">
            <button>All</button>
            <button>Filter</button>
            <button className="primary">Export</button>
          </div>
        ) : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={row[0] || i}>
                {row.map((cell, j) => (
                  <td key={`${i}-${j}`}>
                    {j === headers.length - 2 ? (
                      <span className={`status ${cell.toLowerCase()}`}>
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          Showing {filteredRows.length ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length === rows.length ? total : filteredRows.length} entries{" "}
          <div>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span className="table-page-indicator">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergencyContactsView({
  onAddContact,
  refreshKey,
}: {
  onAddContact?: () => void;
  refreshKey: number;
}) {
  // Re-fetch after a successful create so the new contact appears immediately.
  const contactsQuery = useAsyncData(getEmergencyContacts, [refreshKey]);
  const [page, setPage] = useState(1);

  if (contactsQuery.loading) {
    return <LoadingState label="Loading emergency contacts..." />;
  }

  if (contactsQuery.error) {
    return <ErrorState message={contactsQuery.error} />;
  }

  const emergencyRows = toTableRows(contactsQuery.data?.data ?? []);
  const total = contactsQuery.data?.total ?? emergencyRows.length;
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(emergencyRows.length / pageSize));
  const visibleRows = emergencyRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Emergency Contacts</h1>
          <p>Review emergency contacts registered for platform users.</p>
        </div>
        <button className="primary" onClick={onAddContact}>
          + Add Contact
        </button>
      </div>
      <div className="panel data-panel directory">
        <div className="panel-header">
          <h2>Active Directory</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {/* Columns match GET /api/v1/admin/emergency-contacts/. */}
                {[
                  "Contact",
                  "Phone",
                  "Relationship",
                  "Priority",
                  "Owner",
                  "Actions",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={cell}>
                      {i === 3 ? (
                        <span className="status active">{cell}</span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  <td>✎ &nbsp;▣</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Showing {emergencyRows.length ? (page - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(page * pageSize, emergencyRows.length)} of {total} entries{" "}
            <div>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="table-page-indicator">
                {page} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function PasswordChangeDialog({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const oldPassword = String(form.get("old_password") ?? "");
    const newPassword = String(form.get("new_password") ?? "");
    const newPasswordConfirm = String(form.get("new_password_confirm") ?? "");
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setError("Please complete all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("The new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await changeAdminPassword({
        oldPassword,
        newPassword,
        newPasswordConfirm,
      });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to change your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Change password" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="modal-field">
          Current password
          <input
            className="modal-input"
            name="old_password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label className="modal-field">
          New password
          <input
            className="modal-input"
            name="new_password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="modal-field">
          Confirm new password
          <input
            className="modal-input"
            name="new_password_confirm"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SettingsView({
  onAdministration,
  onProfile,
  onPassword,
  onLogout,
  user,
}: {
  onAdministration: () => void;
  onProfile: () => void;
  onPassword: () => void;
  onLogout: () => void;
  user: AdminUser;
}) {
  // Read the persisted preference so the selected radio survives a refresh.
  const languageQuery = useAsyncData(getAdminLanguagePreference, []);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [savedLanguage, setSavedLanguage] = useState<
    AdminLanguagePreference["preferred_language"] | null
  >(null);
  const language =
    savedLanguage ?? languageQuery.data?.preferred_language ?? "en";

  useEffect(() => {
    // Keep the document metadata in sync when the server preference loads.
    document.documentElement.lang = language;
  }, [language]);

  async function changeLanguage(
    preferredLanguage: AdminLanguagePreference["preferred_language"],
  ) {
    setLanguageError(null);
    setSavingLanguage(true);
    try {
      // PATCH /api/v1/admin/language/ updates only the active administrator.
      const updatedPreference =
        await updateAdminLanguagePreference(preferredLanguage);
      // Reflect the accepted backend value immediately; the next page load
      // will retrieve the same value through GET /admin/language/.
      setSavedLanguage(updatedPreference.preferred_language);
      // Apply the document language as well as persisting the API preference.
      // This makes the setting available to screen readers and future i18n UI
      // messages without requiring an extra page reload.
      document.documentElement.lang = updatedPreference.preferred_language;
      window.localStorage.setItem(
        "admin_language",
        updatedPreference.preferred_language,
      );
    } catch (cause) {
      setLanguageError(
        cause instanceof Error ? cause.message : "Unable to save language.",
      );
    } finally {
      setSavingLanguage(false);
    }
  }
  const items = [
    ["Profile", "Update your name, email and profile picture"],
    ["Administration", "Manage Administration preferences"],
    ["Password", "Change your administrator password"],
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and portal preferences.</p>
        </div>
      </div>
      <div className="settings-layout">
        <div>
          <h2 className="section-label">ACCOUNT</h2>
          {items.slice(0, 2).map(([title, desc]) => (
            <button
              className="setting-item"
              key={title}
              onClick={
                title === "Administration"
                  ? onAdministration
                  : title === "Profile"
                    ? onProfile
                    : undefined
              }
            >
              <span className="setting-icon">
                {title === "Administration" ? "♧" : "♙"}
              </span>
              <span>
                <b>{title}</b>
                <small>{desc}</small>
              </span>
              <ChevronRight />
            </button>
          ))}
          <h2 className="section-label">SECURITY</h2>
          <button className="setting-item" onClick={onPassword}>
            <span className="setting-icon">▣</span>
            <span>
              <b>Password</b>
              <small>Change your administrator password</small>
            </span>
            <ChevronRight />
          </button>
          <h2 className="section-label">PREFERENCES</h2>
          <fieldset className="setting-item language-setting">
            <span className="setting-icon">◎</span>
            <span>
              <b>Language</b>
              <small>Choose your preferred language</small>
              <span className="language-options">
                <label>
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === "en"}
                    disabled={savingLanguage || languageQuery.loading}
                    onChange={() => changeLanguage("en")}
                  />
                  English
                </label>
                <label>
                  <input
                    type="radio"
                    name="language"
                    value="am"
                    checked={language === "am"}
                    disabled={savingLanguage || languageQuery.loading}
                    onChange={() => changeLanguage("am")}
                  />
                  Amharic
                </label>
              </span>
              {languageError ? (
                <small role="alert">{languageError}</small>
              ) : savingLanguage ? (
                <small role="status">Saving language preference…</small>
              ) : null}
            </span>
          </fieldset>
          <button className="logout settings-logout" onClick={onLogout}>
            <LogOut />
            Log Out
          </button>
        </div>
        <aside className="profile-card">
          <div className="profile-avatar">{getInitials(user.name)}</div>
          <h2>{user.name}</h2>
          <p>
            {user.role === "super_admin"
              ? "Super Administrator"
              : "Administrator"}
          </p>
          <em>ACTIVE</em>
          <div className="support-card">
            <b>ⓘ Need Help?</b>
            <p>
              Contact CAGH support for assistance with your account settings.
            </p>
            <button>Contact Support</button>
          </div>
        </aside>
      </div>
    </>
  );
}

function AdminProfileView({ onBack, onPassword }: { onBack: () => void; onPassword: () => void }) {
  const profileQuery = useAsyncData(getAdminProfile, []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (profileQuery.loading)
    return <LoadingState label="Loading administrator profile..." />;
  if (profileQuery.error || !profileQuery.data) {
    return (
      <ErrorState
        message={
          profileQuery.error ?? "Unable to load the administrator profile."
        }
      />
    );
  }

  const profile = profileQuery.data;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const values = new FormData(event.currentTarget);
    try {
      await updateAdminProfile({
        username: String(values.get("username") ?? ""),
        email: String(values.get("email") ?? ""),
        phone_number: String(values.get("phone_number") ?? ""),
        profile: {
          ...profile.profile,
          first_name: String(values.get("first_name") ?? ""),
          last_name: String(values.get("last_name") ?? ""),
          city: String(values.get("city") ?? ""),
          region: String(values.get("region") ?? ""),
        },
      });
      setMessage("Profile updated successfully.");
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to save the administrator profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your administrator account and personal information."
        actions={<button className="outline profile-back" type="button" onClick={onBack}>← Back to Settings</button>}
      />
      <form className="admin-profile-layout" onSubmit={save}>
        <section className="admin-profile-card account-info-card">
          <header><div><h2>Account Information</h2><p>Your login credentials and account details.</p></div><span className="profile-card-icon"><ShieldCheck /></span></header>
          <label>Username<input name="username" defaultValue={profile.username ?? ""} autoComplete="username" /></label>
          <label>Email address<input name="email" type="email" defaultValue={profile.email ?? ""} autoComplete="email" /></label>
          <button className="change-password-link" type="button" onClick={onPassword}>Change password</button>
        </section>
        <section className="admin-profile-card personal-info-card">
          <header><div><h2>Personal Information</h2><p>Manage your account's personal and contact details.</p></div><span className="profile-card-icon"><Users /></span></header>
          <div className="profile-identity-card">
            <div className="profile-photo-placeholder">{getInitials(`${profile.profile.first_name || profile.first_name} ${profile.profile.last_name || profile.last_name}`)}</div>
            <div><b>{[profile.profile.first_name || profile.first_name, profile.profile.last_name || profile.last_name].filter(Boolean).join(" ") || profile.username || "Administrator"}</b><small>{profile.role.replaceAll("_", " ")}</small></div>
          </div>
          <div className="admin-profile-fields">
            <label>First name<input name="first_name" defaultValue={profile.profile.first_name || profile.first_name} autoComplete="given-name" /></label>
            <label>Last name<input name="last_name" defaultValue={profile.profile.last_name || profile.last_name} autoComplete="family-name" /></label>
            <label className="profile-phone-field">Phone number<input name="phone_number" defaultValue={profile.phone_number ?? ""} autoComplete="tel" /></label>
            <div className="profile-location-heading"><MapPin /> Location</div>
            <label>City<input name="city" defaultValue={profile.profile.city ?? ""} autoComplete="address-level2" /></label>
            <label>Region<input name="region" defaultValue={profile.profile.region ?? ""} autoComplete="address-level1" /></label>
          </div>
          {message ? <p className="admin-profile-message" role="status">{message}</p> : null}
          <footer><button className="outline" type="button" onClick={onBack}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></footer>
        </section>
      </form>
    </>
  );
}
function AdministrationView({
  onOpenAdministrators,
}: {
  onOpenAdministrators: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Manage administrators, roles and platform permissions."
      />
      <div className="admin-tiles">
        <button
          type="button"
          className="admin-tile"
          onClick={onOpenAdministrators}
        >
          <span>♟</span>
          <b>ADMINISTRATORS</b>
          <small>Manage admin accounts</small>
          <em>OPEN →</em>
        </button>
      </div>
    </>
  );
}
/**
 * Accessible visual shell for every dashboard dialog. The parent owns the
 * selected dialog state; this component only renders the backdrop and close UI.
 */
function Modal({
  title,
  children,
  danger = false,
  onClose,
}: {
  title: string;
  children: ReactNode;
  danger?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className={`modal${title === "Add Hospital" ? " hospital-dialog" : ""}`}>
        <header>
          <h2 className={danger ? "danger-text" : ""}>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function ConsultationReportView({ midwifeId }: { midwifeId?: string }) {
  const reportQuery = useAsyncData(
    () => getConsultationReport(midwifeId),
    [midwifeId],
  );

  if (reportQuery.loading) {
    return <LoadingState label="Loading consultation report..." />;
  }

  if (reportQuery.error || !reportQuery.data) {
    return (
      <ErrorState
        message={reportQuery.error ?? "Unable to load consultation report."}
      />
    );
  }

  const report = reportQuery.data;
  const historyRows = toTableRows(report.history.data);

  return (
    <>
      <button className="back-link">← Consultation Reports</button>
      <div className="report-profile">
        <div className="mini-avatar">{getInitials(report.name)}</div>
        <div>
          <h1>{report.name}</h1>
          <p>{report.subtitle}</p>
        </div>
        <span className={`status ${report.status.toLowerCase()}`}>
          {report.status}
        </span>
      </div>
      <section className="stats report-stats">
        {report.stats.map(({ label, value }) => (
          <div className="stat-card" key={label}>
            <small>{label}</small>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </section>
      <section className="report-grid">
        <div className="panel">
          <h2>Consultation Breakdown</h2>
          {report.breakdown.map(({ label, count, width }) => (
            <div className="breakdown" key={label}>
              <b>
                {label}
                <span>{String(count)}</span>
              </b>
              <i>
                <em style={{ width }} />
              </i>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Consultation Trend</h2>
          <div className="trend-chart">
            <svg viewBox="0 0 400 160" preserveAspectRatio="none">
              <path d="M0 135 L80 115 L160 58 L240 100 L320 20 L400 42" />
            </svg>
          </div>
        </div>
      </section>
      <div className="panel data-panel">
        <div className="panel-header">
          <h2>Consultation History</h2>
        </div>
        <DataTable
          title=""
          headers={["Date", "Type", "Users", "Status"]}
          rows={historyRows}
          total={String(report.history.total)}
        />
      </div>
    </>
  );
}

function MidwifeAnalyticsView({
  midwife,
  onBack,
}: {
  midwife: DirectoryRecord;
  onBack: () => void;
}) {
  const reportQuery = useAsyncData(
    () => getConsultationReport(midwife.midwifeProfileId),
    [midwife.midwifeProfileId],
  );
  const feedbackQuery = useAsyncData(
    () => getFeedbackForMidwife(midwife.midwifeProfileId!),
    [midwife.midwifeProfileId],
  );
  const [feedbackSession, setFeedbackSession] = useState<string | null>(null);

  if (reportQuery.loading || feedbackQuery.loading) {
    return <LoadingState label="Loading midwife analytics..." />;
  }
  if (reportQuery.error || !reportQuery.data) {
    return <ErrorState message={reportQuery.error ?? "Unable to load this midwife's analytics."} />;
  }

  const report = reportQuery.data;
  const reviews = feedbackQuery.data?.data ?? [];
  const selectedReviews = feedbackSession
    ? reviews.filter((review) => review.sessionId === feedbackSession)
    : [];
  const history = report.history.data;
  const exportReport = () => {
    const lines = [
      ["Date", "Type", "Users", "Status"],
      ...history.map((item) => item.cells),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","));
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    link.download = `${report.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-consultation-report.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <button type="button" className="back-link midwife-analytics-back" onClick={onBack}>← Midwives</button>
      <section className="report-profile midwife-analytics-profile">
        <div className="profile-avatar">{getInitials(report.name || midwife.name)}</div>
        <div>
          <h1>{report.name || midwife.name}</h1>
          <p>{report.subtitle || midwife.location}</p>
        </button>
        <div className="midwife-report-meta">
          <span className={`status ${report.status.toLowerCase()}`}>{report.status}</span>
          <small>Reporting period: {report.reportingPeriod ?? "All available dates"}</small>
        </div>
      </section>
      <section className="stats report-stats midwife-analytics-stats">
        {report.stats.slice(0, 5).map(({ label, value }) => (
          <div className="stat-card" key={label}><small>{label}</small><strong>{String(value)}</strong></div>
        ))}
      </section>
      <section className="panel midwife-breakdown-panel">
        <h2>Consultation Breakdown</h2>
        {report.breakdown.map(({ label, count, width }, index) => (
          <div className={`breakdown midwife-breakdown tone-${index % 4}`} key={label}>
            <b>{label}<span>{String(count)}</span></b><i><em style={{ width }} /></i>
          </div>
        ))}
      </section>
      <section className="panel data-panel midwife-history-panel">
        <div className="panel-header"><h2>Consultation History</h2></div>
        <div className="table-wrap">
          <table>
            <thead><tr>{["Date", "Type", "Users", "Status", "Feedback"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  {item.cells.slice(0, 4).map((cell, index) => <td key={index}>{index === 3 ? <span className={`status ${cell.toLowerCase()}`}>{cell}</span> : cell}</td>)}
                  <td><button className="feedback-session-button" type="button" onClick={() => setFeedbackSession(item.id)}>View feedback</button></td>
                </tr>
              ))}
              {!history.length ? <tr><td colSpan={5}>No consultation history is available.</td></tr> : null}
            </tbody>
          </table>
          {feedbackQuery.error ? <p className="feedback-load-error">{feedbackQuery.error}</p> : null}
        </div>
      </section>
      <div className="midwife-report-export"><button className="primary" type="button" onClick={exportReport}>Export Report <Download aria-hidden="true" /></button></div>
      {feedbackSession ? (
        <Modal title="Session feedback" onClose={() => setFeedbackSession(null)}>
          {selectedReviews.length ? <div className="table-wrap"><table><thead><tr><th>Reviewer</th><th>Rating</th><th>Date</th><th>Feedback</th></tr></thead><tbody>{selectedReviews.map((review) => <tr key={review.id}><td>{review.isAnonymous ? "Anonymous" : review.reviewerName}</td><td className="stars-cell">{"★".repeat(review.rating)}</td><td>{new Date(review.createdAt).toLocaleDateString()}</td><td>{review.comment || "No written feedback."}</td></tr>)}</tbody></table></div> : <p className="session-feedback-empty">No feedback is linked to this consultation session.</p>}
        </Modal>
      ) : null}
    </>
  );
}
/**
 * Admin-only review queue backed by the real midwife application endpoints.
 * Approval is immediate; rejecting and suspending require a reason.
 */
function MidwivesView({ onAddMidwife, refreshKey = 0 }: { onAddMidwife: () => void; refreshKey?: number }) {
  const applicationsQuery = useAsyncData(getMidwifeApplications, [refreshKey]);
  const activeMidwivesQuery = useAsyncData(getMidwives, [refreshKey]);
  // The admin credentials form uses real hospital UUIDs, not free text.
  const hospitalsQuery = useAsyncData(getHospitals, [refreshKey]);
  const [applications, setApplications] = useState<MidwifeApplication[] | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reviewingApplication, setReviewingApplication] =
    useState<MidwifeApplication | null>(null);
  const [viewingCvApplication, setViewingCvApplication] =
    useState<MidwifeApplication | null>(null);
  const [rejectingApplication, setRejectingApplication] =
    useState<MidwifeApplication | null>(null);
  const [suspendingApplication, setSuspendingApplication] =
    useState<MidwifeApplication | null>(null);
  const [selectedMidwife, setSelectedMidwife] =
    useState<DirectoryRecord | null>(null);

  // Copy fetched items into local state only once so a completed review can
  // remove its application from the default pending/under-review queue.
  const displayedApplications =
    applications ?? applicationsQuery.data?.data ?? [];
  const [pendingPage, setPendingPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const pageSize = 10;
  const activeMidwives = (activeMidwivesQuery.data?.data ?? []).filter(
    (midwife) => midwife.status === "APPROVED" || midwife.status === "ACTIVE",
  );
  const pendingPageCount = Math.max(
    1,
    Math.ceil(displayedApplications.length / pageSize),
  );
  const activePageCount = Math.max(
    1,
    Math.ceil(activeMidwives.length / pageSize),
  );
  const visibleApplications = displayedApplications.slice(
    (pendingPage - 1) * pageSize,
    pendingPage * pageSize,
  );
  const visibleActiveMidwives = activeMidwives.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  function toPendingMidwife(application: MidwifeApplication): PendingMidwife {
    return {
      name: application.user.username || application.user.email,
      phone: application.user.phone_number || "Not provided",
      email: application.user.email || "Not provided",
      hospital: application.hospital?.name ?? "Not provided",
      specialty: application.specialty || "Not provided",
      languages: application.languages || "Not provided",
      bio: application.bio || undefined,
      license: application.license_number || "Not provided",
      qualification: application.qualifications.length
        ? "Credentials submitted"
        : "Not provided",
      experience: `${application.experience_years} years`,
      registered: application.created_at,
      cv: application.cv_file_url
        ? "CV attached to application"
        : "No CV uploaded",
    };
  }

  async function handleReview(
    application: MidwifeApplication,
    action: MidwifeReviewAction,
    suppliedReason?: string,
  ) {
    const reason = suppliedReason;
    if (action !== "APPROVE" && !reason) return;

    setPendingId(application.id);
    setMessage(null);
    try {
      const result = await reviewMidwifeApplication(
        application.id,
        action,
        reason,
      );
      // Reviewed records no longer belong in the default pending queue.
      setApplications(
        displayedApplications.filter((item) => item.id !== application.id),
      );
      setMessage(result.message);
      setReviewingApplication(null);
      setViewingCvApplication(null);
      setRejectingApplication(null);
      setSuspendingApplication(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to review this application.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function saveCredentialsAndApprove(
    application: MidwifeApplication,
    payload: UpdateMidwifeApplicationPayload,
  ) {
    setPendingId(application.id);
    setMessage(null);
    try {
      // Persist all profile/CV fields before the verification decision.
      await updateMidwifeApplication(application.id, payload);
      const result = await reviewMidwifeApplication(application.id, "APPROVE");
      setApplications(
        displayedApplications.filter((item) => item.id !== application.id),
      );
      setMessage(result.message);
      setReviewingApplication(null);
      setViewingCvApplication(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to approve this application.";
      setMessage(message);
      // The CV dialog keeps open and displays this same error beside its form.
      throw new Error(message);
    } finally {
      setPendingId(null);
    }
  }

  if (
    applicationsQuery.loading ||
    hospitalsQuery.loading ||
    activeMidwivesQuery.loading
  )
    return <LoadingState label="Loading midwife applications..." />;
  if (
    applicationsQuery.error ||
    hospitalsQuery.error ||
    activeMidwivesQuery.error
  )
    return (
      <ErrorState
        message={
          applicationsQuery.error ??
          hospitalsQuery.error ??
          activeMidwivesQuery.error ??
          "Unable to load midwife applications."
        }
      />
    );

  if (selectedMidwife) {
    return <MidwifeAnalyticsView midwife={selectedMidwife} onBack={() => setSelectedMidwife(null)} />;
  }

  return (
    <>
      <PageHeader
        title="Midwife Applications"
        subtitle="Review submitted professional credentials and account status."
        actions={
          <button type="button" className="primary" onClick={onAddMidwife}>
            + Add Midwife
          </button>
        }
      />
      {message ? (
        <p className="loading-state" role="status">
          {message}
        </p>
      ) : null}
      <div className="panel data-panel">
        <div className="panel-header">
          <h2>Pending Review</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Midwife</th>
                <th>License</th>
                <th>Specialty</th>
                <th>Hospital</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((application) => {
                const disabled = pendingId === application.id;
                return (
                  <tr key={application.id}>
                    <td>
                      <b>
                        {application.user.username || application.user.email}
                      </b>
                      <small>{application.user.email}</small>
                    </td>
                    <td>{application.license_number}</td>
                    <td>{application.specialty || "—"}</td>
                    <td>{application.hospital?.name ?? "—"}</td>
                    <td>
                      <span
                        className={`status ${application.verification_status.toLowerCase()}`}
                      >
                        {application.verification_status}
                      </span>
                    </td>
                    <td>
                      {/* Open a dialog bound to this application's UUID before reviewing it. */}
                      <button
                        disabled={disabled}
                        className="primary"
                        onClick={() => setReviewingApplication(application)}
                      >
                        Review
                      </button>{" "}
                      <button
                        disabled={disabled}
                        className="suspend-action"
                        onClick={() => setSuspendingApplication(application)}
                      >
                        Suspend
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!displayedApplications.length ? (
                <tr>
                  <td colSpan={6}>No applications awaiting review.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-footer">
            Showing{" "}
            {displayedApplications.length
              ? (pendingPage - 1) * pageSize + 1
              : 0}{" "}
            to {Math.min(pendingPage * pageSize, displayedApplications.length)}{" "}
            of {displayedApplications.length} entries
            <div>
              <button
                type="button"
                disabled={pendingPage === 1}
                onClick={() => setPendingPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="table-page-indicator">
                {pendingPage} / {pendingPageCount}
              </span>
              <button
                type="button"
                disabled={pendingPage === pendingPageCount}
                onClick={() => setPendingPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="panel data-panel">
        <div className="panel-header">
          <h2>Active Midwives</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Midwife</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleActiveMidwives.map((midwife) => (
                <tr
                  key={midwife.id}
                  className={midwife.midwifeProfileId ? "midwife-directory-row" : undefined}
                  role={midwife.midwifeProfileId ? "button" : undefined}
                  tabIndex={midwife.midwifeProfileId ? 0 : undefined}
                  onClick={() => midwife.midwifeProfileId && setSelectedMidwife(midwife)}
                  onKeyDown={(event) => {
                    if (midwife.midwifeProfileId && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setSelectedMidwife(midwife);
                    }
                  }}
                >
                  <td>
                    <b>{midwife.name}</b>
                  </td>
                  <td>{midwife.contact}</td>
                  <td>{midwife.location}</td>
                  <td>
                    <span className="status active">ACTIVE</span>
                  </td>
                </tr>
              ))}
              {!activeMidwivesQuery.data?.data.some(
                (midwife) =>
                  midwife.status === "APPROVED" || midwife.status === "ACTIVE",
              ) ? (
                <tr>
                  <td colSpan={4}>No active midwives found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-footer">
            Showing{" "}
            {activeMidwives.length ? (activePage - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(activePage * pageSize, activeMidwives.length)} of{" "}
            {activeMidwives.length} entries
            <div>
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setActivePage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="table-page-indicator">
                {activePage} / {activePageCount}
              </span>
              <button
                type="button"
                disabled={activePage === activePageCount}
                onClick={() => setActivePage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      {reviewingApplication ? (
        <ReviewMidwifeRegistrationDialog
          midwife={toPendingMidwife(reviewingApplication)}
          onClose={() => setReviewingApplication(null)}
          onViewCv={() => {
            setViewingCvApplication(reviewingApplication);
            setReviewingApplication(null);
          }}
          onApprove={() => {
            setViewingCvApplication(reviewingApplication);
            setReviewingApplication(null);
          }}
          onReject={() => {
            setRejectingApplication(reviewingApplication);
            setReviewingApplication(null);
          }}
        />
      ) : null}
      {viewingCvApplication ? (
        <MidwifeCvReviewDialog
          midwife={toPendingMidwife(viewingCvApplication)}
          hospitals={hospitalsQuery.data?.data ?? []}
          initialValues={{
            licenseNumber: viewingCvApplication.license_number ?? "",
            bio: viewingCvApplication.bio ?? "",
            experienceYears: viewingCvApplication.experience_years ?? 0,
            hospitalId: viewingCvApplication.hospital?.id ?? "",
            cvUrl: viewingCvApplication.cv_file_url,
            specialty: viewingCvApplication.specialty ?? "",
            languages: viewingCvApplication.languages ?? "",
          }}
          onClose={() => {
            setViewingCvApplication(null);
            setReviewingApplication(null);
          }}
          onBack={() => {
            setReviewingApplication(viewingCvApplication);
            setViewingCvApplication(null);
          }}
          onSaveInformation={async (payload) => {
            // Save verified profile details without changing the pending status.
            const savedApplication = await updateMidwifeApplication(viewingCvApplication.id, payload);
            setApplications((current) => (current ?? applicationsQuery.data?.data ?? []).map((application) =>
              application.id === viewingCvApplication.id
                ? savedApplication
                : application,
            ));
            setViewingCvApplication(savedApplication);
          }}
          onApprove={(payload) =>
            saveCredentialsAndApprove(viewingCvApplication, payload)
          }
          onReject={() => {
            setRejectingApplication(viewingCvApplication);
            setViewingCvApplication(null);
            setReviewingApplication(null);
          }}
        />
      ) : null}
      {rejectingApplication ? (
        <RejectMidwifeRegistrationDialog
          midwife={toPendingMidwife(rejectingApplication)}
          onClose={() => setRejectingApplication(null)}
          // This calls POST /midwives/applications/{id}/review/ with REJECT.
          onConfirm={(reason) =>
            handleReview(rejectingApplication, "REJECT", reason.trim())
          }
        />
      ) : null}
      {suspendingApplication ? (
        <SuspendMidwifeDialog
          midwife={toPendingMidwife(suspendingApplication)}
          onClose={() => setSuspendingApplication(null)}
          submitting={pendingId === suspendingApplication.id}
          onConfirm={(reason) =>
            handleReview(suspendingApplication, "SUSPEND", reason)
          }
        />
      ) : null}
    </>
  );
}

function EmergencyContactForm({
  onSave,
  onCancel,
}: {
  onSave: (payload: CreateEmergencyContactPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<CreateEmergencyContactPayload>({
    user_id: "",
    name: "",
    relationship: "",
    phone_number: "",
    is_primary: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // POST /api/v1/admin/emergency-contacts/ requires the owner's user UUID.
      await onSave(values);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save emergency contact.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p>Assign this emergency contact to an existing user account.</p>
      <input
        className="modal-input"
        required
        placeholder="User UUID"
        value={values.user_id}
        onChange={(event) =>
          setValues({ ...values, user_id: event.target.value })
        }
      />
      <div className="modal-form-grid">
        <input
          className="modal-input"
          required
          placeholder="Contact name"
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
        />
        <input
          className="modal-input"
          required
          placeholder="Phone number"
          value={values.phone_number}
          onChange={(event) =>
            setValues({ ...values, phone_number: event.target.value })
          }
        />
      </div>
      <input
        className="modal-input"
        required
        placeholder="Relationship, e.g. Mother"
        value={values.relationship}
        onChange={(event) =>
          setValues({ ...values, relationship: event.target.value })
        }
      />
      <label>
        <input
          type="checkbox"
          checked={values.is_primary}
          onChange={(event) =>
            setValues({ ...values, is_primary: event.target.checked })
          }
        />{" "}
        Primary emergency contact
      </label>
      {error ? (
        <p className="loading-state" role="alert">
          {error}
        </p>
      ) : null}
      <div className="modal-actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Saving..." : "Save Contact"}
        </button>
      </div>
    </form>
  );
}

function HospitalForm({
  onSave,
  onCancel,
}: {
  onSave: (payload: CreateHospitalPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState({
    name: "",
    address: "",
    phone: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: CreateHospitalPayload = {
        name: values.name.trim(),
        address: values.address.trim(),
        // Match the required `phone` key in POST /api/v1/admin/hospitals/.
        phone: values.phone.trim(),
        ...(values.latitude.trim()
          ? { latitude: Number(values.latitude) }
          : {}),
        ...(values.longitude.trim()
          ? { longitude: Number(values.longitude) }
          : {}),
      };
      await onSave(payload);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to add hospital.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="hospital-form" onSubmit={submit}>
      <p className="hospital-form-intro">
        Add a hospital or healthcare facility to the directory.
      </p>
      <div className="hospital-form-section">
        <span className="hospital-form-section-title">
          Hospital Information
        </span>
        <label>
          Hospital Name <b>*</b>
          <span className="field-with-icon">
            <Hospital />
            <input
              required
              placeholder="Enter hospital name"
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
            />
          </span>
        </label>
        <label>
          Address <b>*</b>
          <span className="field-with-icon field-with-icon-textarea">
            <MapPin />
            <textarea
              required
              placeholder="Enter hospital address"
              value={values.address}
              onChange={(event) =>
                setValues({ ...values, address: event.target.value })
              }
            />
          </span>
        </label>
        <label>
          Phone Number <b>*</b>
          <span className="field-with-icon">
            <Phone />
            <input
              required
              type="tel"
              placeholder="+251 9XX XXX XXX"
              value={values.phone}
              onChange={(event) =>
                setValues({ ...values, phone: event.target.value })
              }
            />
          </span>
        </label>
      </div>
      <div className="hospital-form-section coordinates-section">
        <span className="hospital-form-section-title">
          Location Coordinates
        </span>
        <small>
          Optional - used to accurately display the hospital location
        </small>
        <div className="hospital-coordinate-grid">
          <label>
            Latitude
            <span className="field-with-icon">
              <Crosshair />
              <input
                type="number"
                step="any"
                placeholder="e.g. 9.0320"
                value={values.latitude}
                onChange={(event) =>
                  setValues({ ...values, latitude: event.target.value })
                }
              />
            </span>
          </label>
          <label>
            Longitude
            <span className="field-with-icon">
              <Crosshair />
              <input
                type="number"
                step="any"
                placeholder="e.g. 38.7469"
                value={values.longitude}
                onChange={(event) =>
                  setValues({ ...values, longitude: event.target.value })
                }
              />
            </span>
          </label>
        </div>
        <p className="coordinate-note">
          <Crosshair /> You can leave the coordinates empty if they are unknown.
        </p>
      </div>
      {error ? (
        <p className="loading-state" role="alert">
          {error}
        </p>
      ) : null}
      <div className="modal-actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={saving}>
          <CirclePlus /> {saving ? "Adding..." : "Add Hospital"}
        </button>
      </div>
    </form>
  );
}

function TableView({
  type,
  onMidwife,
  onAdd,
  refreshKey = 0,
}: {
  type: string;
  onMidwife?: (status: string) => void;
  onAdd?: () => void;
  refreshKey?: number;
}) {
  const isHospitals = type === "Hospitals";
  const isMidwives = type === "Midwives";
  const recordsQuery = useAsyncData<
    PaginatedResponse<DirectoryRecord> | PaginatedResponse<HospitalRecord>
  >(() => {
    if (isHospitals) return getHospitals();
    if (isMidwives) return getMidwives();
    return getUsers();
  }, [type, refreshKey]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!recordsQuery.data) return [];
    const term = query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    if (!term) return recordsQuery.data.data;

    if (isHospitals) {
      return (recordsQuery.data.data as HospitalRecord[]).filter((record) =>
        [record.name, record.location, record.status]
          .join(" ")
          .toLocaleLowerCase()
          .replace(/\s+/g, " ").includes(term),
      );
    }

    return (recordsQuery.data.data as DirectoryRecord[]).filter((record) =>
      [record.name, record.email, record.contact, record.location, record.status]
        .join(" ")
        .toLocaleLowerCase()
        .replace(/\s+/g, " ").includes(term),
    );
  }, [isHospitals, query, recordsQuery.data]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRecords = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (recordsQuery.loading) {
    return <LoadingState label={`Loading ${type.toLowerCase()}...`} />;
  }

  if (recordsQuery.error || !recordsQuery.data) {
    return (
      <ErrorState
        message={recordsQuery.error ?? `Unable to load ${type.toLowerCase()}.`}
      />
    );
  }

  const total = recordsQuery.data.total;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{type}</h1>
          <p>
            Manage{" "}
            {isHospitals
              ? "trusted healthcare organizations"
              : "registered adolescent girls and young women"}
            .
          </p>
        </div>
        <button type="button" className="primary" onClick={onAdd}>
          + Add{" "}
          {isHospitals ? "Hospital" : type === "Midwives" ? "Midwife" : "User"}
        </button>
      </div>
      <div className="filter-panel">
        <label>
          Search
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            type="search"
            aria-label={`Search ${type.toLowerCase()}`}
            placeholder={
              isHospitals ? "Hospital name..." : "Name, ID, or Phone"
            }
          />
        </label>
        {/* Users only need search; hospital directory keeps its additional filters. */}
        {isHospitals ? (
          <>
            <label>
              Status
              <select>
                <option>All Statuses</option>
                <option>Active</option>
                <option>Pending</option>
              </select>
            </label>
            <label>
              Location
              <select>
                <option>All Locations</option>
                <option>Addis Ababa</option>
              </select>
            </label>
            <label className="date-filter">
              Registration Date
              <input placeholder="mm/dd/yyyy" />
            </label>
          </>
        ) : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {(isHospitals
                ? ["Hospital", "Location", "Midwives", "Status", "Actions"]
                : isMidwives
                  ? ["Email", "Location", "Status", "Action"]
                  : ["User", "Contact", "Location", "Status"]
              ).map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isHospitals
              ? (visibleRecords as HospitalRecord[]).map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="table-person">
                        <div className="mini-avatar">
                          <Hospital />
                        </div>
                        <div>
                          <b>{record.name}</b>
                        </div>
                      </div>
                    </td>
                    <td>{record.location}</td>
                    <td>
                      <span className="count">{record.midwifeCount}</span>
                    </td>
                    <td>
                      <span className={`status ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <MoreVertical />
                    </td>
                  </tr>
                ))
              : (visibleRecords as DirectoryRecord[]).map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => isMidwives && onMidwife?.(record.status)}
                  >
                    <td>
                      {isMidwives ? (
                        <div className="table-person">
                          <b>{record.email ?? "No email provided"}</b>
                        </div>
                      ) : (
                        <div className="table-person">
                          <div className="mini-avatar">
                            {getInitials(record.name)}
                          </div>
                          <div>
                            <b>{record.name}</b>
                          </div>
                        </div>
                      )}
                    </td>
                    {!isMidwives ? <td>{record.contact}</td> : null}
                    <td>{record.location}</td>
                    <td>
                      <span className={`status ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    {isMidwives ? (
                      <td>
                        <MoreVertical />
                      </td>
                    ) : null}
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="table-footer">
          Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, filtered.length)} of {total} entries{" "}
          <div>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft />
            </button>
            <span className="table-page-indicator">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
/**
 * Root dashboard controller. `active` selects the page, `open` controls the
 * mobile sidebar, and `modal` identifies the currently open dialog.
 */
export default function AdminDashboard({
  onLogout,
}: {
  onLogout?: () => void;
}) {
  const { user } = useAuth();
  const [active, setActive] = useState("Dashboard");
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormVariant | null>(
    null,
  );
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAddMidwifeModal, setShowAddMidwifeModal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [contactsVersion, setContactsVersion] = useState(0);
  const [hospitalsVersion, setHospitalsVersion] = useState(0);
  const [midwivesVersion, setMidwivesVersion] = useState(0);

  function navigateTo(nextActive: string) {
    setActive(nextActive);
    setAccountForm(null);
    setShowAddAdminModal(false);
    setShowAddMidwifeModal(false);
    setModal(null);
    setNotice(false);
    setShowPasswordChange(false);
  }

  async function submitAccountForm(
    variant: AccountFormVariant,
    values: AccountFormValues,
  ) {
    if (variant === "user") {
      await createUserAccount(values);
      setActive("Users");
    } else if (variant === "midwife") {
      await createMidwifeAccount(values);
      setMidwivesVersion((version) => version + 1);
      setActive("Midwives");
    } else {
      await createAdminAccount(values);
      setActive("Administration");
    }
    setAccountForm(null);
  }

  async function submitMidwifeAccount(payload: CreateMidwifeAccountPayload) {
    await createMidwifeAccount(payload);
    setMidwivesVersion((version) => version + 1);
  }

  async function saveEmergencyContact(payload: CreateEmergencyContactPayload) {
    await createEmergencyContact(payload);
    // Refresh the contacts query after a successful POST.
    setContactsVersion((version) => version + 1);
    setModal(null);
  }

  async function saveHospital(payload: CreateHospitalPayload) {
    await createHospital(payload);
    setHospitalsVersion((version) => version + 1);
    setModal(null);
  }

  if (!user) {
    return <LoadingState label="Loading account..." />;
  }

  const content = accountForm ? (
    <AccountFormPage
      variant={accountForm}
      onBack={() => setAccountForm(null)}
      onSubmit={(values) => submitAccountForm(accountForm, values)}
    />
  ) : active === "Dashboard" ? (
    <Dashboard navigateTo={navigateTo} />
  ) : active === "Midwives" ? (
    <MidwivesView onAddMidwife={() => setShowAddMidwifeModal(true)} refreshKey={midwivesVersion} />
  ) : active === "Health" ? (
    <HealthView onAddContent={() => setModal("content")} />
  ) : active === "Learning" ? (
    <LearningManagement />
  ) : active === "Feedback" ? (
    <FeedbackView />
  ) : active === "Consultations" ? (
    <ConsultationsView />
  ) : active === "Appointments" ? (
    <AppointmentsView />
  ) : active === "Services" ? (
    <ServicesView onAddCategory={() => setModal("category")} />
  ) : active === "Emergency Contacts" ? (
    <EmergencyContactsView
      onAddContact={() => setModal("contact")}
      refreshKey={contactsVersion}
    />
  ) : active === "Settings" ? (
    <SettingsView
      onAdministration={() => setActive("Administration")}
      onProfile={() => setActive("Profile")}
      onPassword={() => setShowPasswordChange(true)}
      onLogout={onLogout ?? (() => undefined)}
      user={user}
    />
  ) : active === "Profile" ? (
    <AdminProfileView onBack={() => setActive("Settings")} onPassword={() => setShowPasswordChange(true)} />
  ) : active === "Administration" ? (
    <AdministrationView
      onOpenAdministrators={() => setShowAddAdminModal(true)}
    />
  ) : (
    <TableView
      type={
        active === "Midwives"
          ? "Midwives"
          : active === "Hospitals"
            ? "Hospitals"
            : "Users"
      }
      onMidwife={active === "Midwives" ? setModal : undefined}
      onAdd={
        active === "Users"
          ? () => setAccountForm("user")
          : active === "Midwives"
            ? () => setShowAddMidwifeModal(true)
            : active === "Hospitals"
              ? () => setModal("hospital")
              : undefined
      }
      refreshKey={active === "Midwives" ? midwivesVersion : hospitalsVersion}
    />
  );
  return (
    <>
      <AdminShell
        sidebar={
          <Sidebar
            active={active}
            setActive={navigateTo}
            open={open}
            setOpen={setOpen}
            onLogout={onLogout}
          />
        }
        header={
          <Topbar
            setOpen={setOpen}
            onNotify={() => setNotice(true)}
            onProfile={() => setActive("Profile")}
            user={user}
          />
        }
        isSidebarOpen={open}
        onDismissSidebar={() => setOpen(false)}
      >
        {content}
      </AdminShell>
      {showAddAdminModal && (
        <AccountFormModal
          onClose={() => setShowAddAdminModal(false)}
          onSubmit={async (values) => {
            await createAdminAccount(values);
          }}
        />
      )}
      {showAddMidwifeModal ? (
        <AddMidwifeDialog
          onClose={() => setShowAddMidwifeModal(false)}
          onSubmit={submitMidwifeAccount}
        />
      ) : null}
      {showPasswordChange ? (
        <PasswordChangeDialog onClose={() => setShowPasswordChange(false)} />
      ) : null}
      {notice && (
        <Modal title="Create Notification" onClose={() => setNotice(false)}>
          <p>Notification Title</p>
          <input
            className="modal-input"
            defaultValue="Upcoming appointment reminder"
          />
          <p>Message</p>
          <textarea
            className="modal-input"
            defaultValue="Your appointment with your midwife is tomorrow..."
          />
          <p>Target Audience</p>
          <select className="modal-input">
            <option>All Users</option>
            <option>Adolescent Girls & Young Women</option>
            <option>Midwives</option>
          </select>
          <div className="modal-actions">
            <button onClick={() => setNotice(false)}>Cancel</button>
            <button className="primary" onClick={() => setNotice(false)}>
              Send Notification
            </button>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            modal === "Pending"
              ? "Review Midwife Registration"
              : modal === "category"
                ? "Add Health Service Category"
                : modal === "contact"
                  ? "Add Emergency Contact"
                  : modal === "hospital"
                    ? "Add Hospital"
                    : modal === "content"
                      ? "Add New Information"
                      : "Consultation Report"
          }
          danger={modal === "Pending"}
          onClose={() => setModal(null)}
        >
          {modal === "hospital" ? (
            <HospitalForm
              onSave={saveHospital}
              onCancel={() => setModal(null)}
            />
          ) : modal === "Pending" ? (
            <>
              <p>
                Review the submitted professional information for Hana Tesfaye.
              </p>
              <div className="modal-card">
                <b>Hana Tesfaye</b>
                <small>Professional Midwife · Pending Verification</small>
              </div>
              <div className="modal-actions">
                <button onClick={() => setModal("Reject")}>Reject</button>
                <button className="primary" onClick={() => setModal(null)}>
                  Approve Midwife
                </button>
              </div>
            </>
          ) : (
            <>
              {modal === "category" ? (
                <>
                  <p>Category Name</p>
                  <input
                    className="modal-input"
                    placeholder="e.g. Menstrual Health"
                  />
                </>
              ) : modal === "contact" ? (
                <EmergencyContactForm
                  onSave={saveEmergencyContact}
                  onCancel={() => setModal(null)}
                />
              ) : modal === "upload" ? (
                <>
                  <p>
                    Drag and drop your PDF here, or browse from your computer.
                  </p>
                  <input
                    className="modal-input"
                    type="file"
                    accept="application/pdf"
                  />
                  <div className="modal-card">
                    <b>Material Health Guide.pdf</b>
                    <small>4.8 MB · Uploaded successfully · Preview PDF</small>
                  </div>
                </>
              ) : modal === "content" ? (
                <>
                  <p>Content Details</p>
                  <input className="modal-input" placeholder="Title" />
                  <textarea
                    className="modal-input"
                    placeholder="Short description"
                  />
                  <label>
                    Content Type{" "}
                    <select className="modal-input">
                      <option>Article</option>
                      <option onClick={() => setModal("upload")}>
                        PDF Document
                      </option>
                    </select>
                  </label>
                </>
              ) : (
                <ConsultationReportView />
              )}
              {modal !== "contact" ? (
                <div className="modal-actions">
                  <button onClick={() => setModal(null)}>Close</button>
                </div>
              ) : null}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
