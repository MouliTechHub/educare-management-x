import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Mail, Smartphone } from "lucide-react";
import { Fee } from "./types/feeTypes";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fees: Fee[];
  onSuccess: () => void;
}

export function ReminderDialog({
  open,
  onOpenChange,
  fees,
  onSuccess
}: ReminderDialogProps) {
  const [reminderTypes, setReminderTypes] = useState({
    sms: true,
    whatsapp: true,
    email: false
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const defaultMessage = `Dear Parent,

This is a reminder that the ${fees[0]?.fee_type || 'fee'} payment for ${fees[0]?.student?.first_name || 'your child'} is pending. 

Please make the payment at your earliest convenience.

Thank you,
SchoolMaster Team`;

  React.useEffect(() => {
    setMessage(defaultMessage);
  }, [fees]);

  const handleSendReminders = async () => {
    if (!reminderTypes.sms && !reminderTypes.whatsapp && !reminderTypes.email) {
      toast({
        title: "Select Reminder Method",
        description: "Please select at least one reminder method",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate sending reminders (replace with actual API calls)
      const promises = fees.map(async (fee) => {
        const balanceAmount = (fee.actual_amount - fee.discount_amount) - fee.total_paid;
        
        if (balanceAmount <= 0) return;

        const reminderData = {
          student_name: `${fee.student?.first_name} ${fee.student?.last_name}`,
          fee_type: fee.fee_type,
          balance_amount: balanceAmount,
          due_date: fee.due_date,
          message: message
        };

        console.log('Sending reminder for:', reminderData);
        
        // Demo API calls - replace with actual implementation
        if (reminderTypes.sms) {
          console.log('SMS sent to:', fee.student?.parent_phone);
        }
        if (reminderTypes.whatsapp) {
          console.log('WhatsApp sent to:', fee.student?.parent_phone);
        }
        if (reminderTypes.email) {
          console.log('Email sent to:', fee.student?.parent_email);
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      await Promise.all(promises);

      toast({
        title: "Reminders Sent",
        description: `Successfully sent reminders to ${fees.length} recipient(s)`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Reminder sending error:', error);
      toast({
        title: "Reminder Failed",
        description: error.message || "Failed to send reminders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Fee Reminders</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              Sending reminders to <strong>{fees.length}</strong> student(s)
            </p>
          </div>

          <div>
            <Label className="text-base font-medium">Reminder Methods</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={reminderTypes.sms}
                  onCheckedChange={(checked) => 
                    setReminderTypes(prev => ({ ...prev, sms: checked as boolean }))
                  }
                />
                <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="w-4 h-4" />
                  SMS
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={reminderTypes.whatsapp}
                  onCheckedChange={(checked) => 
                    setReminderTypes(prev => ({ ...prev, whatsapp: checked as boolean }))
                  }
                />
                <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={reminderTypes.email}
                  onCheckedChange={(checked) => 
                    setReminderTypes(prev => ({ ...prev, email: checked as boolean }))
                  }
                />
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Reminder message"
              rows={6}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReminders}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Reminders'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}