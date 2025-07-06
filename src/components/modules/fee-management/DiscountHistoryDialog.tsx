
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiscountHistoryItem {
  id: string;
  discount_amount: number;
  discount_type: string;
  discount_percentage?: number;
  reason: string;
  notes?: string;
  applied_by: string;
  applied_at: string;
}

interface DiscountHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeId: string;
  studentName: string;
  feeType: string;
}

export function DiscountHistoryDialog({ 
  open, 
  onOpenChange, 
  feeId, 
  studentName, 
  feeType 
}: DiscountHistoryDialogProps) {
  const [discountHistory, setDiscountHistory] = useState<DiscountHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDiscountHistory = async () => {
    if (!feeId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching discount history for fee ID:', feeId);
      
      // Try multiple approaches to find discount history
      // 1. First try by source_fee_id (for student_fee_records)
      const { data: historyBySourceId, error: error1 } = await supabase
        .from('discount_history')
        .select('*')
        .eq('source_fee_id', feeId)
        .order('applied_at', { ascending: false });

      // 2. Also try by fee_id (for fees table)
      const { data: historyByFeeId, error: error2 } = await supabase
        .from('discount_history')
        .select('*')
        .eq('fee_id', feeId)
        .order('applied_at', { ascending: false });

      if (error1 && error2) {
        throw error1;
      }

      // Combine results and remove duplicates
      const combinedHistory = [
        ...(historyBySourceId || []),
        ...(historyByFeeId || [])
      ];

      // Remove duplicates based on ID
      const uniqueHistory = combinedHistory.filter((item, index, self) => 
        index === self.findIndex(h => h.id === item.id)
      );

      console.log('✅ Discount history found:', uniqueHistory.length, 'records');
      console.log('📊 History data:', uniqueHistory);

      setDiscountHistory(uniqueHistory);
    } catch (error: any) {
      console.error('❌ Error fetching discount history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch discount history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && feeId) {
      console.log('🔄 Dialog opened, fetching discount history for:', { feeId, studentName, feeType });
      fetchDiscountHistory();
    }
  }, [open, feeId]);

  const totalDiscountApplied = discountHistory.reduce((sum, item) => sum + item.discount_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Discount History</DialogTitle>
          <p className="text-sm text-gray-500">
            {studentName} - {feeType}
          </p>
          <p className="text-xs text-gray-400">
            Fee ID: {feeId}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <p className="text-sm text-gray-600">Total Discounts Applied</p>
              <p className="text-xl font-bold text-green-600">₹{totalDiscountApplied.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Discount Transactions</p>
              <p className="text-xl font-bold text-blue-600">{discountHistory.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading discount history...</span>
            </div>
          ) : discountHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No discount history found for this fee.</p>
              <p className="text-xs text-gray-400 mt-2">
                This could mean no discounts have been applied to this fee record yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(item.applied_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(item.applied_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.discount_type}
                        {item.discount_percentage && ` (${item.discount_percentage}%)`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        ₹{item.discount_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.applied_by}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {item.notes || 'No notes'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
