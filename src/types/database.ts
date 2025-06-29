
// Database types that match Supabase schema
export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  class_id: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  photo_url: string | null;
  status: 'Active' | 'Inactive' | 'Alumni';
  blood_group: string | null;
  religion: string | null;
  caste_category: string | null;
  previous_school: string | null;
  transport_route: string | null;
  transport_stop: string | null;
  medical_information: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  aadhaar_number: string | null;
  mother_tongue: string | null;
  nationality: string | null;
  transfer_certificate: string | null;
  created_at: string;
  updated_at: string;
  classes?: {
    id: string;
    name: string;
    section: string | null;
  } | null;
  parents?: ParentBasic[];
  // Financial information
  total_paid?: number;
  total_pending?: number;
  fees?: Fee[];
}

// Simplified student type for dropdowns and selections
export interface StudentBasic {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id?: string | null;
}

export interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  relation: 'Mother' | 'Father' | 'Guardian' | 'Other';
  phone_number: string;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  occupation: string | null;
  annual_income: number | null;
  employer_name: string | null;
  employer_address: string | null;
  alternate_phone: string | null;
  aadhaar_number: string | null;
  pan_number: string | null;
  education_qualification: string | null;
  created_at: string;
  updated_at: string;
  students?: StudentBasic[];
}

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  hire_date: string;
  status: 'Active' | 'On Leave' | 'Retired';
  employee_id: string | null;
  department: string | null;
  designation: string | null;
  qualification: string | null;
  experience_years: number | null;
  salary: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  aadhaar_number: string | null;
  pan_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  section: string | null;
  homeroom_teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

// Simplified types for join queries
export interface TeacherBasic {
  id: string;
  first_name: string;
  last_name: string;
}

export interface ClassBasic {
  id: string;
  name: string;
  section: string | null;
}

export interface SubjectBasic {
  id: string;
  name: string;
  code: string;
}

export interface ParentBasic {
  id: string;
  first_name: string;
  last_name: string;
  relation: 'Mother' | 'Father' | 'Guardian' | 'Other';
  phone_number: string;
  email: string;
}

export interface StudentParentLink {
  student_id: string;
  parent_id: string;
}

export interface Fee {
  id: string;
  student_id: string;
  fee_type: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  due_date: string;
  payment_date: string | null;
  receipt_number: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
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

export interface StudentAcademicRecord {
  id: string;
  student_id: string;
  academic_year_id: string;
  class_id: string | null;
  status: 'Active' | 'Graduated' | 'Left' | 'Transferred';
  enrollment_date: string | null;
  departure_date: string | null;
  departure_reason: string | null;
  promoted_from_class: string | null;
  created_at: string;
  updated_at: string;
}
