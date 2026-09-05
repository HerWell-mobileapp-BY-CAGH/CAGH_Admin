"use client";

/**
 * This module contains the interactive admin dashboard. It is a client module
 * because navigation, filters, dialogs, and form controls all need React state.
 */
import { useMemo, useState, type ReactNode } from "react";
import logo from "../assets/logo.jpg";
import {
  getAnalytics,
  getAppointments,
  getAppointmentsSummary,
  getConsultationReport,
  getConsultationStats,
  getConsultations,
  getDashboardStats,
  getEmergencyContacts,
  getFeedback,
  getFeedbackSummary,
  getHealthContent,
  getHospitals,
  getMidwives,
  getRecentActivity,
  getServiceUsage,
  getServices,
  getUsers,
} from "../features/admin/api/admin-api";
import type {
  DirectoryRecord,
  HospitalRecord,
  PaginatedResponse,
  TableRecord,
} from "../features/admin/api/types";
import { useAsyncData } from "../features/admin/hooks/useAsyncData";
import { useAuth } from "../features/auth/auth-context";
import type { AdminUser } from "../features/auth/types";
import { AdminShell } from "./layout/AdminShell";
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
  Users,
  XCircle,
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
  { label: "Settings", icon: Settings },
];
/** Brand block reused at the top of the responsive sidebar. */
function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <img src={logo} alt="Emma Healthcare logo" />
      </div>
      <div>
        <strong>Emma</strong>
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

function ServiceUsagePanel({
  items,
}: {
  items: Array<{ name: string; percentage: string; barClass: string }>;
}) {
  return (
    <div className="panel service">
      <div className="panel-header">
        <h2>Service Usage</h2>
        <span className="month">This Month</span>
      </div>
      {items.map((item) => (
        <div className="usage" key={item.name}>
          <div>
            <b>{item.name}</b>
            <span>{item.percentage}</span>
          </div>
          <div className="track">
            <i className={item.barClass} />
          </div>
        </div>
      ))}
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
  const statsQuery = useAsyncData(getDashboardStats, []);
  const appointmentsQuery = useAsyncData(getAppointmentsSummary, []);
  const serviceUsageQuery = useAsyncData(getServiceUsage, []);
  const activityQuery = useAsyncData(getRecentActivity, []);

  if (
    statsQuery.loading ||
    appointmentsQuery.loading ||
    serviceUsageQuery.loading ||
    activityQuery.loading
  ) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (
    statsQuery.error ||
    appointmentsQuery.error ||
    serviceUsageQuery.error ||
    activityQuery.error
  ) {
    return (
      <ErrorState
        message={
          statsQuery.error ??
          appointmentsQuery.error ??
          serviceUsageQuery.error ??
          activityQuery.error ??
          "Unable to load dashboard."
        }
      />
    );
  }

  const stats = statsQuery.data!;
  const appointments = appointmentsQuery.data ?? [];
  const serviceUsage = serviceUsageQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Administrator. Here's what's happening on Emma today."
        actions={
          <>
            <button className="primary">+ Add Record</button>
            <button className="outline">Export Data</button>
          </>
        }
      />
      <StatsGrid stats={stats} />
      <section className="dashboard-grid">
        <GrowthChartPanel />
        <AppointmentsSummaryPanel appointments={appointments} />
      </section>
      <section className="bottom-grid">
        <ServiceUsagePanel items={serviceUsage} />
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
}: {
  onAddContact?: () => void;
}) {
  const contactsQuery = useAsyncData(getEmergencyContacts, []);

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
          <p>Manage critical service numbers and regional availability.</p>
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
                {["Service", "Number", "Region", "Status", "Actions"].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
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
  const items = [
    ["Profile", "Update your name, email and profile picture"],
    ["Administration", "Manage Administration preferences"],
    ["Password", "Change your administrator password"],
    ["Language", "English / Amharic"],
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
          <button className="setting-item">
            <span className="setting-icon">◎</span>
            <span>
              <b>Language</b>
              <small>English / Amharic</small>
            </span>
            <ChevronRight />
          </button>
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
              Contact Emma support for assistance with your account settings.
            </p>
            <button>Contact Support</button>
          </div>
        </aside>
      </div>
    </>
  );
}
function AdministrationView() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Administration</h1>
          <p>Manage administrators, roles and platform permissions.</p>
        </div>
      </div>
      <div className="admin-tiles">
        <button className="admin-tile">
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
function TableView({
  type,
  onMidwife,
}: {
  type: string;
  onMidwife?: (status: string) => void;
}) {
  const isHospitals = type === "Hospitals";
  const isMidwives = type === "Midwives";
  const recordsQuery = useAsyncData<
    PaginatedResponse<DirectoryRecord> | PaginatedResponse<HospitalRecord>
  >(() => {
    if (isHospitals) return getHospitals();
    if (isMidwives) return getMidwives();
    return getUsers();
  }, [type]);
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
        <button className="primary">
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

  if (!user) {
    return <LoadingState label="Loading account..." />;
  }

  const content =
    active === "Dashboard" ? (
      <Dashboard />
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
      <EmergencyContactsView onAddContact={() => setModal("contact")} />
    ) : active === "Settings" ? (
      <SettingsView
        onAdministration={() => setActive("Administration")}
        user={user}
      />
    ) : active === "Administration" ? (
      <AdministrationView />
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
                  : modal === "content"
                    ? "Add New Information"
                    : "Consultation Report"
          }
          danger={modal === "Pending"}
          onClose={() => setModal(null)}
        >
          {modal === "Pending" ? (
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
                <>
                  <p>Service Information</p>
                  <div className="modal-form-grid">
                    <input
                      className="modal-input"
                      placeholder="e.g. Emergency Medical Services"
                    />
                    <input className="modal-input" placeholder="e.g. 911" />
                  </div>
                  <select className="modal-input">
                    <option>Select region</option>
                  </select>
                  <textarea
                    className="modal-input"
                    placeholder="Provide additional information about this service..."
                  />
                </>
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
              <div className="modal-actions">
                <button onClick={() => setModal(null)}>Close</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
