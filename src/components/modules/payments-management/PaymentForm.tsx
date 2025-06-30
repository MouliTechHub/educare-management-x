
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Class, Student, FeeStructure } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

interface PaymentFormProps {
  classes: Class[];
  students: Student[];
  feeStructures: FeeStructure[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  'PhonePe', 'GPay', 'Card', 'Online', 'Cash', 'Cheque', 'Bank Transfer'
];

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

  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filteredFeeStructures, setFilteredFeeStructures] = useState<FeeStructure[]>([]);
  const [balanceAmount, setBalanceAmount] = useState<number>(0);
  const [totalFeeAmount, setTotalFeeAmount] = useState<number>(0);

  // Filter students based on selected class
  useEffect(() => {
    if (formData.class_id) {
      const studentsInClass = students.filter(s => s.class_id === formData.class_id);
      setFilteredStudents(studentsInClass);
      
      // Filter fee structures for the selected class
      const structuresForClass = feeStructures.filter(fs => fs.class_id === formData.class_id);
      setFilteredFeeStructures(structuresForClass);
    } else {
      setFilteredStudents([]);
      setFilteredFeeStructures([]);
    }
    
    // Reset dependent fields
    setFormData(prev => ({ ...prev, student_id: '', fee_structure_id: '' }));
  }, [formData.class_id, students, feeStructures]);

  // Calculate balance when student and fee structure are selected
  useEffect(() => {
    if (formData.student_id && formData.fee_structure_id) {
      calculateBalance();
    }
  }, [formData.student_id, formData.fee_structure_id]);

  const calculateBalance = async () => {
    try {
      // Get fee structure amount
      const selectedStructure = feeStructures.find(fs => fs.id === formData.fee_structure_id);
      if (!selectedStructure) return;

      // Get existing payments for this student and fee structure
      const { data: existingPayments, error } = await supabase
        .from("student_payments")
        .select("amount_paid")
        .eq("student_id", formData.student_id)
        .eq("fee_structure_id", formData.fee_structure_id);

      if (error) throw error;

      const totalPaid = existingPayments?.reduce((sum, payment) => sum + payment.amount_paid, 0) || 0;
      const balance = selectedStructure.amount - totalPaid;
      
      setTotalFeeAmount(selectedStructure.amount);
      setBalanceAmount(Math.max(0, balance));
      setFormData(prev => ({ ...prev, amount_paid: balance.toString() }));
    } catch (error) {
      console.error("Error calculating balance:", error);
    }
  };

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

    if (amountPaid > balanceAmount) {
      alert(`Amount paid cannot exceed balance amount of ₹${balanceAmount.toLocaleString()}`);
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Student Selection</CardTitle>
          <CardDescription>Select the class and student for payment</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">Class *</Label>
            <Select
              value={formData.class_id}
              onValueChange={(value) => handleInputChange('class_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- Section ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student_id">Student *</Label>
            <Select
              value={formData.student_id}
              onValueChange={(value) => handleInputChange('student_id', value)}
              disabled={!formData.class_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.class_id ? "Select class first" : "Select student"} />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.admission_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fee_structure_id">Fee Structure *</Label>
            <Select
              value={formData.fee_structure_id}
              onValueChange={(value) => handleInputChange('fee_structure_id', value)}
              disabled={!formData.class_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.class_id ? "Select class first" : "Select fee structure"} />
              </SelectTrigger>
              <SelectContent>
                {filteredFeeStructures.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id}>
                    {structure.fee_type} - ₹{structure.amount.toLocaleString()} ({structure.frequency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Balance Information */}
          {balanceAmount > 0 && (
            <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Fee:</span>
                  <div className="text-lg">₹{totalFeeAmount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium">Paid:</span>
                  <div className="text-lg">₹{(totalFeeAmount - balanceAmount).toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium text-red-600">Balance:</span>
                  <div className="text-lg font-bold text-red-600">₹{balanceAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Enter payment details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount_paid">Amount Paid (₹) *</Label>
            <Input
              id="amount_paid"
              type="number"
              step="0.01"
              min="0"
              max={balanceAmount}
              value={formData.amount_paid}
              onChange={(e) => handleInputChange('amount_paid', e.target.value)}
              placeholder="Enter amount paid"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => handleInputChange('payment_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => handleInputChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="late_fee">Late Fee (₹)</Label>
            <Input
              id="late_fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.late_fee}
              onChange={(e) => handleInputChange('late_fee', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="Receipt/Transaction number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_received_by">Payment Received By *</Label>
            <Input
              id="payment_received_by"
              value={formData.payment_received_by}
              onChange={(e) => handleInputChange('payment_received_by', e.target.value)}
              placeholder="Name of person receiving payment"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Optional notes about this payment"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

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
