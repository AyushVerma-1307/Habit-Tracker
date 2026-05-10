// Admin email verification
// Set ADMIN_EMAIL environment variable with comma-separated emails

const ADMIN_EMAILS = process.env.ADMIN_EMAIL || "";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || !ADMIN_EMAILS) {
    return false;
  }
  
  const allowedEmails = ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase());
  return allowedEmails.includes(email.toLowerCase());
}

export function getAdminEmails(): string[] {
  return ADMIN_EMAILS.split(",").map((e) => e.trim()).filter(Boolean);
}