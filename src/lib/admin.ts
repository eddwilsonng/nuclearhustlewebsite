export function isAdmin(email: string | undefined): boolean {
  if (!email || !process.env.ADMIN_EMAIL) return false;
  return email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
}
