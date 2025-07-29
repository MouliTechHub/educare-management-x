import React from 'react';
import { useRoleAccess, UserRole } from '@/hooks/useRoleAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  fallback 
}: RoleProtectedRouteProps) {
  const { userRole, loading, hasAnyRole } = useRoleAccess();

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!userRole || !hasAnyRole(allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to access this page. Required roles: {allowedRoles.join(', ')}
          {userRole && ` Your current role: ${userRole}`}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}