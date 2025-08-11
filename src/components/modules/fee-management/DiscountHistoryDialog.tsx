
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  studentId?: string;
  studentName: string;
  feeType: string;
}

export function DiscountHistoryDialog({ 
  open, 
  onOpenChange, 
  feeId, 
  studentId,
  studentName, 
  feeType 
}: DiscountHistoryDialogProps) {
  const [discountHistory, setDiscountHistory] = useState<DiscountHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDiscountHistory = async () => {
    if (!feeId && !studentId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching discount history for:', { feeId, studentId });
      
      // Build a single query with OR conditions to avoid duplicates
      let query = supabase
        .from('discount_history')
        .select('*')
        .order('applied_at', { ascending: false });

      // Add conditions based on available parameters
      if (feeId && studentId) {
        // If we have both feeId and studentId, search by both
        query = query.or(`source_fee_id.eq.${feeId},fee_id.eq.${feeId},student_id.eq.${studentId}`);
      } else if (feeId) {
        // If we only have feeId, search by fee references
        query = query.or(`source_fee_id.eq.${feeId},fee_id.eq.${feeId}`);
      } else if (studentId) {
        // If we only have studentId, search by student
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Remove duplicates based on ID (in case there are any)
      const uniqueHistory = data.filter((item, index, self) => 
        index === self.findIndex(h => h.id === item.id)
      );

      console.log('✅ Discount history found:', uniqueHistory.length, 'unique records');
      console.log('📊 Discount amounts:', uniqueHistory.map(h => h.discount_amount));
      
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
    if (open && (feeId || studentId)) {
      console.log('🔄 Dialog opened, fetching discount history for:', { feeId, studentId, studentName, feeType });
      fetchDiscountHistory();
    }
  }, [open, feeId, studentId]);

  // Calculate total discount correctly from unique records
  const totalDiscountApplied = discountHistory.reduce((sum, item) => {
    const amount = Number(item.discount_amount) || 0;
    return sum + amount;
  }, 0);

  console.log('💰 Total discount calculation:', {
    records: discountHistory.length,
    amounts: discountHistory.map(h => h.discount_amount),
    total: totalDiscountApplied
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Discount History</DialogTitle>
          <DialogDescription>
            Detailed log of discounts applied to this fee record and student.
          </DialogDescription>
          <p className="text-sm text-gray-500">
            {studentName} - {feeType}
          </p>
          <p className="text-xs text-gray-400">
            Fee ID: {feeId} {studentId ? `• Student ID: ${studentId}` : ''}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <p className="text-sm text-gray-600">Total Discounts Applied</p>
              <p className="text-xl font-bold text-green-600">₹{totalDiscountApplied.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Sum of {discountHistory.length} unique transactions</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Discount Transactions</p>
              <p className="text-xl font-bold text-blue-600">{discountHistory.length}</p>
              <p className="text-xs text-gray-500">Unique discount applications</p>
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
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>QA Validation:</strong> Showing {discountHistory.length} unique discount transactions. 
                  Each transaction represents a separate discount application with its individual amount.
                </p>
              </div>
              
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
                          ₹{Number(item.discount_amount).toLocaleString()}
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
            </div>
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
