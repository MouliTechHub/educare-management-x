
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface PaymentHistoryDialogHeaderProps {
  studentName: string;
  currentYear?: AcademicYear;
}

export function PaymentHistoryDialogHeader({ 
  studentName, 
  currentYear 
}: PaymentHistoryDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="w-5 h-5" />
          <span>Detailed Payment History - {studentName}</span>
        </div>
        {currentYear && (
          <Badge variant="outline" className="text-sm">
            Academic Year: {currentYear.year_name}
            {currentYear.is_current && " (Current)"}
          </Badge>
        )}
      </DialogTitle>
    </DialogHeader>
  );
}
