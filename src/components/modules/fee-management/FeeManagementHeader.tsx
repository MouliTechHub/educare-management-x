
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeFormDialog } from "./FeeFormDialog";
import { FeeStructureDialog } from "./FeeStructureDialog";
import { DiscountReportsDialog } from "./DiscountReportsDialog";
import { ExportButtons } from "./ExportButtons";
import { AcademicYearSelector } from "./AcademicYearSelector";
import { useState } from "react";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface FeeManagementHeaderProps {
  academicYears: AcademicYear[];
  selectedAcademicYear: string;
  onYearChange: (yearId: string) => void;
  onFeeCreated: () => void;
  onStructureCreated: () => void;
  filteredFees: any[];
}

export function FeeManagementHeader({ 
  academicYears, 
  selectedAcademicYear, 
  onYearChange, 
  onFeeCreated,
  onStructureCreated,
  filteredFees 
}: FeeManagementHeaderProps) {
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  
  const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
  
  const handleExport = (format: 'excel' | 'pdf') => {
    // This will be handled by the parent component
    console.log('Export requested:', format);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Management</CardTitle>
              <CardDescription>
                Manage student fees, payments, and fee structures across academic years
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <AcademicYearSelector
                academicYears={academicYears}
                selectedYear={selectedAcademicYear}
                onYearChange={onYearChange}
              />
              <ExportButtons 
                data={filteredFees} 
                academicYear={currentYear?.year_name || 'Unknown'} 
                onExport={handleExport} 
              />
              <button
                onClick={() => setReportsDialogOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reports
              </button>
              <FeeStructureDialog onStructureCreated={onStructureCreated} />
              <FeeFormDialog onFeeCreated={onFeeCreated} />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <DiscountReportsDialog
        open={reportsDialogOpen}
        onOpenChange={setReportsDialogOpen}
      />
    </>
  );
}
