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
  const [feeDetails, setFeeDetails] = useState<{
    actualAmount: number;
    discountAmount: number;
    finalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  } | null>(null);

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
    setFeeDetails(null);
  }, [formData.class_id, students, feeStructures]);

  // Get fee details from both fee management systems
  useEffect(() => {
    if (formData.student_id && formData.fee_structure_id) {
      fetchFeeDetails();
    } else {
      setFeeDetails(null);
    }
  }, [formData.student_id, formData.fee_structure_id]);

  const fetchFeeDetails = async () => {
    try {
      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .single();

      if (yearError || !currentYear) {
        console.error("No current academic year found");
        return;
      }

      // Get fee structure details
      const selectedStructure = feeStructures.find(fs => fs.id === formData.fee_structure_id);
      if (!selectedStructure) return;

      // First check enhanced fee system (student_fee_records)
      const { data: enhancedFeeRecord, error: enhancedError } = await supabase
        .from("student_fee_records")
        .select("*")
        .eq("student_id", formData.student_id)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .maybeSingle();

      if (enhancedError && enhancedError.code !== 'PGRST116') {
        console.error("Error fetching enhanced fee record:", enhancedError);
      }

      // Check existing payments from all systems
      const [paymentHistoryData, feePaymentData, studentPaymentData] = await Promise.all([
        supabase
          .from('payment_history')
          .select('amount_paid')
          .eq('student_id', formData.student_id)
          .eq('fee_type', selectedStructure.fee_type),
        
        enhancedFeeRecord ? supabase
          .from('fee_payment_records')
          .select('amount_paid')
          .eq('fee_record_id', enhancedFeeRecord.id) : Promise.resolve({ data: [] }),
        
        supabase
          .from('student_payments')
          .select('amount_paid')
          .eq('student_id', formData.student_id)
          .eq('fee_structure_id', formData.fee_structure_id)
      ]);

      // Calculate total paid from all sources with proper type handling
      const calculatePaidAmount = (data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return 0;
        return data.reduce((total, record) => {
          const amount = Number(record?.amount_paid) || 0;
          return total + amount;
        }, 0);
      };

      const paidFromHistory = calculatePaidAmount(paymentHistoryData.data || []);
      const paidFromRecords = calculatePaidAmount(feePaymentData.data || []);
      const paidFromPayments = calculatePaidAmount(studentPaymentData.data || []);

      if (enhancedFeeRecord) {
        // Use data from enhanced fee management system
        const actualAmount = enhancedFeeRecord.actual_fee;
        const discountAmount = enhancedFeeRecord.discount_amount;
        const finalAmount = actualAmount - discountAmount;
        const totalPaid = Math.max(paidFromHistory, paidFromRecords, paidFromPayments);
        const balanceAmount = Math.max(0, finalAmount - totalPaid);

        setFeeDetails({
          actualAmount,
          discountAmount,
          finalAmount,
          paidAmount: totalPaid,
          balanceAmount
        });

        setFormData(prev => ({ 
          ...prev, 
          amount_paid: balanceAmount > 0 ? balanceAmount.toString() : '0'
        }));
      } else {
        // Check legacy fee system
        const { data: legacyFeeRecord, error: legacyError } = await supabase
          .from("fees")
          .select("*")
          .eq("student_id", formData.student_id)
          .eq("academic_year_id", currentYear.id)
          .eq("fee_type", selectedStructure.fee_type)
          .maybeSingle();

        if (legacyError && legacyError.code !== 'PGRST116') {
          console.error("Error fetching legacy fee record:", legacyError);
        }

        if (legacyFeeRecord) {
          // Use data from legacy fee system
          const actualAmount = legacyFeeRecord.actual_amount || selectedStructure.amount;
          const discountAmount = legacyFeeRecord.discount_amount || 0;
          const finalAmount = actualAmount - discountAmount;
          const totalPaid = Math.max(paidFromHistory, paidFromPayments, legacyFeeRecord.total_paid || 0);
          const balanceAmount = Math.max(0, finalAmount - totalPaid);

          setFeeDetails({
            actualAmount,
            discountAmount,
            finalAmount,
            paidAmount: totalPaid,
            balanceAmount
          });

          setFormData(prev => ({ 
            ...prev, 
            amount_paid: balanceAmount > 0 ? balanceAmount.toString() : '0'
          }));
        } else {
          // Fallback to fee structure amount if no fee record exists
          const actualAmount = selectedStructure.amount;
          const discountAmount = 0;
          const finalAmount = actualAmount;
          const totalPaid = Math.max(paidFromHistory, paidFromPayments);
          const balanceAmount = Math.max(0, finalAmount - totalPaid);

          setFeeDetails({
            actualAmount,
            discountAmount,
            finalAmount,
            paidAmount: totalPaid,
            balanceAmount
          });

          setFormData(prev => ({ 
            ...prev, 
            amount_paid: balanceAmount > 0 ? balanceAmount.toString() : '0'
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching fee details:", error);
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

          {/* Enhanced Fee Information Display */}
          {feeDetails && (
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Fee Details from Management System</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Actual Fee:</span>
                  <div className="text-lg font-semibold">₹{feeDetails.actualAmount.toLocaleString()}</div>
                </div>
                {feeDetails.discountAmount > 0 && (
                  <div>
                    <span className="font-medium text-green-600">Discount:</span>
                    <div className="text-lg font-semibold text-green-600">-₹{feeDetails.discountAmount.toLocaleString()}</div>
                  </div>
                )}
                <div>
                  <span className="font-medium text-blue-600">Final Fee:</span>
                  <div className="text-lg font-semibold text-blue-600">₹{feeDetails.finalAmount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Paid:</span>
                  <div className="text-lg font-semibold">₹{feeDetails.paidAmount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium text-red-600">Balance:</span>
                  <div className="text-lg font-bold text-red-600">₹{feeDetails.balanceAmount.toLocaleString()}</div>
                </div>
              </div>
              {feeDetails.discountAmount > 0 && (
                <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                  ✓ Discount applied from Fee Management System
                </div>
              )}
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
              max={feeDetails?.balanceAmount || undefined}
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
              max={new Date().toISOString().split('T')[0]}
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
