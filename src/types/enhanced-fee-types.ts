
// Enhanced fee management types
export interface StudentFeeRecord {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  discount_percentage?: number;
  final_fee: number;
  paid_amount: number;
  balance_fee: number;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
  created_at: string;
  updated_at: string;
  discount_updated_by?: string;
  discount_updated_at?: string;
  discount_notes?: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
  };
}

export interface FeePaymentRecord {
  id: string;
  fee_record_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_time: string;
  payment_method: 'Cash' | 'Card' | 'PhonePe' | 'GPay' | 'Online' | 'Cheque' | 'Bank Transfer';
  late_fee: number;
  receipt_number: string;
  payment_receiver: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface FeeChangeHistory {
  id: string;
  fee_record_id: string;
  change_type: 'payment' | 'discount' | 'creation' | 'status_update';
  previous_value?: number;
  new_value?: number;
  amount?: number;
  changed_by: string;
  change_date: string;
  notes?: string;
  payment_method?: string;
  receipt_number?: string;
}
