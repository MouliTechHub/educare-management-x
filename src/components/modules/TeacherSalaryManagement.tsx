import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Calculator, DollarSign, Users, TrendingUp } from "lucide-react";
import { TeacherSalaryTable } from "./teacher-salary/TeacherSalaryTable";
import { TeacherSalaryFormDialog } from "./teacher-salary/TeacherSalaryFormDialog";
import { SalaryFilters } from "./teacher-salary/SalaryFilters";
import { SalarySummaryCards } from "./teacher-salary/SalarySummaryCards";
import { BulkSalaryProcessing } from "./teacher-salary/BulkSalaryProcessing";
import { SalaryCharts } from "./teacher-salary/SalaryCharts";
import { useTeacherSalaryData } from "./teacher-salary/useTeacherSalaryData";
import { useTeacherSalaryFilters } from "./teacher-salary/useTeacherSalaryFilters";

export function TeacherSalaryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showBulkProcessing, setShowBulkProcessing] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  const {
    salaries,
    teachers,
    loading,
    fetchSalaries,
    saveSalary,
    deleteSalary,
    bulkProcessSalaries,
    exportSalaries
  } = useTeacherSalaryData();

  const {
    filters,
    filteredSalaries,
    updateFilter,
    clearFilters
  } = useTeacherSalaryFilters(salaries, searchTerm);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleAddSalary = () => {
    setSelectedSalary(null);
    setDialogOpen(true);
  };

  const handleEditSalary = (salary: any) => {
    setSelectedSalary(salary);
    setDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      await exportSalaries(filteredSalaries);
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
          <h1 className="text-3xl font-bold">Teacher Salary Management</h1>
          <p className="text-muted-foreground mt-2">Manage teacher salaries and payments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowCharts(!showCharts)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </Button>
          <Button variant="outline" onClick={() => setShowBulkProcessing(!showBulkProcessing)}>
            <Calculator className="w-4 h-4 mr-2" />
            Bulk Process
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <DollarSign className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddSalary}>
                <Plus className="w-4 h-4 mr-2" />
                Add Salary
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <TeacherSalaryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedSalary={selectedSalary}
        teachers={teachers}
        onSubmit={saveSalary}
      />

      {showBulkProcessing && (
        <BulkSalaryProcessing
          teachers={teachers}
          onProcess={bulkProcessSalaries}
          onClose={() => setShowBulkProcessing(false)}
        />
      )}

      <SalarySummaryCards salaries={filteredSalaries} />

      {showCharts && <SalaryCharts salaries={filteredSalaries} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teacher Salaries</CardTitle>
              <CardDescription>Track and manage teacher salary payments</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by teacher name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SalaryFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
          />
          <TeacherSalaryTable
            salaries={filteredSalaries}
            onEditSalary={handleEditSalary}
            onDeleteSalary={deleteSalary}
          />
        </CardContent>
      </Card>
    </div>
  );
}