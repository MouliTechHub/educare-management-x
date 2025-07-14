import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw } from 'lucide-react';

export function TestSyncIndicator() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  useEffect(() => {
    const handlePaymentRecorded = () => {
      setLastSync(new Date());
      setSyncCount(prev => prev + 1);
      console.log('🔄 TestSyncIndicator: Payment sync detected!');
    };

    window.addEventListener('payment-recorded', handlePaymentRecorded);
    return () => window.removeEventListener('payment-recorded', handlePaymentRecorded);
  }, []);

  if (!lastSync) return null;

  return (
    <Badge variant="outline" className="flex items-center gap-2">
      <RefreshCcw className="h-3 w-3" />
      Last sync: {lastSync.toLocaleTimeString()} ({syncCount} times)
    </Badge>
  );
}