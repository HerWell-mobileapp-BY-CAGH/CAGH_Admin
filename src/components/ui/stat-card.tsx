import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  note: ReactNode;
  featured?: boolean;
  onNavigate?: () => void;
};

/** Consistent metric card for dashboards and reports. */
export function StatCard({ title, value, note, featured = false, onNavigate }: StatCardProps) {
  return (
    <article className={`stat-card ${featured ? "featured" : ""}`}>
      <div className="stat-title">
        {title}
        {onNavigate ? <button className="stat-link" type="button" aria-label={`Open ${title}`} onClick={onNavigate}><ArrowUpRight aria-hidden="true" /></button> : <ArrowUpRight aria-hidden="true" />}
      </div>
      <strong>{value}</strong>
      <div className="stat-note">{note}</div>
    </article>
  );
}
