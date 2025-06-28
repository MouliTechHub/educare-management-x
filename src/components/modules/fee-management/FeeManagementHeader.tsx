
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ExportButtons } from "./ExportButtons";
import { FeeFormDialog } from "./FeeFormDialog";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

interface FeeManagementHeaderProps {
  filteredFees: Fee[];
  academicYear: string;
  onExport: (format: 'excel' | 'pdf') => void;
  onReportsClick: () => void;
  onFeeCreated: () => void;
}

export function FeeManagementHeader({
  filteredFees,
  academicYear,
  onExport,
  onReportsClick,
  onFeeCreated
}: FeeManagementHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <p className="text-gray-600 mt-2">Academic year-based fee tracking with comprehensive analytics</p>
      </div>
      <div className="flex space-x-2">
        <ExportButtons 
          data={filteredFees} 
          academicYear={academicYear}
          onExport={onExport}
        />
        <Button variant="outline" onClick={onReportsClick}>
          <FileText className="w-4 h-4 mr-2" />
          Discount Reports
        </Button>
        <FeeFormDialog onFeeCreated={onFeeCreated} />
      </div>
    </div>
  );
}
