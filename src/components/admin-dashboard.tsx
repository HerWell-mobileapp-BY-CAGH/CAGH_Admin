"use client";

/**
 * This module contains the interactive admin dashboard. It is a client module
 * because navigation, filters, dialogs, and form controls all need React state.
 */
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import logo from "../assets/logo.jpg";
import {
  createAdminAccount,
  createEmergencyContact,
  createHospital,
  createMidwifeAccount,
  createUserAccount,
  getAdminLanguagePreference,
  getAnalytics,
  getAdminDashboard,
  getAppointments,
  getConsultationReport,
  getConsultationStats,
  getConsultations,
  getEmergencyContacts,
  getFeedback,
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
  AdminLanguagePreference,
} from "../features/admin/api/types";
import { useAsyncData } from "../features/admin/hooks/useAsyncData";
import { useAuth } from "../features/auth/auth-context";
import type { AdminUser } from "../features/auth/types";
import { AdminShell } from "./layout/AdminShell";
import { AccountFormModal } from "./forms/AccountFormModal";
import { AccountFormPage } from "./forms/AccountFormPage";
import {
  ReviewMidwifeRegistrationDialog,
  type PendingMidwife,
} from "./dialogue/midwife_review";
import { RejectMidwifeRegistrationDialog } from "./dialogue/midwife_reject";
import { MidwifeCvReviewDialog } from "./dialogue/midwife_cv_review";
import type { AccountFormVariant } from "./forms/account-form-config";
import type { AccountFormValues } from "./forms/account-form-config";
import { StatCard } from "./ui/stat-card";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Grid2X2,
  Hospital,
  Inbox,
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
  MapPin,
  Phone,
} from "lucide-react";

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
  { label: "Health", icon: Activity },
];
const manageItems = [
  { label: "Emergency Contacts", icon: ShieldCheck },
  { label: "Services", icon: Stethoscope },
  { label: "Feedback", icon: AlertTriangle },
  { label: "Analytics", icon: BarChart3 },
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
 * Global header with mobile navigation, search, inbox, notifications,
 * and the signed-in administrator summary.
 */
function Topbar({
  setOpen,
  onNotify,
  user,
}: {
  setOpen: (v: boolean) => void;
  onNotify: () => void;
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
      <div className="global-search">
        <Search />
        <input placeholder="Search task, user, or record..." />
      </div>
      <div className="top-actions">
        <Inbox />
        <button
          className="bell"
          onClick={onNotify}
          aria-label="Open notifications"
        >
          <Bell />
          <i />
        </button>
        <div className="admin">
          <div className="avatar">{getInitials(user.name)}</div>
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
        </div>
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
}: {
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
}: {
  appointments: Array<{
    label: string;
    description: string;
    count: number | string;
    kind: "complete" | "booked" | "cancelled";
  }>;
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
        <a>View All ›</a>
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

function ActivityPanel({
  items,
}: {
  items: Array<{
    title: string;
    time: string;
    description: string;
    tag: string;
  }>;
}) {
  return (
    <div className="panel activity">
      <div className="panel-header">
        <h2>Recent Activity</h2>
      </div>
      {items.map((item) => (
        <div className="activity-row" key={`${item.title}-${item.time}`}>
          <i className={item.tag} />
          <div>
            <b>{item.title}</b>
            <small>{item.description}</small>
            <em>{item.tag}</em>
          </div>
          <span>{item.time}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
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
  const activity = dashboard.recent_activities.map((item) => ({
    title: item.action.replaceAll("_", " "),
    description: item.performed_by ?? "System activity",
    time: new Date(item.timestamp).toLocaleString(),
    tag: "green",
  }));
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
    // Export the same live totals and activity rows currently shown on screen.
    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
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
      [],
      ["Activity", "Performed by", "Timestamp"],
      ...dashboard.recent_activities.map((item) => [
        item.action,
        item.performed_by ?? "System",
        item.timestamp,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => escapeCsv(cell ?? "")).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `cagh-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
      <StatsGrid stats={stats} />
      <section className="dashboard-grid">
        <GrowthChartPanel />
        <AppointmentsSummaryPanel appointments={appointments} />
      </section>
      <section className="bottom-grid">
        <ActivityPanel items={activity} />
      </section>
    </>
  );
}
function FeedbackView() {
  const summaryQuery = useAsyncData(getFeedbackSummary, []);
  const feedbackQuery = useAsyncData(getFeedback, []);

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
  const feedbackRows = toTableRows(feedbackQuery.data?.data ?? []);

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
          <a>Filter ���</a>
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
              {feedbackRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={cell} className={i === 1 ? "stars-cell" : ""}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        />
        <StatCard
          title="Voice"
          value={String(stats.voice)}
          note={<>Voice sessions</>}
        />
        <StatCard
          title="Completed"
          value={String(stats.completed)}
          note={
            stats.completedChange ? (
              <b className="green-text">↗ {stats.completedChange}</b>
            ) : undefined
          }
        />
      </section>
      <DataTable
        title="Recent Activity"
        headers={["ID", "Type", "Midwife", "Date", "Status", "Actions"]}
        rows={consultationRows}
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
        title="All   Booked   Completed   Cancelled   Rescheduled"
        headers={["Date", "User", "Midwife", "Type", "Status", "Actions"]}
        rows={appointmentRows}
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
}: {
  title: string;
  headers: string[];
  rows: string[][];
  total: string;
}) {
  return (
    <div className="panel data-panel generic-table">
      <div className="panel-header">
        <h2>{title}</h2>
        <div className="table-filters">
          <button>All</button>
          <button>Filter</button>
          <button className="primary">Export</button>
        </div>
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
            {rows.map((row, i) => (
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
          Showing 1 to {rows.length} of {total} entries{" "}
          <div>
            <button>Previous</button>
            <button>Next</button>
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

  if (contactsQuery.loading) {
    return <LoadingState label="Loading emergency contacts..." />;
  }

  if (contactsQuery.error) {
    return <ErrorState message={contactsQuery.error} />;
  }

  const emergencyRows = toTableRows(contactsQuery.data?.data ?? []);
  const total = contactsQuery.data?.total ?? emergencyRows.length;

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
          <div className="table-filters">
            <button>Filter</button>
            <button>Export</button>
          </div>
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
              {emergencyRows.map((row) => (
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
            Showing 1 to {emergencyRows.length} of {total} entries{" "}
            <div>
              <button>Prev</button>
              <button>Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function SettingsView({
  onAdministration,
  user,
}: {
  onAdministration: () => void;
  user: AdminUser;
}) {
  // Read the persisted preference so the selected radio survives a refresh.
  const languageQuery = useAsyncData(getAdminLanguagePreference, []);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [savedLanguage, setSavedLanguage] = useState<
    AdminLanguagePreference["preferred_language"] | null
  >(null);
  const language = savedLanguage ?? languageQuery.data?.preferred_language ?? "en";

  async function changeLanguage(
    preferredLanguage: AdminLanguagePreference["preferred_language"],
  ) {
    setLanguageError(null);
    setSavingLanguage(true);
    try {
      // PATCH /api/v1/admin/language/ updates only the active administrator.
      const updatedPreference = await updateAdminLanguagePreference(preferredLanguage);
      // Reflect the accepted backend value immediately; the next page load
      // will retrieve the same value through GET /admin/language/.
      setSavedLanguage(updatedPreference.preferred_language);
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
                title === "Administration" ? onAdministration : undefined
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
          <button className="setting-item">
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
              ) : null}
            </span>
          </fieldset>
          <button className="logout settings-logout">
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
function AdministrationView({
  onAddAdmin,
  onOpenAdministrators,
}: {
  onAddAdmin: () => void;
  onOpenAdministrators: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Manage administrators, roles and platform permissions."
        actions={
          <button type="button" className="primary" onClick={onAddAdmin}>
            + Add Administrator
          </button>
        }
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
        <button className="admin-tile">
          <span>▣</span>
          <b>ROLES &amp; PERMISSIONS</b>
          <small>Control administrative access</small>
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
      <section className="modal">
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
function AnalyticsView() {
  const analyticsQuery = useAsyncData(getAnalytics, []);

  if (analyticsQuery.loading) {
    return <LoadingState label="Loading analytics..." />;
  }

  if (analyticsQuery.error || !analyticsQuery.data) {
    return (
      <ErrorState
        message={analyticsQuery.error ?? "Unable to load analytics."}
      />
    );
  }

  const analytics = analyticsQuery.data;
  const performanceRows = toTableRows(analytics.midwifePerformance.data);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Consultation Reports</h1>
          <p>Detailed consultation activity and midwife performance.</p>
        </div>
        <button className="primary">Export ↓</button>
      </div>
      <div className="filter-panel report-filters">
        <label>
          Date Range
          <input value="Aug 01 – Aug 29, 2026" readOnly />
        </label>
        <label>
          Hospital
          <select>
            <option>All Hospitals</option>
          </select>
        </label>
        <label>
          Midwife
          <select>
            <option>All Midwives</option>
          </select>
        </label>
        <label>
          Consultation Type
          <select>
            <option>All Types</option>
          </select>
        </label>
      </div>
      <section className="stats report-stats">
        {analytics.stats.map(({ label, value }) => (
          <div className="stat-card" key={label}>
            <small>{label}</small>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </section>
      <section className="analytics-grid">
        <div className="panel">
          <h3>Consultations Over Time</h3>
          <div className="bar-chart">
            {[35, 52, 40, 85, 68, 74].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <DataTable
          title="Midwife Performance"
          headers={[
            "Midwife",
            "People",
            "Consult.",
            "Completed",
            "Rating",
            "Status",
          ]}
          rows={performanceRows}
          total={String(analytics.midwifePerformance.total)}
        />
      </section>
    </>
  );
}

/**
 * Admin-only review queue backed by the real midwife application endpoints.
 * Approval is immediate; rejecting and suspending prompt for the reason that
 * Django requires for those two review actions.
 */
function MidwivesView({ onAddMidwife }: { onAddMidwife: () => void }) {
  const applicationsQuery = useAsyncData(getMidwifeApplications, []);
  // The admin credentials form uses real hospital UUIDs, not free text.
  const hospitalsQuery = useAsyncData(getHospitals, []);
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

  // Copy fetched items into local state only once so a completed review can
  // remove its application from the default pending/under-review queue.
  const displayedApplications =
    applications ?? applicationsQuery.data?.data ?? [];

  function toPendingMidwife(application: MidwifeApplication): PendingMidwife {
    return {
      name: application.user.username || application.user.email,
      phone: application.user.phone_number || "Not provided",
      email: application.user.email || "Not provided",
      license: application.license_number || "Not provided",
      qualification: application.qualifications.length
        ? "Credentials submitted"
        : "Not provided",
      experience: `${application.experience_years} years`,
      registered: application.created_at,
      cv: application.cv_file_url ? "CV attached to application" : "No CV uploaded",
    };
  }

  async function handleReview(
    application: MidwifeApplication,
    action: MidwifeReviewAction,
    suppliedReason?: string,
  ) {
    const reason =
      suppliedReason ??
      (action === "SUSPEND"
        ? window.prompt("Reason for suspending this midwife:")?.trim()
        : undefined);
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
      const message = error instanceof Error ? error.message : "Unable to approve this application.";
      setMessage(message);
      // The CV dialog keeps open and displays this same error beside its form.
      throw new Error(message);
    } finally {
      setPendingId(null);
    }
  }

  if (applicationsQuery.loading || hospitalsQuery.loading)
    return <LoadingState label="Loading midwife applications..." />;
  if (applicationsQuery.error || hospitalsQuery.error)
    return <ErrorState message={applicationsQuery.error ?? hospitalsQuery.error ?? "Unable to load midwife applications."} />;

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
              {displayedApplications.map((application) => {
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
                        onClick={() => handleReview(application, "SUSPEND")}
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
        </div>
      </div>
      {reviewingApplication ? (
        <ReviewMidwifeRegistrationDialog
          midwife={toPendingMidwife(reviewingApplication)}
          onClose={() => setReviewingApplication(null)}
          onViewCv={() => setViewingCvApplication(reviewingApplication)}
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
          }}
          onClose={() => setViewingCvApplication(null)}
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

    if (isHospitals) {
      return (recordsQuery.data.data as HospitalRecord[]).filter((record) =>
        [record.name, record.id, record.location, record.status]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      );
    }

    return (recordsQuery.data.data as DirectoryRecord[]).filter((record) =>
      [record.name, record.id, record.contact, record.location, record.status]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }, [isHospitals, query, recordsQuery.data]);

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
            onChange={(e) => setQuery(e.target.value)}
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
                : ["User", "Contact", "Location", "Status", "Action"]
              ).map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isHospitals
              ? (filtered as HospitalRecord[]).map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="table-person">
                        <div className="mini-avatar">
                          <Hospital />
                        </div>
                        <div>
                          <b>{record.name}</b>
                          <small>ID: {record.id}</small>
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
              : (filtered as DirectoryRecord[]).map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => isMidwives && onMidwife?.(record.status)}
                  >
                    <td>
                      <div className="table-person">
                        <div className="mini-avatar">
                          {getInitials(record.name)}
                        </div>
                        <div>
                          <b>{record.name}</b>
                          <small>ID: {record.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{record.contact}</td>
                    <td>{record.location}</td>
                    <td>
                      <span className={`status ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="table-footer">
          Showing 1 to {filtered.length} of {total} entries{" "}
          <div>
            <button>
              <ChevronLeft />
            </button>
            <button className="current">1</button>
            <button>2</button>
            <button>3</button>
            <button>
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
  const [contactsVersion, setContactsVersion] = useState(0);
  const [hospitalsVersion, setHospitalsVersion] = useState(0);

  async function submitAccountForm(
    variant: AccountFormVariant,
    values: AccountFormValues,
  ) {
    if (variant === "user") {
      await createUserAccount(values);
      setActive("Users");
    } else if (variant === "midwife") {
      await createMidwifeAccount(values);
      setActive("Midwives");
    } else {
      await createAdminAccount(values);
      setActive("Administration");
    }
    setAccountForm(null);
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
    <Dashboard />
  ) : active === "Midwives" ? (
    <MidwivesView onAddMidwife={() => setAccountForm("midwife")} />
  ) : active === "Health" ? (
    <HealthView onAddContent={() => setModal("content")} />
  ) : active === "Analytics" ? (
    <AnalyticsView />
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
      user={user}
    />
  ) : active === "Administration" ? (
    <AdministrationView
      onAddAdmin={() => setAccountForm("admin")}
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
            ? () => setAccountForm("midwife")
            : active === "Hospitals"
              ? () => setModal("hospital")
              : undefined
      }
      refreshKey={hospitalsVersion}
    />
  );
  return (
    <>
      <AdminShell
        sidebar={
          <Sidebar
            active={active}
            setActive={setActive}
            open={open}
            setOpen={setOpen}
            onLogout={onLogout}
          />
        }
        header={
          <Topbar
            setOpen={setOpen}
            onNotify={() => setNotice(true)}
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
