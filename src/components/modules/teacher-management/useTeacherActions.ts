
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Teacher } from "@/types/database";
import { validateAndFormatPhoneNumber } from "@/components/modules/student-management/utils/phoneValidation";

interface TeacherFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  hire_date: string;
  status: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience_years?: number;
  salary?: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export function useTeacherActions() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type cast the status field to match our enum
      const typedTeachers = (data || []).map(teacher => ({
        ...teacher,
        status: teacher.status as 'Active' | 'On Leave' | 'Retired'
      }));
      
      setTeachers(typedTeachers);
    } catch (error: any) {
      toast({
        title: "Error fetching teachers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTeacher = async (data: TeacherFormData, selectedTeacher: Teacher | null) => {
    // Validate phone numbers before submission
    if (data.phone_number) {
      const phoneValidation = validateAndFormatPhoneNumber(data.phone_number);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Invalid phone number format');
      }
      data.phone_number = phoneValidation.formatted;
    }

    if (data.emergency_contact_phone) {
      const emergencyPhoneValidation = validateAndFormatPhoneNumber(data.emergency_contact_phone);
      if (!emergencyPhoneValidation.isValid) {
        throw new Error(emergencyPhoneValidation.error || 'Invalid emergency contact phone number format');
      }
      data.emergency_contact_phone = emergencyPhoneValidation.formatted;
    }

    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      employee_id: data.employee_id || null,
      department: data.department || null,
      designation: data.designation || null,
      qualification: data.qualification || null,
      experience_years: data.experience_years || null,
      salary: data.salary || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      pin_code: data.pin_code || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      emergency_contact_relation: data.emergency_contact_relation || null,
    };

    if (selectedTeacher) {
      const { error } = await supabase
        .from("teachers")
        .update(cleanedData)
        .eq("id", selectedTeacher.id);

      if (error) throw error;
      toast({ title: "Teacher updated successfully" });
    } else {
      const { error } = await supabase
        .from("teachers")
        .insert([cleanedData]);

      if (error) throw error;
      toast({ title: "Teacher created successfully" });
    }

    fetchTeachers();
  };

  const deleteTeacher = async (id: string) => {
    // Check if teacher is assigned as homeroom teacher to any classes
    try {
      const { data: classes, error: checkError } = await supabase
        .from("classes")
        .select("name, section")
        .eq("homeroom_teacher_id", id);

      if (checkError) throw checkError;

      let confirmMessage = "Are you sure you want to delete this teacher?";
      if (classes && classes.length > 0) {
        const classNames = classes.map(c => `${c.name}${c.section ? ` - ${c.section}` : ''}`).join(', ');
        confirmMessage = `This teacher is currently assigned as homeroom teacher for: ${classNames}. Deleting will remove them from these classes. Are you sure you want to continue?`;
      }

      if (!confirm(confirmMessage)) return;

      // Remove teacher from homeroom assignments first
      if (classes && classes.length > 0) {
        const { error: updateError } = await supabase
          .from("classes")
          .update({ homeroom_teacher_id: null })
          .eq("homeroom_teacher_id", id);

        if (updateError) throw updateError;
      }

      // Then delete the teacher
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Teacher deleted successfully" });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error deleting teacher",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    teachers,
    loading,
    fetchTeachers,
    saveTeacher,
    deleteTeacher,
    setTeachers
  };
}

export type { TeacherFormData };
