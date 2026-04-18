/**
 * Helper to determine the correct redirect path after authentication based on user role.
 */
export const getRoleRedirectPath = (user: any): string => {
  if (!user) return '/auth/login';
  
  // Aligning with the Role enum from Prisma: ADMIN, USER, DEFAULT_USER
  if (user.role === 'ADMIN') {
    return '/admin/dashboard';
  }
  
  return '/';
};
