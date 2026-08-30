import type { ReactNode } from "react";

type AdminShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  isSidebarOpen: boolean;
  onDismissSidebar: () => void;
};

/** Shared responsive frame used by every administration screen. */
export function AdminShell({
  sidebar,
  header,
  children,
  isSidebarOpen,
  onDismissSidebar,
}: AdminShellProps) {
  return (
    <div className="app-shell">
      {sidebar}
      <div className="main-area">
        {header}
        <main>{children}</main>
      </div>
      {isSidebarOpen && (
        <button
          className="scrim"
          onClick={onDismissSidebar}
          aria-label="Close navigation"
        />
      )}
    </div>
  );
}
