import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Student } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onStatusChanged: () => void;
}

const EXIT_REASONS = [
  { value: "Transfer", label: "Transfer to Other School" },
  { value: "Dropout", label: "Dropout" },  
  { value: "Completed", label: "Completed Education" },
  { value: "Family Relocation", label: "Family Relocation" },
  { value: "Financial Reasons", label: "Financial Reasons" },
  { value: "Performance Concerns", label: "Performance Concerns" },
  { value: "Behavioral Issues", label: "Behavioral Issues" },
  { value: "Health Reasons", label: "Health Reasons" },
  { value: "Personal/Family Circumstances", label: "Personal/Family Circumstances" },
  { value: "Other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "Inactive", label: "Inactive", description: "Temporarily not attending" },
  { value: "Alumni", label: "Alumni", description: "Graduated/Completed education" },
  { value: "Transferred", label: "Transferred", description: "Moved to another school" },
  { value: "Withdrawn", label: "Withdrawn", description: "Permanently withdrawn" },
];

export function StudentStatusDialog({ open, onOpenChange, student, onStatusChanged }: StudentStatusDialogProps) {
  const [status, setStatus] = useState<string>("");
  const [exitReason, setExitReason] = useState<string>("");
  const [exitFeedback, setExitFeedback] = useState<string>("");
  const [exitDate, setExitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [anonymize, setAnonymize] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  const { toast } = useToast();

  const handleClose = () => {
    setStatus("");
    setExitReason("");
    setExitFeedback("");
    setExitDate(new Date().toISOString().split('T')[0]);
    setAnonymize(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!student || !status || !exitReason) {
      toast({
        title: "Missing Information",
        description: "Please select both status and exit reason.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('set_student_status', {
        p_student_id: student.id,
        p_new_status: status,
        p_exit_reason: exitReason,
        p_feedback_notes: exitFeedback || null,
        p_exit_date: exitDate,
        p_anonymize: anonymize,
      });

      if (error) {
        console.error('Error setting student status:', error);
        throw error;
      }

      toast({
        title: "Student Status Updated",
        description: `Student has been marked as ${status.toLowerCase()}.`,
      });

      handleClose();
      onStatusChanged();
    } catch (error: any) {
      console.error('handleSubmit error:', error);
      toast({
        title: "Error updating student status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Student Status</DialogTitle>
          <DialogDescription>
            Update the status for {student.first_name} {student.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitReason">Exit Reason</Label>
            <Select value={exitReason} onValueChange={setExitReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {EXIT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitDate">Exit Date</Label>
            <Input
              id="exitDate"
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitFeedback">Additional Notes (Optional)</Label>
            <Textarea
              id="exitFeedback"
              placeholder="Any additional information about this status change..."
              value={exitFeedback}
              onChange={(e) => setExitFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymize"
              checked={anonymize}
              onCheckedChange={(checked) => setAnonymize(checked === true)}
            />
            <Label htmlFor="anonymize" className="text-sm">
              Anonymize student data (remove name and contact info)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !status || !exitReason}>
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}