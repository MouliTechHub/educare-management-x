
export interface Fee {
  id: string;
  student_id: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  paid_amount: number;
  final_fee: number;
  balance_fee: number;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
  created_at: string;
  updated_at: string;
  discount_notes?: string;
  discount_updated_by?: string;
  discount_updated_at?: string;
  academic_year_id: string;
  class_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name: string;
    section?: string;
    class_id: string;
    gender?: string;
    status?: string;
    parent_phone?: string;
    parent_email?: string;
  };
}

export interface PaymentRecord {
  id: string;
  fee_record_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_time?: string;
  payment_method: string;
  receipt_number: string;
  payment_receiver: string;
  notes?: string;
  created_at: string;
}
