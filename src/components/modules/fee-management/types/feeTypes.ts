
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

// Add a specific type for student fee records from database
export interface StudentFeeRecord {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  paid_amount: number;
  final_fee: number | null;
  balance_fee: number | null;
  due_date: string | null;
  status: string; // This comes as generic string from database
  created_at: string;
  updated_at: string;
  discount_notes?: string | null;
  discount_updated_by?: string | null;
  discount_updated_at?: string | null;
  discount_percentage?: number | null;
  is_carry_forward?: boolean;
  payment_blocked?: boolean;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_id: string;
    classes?: {
      name: string;
      section: string | null;
    } | null;
  } | null;
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

export interface Class {
  id: string;
  name: string;
  section?: string;
  homeroom_teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
  has_discount: string;
  payment_status: string;
  search_parent: string;
}

export interface EnhancedFilterState {
  search: string;
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
  has_discount: string;
  payment_status: string;
  academic_year: string;
  amount_range: string;
  is_carry_forward: string;
  payment_blocked: string;
}
