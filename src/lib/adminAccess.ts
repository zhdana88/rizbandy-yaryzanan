export const ADMIN_EMAIL = 'zhdana88@gmail.com';

export function isConfiguredAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}
