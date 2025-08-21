import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for year-scoped cache management
 * Provides methods to invalidate only specific year caches to prevent cross-contamination
 */
export function useYearScopedCache() {
  const queryClient = useQueryClient();

  const invalidateYearCache = useCallback((yearId: string, cacheTypes?: string[]) => {
    console.log(`🗑️ Invalidating cache for year: ${yearId}`, cacheTypes);
    
    const defaultCacheTypes = [
      'fee-records',
      'pyd-summary', 
      'pyd-list',
      'pyd-details',
      'student-enrollments',
      'fee-stats'
    ];
    
    const typesToInvalidate = cacheTypes || defaultCacheTypes;
    
    typesToInvalidate.forEach(cacheType => {
      queryClient.invalidateQueries({ 
        queryKey: [cacheType, yearId],
        exact: false 
      });
    });
  }, [queryClient]);

  const invalidateStudentYearCache = useCallback((studentId: string, yearId: string) => {
    console.log(`🗑️ Invalidating student cache: ${studentId} for year: ${yearId}`);
    
    queryClient.invalidateQueries({ 
      queryKey: ['student-fees', studentId, yearId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['student-pyd', studentId, yearId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['payment-history', studentId, yearId] 
    });
  }, [queryClient]);

  const invalidateAfterPromotion = useCallback((sourceYearId: string, targetYearId: string) => {
    console.log(`🔄 Cache invalidation after promotion: ${sourceYearId} → ${targetYearId}`);
    
    // Only invalidate target year (source year should remain immutable)
    invalidateYearCache(targetYearId, [
      'fee-records',
      'pyd-summary',
      'pyd-list',
      'student-enrollments'
    ]);
    
    // Also invalidate promotion-related caches
    queryClient.invalidateQueries({ 
      queryKey: ['promotion-history'] 
    });
  }, [queryClient, invalidateYearCache]);

  const invalidateAfterPayment = useCallback((studentId: string, yearId: string, paymentType: 'current' | 'pyd') => {
    console.log(`💰 Cache invalidation after ${paymentType} payment: ${studentId} in ${yearId}`);
    
    // Invalidate student-specific caches
    invalidateStudentYearCache(studentId, yearId);
    
    // Invalidate year-level summaries
    invalidateYearCache(yearId, ['pyd-summary', 'fee-stats']);
    
    // Dispatch events for real-time updates
    if (paymentType === 'pyd') {
      window.dispatchEvent(new CustomEvent('pyd-payment-recorded', { 
        detail: { studentId, yearId } 
      }));
    }
    
    window.dispatchEvent(new CustomEvent('payment-recorded', { 
      detail: { studentId, yearId, paymentType } 
    }));
  }, [queryClient, invalidateStudentYearCache, invalidateYearCache]);

  const prefetchYearData = useCallback(async (yearId: string) => {
    console.log(`⚡ Prefetching data for year: ${yearId}`);
    
    // Prefetch commonly accessed data
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['pyd-summary', yearId],
        staleTime: 30000
      }),
      queryClient.prefetchQuery({
        queryKey: ['fee-records', yearId],
        staleTime: 30000
      }),
      queryClient.prefetchQuery({
        queryKey: ['student-enrollments', yearId],
        staleTime: 60000
      })
    ]);
  }, [queryClient]);

  return {
    invalidateYearCache,
    invalidateStudentYearCache,
    invalidateAfterPromotion,
    invalidateAfterPayment,
    prefetchYearData
  };
}