import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/database";

export function useExpenseData() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses" as any)
        .select(`
          *,
          academic_years (
            year_name
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching expenses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveExpense = useCallback(async (expenseData: any) => {
    try {
      if (expenseData.id) {
        // Update existing expense
        const { error } = await supabase
          .from("expenses" as any)
          .update(expenseData)
          .eq("id", expenseData.id);

        if (error) throw error;
        toast({ title: "Expense updated successfully" });
      } else {
        // Create new expense
        const { error } = await supabase
          .from("expenses" as any)
          .insert([expenseData]);

        if (error) throw error;
        toast({ title: "Expense created successfully" });
      }

      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "Error saving expense",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchExpenses, toast]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const { error } = await supabase
        .from("expenses" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Expense deleted successfully" });
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "Error deleting expense",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [fetchExpenses, toast]);

  const exportExpenses = useCallback(async (expensesToExport: Expense[]) => {
    try {
      // Create CSV content
      const headers = ['Date', 'Category', 'Description', 'Amount', 'Paid To', 'Payment Mode', 'Academic Year', 'Month', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...expensesToExport.map(expense => [
          expense.date,
          expense.category,
          `"${expense.description.replace(/"/g, '""')}"`,
          expense.amount,
          `"${expense.paid_to.replace(/"/g, '""')}"`,
          expense.payment_method,
          expense.academic_year_id, // You might want to get the year name from the relation
          expense.month,
          `"${(expense.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Expenses exported successfully" });
    } catch (error: any) {
      toast({
        title: "Error exporting expenses",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    expenses,
    loading,
    fetchExpenses,
    saveExpense,
    deleteExpense,
    exportExpenses
  };
}