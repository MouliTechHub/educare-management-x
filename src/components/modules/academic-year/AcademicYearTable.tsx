import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { AcademicYear } from "@/types/database";

interface AcademicYearTableProps {
  academicYears: AcademicYear[];
  onEdit: (year: AcademicYear) => void;
  onDelete: (year: AcademicYear) => void;
}

export function AcademicYearTable({ academicYears, onEdit, onDelete }: AcademicYearTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year Name</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {academicYears.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No academic years found. Add your first academic year to get started.
              </TableCell>
            </TableRow>
          ) : (
            academicYears.map((year) => (
              <TableRow key={year.id}>
                <TableCell className="font-medium">{year.year_name}</TableCell>
                <TableCell>{formatDate(year.start_date)}</TableCell>
                <TableCell>{formatDate(year.end_date)}</TableCell>
                <TableCell>
                  {year.is_current ? (
                    <Badge>Current</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(year)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(year)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}