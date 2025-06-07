
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getErrorMessage = (error: any) => {
    if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
      return {
        title: "Email Not Confirmed",
        description: "Please check your email for a confirmation link, or disable email confirmation in Supabase settings."
      };
    }
    
    if (error.message.includes('Invalid login credentials')) {
      return {
        title: "Invalid Credentials",
        description: "Please check your email and password."
      };
    }

    if (error.message.includes('email_provider_disabled')) {
      return {
        title: "Email Authentication Disabled",
        description: "Email authentication is disabled. Please contact your administrator."
      };
    }

    return {
      title: "Authentication Error",
      description: error.message
    };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('Sign in error:', error.message);
      
      // Handle email not confirmed error for admin user
      if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
        if (email === 'admin@schoolmaster.com') {
          toast({
            title: "Admin Account Setup Required",
            description: "Please disable email confirmation in Supabase settings or check your email for the confirmation link.",
            variant: "destructive",
          });
        } else {
          const errorInfo = getErrorMessage(error);
          toast({
            title: errorInfo.title,
            description: errorInfo.description,
            variant: "destructive",
          });
        }
      } else {
        const errorInfo = getErrorMessage(error);
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome to SchoolMaster!",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      const errorInfo = getErrorMessage(error);
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration Successful",
        description: "Please check your email to confirm your account, or your email will be auto-confirmed if you're an admin.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
