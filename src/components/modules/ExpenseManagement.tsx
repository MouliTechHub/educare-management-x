import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Upload, BarChart3, PieChart, Download } from "lucide-react";
import { ExpenseTable } from "./expense-management/ExpenseTable";
import { ExpenseFormDialog } from "./expense-management/ExpenseFormDialog";
import { ExpenseFilters } from "./expense-management/ExpenseFilters";
import { ExpenseSummaryCards } from "./expense-management/ExpenseSummaryCards";
import { ExpenseCharts } from "./expense-management/ExpenseCharts";
import { useExpenseData } from "./expense-management/useExpenseData";
import { useExpenseFilters } from "./expense-management/useExpenseFilters";

export function ExpenseManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

  const {
    expenses,
    loading,
    fetchExpenses,
    saveExpense,
    deleteExpense,
    exportExpenses
  } = useExpenseData();

  const {
    filters,
    filteredExpenses,
    updateFilter,
    clearFilters
  } = useExpenseFilters(expenses, searchTerm);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      await exportExpenses(filteredExpenses);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage school expenses</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowCharts(!showCharts)}>
            {showCharts ? <BarChart3 className="w-4 h-4 mr-2" /> : <PieChart className="w-4 h-4 mr-2" />}
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddExpense}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedExpense={selectedExpense}
        onSubmit={saveExpense}
      />

      <ExpenseSummaryCards expenses={filteredExpenses} />

      {showCharts && <ExpenseCharts expenses={filteredExpenses} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Manage school expenses and receipts</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpenseFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
          />
          <ExpenseTable
            expenses={filteredExpenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={deleteExpense}
          />
        </CardContent>
      </Card>
    </div>
  );
}