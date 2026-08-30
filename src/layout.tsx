import type { ReactNode } from "react";

/** Compatibility layout for code imported from the earlier Next.js prototype. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
