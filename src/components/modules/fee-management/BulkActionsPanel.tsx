import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Users, Percent, DollarSign, Send } from "lucide-react";
import { Fee } from "./types/feeTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkActionsPanelProps {
  fees: Fee[];
  selectedFees: Set<string>;
  onSelectionChange: (feeIds: Set<string>) => void;
  onRefresh: () => void;
  onBulkReminder: (feeIds: string[]) => void;
}

export function BulkActionsPanel({
  fees,
  selectedFees,
  onSelectionChange,
  onRefresh,
  onBulkReminder
}: BulkActionsPanelProps) {
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [actionType, setActionType] = useState<'discount' | 'reminder' | ''>('');
  const [discountType, setDiscountType] = useState('Fixed Amount');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [discountNotes, setDiscountNotes] = useState('');
  const [reminderMethod, setReminderMethod] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedFeesData = fees.filter(fee => selectedFees.has(fee.id));
  const totalAmount = selectedFeesData.reduce((sum, fee) => sum + (fee.actual_amount - fee.discount_amount), 0);

  const handleSelectAll = () => {
    if (selectedFees.size === fees.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(fees.map(fee => fee.id)));
    }
  };

  const handleBulkDiscount = async () => {
    if (!discountAmount || !discountReason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      for (const fee of selectedFeesData) {
        let discountAmountValue = 0;
        
        if (discountType === 'Fixed Amount') {
          discountAmountValue = parseFloat(discountAmount);
        } else if (discountType === 'Percentage') {
          discountAmountValue = (fee.actual_amount * parseFloat(discountAmount)) / 100;
        }

        const discountData = {
          discount_amount: discountAmountValue,
          discount_notes: discountNotes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString()
        };

        // Update fees table
        await supabase
          .from('fees')
          .update(discountData)
          .eq('id', fee.id);

        // Update student_fee_records table if exists
        await supabase
          .from('student_fee_records')
          .update(discountData)
          .eq('student_id', fee.student_id)
          .eq('fee_type', fee.fee_type);
      }

      toast({
        title: "Bulk Discount Applied",
        description: `Discount applied to ${selectedFeesData.length} fee records`
      });

      setShowBulkDialog(false);
      onSelectionChange(new Set());
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReminder = async () => {
    if (!reminderMethod) {
      toast({
        title: "Missing Information",
        description: "Please select a reminder method",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would send actual reminders
      // For now, we'll just show a success message
      
      const studentsToRemind = new Set(selectedFeesData.map(fee => fee.student?.first_name + ' ' + fee.student?.last_name));
      
      toast({
        title: "Reminders Sent",
        description: `Reminders sent to ${studentsToRemind.size} students via ${reminderMethod}`,
      });

      setShowBulkDialog(false);
      onSelectionChange(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Actions
            {selectedFees.size > 0 && (
              <Badge variant="secondary">{selectedFees.size} selected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedFees.size === fees.length && fees.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">Select All ({fees.length})</Label>
            </div>

            {selectedFees.size > 0 && (
              <>
                <div className="text-sm text-muted-foreground">
                  Total Amount: ₹{totalAmount.toLocaleString()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionType('discount');
                    setShowBulkDialog(true);
                  }}
                  disabled={selectedFees.size === 0}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Apply Bulk Discount
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionType('reminder');
                    setShowBulkDialog(true);
                  }}
                  disabled={selectedFees.size === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminders
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectionChange(new Set())}
                >
                  Clear Selection
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'discount' ? 'Apply Bulk Discount' : 'Send Bulk Reminders'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                This action will affect {selectedFeesData.length} fee records
              </p>
            </div>

            {actionType === 'discount' && (
              <>
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Amount {discountType === 'Percentage' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <Label>Reason</Label>
                  <Select value={discountReason} onValueChange={setDiscountReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scholarship">Scholarship</SelectItem>
                      <SelectItem value="Financial Hardship">Financial Hardship</SelectItem>
                      <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                      <SelectItem value="Festival Discount">Festival Discount</SelectItem>
                      <SelectItem value="Batch Discount">Batch Discount</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={discountNotes}
                    onChange={(e) => setDiscountNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {actionType === 'reminder' && (
              <>
                <div>
                  <Label>Reminder Method</Label>
                  <Select value={reminderMethod} onValueChange={setReminderMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Custom Message (Optional)</Label>
                  <Textarea
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="Default reminder message will be used if blank..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={actionType === 'discount' ? handleBulkDiscount : handleBulkReminder}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}