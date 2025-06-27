
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  fee_type: string;
  due_date: string;
  student?: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: Fee | null;
  onDiscountApplied: () => void;
}

export function DiscountDialog({ open, onOpenChange, fee, onDiscountApplied }: DiscountDialogProps) {
  const [discountType, setDiscountType] = useState<"amount" | "percentage">("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fee) return;

    setLoading(true);
    try {
      const discountAmount = discountType === "percentage" 
        ? (fee.actual_amount * parseFloat(discountValue)) / 100
        : parseFloat(discountValue);

      if (discountAmount > fee.actual_amount) {
        toast({
          title: "Invalid Discount",
          description: "Discount amount cannot exceed the actual fee amount.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const finalAmount = fee.actual_amount - discountAmount;

      // Update the fee record
      const { error: feeError } = await supabase
        .from("fees")
        .update({
          discount_amount: discountAmount,
          amount: finalAmount,
          discount_notes: notes,
          discount_updated_by: "Admin", // In a real app, this would be the current user
          discount_updated_at: new Date().toISOString(),
        })
        .eq("id", fee.id);

      if (feeError) throw feeError;

      // Create a discount record
      const { error: discountError } = await supabase
        .from("fee_discounts")
        .insert([{
          fee_id: fee.id,
          discount_amount: discountAmount,
          discount_percentage: discountType === "percentage" ? parseFloat(discountValue) : null,
          reason,
          notes,
          approved_by: "Admin", // In a real app, this would be the current user
        }]);

      if (discountError) throw discountError;

      toast({
        title: "Discount Applied",
        description: `Discount of ₹${discountAmount.toFixed(2)} applied successfully.`,
      });

      onDiscountApplied();
      onOpenChange(false);
      
      // Reset form
      setDiscountType("amount");
      setDiscountValue("");
      setReason("");
      setNotes("");
    } catch (error: any) {
      console.error("Error applying discount:", error);
      toast({
        title: "Error",
        description: "Failed to apply discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!fee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Apply discount for {fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "student"} - {fee.fee_type}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Actual Amount</Label>
              <p className="text-lg font-semibold">₹{fee.actual_amount.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Current Discount</Label>
              <p className="text-lg font-semibold text-green-600">₹{fee.discount_amount.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Discount Type</Label>
                <Select value={discountType} onValueChange={(value: "amount" | "percentage") => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount_value">
                  {discountType === "percentage" ? "Percentage (%)" : "Amount (₹)"}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={discountType === "percentage" ? "100" : fee.actual_amount.toString()}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Discount</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Financial Hardship">Financial Hardship</SelectItem>
                  <SelectItem value="Merit Scholarship">Merit Scholarship</SelectItem>
                  <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                  <SelectItem value="Staff Ward">Staff Ward</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes about this discount..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Applying..." : "Apply Discount"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
