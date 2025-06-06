
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
  created_at: string;
  updated_at: string;
  classes?: {
    id: string;
    name: string;
    section: string | null;
  } | null;
}

// Simplified student type for dropdowns and selections
export interface StudentBasic {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
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
  created_at: string;
  updated_at: string;
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
