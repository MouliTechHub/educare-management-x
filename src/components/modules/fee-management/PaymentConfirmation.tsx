
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PaymentConfirmationProps {
  studentName: string;
  feeType: string;
  academicYear: string;
  amount: number;
  receiptNumber: string;
  paymentDate: string;
  onBack: () => void;
  onConfirm: () => void;
}

export function PaymentConfirmation({
  studentName,
  feeType,
  academicYear,
  amount,
  receiptNumber,
  paymentDate,
  onBack,
  onConfirm
}: PaymentConfirmationProps) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-amber-800">Confirm Payment Details</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <p><strong>Student:</strong> {studentName}</p>
              <p><strong>Fee Type:</strong> {feeType}</p>
              <p><strong>Academic Year:</strong> {academicYear}</p>
              <p><strong>Amount:</strong> ₹{amount.toLocaleString()}</p>
              <p><strong>Receipt:</strong> {receiptNumber}</p>
              <p><strong>Date:</strong> {new Date(paymentDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Edit
        </Button>
        <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
          Confirm & Record Payment
        </Button>
      </div>
    </div>
  );
}
