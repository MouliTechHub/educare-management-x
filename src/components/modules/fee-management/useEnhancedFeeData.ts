import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentFeeRecord, FeePaymentRecord, FeeChangeHistory } from "@/types/enhanced-fee-types";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function useEnhancedFeeData() {
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      console.log('Academic years fetched:', data);
      setAcademicYears(data || []);
      const current = data?.find(year => year.is_current);
      if (current) {
        setCurrentAcademicYear(current);
        if (!selectedAcademicYear) {
          setSelectedAcademicYear(current.id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
      toast({
        title: "Error fetching academic years",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFeeRecords = async (academicYearId?: string) => {
    if (!academicYearId) {
      console.log('No academic year ID provided, skipping fee records fetch');
      setFeeRecords([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching enhanced fee records for academic year:', academicYearId);
      
      // First check what students we have in the database
      const { data: allStudents, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, class_id, classes(name, section)");

      console.log('All students in database:', allStudents);
      
      if (studentsError) {
        console.error('Error fetching all students:', studentsError);
      }

      // Check what fee records exist
      const { data: allFeeRecords, error: allFeeRecordsError } = await supabase
        .from("student_fee_records")
        .select("*");

      console.log('All fee records in database:', allFeeRecords);
      
      if (allFeeRecordsError) {
        console.error('Error fetching all fee records:', allFeeRecordsError);
      }

      // Now try the enhanced query with proper joins
      const { data, error } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          students!inner(
            id, 
            first_name, 
            last_name, 
            admission_number,
            classes(name, section)
          )
        `)
        .eq('academic_year_id', academicYearId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching enhanced fee records:', error);
        
        // Fallback: get fee records and students separately
        console.log('Trying fallback approach...');
        const { data: feeRecordsOnly, error: feeError } = await supabase
          .from("student_fee_records")
          .select("*")
          .eq('academic_year_id', academicYearId)
          .order("created_at", { ascending: false });

        if (feeError) {
          console.error('Fallback query also failed:', feeError);
          throw error; // throw original error
        }

        console.log('Fee records from fallback:', feeRecordsOnly);
        
        if (feeRecordsOnly && feeRecordsOnly.length > 0) {
          const studentIds = [...new Set(feeRecordsOnly.map(record => record.student_id))];
          const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select(`
              id, 
              first_name, 
              last_name, 
              admission_number,
              class_id,
              classes(name, section)
            `)
            .in('id', studentIds);

          if (studentsError) {
            console.error('Error fetching students for fallback:', studentsError);
            throw studentsError;
          }

          console.log('Students data from fallback:', studentsData);
          
          // Combine the data
          const enhancedRecords: StudentFeeRecord[] = feeRecordsOnly.map(record => {
            const student = studentsData?.find(s => s.id === record.student_id);
            return {
              ...record,
              status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
              student: student ? {
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                admission_number: student.admission_number,
                class_name: student.classes?.name || 'Unknown Class',
                section: student.classes?.section || '',
              } : {
                id: record.student_id,
                first_name: 'Unknown',
                last_name: 'Student',
                admission_number: 'N/A',
                class_name: 'Unknown Class',
                section: '',
              }
            };
          });

          console.log('Enhanced records from fallback:', enhancedRecords);
          setFeeRecords(enhancedRecords);
          return;
        } else {
          console.log('No fee records found in fallback query');
          setFeeRecords([]);
          return;
        }
      }

      console.log('Enhanced fee records from main query:', data);

      const enhancedRecords: StudentFeeRecord[] = (data || []).map(record => {
        const student = record.students;
        return {
          ...record,
          status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
          student: {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            admission_number: student.admission_number,
            class_name: student.classes?.name || 'Unknown Class',
            section: student.classes?.section || '',
          }
        };
      });

      console.log('Final enhanced fee records:', enhancedRecords);
      setFeeRecords(enhancedRecords);
      
    } catch (error: any) {
      console.error('Error fetching fee records:', error);
      toast({
        title: "Error fetching fee records",
        description: error.message,
        variant: "destructive",
      });
      setFeeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const updateDiscount = async (recordId: string, discountData: {
    discount_amount: number;
    discount_percentage?: number;
    discount_notes?: string;
    discount_updated_by: string;
  }) => {
    try {
      const { error } = await supabase
        .from("student_fee_records")
        .update({
          ...discountData,
          discount_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", recordId);

      if (error) throw error;

      // Log the discount change
      await supabase.from("fee_change_history").insert({
        fee_record_id: recordId,
        change_type: 'discount',
        amount: discountData.discount_amount,
        changed_by: discountData.discount_updated_by,
        notes: discountData.discount_notes || 'Discount applied'
      });

      toast({
        title: "Discount updated successfully",
        description: "Fee record has been updated with the new discount."
      });

      // Refresh data
      fetchFeeRecords(selectedAcademicYear);
    } catch (error: any) {
      toast({
        title: "Error updating discount",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const recordPayment = async (paymentData: Omit<FeePaymentRecord, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from("fee_payment_records")
        .insert([paymentData]);

      if (error) throw error;

      toast({
        title: "Payment recorded successfully",
        description: "The payment has been added and fee status updated."
      });

      // Refresh data
      fetchFeeRecords(selectedAcademicYear);
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getChangeHistory = async (feeRecordId: string): Promise<FeeChangeHistory[]> => {
    try {
      const { data, error } = await supabase
        .from("fee_change_history")
        .select("*")
        .eq("fee_record_id", feeRecordId)
        .order("change_date", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        change_type: item.change_type as 'payment' | 'discount' | 'creation' | 'status_update'
      }));
    } catch (error: any) {
      console.error('Error fetching change history:', error);
      return [];
    }
  };

  const getPaymentHistory = async (feeRecordId: string): Promise<FeePaymentRecord[]> => {
    try {
      const { data, error } = await supabase
        .from("fee_payment_records")
        .select("*")
        .eq("fee_record_id", feeRecordId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        payment_method: item.payment_method as 'Cash' | 'Card' | 'PhonePe' | 'GPay' | 'Online' | 'Cheque' | 'Bank Transfer'
      }));
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      console.log('Selected academic year changed, fetching fee records:', selectedAcademicYear);
      fetchFeeRecords(selectedAcademicYear);
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (!selectedAcademicYear && currentAcademicYear) {
      console.log('Setting selected academic year to current:', currentAcademicYear.id);
      setSelectedAcademicYear(currentAcademicYear.id);
    }
  }, [currentAcademicYear, selectedAcademicYear]);

  useEffect(() => {
    // Set up real-time subscription for fee updates
    const channel = supabase
      .channel('enhanced-fee-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_fee_records'
        },
        () => {
          console.log('Fee record changed, refreshing...');
          if (selectedAcademicYear) {
            fetchFeeRecords(selectedAcademicYear);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_payment_records'
        },
        () => {
          console.log('Payment record changed, refreshing...');
          if (selectedAcademicYear) {
            fetchFeeRecords(selectedAcademicYear);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAcademicYear]);

  return {
    feeRecords,
    academicYears,
    currentAcademicYear,
    selectedAcademicYear,
    setSelectedAcademicYear,
    loading,
    updateDiscount,
    recordPayment,
    getChangeHistory,
    getPaymentHistory,
    refetchFeeRecords: () => fetchFeeRecords(selectedAcademicYear)
  };
}
