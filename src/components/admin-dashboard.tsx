"use client";

/**
 * This module contains the interactive admin dashboard. It is a client module
 * because navigation, filters, dialogs, and form controls all need React state.
 */
import { useMemo, useState, type ReactNode } from "react";
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

const notice = false;
const setNotice = (_value: boolean) => {
  void _value;
};
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
/** Demo directory rows used by the people and midwife table views. */
const people = [
  ["Abeba Tilahun", "USR-8492", "+251 911 234 567", "Addis Ababa", "Active"],
  ["Kalkidan Bekele", "USR-8493", "+251 922 345 678", "Adama", "Suspended"],
  ["Meron Alemu", "USR-8494", "+251 933 456 789", "Bahir Dar", "Active"],
  ["Hana Tesfaye", "USR-8495", "+251 944 567 890", "Addis Ababa", "Active"],
];
const hospitals = [
  ["Mercy General Hospital", "HOSP-4921", "New York, NY", "12", "Active"],
  ["St. Jude's Women Center", "HOSP-8832", "Chicago, IL", "8", "Active"],
  ["Cedar Ridge Maternity", "HOSP-1104", "Austin, TX", "5", "Pending"],
  ["Oakland Community Health", "HOSP-3392", "Oakland, CA", "15", "Active"],
];

/** Brand block reused at the top of the responsive sidebar. */
function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Stethoscope />
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
}: {
  setOpen: (v: boolean) => void;
  onNotify: () => void;
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
          <div className="avatar">SJ</div>
          <div>
            <b>Sarah Jenkins</b>
            <small>sarah.j@emma.health</small>
          </div>
        </div>
      </div>
    </header>
  );
}
function Dashboard() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back, Administrator. Here's what's happening on Emma today.
          </p>
        </div>
        <div className="heading-actions">
          <button className="primary">+ Add Record</button>
          <button className="outline">Export Data</button>
        </div>
      </div>
      <section className="stats">
        <StatCard
          title="Total Users"
          value="12,450"
          featured
          note={
            <>
              <b>↗ +8.2%</b> Increased from last month
            </>
          }
        />
        <StatCard
          title="Total Midwives"
          value="124"
          note={<em>18 pending approval</em>}
        />
        <StatCard
          title="Hospitals"
          value="32"
          note={<span className="orange-dot" />}
        />
        <StatCard
          title="Consultations"
          value="4,892"
          note={
            <>
              <b className="green-text">↗ +12%</b> Since last quarter
            </>
          }
        />
      </section>
      <section className="dashboard-grid">
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
        <div className="panel appointments">
          <div className="panel-header">
            <h2>Appointments Summary</h2>
            <a>View All ›</a>
          </div>
          {[
            ["Completed", "Successfully attended", "1,240", "complete", Check],
            ["Booked", "Upcoming sessions", "842", "booked", CalendarDays],
            [
              "Cancelled",
              "Patient or provider cancelled",
              "156",
              "cancelled",
              XCircle,
            ],
          ].map(([a, b, c, kind, Icon]) => (
            <div className="appointment" key={a as string}>
              <div className={`appointment-icon ${kind}`}>
                <Icon />
              </div>
              <div>
                <b>{a as string}</b>
                <small>{b as string}</small>
              </div>
              <strong>{c as string}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="bottom-grid">
        <div className="panel service">
          <div className="panel-header">
            <h2>Service Usage</h2>
            <span className="month">This Month</span>
          </div>
          {[
            ["Contraception", "45%", "bar-1"],
            ["Maternal Health", "30%", "bar-2"],
            ["Nutrition", "15%", "bar-3"],
            ["GBV Support", "10%", "bar-4"],
          ].map(([name, pct, cls]) => (
            <div className="usage" key={name}>
              <div>
                <b>{name}</b>
                <span>{pct}</span>
              </div>
              <div className="track">
                <i className={cls} />
              </div>
            </div>
          ))}
        </div>
        <div className="panel activity">
          <div className="panel-header">
            <h2>Recent Activity</h2>
          </div>
          {[
            [
              "New Midwife Registration",
              "Dr. Amina Yusuf applied for registration.",
              "2m ago",
              "pending",
            ],
            [
              "Appointment Confirmed",
              "Maternal checkup at City Clinic.",
              "1h ago",
              "confirmed",
            ],
            [
              "New Complaint Logged",
              "Service delay at Central Ward.",
              "3h ago",
              "open",
            ],
            [
              "Hospital Approved",
              "St. Jude's Medical Center onboarded.",
              "1d ago",
              "approved",
            ],
          ].map(([title, desc, time, tag]) => (
            <div className="activity-row" key={title}>
              <i className={tag} />
              <div>
                <b>{title}</b>
                <small>{desc}</small>
                <em>{tag}</em>
              </div>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
const feedbackRows = [
  ["Aster", "★★★★★", "Aug 19, 2023", "Very helpful and supportive session."],
  ["Hana", "★★★★☆", "Aug 18, 2023", "Good consultation, very informative."],
  [
    "Sarah",
    "★★★★★",
    "Aug 17, 2023",
    "Excellent care and attention to detail. Highly recommend.",
  ],
];
const consultationRows = [
  ["C-102", "Anonymous", "Midwife A", "Aug 19", "Completed"],
  ["C-103", "Voice", "Midwife B", "Aug 19", "Active"],
  ["C-104", "Messages", "Midwife C", "Aug 18", "Completed"],
];
const appointmentRows = [
  ["Aug 19, 2024", "User 01", "Aster", "Online", "Booked"],
  ["Aug 19, 2024", "User 02", "Hana", "In-person", "Completed"],
  ["Aug 20, 2024", "User 03", "Selam", "Online", "Pending"],
];
const serviceRows = [
  ["Contraceptive Counselling", "12"],
  ["GBV Support", "8"],
  ["Adolescent Nutrition", "6"],
  ["Maternal Health", "10"],
  ["Newborn Care", "5"],
];

function FeedbackView() {
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
            4.6 <span>/ 5.0</span>
          </strong>
          <div className="stars">★★★★☆</div>
          <em>↗ +0.2 from last month</em>
        </div>
        <div className="panel distribution">
          <small>RATING DISTRIBUTION</small>
          {[
            ["5", "342", "90%"],
            ["4", "89", "25%"],
            ["3", "12", "6%"],
          ].map(([rating, count, width]) => (
            <div className="rating-row" key={rating}>
              <span>{rating} ★</span>
              <i>
                <b style={{ width }} />
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
          value="1,240"
          note={<b className="green-text">↗ +12%</b>}
        />
        <StatCard
          title="Messages"
          value="2,450"
          note={<>Consultation messages</>}
        />
        <StatCard title="Voice" value="520" note={<>Voice sessions</>} />
        <StatCard
          title="Completed"
          value="3,200"
          note={<b className="green-text">↗ +5%</b>}
        />
      </section>
      <DataTable
        title="Recent Activity"
        headers={["ID", "Type", "Midwife", "Date", "Status", "Actions"]}
        rows={consultationRows}
        total="45"
      />
    </>
  );
}
function AppointmentsView() {
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
        total="24 appointments"
      />
    </>
  );
}
/** Health library view with filters and the entry point for new content. */
function HealthView({ onAddContent }: { onAddContent: () => void }) {
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
        rows={[
          [
            "Understanding Maternal Health",
            "Maternal Care",
            "Article",
            "Published",
            "⋮",
          ],
          ["Newborn Care Guide", "Newborn Care", "PDF", "Published", "⋮"],
          [
            "Contraceptive Methods",
            "Contraceptive Counselling",
            "PDF",
            "Review",
            "⋮",
          ],
          ["Understanding GBV", "GBV Prevention", "Article", "Draft", "⋮"],
        ]}
        total="42"
      />
    </>
  );
}
function ServicesView({ onAddCategory }: { onAddCategory?: () => void }) {
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
        rows={serviceRows.map((row) => [row[0], row[1], "Active", ""])}
        total="5 entries"
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

const emergencyRows = [
  ["Emergency", "911", "National", "Active"],
  ["GBV Support", "116", "National", "Active"],
  ["Health Line", "XXX", "Addis", "Active"],
];
function EmergencyContactsView({
  onAddContact,
}: {
  onAddContact?: () => void;
}) {
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
            Showing 1 to 3 of 3 entries{" "}
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
function SettingsView({ onAdministration }: { onAdministration: () => void }) {
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
          <div className="profile-avatar">SJ</div>
          <h2>Dr. Sarah Jenkins</h2>
          <p>Lead Administrator</p>
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
function ConsultationReportView() {
  return (
    <>
      <button className="back-link">← Consultation Reports</button>
      <div className="report-profile">
        <div className="mini-avatar">AT</div>
        <div>
          <h1>ASTER TESFAYE</h1>
          <p>Midwife • St. Peter Hospital</p>
        </div>
        <span className="status active">Active</span>
      </div>
      <section className="stats report-stats">
        {[
          ["People", "82"],
          ["Consult.", "124"],
          ["Completed", "95.2%"],
          ["Avg Rating", "4.8★"],
          ["Avg Duration", "18m"],
        ].map(([a, b]) => (
          <div className="stat-card" key={a}>
            <small>{a}</small>
            <strong>{b}</strong>
          </div>
        ))}
      </section>
      <section className="report-grid">
        <div className="panel">
          <h2>Consultation Breakdown</h2>
          {[
            ["Anonymous Chat", "48", "40%"],
            ["Direct Messages", "34", "28%"],
            ["Voice", "18", "15%"],
            ["Online", "24", "20%"],
          ].map(([a, b, w]) => (
            <div className="breakdown" key={a}>
              <b>
                {a}
                <span>{b}</span>
              </b>
              <i>
                <em style={{ width: w }} />
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
          rows={[
            ["Aug 28, 2026", "Anonymous Chat", "User #8932", "Completed"],
            ["Aug 28, 2026", "Voice", "User #1124", "Completed"],
            ["Aug 27, 2026", "Direct Message", "User #4451", "Missed"],
          ]}
          total="124"
        />
      </div>
    </>
  );
}
function AnalyticsView() {
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
        {[
          ["Midwives", "86"],
          ["People", "1,240"],
          ["Consultations", "2,450"],
          ["Avg Duration", "18 min"],
        ].map(([a, b]) => (
          <div className="stat-card" key={a}>
            <small>{a}</small>
            <strong>{b}</strong>
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
          rows={[
            ["Aster", "82", "124", "118", "★ 4.8", "Active"],
            ["Hana", "64", "98", "92", "★ 4.6", "Active"],
            ["Clara", "45", "70", "65", "★ 4.9", "Active"],
            ["Maya", "90", "150", "145", "★ 4.7", "Away"],
            ["Elena", "30", "45", "40", "★ 4.5", "Active"],
          ]}
          total="86"
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
  const rows = isHospitals ? hospitals : people;
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        r.join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  );
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
            {filtered.map((r) => (
              <tr
                key={r[1]}
                onClick={() => type === "Midwives" && onMidwife?.(r[4])}
              >
                <td>
                  <div className="table-person">
                    <div className="mini-avatar">
                      {isHospitals ? (
                        <Hospital />
                      ) : (
                        r[0]
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                      )}
                    </div>
                    <div>
                      <b>{r[0]}</b>
                      <small>ID: {r[1]}</small>
                    </div>
                  </div>
                </td>
                <td>{r[2]}</td>
                <td>
                  {isHospitals ? <span className="count">{r[3]}</span> : r[3]}
                </td>
                <td>
                  <span className={`status ${r[4].toLowerCase()}`}>{r[4]}</span>
                </td>
                {isHospitals && (
                  <td>
                    <MoreVertical />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          Showing 1 to {filtered.length} of {isHospitals ? 42 : 248} entries{" "}
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
export default function AdminDashboard({ onLogout }: { onLogout?: () => void }) {
  const [active, setActive] = useState("Dashboard");
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
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
      <SettingsView onAdministration={() => setActive("Administration")} />
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
        header={<Topbar setOpen={setOpen} onNotify={() => setNotice(true)} />}
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
/* legacy render intentionally replaced */
function LegacyAdminDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [open, setOpen] = useState(false);
  const content =
    active === "Dashboard" ? (
      <Dashboard />
    ) : active === "Feedback" ? (
      <FeedbackView />
    ) : active === "Consultations" ? (
      <ConsultationsView />
    ) : active === "Appointments" ? (
      <AppointmentsView />
    ) : active === "Services" ? (
      <ServicesView />
    ) : active === "Emergency Contacts" ? (
      <EmergencyContactsView />
    ) : active === "Settings" ? (
      <SettingsView onAdministration={() => setActive("Administration")} />
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
      />
    );
  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        open={open}
        setOpen={setOpen}
      />
      <div className="main-area">
        <Topbar setOpen={setOpen} onNotify={() => setNotice(true)} />
        <main>{content}</main>
      </div>
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
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  );
}

export { LegacyAdminDashboard };
