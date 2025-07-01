
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Class, Student, FeeStructure } from "@/types/database";
import { useFeeDetails } from "./hooks/useFeeDetails";
import { StudentSelectionCard } from "./components/StudentSelectionCard";
import { FeeDetailsDisplay } from "./components/FeeDetailsDisplay";
import { PaymentInformationCard } from "./components/PaymentInformationCard";

interface PaymentFormProps {
  classes: Class[];
  students: Student[];
  feeStructures: FeeStructure[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function PaymentForm({ classes, students, feeStructures, onSubmit, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    class_id: '',
    student_id: '',
    fee_structure_id: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    late_fee: '0',
    reference_number: '',
    payment_received_by: '',
    notes: '',
  });

  const feeDetails = useFeeDetails(formData.student_id, formData.fee_structure_id, feeStructures);

  // Reset dependent fields when class changes
  useEffect(() => {
    if (formData.class_id) {
      setFormData(prev => ({ ...prev, student_id: '', fee_structure_id: '' }));
    }
  }, [formData.class_id]);

  // Update amount when fee details change
  useEffect(() => {
    if (feeDetails) {
      setFormData(prev => ({ 
        ...prev, 
        amount_paid: feeDetails.balanceAmount > 0 ? feeDetails.balanceAmount.toString() : '0'
      }));
    }
  }, [feeDetails]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.fee_structure_id || !formData.amount_paid || !formData.payment_received_by) {
      alert('Please fill in all required fields');
      return;
    }

    const amountPaid = parseFloat(formData.amount_paid);
    if (amountPaid <= 0) {
      alert('Amount paid must be greater than 0');
      return;
    }

    if (feeDetails && amountPaid > feeDetails.balanceAmount) {
      alert(`Amount paid cannot exceed balance amount of ₹${feeDetails.balanceAmount.toLocaleString()}`);
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StudentSelectionCard
        classId={formData.class_id}
        studentId={formData.student_id}
        feeStructureId={formData.fee_structure_id}
        classes={classes}
        students={students}
        feeStructures={feeStructures}
        onInputChange={handleInputChange}
      />

      {feeDetails && (
        <FeeDetailsDisplay feeDetails={feeDetails} />
      )}

      <PaymentInformationCard
        formData={formData}
        feeDetails={feeDetails}
        onInputChange={handleInputChange}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Record Payment
        </Button>
      </div>
    </form>
  );
}
