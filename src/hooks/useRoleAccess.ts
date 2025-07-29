import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'teacher' | 'parent' | 'accountant';

interface UserRoleData {
  role: UserRole;
  assigned_at: string;
  is_active: boolean;
}

export function useRoleAccess() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, assigned_at, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role || null);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return userRole ? roles.includes(userRole) : false;
  };

  const canManageFinances = (): boolean => {
    return hasAnyRole(['admin', 'accountant']);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const canViewStudents = (): boolean => {
    return hasAnyRole(['admin', 'teacher', 'accountant']);
  };

  const canModifyStudents = (): boolean => {
    return hasRole('admin');
  };

  return {
    userRole,
    loading,
    hasRole,
    hasAnyRole,
    canManageFinances,
    isAdmin,
    canViewStudents,
    canModifyStudents,
  };
}