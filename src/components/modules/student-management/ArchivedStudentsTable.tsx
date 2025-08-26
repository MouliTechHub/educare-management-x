import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Search, ExternalLink, CreditCard } from "lucide-react";
import { ArchivedStudent } from "./utils/archivedStudentFetcher";
import { format, parseISO } from "date-fns";

interface ArchivedStudentsTableProps {
  students: ArchivedStudent[];
  onRestoreStudent: (id: string) => void;
  onViewFeeHistory: (studentId: string) => void;
  onViewPaymentHistory: (studentId: string) => void;
}

export function ArchivedStudentsTable({ 
  students, 
  onRestoreStudent, 
  onViewFeeHistory,
  onViewPaymentHistory 
}: ArchivedStudentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy 'at' HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search archived students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Archived On</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No archived students match your search." : "No archived students found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.admission_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {student.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.class_name}
                    {student.class_section && ` - ${student.class_section}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.gender}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(student.deleted_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-32 truncate" title={student.deleted_reason}>
                      {student.deleted_reason || "No reason provided"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestoreStudent(student.id)}
                        className="h-8 px-2"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewFeeHistory(student.id)}
                        className="h-8 px-2"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Fees
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewPaymentHistory(student.id)}
                        className="h-8 px-2"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Payments
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredStudents.length} of {students.length} archived students
        </div>
      )}
    </div>
  );
}