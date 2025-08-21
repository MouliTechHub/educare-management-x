export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          start_date: string
          updated_at: string
          year_name: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          start_date: string
          updated_at?: string
          year_name: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          start_date?: string
          updated_at?: string
          year_name?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string | null
          date: string
          id: string
          remarks: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          date?: string
          id?: string
          remarks?: string | null
          status: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          remarks?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      cache_invalidations: {
        Row: {
          academic_year_id: string
          cache_key: string | null
          created_at: string
          id: string
          reason: string | null
          student_id: string
        }
        Insert: {
          academic_year_id: string
          cache_key?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string
          cache_key?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          student_id?: string
        }
        Relationships: []
      }
      class_subject_links: {
        Row: {
          class_id: string
          subject_id: string
        }
        Insert: {
          class_id: string
          subject_id: string
        }
        Update: {
          class_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subject_links_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_links_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_links_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          homeroom_teacher_id: string | null
          id: string
          name: string
          section: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homeroom_teacher_id?: string | null
          id?: string
          name: string
          section?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homeroom_teacher_id?: string | null
          id?: string
          name?: string
          section?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_homeroom_teacher_id_fkey"
            columns: ["homeroom_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_history: {
        Row: {
          applied_at: string
          applied_by: string
          applies_to: string | null
          created_at: string
          discount_amount: number
          discount_percentage: number | null
          discount_type: string
          fee_id: string | null
          id: string
          notes: string | null
          original_academic_year_id: string | null
          reason: string
          source_fee_id: string | null
          source_table: string | null
          student_id: string | null
          tag: string | null
          target_academic_year_id: string | null
        }
        Insert: {
          applied_at?: string
          applied_by?: string
          applies_to?: string | null
          created_at?: string
          discount_amount: number
          discount_percentage?: number | null
          discount_type: string
          fee_id?: string | null
          id?: string
          notes?: string | null
          original_academic_year_id?: string | null
          reason: string
          source_fee_id?: string | null
          source_table?: string | null
          student_id?: string | null
          tag?: string | null
          target_academic_year_id?: string | null
        }
        Update: {
          applied_at?: string
          applied_by?: string
          applies_to?: string | null
          created_at?: string
          discount_amount?: number
          discount_percentage?: number | null
          discount_type?: string
          fee_id?: string | null
          id?: string
          notes?: string | null
          original_academic_year_id?: string | null
          reason?: string
          source_fee_id?: string | null
          source_table?: string | null
          student_id?: string | null
          tag?: string | null
          target_academic_year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      exam_subject_links: {
        Row: {
          exam_id: string
          subject_id: string
        }
        Insert: {
          exam_id: string
          subject_id: string
        }
        Update: {
          exam_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subject_links_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subject_links_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string
          created_at: string | null
          exam_date: string
          id: string
          name: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          exam_date: string
          id?: string
          name: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          exam_date?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          academic_year_id: string
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          id: string
          month: number
          notes: string | null
          paid_to: string
          payment_method: string
          receipt_url: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          academic_year_id: string
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          id?: string
          month: number
          notes?: string | null
          paid_to: string
          payment_method?: string
          receipt_url?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          academic_year_id?: string
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          month?: number
          notes?: string | null
          paid_to?: string
          payment_method?: string
          receipt_url?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_allocation_rules: {
        Row: {
          academic_year_priority: string
          allocation_order: number
          created_at: string
          fee_type: string
          id: string
          is_active: boolean
          rule_name: string
          updated_at: string
        }
        Insert: {
          academic_year_priority?: string
          allocation_order: number
          created_at?: string
          fee_type: string
          id?: string
          is_active?: boolean
          rule_name: string
          updated_at?: string
        }
        Update: {
          academic_year_priority?: string
          allocation_order?: number
          created_at?: string
          fee_type?: string
          id?: string
          is_active?: boolean
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_audit_log: {
        Row: {
          academic_year_id: string
          action_type: string
          amount_affected: number | null
          fee_record_id: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          performed_at: string
          performed_by: string
          reference_number: string | null
          student_id: string
        }
        Insert: {
          academic_year_id: string
          action_type: string
          amount_affected?: number | null
          fee_record_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_at?: string
          performed_by: string
          reference_number?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string
          action_type?: string
          amount_affected?: number | null
          fee_record_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string
          reference_number?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_academic_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_fee_record"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "student_fee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_fee_record"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_outstanding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_fee_record"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_records_with_enrollment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_fee_record"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["fee_record_id"]
          },
          {
            foreignKeyName: "fk_audit_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      fee_carry_forward: {
        Row: {
          carried_amount: number
          carry_forward_type: string
          created_at: string
          created_by: string
          from_academic_year_id: string
          id: string
          notes: string | null
          original_amount: number
          status: string
          student_id: string
          to_academic_year_id: string
          updated_at: string
        }
        Insert: {
          carried_amount?: number
          carry_forward_type?: string
          created_at?: string
          created_by?: string
          from_academic_year_id: string
          id?: string
          notes?: string | null
          original_amount?: number
          status?: string
          student_id: string
          to_academic_year_id: string
          updated_at?: string
        }
        Update: {
          carried_amount?: number
          carry_forward_type?: string
          created_at?: string
          created_by?: string
          from_academic_year_id?: string
          id?: string
          notes?: string | null
          original_amount?: number
          status?: string
          student_id?: string
          to_academic_year_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_carry_forward_from_year"
            columns: ["from_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_carry_forward_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_carry_forward_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_carry_forward_to_year"
            columns: ["to_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_change_history: {
        Row: {
          amount: number | null
          change_date: string
          change_type: string
          changed_by: string
          fee_record_id: string
          id: string
          new_value: number | null
          notes: string | null
          payment_method: string | null
          previous_value: number | null
          receipt_number: string | null
        }
        Insert: {
          amount?: number | null
          change_date?: string
          change_type: string
          changed_by: string
          fee_record_id: string
          id?: string
          new_value?: number | null
          notes?: string | null
          payment_method?: string | null
          previous_value?: number | null
          receipt_number?: string | null
        }
        Update: {
          amount?: number | null
          change_date?: string
          change_type?: string
          changed_by?: string
          fee_record_id?: string
          id?: string
          new_value?: number | null
          notes?: string | null
          payment_method?: string | null
          previous_value?: number | null
          receipt_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_change_history_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "student_fee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_change_history_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_outstanding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_change_history_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_records_with_enrollment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_change_history_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["fee_record_id"]
          },
        ]
      }
      fee_payment_records: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string
          fee_record_id: string | null
          id: string
          late_fee: number | null
          notes: string | null
          payment_date: string
          payment_method: string
          payment_receiver: string
          payment_time: string
          receipt_number: string
          student_id: string
          target_academic_year_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          created_by?: string
          fee_record_id?: string | null
          id?: string
          late_fee?: number | null
          notes?: string | null
          payment_date: string
          payment_method?: string
          payment_receiver: string
          payment_time?: string
          receipt_number: string
          student_id: string
          target_academic_year_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string
          fee_record_id?: string | null
          id?: string
          late_fee?: number | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_receiver?: string
          payment_time?: string
          receipt_number?: string
          student_id?: string
          target_academic_year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payment_records_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "student_fee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payment_records_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_outstanding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payment_records_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_records_with_enrollment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payment_records_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["fee_record_id"]
          },
          {
            foreignKeyName: "fee_payment_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payment_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_payment_records_target_academic_year_id_fkey"
            columns: ["target_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          amount: number
          class_id: string
          created_at: string
          description: string | null
          fee_type: string
          frequency: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          class_id: string
          created_at?: string
          description?: string | null
          fee_type: string
          frequency: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          class_id?: string
          created_at?: string
          description?: string | null
          fee_type?: string
          frequency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string | null
          exam_id: string
          grade: string
          id: string
          remarks: string | null
          score: number
          student_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          exam_id: string
          grade: string
          id?: string
          remarks?: string | null
          score: number
          student_id: string
          subject_id: string
        }
        Update: {
          created_at?: string | null
          exam_id?: string
          grade?: string
          id?: string
          remarks?: string | null
          score?: number
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          aadhaar_number: string | null
          address_line1: string | null
          address_line2: string | null
          alternate_phone: string | null
          annual_income: number | null
          city: string | null
          created_at: string | null
          education_qualification: string | null
          email: string
          employer_address: string | null
          employer_name: string | null
          first_name: string
          id: string
          last_name: string
          occupation: string | null
          pan_number: string | null
          phone_number: string
          pin_code: string | null
          relation: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          annual_income?: number | null
          city?: string | null
          created_at?: string | null
          education_qualification?: string | null
          email: string
          employer_address?: string | null
          employer_name?: string | null
          first_name: string
          id?: string
          last_name: string
          occupation?: string | null
          pan_number?: string | null
          phone_number: string
          pin_code?: string | null
          relation: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          annual_income?: number | null
          city?: string | null
          created_at?: string | null
          education_qualification?: string | null
          email?: string
          employer_address?: string | null
          employer_name?: string | null
          first_name?: string
          id?: string
          last_name?: string
          occupation?: string | null
          pan_number?: string | null
          phone_number?: string
          pin_code?: string | null
          relation?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          allocation_date: string
          allocation_order: number
          fee_record_id: string
          id: string
          payment_record_id: string
        }
        Insert: {
          allocated_amount: number
          allocation_date?: string
          allocation_order: number
          fee_record_id: string
          id?: string
          payment_record_id: string
        }
        Update: {
          allocated_amount?: number
          allocation_date?: string
          allocation_order?: number
          fee_record_id?: string
          id?: string
          payment_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_allocation_fee"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "student_fee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_allocation_fee"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_outstanding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_allocation_fee"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_fee_records_with_enrollment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_allocation_fee"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["fee_record_id"]
          },
          {
            foreignKeyName: "fk_allocation_payment"
            columns: ["payment_record_id"]
            isOneToOne: false
            referencedRelation: "fee_payment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_blockage_log: {
        Row: {
          academic_year_id: string | null
          blocked_amount: number
          blocked_at: string
          id: string
          outstanding_dues: number
          reason: string
          student_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          blocked_amount: number
          blocked_at?: string
          id?: string
          outstanding_dues: number
          reason: string
          student_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          blocked_amount?: number
          blocked_at?: string
          id?: string
          outstanding_dues?: number
          reason?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_blockage_log_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_blockage_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_blockage_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      payment_reversals: {
        Row: {
          authorized_by: string
          created_at: string
          id: string
          notes: string | null
          payment_history_id: string
          reason: string
          reversal_amount: number
          reversal_date: string
          reversal_type: string
          updated_at: string
        }
        Insert: {
          authorized_by: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_history_id: string
          reason: string
          reversal_amount: number
          reversal_date?: string
          reversal_type: string
          updated_at?: string
        }
        Update: {
          authorized_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_history_id?: string
          reason?: string
          reversal_amount?: number
          reversal_date?: string
          reversal_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promotion_audit: {
        Row: {
          created_at: string
          from_academic_year_id: string
          from_class_id: string
          id: string
          notes: string | null
          promoted_by: string
          promotion_type: string
          reason: string | null
          request_id: string | null
          student_id: string
          to_academic_year_id: string
          to_class_id: string | null
        }
        Insert: {
          created_at?: string
          from_academic_year_id: string
          from_class_id: string
          id?: string
          notes?: string | null
          promoted_by: string
          promotion_type: string
          reason?: string | null
          request_id?: string | null
          student_id: string
          to_academic_year_id: string
          to_class_id?: string | null
        }
        Update: {
          created_at?: string
          from_academic_year_id?: string
          from_class_id?: string
          id?: string
          notes?: string | null
          promoted_by?: string
          promotion_type?: string
          reason?: string | null
          request_id?: string | null
          student_id?: string
          to_academic_year_id?: string
          to_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_audit_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "promotion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          request_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          request_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "promotion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          idempotency_key: string
          promoted_by_user: string
          request_payload: Json
          result: Json | null
          status: string
          target_academic_year_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key: string
          promoted_by_user: string
          request_payload: Json
          result?: Json | null
          status?: string
          target_academic_year_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key?: string
          promoted_by_user?: string
          request_payload?: Json
          result?: Json | null
          status?: string
          target_academic_year_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown | null
          performed_at: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          performed_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          performed_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_academic_records: {
        Row: {
          academic_year_id: string
          class_id: string | null
          created_at: string
          departure_date: string | null
          departure_reason: string | null
          enrollment_date: string | null
          id: string
          promoted_from_class: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id?: string | null
          created_at?: string
          departure_date?: string | null
          departure_reason?: string | null
          enrollment_date?: string | null
          id?: string
          promoted_from_class?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string | null
          created_at?: string
          departure_date?: string | null
          departure_reason?: string | null
          enrollment_date?: string | null
          id?: string
          promoted_from_class?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_academic_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_records_promoted_from_class_fkey"
            columns: ["promoted_from_class"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_records_promoted_from_class_fkey"
            columns: ["promoted_from_class"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          enrollment_date: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          enrollment_date?: string
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          enrollment_date?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_se_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_se_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_se_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_se_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_se_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_fee_records: {
        Row: {
          academic_year_id: string
          actual_fee: number
          balance_fee: number | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          carry_forward_source_id: string | null
          class_id: string
          created_at: string
          discount_amount: number
          discount_notes: string | null
          discount_percentage: number | null
          discount_updated_at: string | null
          discount_updated_by: string | null
          due_date: string | null
          fee_type: string
          final_fee: number | null
          id: string
          is_carry_forward: boolean | null
          paid_amount: number
          payment_blocked: boolean | null
          priority_order: number | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          actual_fee?: number
          balance_fee?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          carry_forward_source_id?: string | null
          class_id: string
          created_at?: string
          discount_amount?: number
          discount_notes?: string | null
          discount_percentage?: number | null
          discount_updated_at?: string | null
          discount_updated_by?: string | null
          due_date?: string | null
          fee_type?: string
          final_fee?: number | null
          id?: string
          is_carry_forward?: boolean | null
          paid_amount?: number
          payment_blocked?: boolean | null
          priority_order?: number | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          actual_fee?: number
          balance_fee?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          carry_forward_source_id?: string | null
          class_id?: string
          created_at?: string
          discount_amount?: number
          discount_notes?: string | null
          discount_percentage?: number | null
          discount_updated_at?: string | null
          discount_updated_by?: string | null
          due_date?: string | null
          fee_type?: string
          final_fee?: number | null
          id?: string
          is_carry_forward?: boolean | null
          paid_amount?: number
          payment_blocked?: boolean | null
          priority_order?: number | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_carry_forward_source"
            columns: ["carry_forward_source_id"]
            isOneToOne: false
            referencedRelation: "fee_carry_forward"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_sfr_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_parent_links: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parent_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parent_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parent_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_promotions: {
        Row: {
          created_at: string
          from_academic_year_id: string
          from_class_id: string
          id: string
          notes: string | null
          promoted_by: string
          promotion_date: string
          promotion_type: string
          reason: string | null
          student_id: string
          to_academic_year_id: string
          to_class_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_academic_year_id: string
          from_class_id: string
          id?: string
          notes?: string | null
          promoted_by?: string
          promotion_date?: string
          promotion_type?: string
          reason?: string | null
          student_id: string
          to_academic_year_id: string
          to_class_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_academic_year_id?: string
          from_class_id?: string
          id?: string
          notes?: string | null
          promoted_by?: string
          promotion_date?: string
          promotion_type?: string
          reason?: string | null
          student_id?: string
          to_academic_year_id?: string
          to_class_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_promotions_from_academic_year_id_fkey"
            columns: ["from_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_promotions_to_academic_year_id_fkey"
            columns: ["to_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          aadhaar_number: string | null
          address_line1: string | null
          address_line2: string | null
          admission_number: string
          blood_group: string | null
          caste_category: string | null
          city: string | null
          class_id: string
          created_at: string | null
          date_of_birth: string
          date_of_join: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          medical_information: string | null
          mother_tongue: string | null
          nationality: string | null
          photo_url: string | null
          pin_code: string | null
          previous_school: string | null
          religion: string | null
          state: string | null
          status: string
          transfer_certificate: string | null
          transport_route: string | null
          transport_stop: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          admission_number: string
          blood_group?: string | null
          caste_category?: string | null
          city?: string | null
          class_id: string
          created_at?: string | null
          date_of_birth: string
          date_of_join?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name: string
          gender: string
          id?: string
          last_name: string
          medical_information?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          photo_url?: string | null
          pin_code?: string | null
          previous_school?: string | null
          religion?: string | null
          state?: string | null
          status?: string
          transfer_certificate?: string | null
          transport_route?: string | null
          transport_stop?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          admission_number?: string
          blood_group?: string | null
          caste_category?: string | null
          city?: string | null
          class_id?: string
          created_at?: string | null
          date_of_birth?: string
          date_of_join?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          medical_information?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          photo_url?: string | null
          pin_code?: string | null
          previous_school?: string | null
          religion?: string | null
          state?: string | null
          status?: string
          transfer_certificate?: string | null
          transport_route?: string | null
          transport_stop?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teacher_salaries: {
        Row: {
          academic_year_id: string
          attended_days: number
          bonus: number | null
          calculated_salary: number
          created_at: string | null
          deductions: number | null
          final_salary: number
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          salary_rate: number
          status: string
          teacher_id: string
          updated_at: string | null
          working_days: number
          year: number
        }
        Insert: {
          academic_year_id: string
          attended_days?: number
          bonus?: number | null
          calculated_salary: number
          created_at?: string | null
          deductions?: number | null
          final_salary: number
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          salary_rate: number
          status?: string
          teacher_id: string
          updated_at?: string | null
          working_days?: number
          year: number
        }
        Update: {
          academic_year_id?: string
          attended_days?: number
          bonus?: number | null
          calculated_salary?: number
          created_at?: string | null
          deductions?: number | null
          final_salary?: number
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          salary_rate?: number
          status?: string
          teacher_id?: string
          updated_at?: string | null
          working_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_salaries_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_salaries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subject_links: {
        Row: {
          subject_id: string
          teacher_id: string
        }
        Insert: {
          subject_id: string
          teacher_id: string
        }
        Update: {
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subject_links_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subject_links_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          aadhaar_number: string
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_id: string | null
          experience_years: number | null
          first_name: string
          hire_date: string
          id: string
          last_name: string
          pan_number: string | null
          phone_number: string
          pin_code: string | null
          qualification: string | null
          salary: number | null
          state: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          aadhaar_number: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string | null
          experience_years?: number | null
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          pan_number?: string | null
          phone_number: string
          pin_code?: string | null
          qualification?: string | null
          salary?: number | null
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string | null
          experience_years?: number | null
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          pan_number?: string | null
          phone_number?: string
          pin_code?: string | null
          qualification?: string | null
          salary?: number | null
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timetables: {
        Row: {
          class_id: string
          created_at: string | null
          day_of_week: string
          end_time: string
          id: string
          period_number: number
          start_time: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          day_of_week: string
          end_time: string
          id?: string
          period_number: number
          start_time: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          day_of_week?: string
          end_time?: string
          id?: string
          period_number?: number
          start_time?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      class_gender_stats: {
        Row: {
          female_count: number | null
          id: string | null
          male_count: number | null
          name: string | null
          other_count: number | null
          section: string | null
          total_students: number | null
        }
        Relationships: []
      }
      v_fee_outstanding: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          fee_type: string | null
          id: string | null
          outstanding: number | null
          student_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          class_id?: string | null
          fee_type?: string | null
          id?: string | null
          outstanding?: never
          student_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string | null
          fee_type?: string | null
          id?: string | null
          outstanding?: never
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_sfr_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_fee_records_with_enrollment: {
        Row: {
          academic_year_id: string | null
          actual_fee: number | null
          balance_fee: number | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          carry_forward_source_id: string | null
          class_id: string | null
          created_at: string | null
          discount_amount: number | null
          discount_notes: string | null
          discount_percentage: number | null
          discount_updated_at: string | null
          discount_updated_by: string | null
          due_date: string | null
          enrolled_class_id: string | null
          enrolled_class_name: string | null
          enrolled_class_section: string | null
          enrolled_year_id: string | null
          fee_type: string | null
          final_fee: number | null
          id: string | null
          is_carry_forward: boolean | null
          paid_amount: number | null
          payment_blocked: boolean | null
          priority_order: number | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_carry_forward_source"
            columns: ["carry_forward_source_id"]
            isOneToOne: false
            referencedRelation: "fee_carry_forward"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_se_class"
            columns: ["enrolled_class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_se_class"
            columns: ["enrolled_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_se_year"
            columns: ["enrolled_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_sfr_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["enrolled_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["enrolled_class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["enrolled_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_pyd: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          outstanding: number | null
          student_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          class_id?: string | null
          outstanding?: never
          student_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string | null
          outstanding?: never
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_sfr_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_pyd_per_student: {
        Row: {
          academic_year_id: string | null
          pyd_per_student: number | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sfr_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_sfr_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_fees"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_students_with_fees: {
        Row: {
          academic_year_id: string | null
          actual_fee: number | null
          admission_number: string | null
          balance_fee: number | null
          class_id: string | null
          discount_amount: number | null
          due_date: string | null
          fee_record_id: string | null
          fee_status: string | null
          fee_type: string | null
          first_name: string | null
          last_name: string | null
          paid_amount: number | null
          status: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sfr_year"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_gender_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_records_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      allocate_payment_fifo: {
        Args: {
          p_academic_year_id: string
          p_payment_amount: number
          p_payment_record_id: string
          p_student_id: string
        }
        Returns: Json
      }
      apply_previous_year_dues_discount: {
        Args: {
          p_amount: number
          p_approved_by?: string
          p_current_year_id: string
          p_notes?: string
          p_reason: string
          p_student_id: string
          p_type: string
        }
        Returns: Json
      }
      apply_student_discount: {
        Args: {
          p_amount: number
          p_applied_by?: string
          p_fee_record_id: string
          p_notes?: string
          p_reason: string
          p_type: string
        }
        Returns: Json
      }
      can_manage_finances: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      carry_forward_student_fees: {
        Args: {
          p_carry_forward_type?: string
          p_created_by?: string
          p_from_academic_year_id: string
          p_student_id: string
          p_to_academic_year_id: string
        }
        Returns: Json
      }
      check_fee_structure_exists: {
        Args: { target_academic_year_id: string; target_class_id: string }
        Returns: boolean
      }
      debug_fee_counts: {
        Args: { p_year: string }
        Returns: number
      }
      get_next_class_id: {
        Args: { current_class_id: string }
        Returns: string
      }
      get_pyd_summary: {
        Args: { p_year: string }
        Returns: {
          avg_per_student: number
          high_count: number
          low_count: number
          medium_count: number
          students_with_dues: number
          total_outstanding: number
        }[]
      }
      get_pyd_summary_enhanced: {
        Args: { p_year: string }
        Returns: {
          avg_per_student: number
          high_count: number
          low_count: number
          medium_count: number
          students_with_dues: number
          total_outstanding: number
        }[]
      }
      get_student_pyd_details: {
        Args: { p_student_id: string; p_year: string }
        Returns: {
          fee_record_id: string
          outstanding_amount: number
        }[]
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          user_uuid?: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      log_fee_audit: {
        Args: {
          p_academic_year_id: string
          p_action_type: string
          p_amount_affected?: number
          p_fee_record_id: string
          p_new_values?: Json
          p_notes?: string
          p_old_values?: Json
          p_performed_by: string
          p_reference_number?: string
          p_student_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
        }
        Returns: string
      }
      promote_students_with_fees: {
        Args: {
          idempotency_key?: string
          promoted_by_user: string
          promotion_data: Json
          target_academic_year_id: string
        }
        Returns: Json
      }
      promote_students_with_fees_by_name: {
        Args: {
          promoted_by_user?: string
          source_year_name: string
          target_year_name: string
        }
        Returns: Json
      }
      promote_students_with_fees_safe: {
        Args: {
          promoted_by_user?: string
          source_year_name: string
          target_year_name: string
        }
        Returns: Json
      }
      set_current_academic_year: {
        Args: { p_year_id: string }
        Returns: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          start_date: string
          updated_at: string
          year_name: string
        }
      }
      update_fee_priorities: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "parent", "accountant"],
    },
  },
} as const
