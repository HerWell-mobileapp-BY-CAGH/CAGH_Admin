import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  note: ReactNode;
  featured?: boolean;
};

/** Consistent metric card for dashboards and reports. */
export function StatCard({ title, value, note, featured = false }: StatCardProps) {
  return (
    <article className={`stat-card ${featured ? "featured" : ""}`}>
      <div className="stat-title">
        {title}
        <ArrowUpRight aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <div className="stat-note">{note}</div>
    </article>
  );
}
