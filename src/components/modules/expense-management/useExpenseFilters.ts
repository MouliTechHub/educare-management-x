import { useState, useMemo } from "react";
import { Expense } from "@/types/database";

interface ExpenseFilters {
  category: string;
  paymentMode: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export function useExpenseFilters(expenses: Expense[], searchTerm: string) {
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: 'all',
    paymentMode: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  const updateFilter = (key: keyof ExpenseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      paymentMode: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          expense.description.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.paid_to.toLowerCase().includes(searchLower) ||
          expense.payment_mode.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && expense.category !== filters.category) {
        return false;
      }

      // Payment mode filter
      if (filters.paymentMode && filters.paymentMode !== 'all' && expense.payment_mode !== filters.paymentMode) {
        return false;
      }

      // Date range filters
      if (filters.dateFrom && expense.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && expense.date > filters.dateTo) {
        return false;
      }

      // Amount range filters
      if (filters.amountMin && expense.amount < parseFloat(filters.amountMin)) {
        return false;
      }
      if (filters.amountMax && expense.amount > parseFloat(filters.amountMax)) {
        return false;
      }

      return true;
    });
  }, [expenses, searchTerm, filters]);

  return {
    filters,
    filteredExpenses,
    updateFilter,
    clearFilters
  };
}