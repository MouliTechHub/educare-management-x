import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export function useSecurityAudit() {
  const { user } = useAuth();

  const logSecurityEvent = async (event: SecurityEvent) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_action: event.action,
        p_resource_type: event.resourceType || null,
        p_resource_id: event.resourceId || null,
        p_details: event.details || null
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  // Log critical actions
  const logLogin = () => logSecurityEvent({ action: 'login' });
  const logLogout = () => logSecurityEvent({ action: 'logout' });
  const logStudentAccess = (studentId: string) => 
    logSecurityEvent({ 
      action: 'student_access', 
      resourceType: 'student',
      resourceId: studentId 
    });
  const logPaymentCreation = (paymentId: string, amount: number) =>
    logSecurityEvent({
      action: 'payment_created',
      resourceType: 'payment',
      resourceId: paymentId,
      details: { amount }
    });
  const logDiscountApplication = (studentId: string, discountAmount: number) =>
    logSecurityEvent({
      action: 'discount_applied',
      resourceType: 'student',
      resourceId: studentId,
      details: { discountAmount }
    });

  return {
    logSecurityEvent,
    logLogin,
    logLogout,
    logStudentAccess,
    logPaymentCreation,
    logDiscountApplication,
  };
}

// Component to automatically log auth events
export function SecurityAuditLogger() {
  const { user } = useAuth();
  const { logLogin, logLogout } = useSecurityAudit();

  useEffect(() => {
    if (user) {
      logLogin();
    } else {
      logLogout();
    }
  }, [user, logLogin, logLogout]);

  return null;
}