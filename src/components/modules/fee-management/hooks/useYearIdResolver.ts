import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to resolve academic year names to IDs for consistent querying
 */
export function useYearIdResolver(yearName: string | undefined) {
  const [yearId, setYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yearName) {
      setYearId(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const resolveYearId = async () => {
      try {
        console.debug('[YEAR-RESOLVER] Resolving year name to ID:', yearName);
        
        const { data, error: queryError } = await supabase
          .from('academic_years')
          .select('id')
          .eq('year_name', yearName)
          .maybeSingle();

        if (queryError) {
          console.error('[YEAR-RESOLVER] Error resolving year:', queryError);
          setError(queryError.message);
          setYearId(null);
          return;
        }

        if (!data) {
          console.warn('[YEAR-RESOLVER] No academic year found for name:', yearName);
          setError(`Academic year "${yearName}" not found`);
          setYearId(null);
          return;
        }

        console.debug('[YEAR-RESOLVER] Resolved year ID:', data.id, 'for name:', yearName);
        setYearId(data.id);
        setError(null);
      } catch (err) {
        console.error('[YEAR-RESOLVER] Unexpected error:', err);
        setError('Failed to resolve academic year');
        setYearId(null);
      } finally {
        setLoading(false);
      }
    };

    resolveYearId();
  }, [yearName]);

  return { yearId, loading, error };
}