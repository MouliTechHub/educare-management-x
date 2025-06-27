export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
        ]
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
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_discounts: {
        Row: {
          approved_by: string | null
          created_at: string
          discount_amount: number
          discount_percentage: number | null
          fee_id: string
          id: string
          notes: string | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          discount_amount: number
          discount_percentage?: number | null
          fee_id: string
          id?: string
          notes?: string | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          discount_amount?: number
          discount_percentage?: number | null
          fee_id?: string
          id?: string
          notes?: string | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_discounts_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          actual_amount: number
          amount: number
          created_at: string | null
          discount_amount: number
          discount_notes: string | null
          discount_updated_at: string | null
          discount_updated_by: string | null
          due_date: string
          fee_type: string
          id: string
          payment_date: string | null
          receipt_number: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number
          amount: number
          created_at?: string | null
          discount_amount?: number
          discount_notes?: string | null
          discount_updated_at?: string | null
          discount_updated_by?: string | null
          due_date: string
          fee_type: string
          id?: string
          payment_date?: string | null
          receipt_number?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number
          amount?: number
          created_at?: string | null
          discount_amount?: number
          discount_notes?: string | null
          discount_updated_at?: string | null
          discount_updated_by?: string | null
          due_date?: string
          fee_type?: string
          id?: string
          payment_date?: string | null
          receipt_number?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          address_line1: string | null
          address_line2: string | null
          alternate_phone: string | null
          annual_income: number | null
          city: string | null
          created_at: string | null
          email: string
          employer_address: string | null
          employer_name: string | null
          first_name: string
          id: string
          last_name: string
          occupation: string | null
          phone_number: string
          pin_code: string | null
          relation: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          annual_income?: number | null
          city?: string | null
          created_at?: string | null
          email: string
          employer_address?: string | null
          employer_name?: string | null
          first_name: string
          id?: string
          last_name: string
          occupation?: string | null
          phone_number: string
          pin_code?: string | null
          relation: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          annual_income?: number | null
          city?: string | null
          created_at?: string | null
          email?: string
          employer_address?: string | null
          employer_name?: string | null
          first_name?: string
          id?: string
          last_name?: string
          occupation?: string | null
          phone_number?: string
          pin_code?: string | null
          relation?: string
          state?: string | null
          updated_at?: string | null
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
          class_id: string | null
          created_at: string | null
          date_of_birth: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          medical_information: string | null
          photo_url: string | null
          pin_code: string | null
          previous_school: string | null
          religion: string | null
          state: string | null
          status: string
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
          class_id?: string | null
          created_at?: string | null
          date_of_birth: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name: string
          gender: string
          id?: string
          last_name: string
          medical_information?: string | null
          photo_url?: string | null
          pin_code?: string | null
          previous_school?: string | null
          religion?: string | null
          state?: string | null
          status?: string
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
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          medical_information?: string | null
          photo_url?: string | null
          pin_code?: string | null
          previous_school?: string | null
          religion?: string | null
          state?: string | null
          status?: string
          transport_route?: string | null
          transport_stop?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          phone_number: string
          pin_code: string | null
          qualification: string | null
          salary: number | null
          state: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
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
          phone_number: string
          pin_code?: string | null
          qualification?: string | null
          salary?: number | null
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
