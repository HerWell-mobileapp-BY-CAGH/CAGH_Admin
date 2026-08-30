export type ClassValue = string | false | null | undefined;

/** Joins conditional class names without adding an unnecessary dependency. */
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
