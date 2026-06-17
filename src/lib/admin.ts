export function isAdmin(email: string | undefined): boolean {
  if (!email || !process.env.ADMIN_EMAIL) return false;
  return email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
}

export const ADMIN_VIEW_COOKIE = 'admin_view_role';
export type AdminViewRole = 'employer' | 'job_seeker';
