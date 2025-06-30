
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeFormDialog } from "./FeeFormDialog";
import { FeeStructureDialog } from "./FeeStructureDialog";
import { DiscountReportsDialog } from "./DiscountReportsDialog";
import { ExportButtons } from "./ExportButtons";
import { AcademicYearSelector } from "./AcademicYearSelector";

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
  return (
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
            <ExportButtons fees={filteredFees} />
            <DiscountReportsDialog />
            <FeeStructureDialog onStructureCreated={onStructureCreated} />
            <FeeFormDialog onFeeCreated={onFeeCreated} />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
