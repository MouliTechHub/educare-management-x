import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // in milliseconds
  sessionTimeout: number; // in milliseconds
}

const DEFAULT_CONFIG: SecurityConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

export function useSecurityEnhancements(config: Partial<SecurityConfig> = {}) {
  const { toast } = useToast();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sanitizeInput = useCallback((input: string): string => {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML injection characters
      .trim()
      .slice(0, 1000); // Limit length
  }, []);

  const checkRateLimit = useCallback((): boolean => {
    if (isLocked && lockoutEndTime && Date.now() < lockoutEndTime) {
      const remainingTime = Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60);
      toast({
        title: "Account Temporarily Locked",
        description: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        variant: "destructive",
      });
      return false;
    }

    if (isLocked && lockoutEndTime && Date.now() >= lockoutEndTime) {
      // Unlock the account
      setIsLocked(false);
      setLockoutEndTime(null);
      setFailedAttempts(0);
    }

    return true;
  }, [isLocked, lockoutEndTime, toast]);

  const recordFailedAttempt = useCallback(() => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);

    if (newFailedAttempts >= finalConfig.maxFailedAttempts) {
      const lockoutEnd = Date.now() + finalConfig.lockoutDuration;
      setIsLocked(true);
      setLockoutEndTime(lockoutEnd);
      
      toast({
        title: "Account Locked",
        description: `Account locked due to too many failed attempts. Try again in ${finalConfig.lockoutDuration / 1000 / 60} minutes.`,
        variant: "destructive",
      });
    }
  }, [failedAttempts, finalConfig.maxFailedAttempts, finalConfig.lockoutDuration, toast]);

  const recordSuccessfulAttempt = useCallback(() => {
    setFailedAttempts(0);
    setIsLocked(false);
    setLockoutEndTime(null);
  }, []);

  const startSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    sessionTimeoutRef.current = setTimeout(() => {
      toast({
        title: "Session Expired",
        description: "Your session has expired for security reasons. Please log in again.",
        variant: "destructive",
      });
      // Force logout would go here
      window.location.reload();
    }, finalConfig.sessionTimeout);
  }, [finalConfig.sessionTimeout, toast]);

  const resetSessionTimeout = useCallback(() => {
    startSessionTimeout();
  }, [startSessionTimeout]);

  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  const generateSecurePassword = useCallback((length: number = 16): string => {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = upperCase + lowerCase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }, []);

  return {
    sanitizeInput,
    checkRateLimit,
    recordFailedAttempt,
    recordSuccessfulAttempt,
    startSessionTimeout,
    resetSessionTimeout,
    clearSessionTimeout,
    generateSecurePassword,
    isLocked,
    failedAttempts,
    remainingAttempts: finalConfig.maxFailedAttempts - failedAttempts,
  };
}