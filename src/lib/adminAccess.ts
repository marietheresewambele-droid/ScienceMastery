const adminEmails = new Set(
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && adminEmails.has(email.toLowerCase()));
}
